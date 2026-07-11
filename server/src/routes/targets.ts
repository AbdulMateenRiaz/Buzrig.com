import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, paginationSchema, idSchema } from '../lib/validate.js'
import { NotFoundError, ConflictError, ForbiddenError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createTargetSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: z.enum(['WEB_APPLICATION', 'API_ENDPOINT', 'SOURCE_CODE', 'CLOUD_INFRASTRUCTURE']),
  value: z.string().min(1).max(500).trim(),
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT']).default('PRODUCTION'),
  metadata: z.any().optional(),
})

const updateTargetSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT']).optional(),
  active: z.boolean().optional(),
  metadata: z.any().optional(),
})

const listTargetsSchema = paginationSchema.extend({
  type: z.enum(['WEB_APPLICATION', 'API_ENDPOINT', 'SOURCE_CODE', 'CLOUD_INFRASTRUCTURE']).optional(),
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT']).optional(),
  active: z.coerce.boolean().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function targetRoutes(app: FastifyInstance) {
  // All target routes require auth
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/targets ────────────────────────────────────────────────────
  app.get('/api/targets', async (request, reply) => {
    const { page = 1, limit = 20, type, environment, active } = validate(listTargetsSchema, request.query)
    const orgId = request.authUser!.orgId

    const where = {
      orgId,
      ...(type && { type }),
      ...(environment && { environment }),
      ...(active !== undefined && { active }),
    }

    const [targets, total] = await Promise.all([
      prisma.target.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { scans: true, vulnerabilities: true } },
        },
      }),
      prisma.target.count({ where }),
    ])

    return reply.send({
      success: true,
      data: targets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  // ─── POST /api/targets ───────────────────────────────────────────────────
  app.post('/api/targets', async (request, reply) => {
    const data = validate(createTargetSchema, request.body)
    const orgId = request.authUser!.orgId
    const role = request.authUser!.role

    // Only admins+ can add targets
    if (!['OWNER', 'ADMIN', 'SECURITY_LEAD'].includes(role)) {
      throw new ForbiddenError('Only admins and security leads can add targets')
    }

    // Check for duplicate
    const existing = await prisma.target.findUnique({
      where: { orgId_value: { orgId, value: data.value } },
    })
    if (existing) {
      throw new ConflictError(`Target '${data.value}' already exists`)
    }

    const target = await prisma.target.create({
      data: { ...data, orgId },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'target.created',
        resource: 'target',
        resourceId: target.id,
        metadata: { name: target.name, value: target.value, type: target.type },
      },
    })

    return reply.status(201).send({ success: true, data: target })
  })

  // ─── GET /api/targets/:id ────────────────────────────────────────────────
  app.get('/api/targets/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const target = await prisma.target.findFirst({
      where: { id, orgId },
      include: {
        scans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, findingsCount: true, createdAt: true },
        },
        vulnerabilities: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS', 'REMEDIATION'] } },
          orderBy: { severity: 'asc' },
          take: 10,
          select: { id: true, title: true, severity: true, status: true },
        },
        _count: { select: { scans: true, vulnerabilities: true } },
      },
    })

    if (!target) throw new NotFoundError('Target', id)

    return reply.send({ success: true, data: target })
  })

  // ─── PATCH /api/targets/:id ──────────────────────────────────────────────
  app.patch('/api/targets/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const data = validate(updateTargetSchema, request.body)
    const orgId = request.authUser!.orgId
    const role = request.authUser!.role

    if (!['OWNER', 'ADMIN', 'SECURITY_LEAD'].includes(role)) {
      throw new ForbiddenError('Only admins and security leads can update targets')
    }

    // Verify ownership
    const existing = await prisma.target.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundError('Target', id)

    const target = await prisma.target.update({
      where: { id },
      data,
    })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'target.updated',
        resource: 'target',
        resourceId: target.id,
        metadata: { changes: data },
      },
    })

    return reply.send({ success: true, data: target })
  })

  // ─── DELETE /api/targets/:id ─────────────────────────────────────────────
  app.delete('/api/targets/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId
    const role = request.authUser!.role

    if (!['OWNER', 'ADMIN'].includes(role)) {
      throw new ForbiddenError('Only owners and admins can delete targets')
    }

    const existing = await prisma.target.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundError('Target', id)

    await prisma.target.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'target.deleted',
        resource: 'target',
        resourceId: id,
        metadata: { name: existing.name, value: existing.value },
      },
    })

    return reply.send({ success: true, message: 'Target deleted' })
  })
}
