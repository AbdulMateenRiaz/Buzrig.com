import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, paginationSchema, idSchema } from '../lib/validate.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const listRemediationsSchema = paginationSchema.extend({
  status: z.enum(['GENERATING', 'PR_OPEN', 'IN_REVIEW', 'CHANGES_REQUESTED', 'MERGED', 'CLOSED', 'FAILED']).optional(),
  vulnerabilityId: z.string().uuid().optional(),
})

const createRemediationSchema = z.object({
  vulnerabilityId: z.string().uuid(),
})

const updateRemediationSchema = z.object({
  status: z.enum(['GENERATING', 'PR_OPEN', 'IN_REVIEW', 'CHANGES_REQUESTED', 'MERGED', 'CLOSED', 'FAILED']).optional(),
  prUrl: z.string().url().optional(),
  prNumber: z.coerce.number().int().positive().optional(),
  repo: z.string().max(200).optional(),
  branch: z.string().max(200).optional(),
  patch: z.string().optional(),
  description: z.string().max(5000).optional(),
  linesAdded: z.coerce.number().int().min(0).optional(),
  linesRemoved: z.coerce.number().int().min(0).optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function remediationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/remediations ───────────────────────────────────────────────
  app.get('/api/remediations', async (request, reply) => {
    const { page = 1, limit = 20, status, vulnerabilityId } = validate(listRemediationsSchema, request.query)
    const orgId = request.authUser!.orgId

    const where = {
      vulnerability: { orgId },
      ...(status && { status }),
      ...(vulnerabilityId && { vulnerabilityId }),
    }

    const [remediations, total] = await Promise.all([
      prisma.remediation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vulnerability: {
            select: { id: true, title: true, severity: true, target: { select: { value: true } } },
          },
        },
      }),
      prisma.remediation.count({ where }),
    ])

    return reply.send({
      success: true,
      data: remediations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })

  // ─── GET /api/remediations/stats ─────────────────────────────────────────
  app.get('/api/remediations/stats', async (request, reply) => {
    const orgId = request.authUser!.orgId

    const [byStatus, avgFixTime] = await Promise.all([
      prisma.remediation.groupBy({
        by: ['status'],
        where: { vulnerability: { orgId } },
        _count: true,
      }),
      prisma.remediation.aggregate({
        where: {
          vulnerability: { orgId },
          status: 'MERGED',
          mergedAt: { not: null },
        },
        _avg: {
          linesAdded: true,
          linesRemoved: true,
        },
        _count: true,
      }),
    ])

    // Calculate average time from creation to merge
    const mergedOnes = await prisma.remediation.findMany({
      where: {
        vulnerability: { orgId },
        status: 'MERGED',
        mergedAt: { not: null },
      },
      select: { createdAt: true, mergedAt: true },
    })

    let avgHoursToMerge = 0
    if (mergedOnes.length > 0) {
      const totalMs = mergedOnes.reduce((sum, r) => {
        return sum + (r.mergedAt!.getTime() - r.createdAt.getTime())
      }, 0)
      avgHoursToMerge = Math.round((totalMs / mergedOnes.length / 3600000) * 10) / 10
    }

    return reply.send({
      success: true,
      data: {
        byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
        totalMerged: avgFixTime._count,
        avgLinesAdded: Math.round(avgFixTime._avg.linesAdded ?? 0),
        avgLinesRemoved: Math.round(avgFixTime._avg.linesRemoved ?? 0),
        avgHoursToMerge,
      },
    })
  })

  // ─── POST /api/remediations ──────────────────────────────────────────────
  app.post('/api/remediations', async (request, reply) => {
    const data = validate(createRemediationSchema, request.body)
    const orgId = request.authUser!.orgId
    const role = request.authUser!.role

    if (!['OWNER', 'ADMIN', 'SECURITY_LEAD'].includes(role)) {
      throw new ForbiddenError('Only admins and security leads can trigger remediations')
    }

    // Verify vulnerability belongs to org and is still open
    const vuln = await prisma.vulnerability.findFirst({
      where: { id: data.vulnerabilityId, orgId },
    })
    if (!vuln) throw new NotFoundError('Vulnerability', data.vulnerabilityId)
    if (vuln.status === 'VERIFIED_FIXED') {
      throw new BadRequestError('Vulnerability is already fixed')
    }

    // Check for existing active remediation
    const existing = await prisma.remediation.findFirst({
      where: {
        vulnerabilityId: data.vulnerabilityId,
        status: { in: ['GENERATING', 'PR_OPEN', 'IN_REVIEW'] },
      },
    })
    if (existing) {
      throw new BadRequestError('An active remediation already exists for this vulnerability')
    }

    const remediation = await prisma.remediation.create({
      data: {
        vulnerabilityId: data.vulnerabilityId,
        status: 'GENERATING',
      },
      include: {
        vulnerability: { select: { id: true, title: true, severity: true } },
      },
    })

    // Update vulnerability status
    await prisma.vulnerability.update({
      where: { id: data.vulnerabilityId },
      data: { status: 'REMEDIATION' },
    })

    // TODO: Queue LLM remediation generation job
    // await remediationQueue.add('generate-fix', { remediationId: remediation.id })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'remediation.created',
        resource: 'remediation',
        resourceId: remediation.id,
        metadata: { vulnerabilityId: data.vulnerabilityId, vulnTitle: vuln.title },
      },
    })

    return reply.status(201).send({ success: true, data: remediation })
  })

  // ─── GET /api/remediations/:id ───────────────────────────────────────────
  app.get('/api/remediations/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const remediation = await prisma.remediation.findFirst({
      where: { id, vulnerability: { orgId } },
      include: {
        vulnerability: {
          select: {
            id: true, title: true, severity: true, description: true,
            endpoint: true, poc: true,
            target: { select: { id: true, name: true, value: true } },
          },
        },
      },
    })

    if (!remediation) throw new NotFoundError('Remediation', id)

    return reply.send({ success: true, data: remediation })
  })

  // ─── PATCH /api/remediations/:id ─────────────────────────────────────────
  app.patch('/api/remediations/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const data = validate(updateRemediationSchema, request.body)
    const orgId = request.authUser!.orgId

    const existing = await prisma.remediation.findFirst({
      where: { id, vulnerability: { orgId } },
    })
    if (!existing) throw new NotFoundError('Remediation', id)

    // Validate state transitions
    if (data.status) {
      const validTransitions: Record<string, string[]> = {
        GENERATING: ['PR_OPEN', 'FAILED'],
        PR_OPEN: ['IN_REVIEW', 'CLOSED', 'MERGED'],
        IN_REVIEW: ['CHANGES_REQUESTED', 'MERGED', 'CLOSED'],
        CHANGES_REQUESTED: ['IN_REVIEW', 'PR_OPEN', 'CLOSED'],
        MERGED: [], // terminal
        CLOSED: ['PR_OPEN'], // can reopen
        FAILED: ['GENERATING'], // can retry
      }
      const allowed = validTransitions[existing.status] || []
      if (!allowed.includes(data.status)) {
        throw new BadRequestError(
          `Cannot transition from '${existing.status}' to '${data.status}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`
        )
      }
    }

    const updateData: Record<string, unknown> = { ...data }
    if (data.status === 'MERGED') {
      updateData.mergedAt = new Date()
      // Also mark vulnerability as verified fixed
      await prisma.vulnerability.update({
        where: { id: existing.vulnerabilityId },
        data: { status: 'VERIFIED_FIXED', resolvedAt: new Date() },
      })
    }

    const remediation = await prisma.remediation.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'remediation.updated',
        resource: 'remediation',
        resourceId: id,
        metadata: { changes: data, previousStatus: existing.status },
      },
    })

    return reply.send({ success: true, data: remediation })
  })
}
