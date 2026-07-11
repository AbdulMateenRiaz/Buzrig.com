import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, paginationSchema, idSchema } from '../lib/validate.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createScanSchema = z.object({
  targetId: z.string().uuid(),
  scanType: z.enum(['FULL', 'OWASP_TOP_10', 'API_SECURITY', 'SOURCE_CODE', 'CUSTOM']).default('FULL'),
  config: z.any().optional(),
})

const listScansSchema = paginationSchema.extend({
  status: z.enum(['QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  targetId: z.string().uuid().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function scanRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/scans ──────────────────────────────────────────────────────
  app.get('/api/scans', async (request, reply) => {
    const { page = 1, limit = 20, status, targetId } = validate(listScansSchema, request.query)
    const orgId = request.authUser!.orgId

    const where = {
      orgId,
      ...(status && { status }),
      ...(targetId && { targetId }),
    }

    const [scans, total] = await Promise.all([
      prisma.scan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          target: { select: { id: true, name: true, value: true, type: true } },
        },
      }),
      prisma.scan.count({ where }),
    ])

    return reply.send({
      success: true,
      data: scans,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })

  // ─── POST /api/scans ─────────────────────────────────────────────────────
  app.post('/api/scans', async (request, reply) => {
    const data = validate(createScanSchema, request.body)
    const orgId = request.authUser!.orgId
    const role = request.authUser!.role

    if (!['OWNER', 'ADMIN', 'SECURITY_LEAD'].includes(role)) {
      throw new ForbiddenError('Only admins and security leads can create scans')
    }

    // Verify target belongs to org
    const target = await prisma.target.findFirst({
      where: { id: data.targetId, orgId, active: true },
    })
    if (!target) throw new NotFoundError('Target', data.targetId)

    // Check if there's already a running scan for this target
    const runningScans = await prisma.scan.count({
      where: { targetId: data.targetId, status: { in: ['QUEUED', 'RUNNING'] } },
    })
    if (runningScans > 0) {
      throw new BadRequestError('A scan is already running or queued for this target')
    }

    const scan = await prisma.scan.create({
      data: {
        orgId,
        targetId: data.targetId,
        scanType: data.scanType,
        config: data.config ?? {},
        status: 'QUEUED',
      },
      include: {
        target: { select: { id: true, name: true, value: true, type: true } },
      },
    })

    // TODO: Queue scan job in BullMQ when worker is ready
    // await scanQueue.add('execute-scan', { scanId: scan.id })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'scan.created',
        resource: 'scan',
        resourceId: scan.id,
        metadata: { targetName: target.name, scanType: scan.scanType },
      },
    })

    return reply.status(201).send({ success: true, data: scan })
  })

  // ─── GET /api/scans/:id ──────────────────────────────────────────────────
  app.get('/api/scans/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const scan = await prisma.scan.findFirst({
      where: { id, orgId },
      include: {
        target: { select: { id: true, name: true, value: true, type: true } },
        vulnerabilities: {
          orderBy: { severity: 'asc' },
          select: { id: true, title: true, severity: true, status: true, cvss: true },
        },
      },
    })

    if (!scan) throw new NotFoundError('Scan', id)

    return reply.send({ success: true, data: scan })
  })

  // ─── POST /api/scans/:id/pause ───────────────────────────────────────────
  app.post('/api/scans/:id/pause', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const scan = await prisma.scan.findFirst({ where: { id, orgId } })
    if (!scan) throw new NotFoundError('Scan', id)
    if (scan.status !== 'RUNNING') {
      throw new BadRequestError(`Cannot pause scan with status '${scan.status}'`)
    }

    const updated = await prisma.scan.update({
      where: { id },
      data: { status: 'PAUSED' },
    })

    return reply.send({ success: true, data: updated })
  })

  // ─── POST /api/scans/:id/resume ──────────────────────────────────────────
  app.post('/api/scans/:id/resume', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const scan = await prisma.scan.findFirst({ where: { id, orgId } })
    if (!scan) throw new NotFoundError('Scan', id)
    if (scan.status !== 'PAUSED') {
      throw new BadRequestError(`Cannot resume scan with status '${scan.status}'`)
    }

    const updated = await prisma.scan.update({
      where: { id },
      data: { status: 'RUNNING' },
    })

    return reply.send({ success: true, data: updated })
  })

  // ─── POST /api/scans/:id/cancel ──────────────────────────────────────────
  app.post('/api/scans/:id/cancel', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const scan = await prisma.scan.findFirst({ where: { id, orgId } })
    if (!scan) throw new NotFoundError('Scan', id)
    if (!['QUEUED', 'RUNNING', 'PAUSED'].includes(scan.status)) {
      throw new BadRequestError(`Cannot cancel scan with status '${scan.status}'`)
    }

    const updated = await prisma.scan.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return reply.send({ success: true, data: updated })
  })
}
