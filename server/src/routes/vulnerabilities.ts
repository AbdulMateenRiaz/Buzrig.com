import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, paginationSchema, idSchema } from '../lib/validate.js'
import { NotFoundError, BadRequestError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const listVulnsSchema = paginationSchema.extend({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'REMEDIATION', 'VERIFIED_FIXED', 'ACCEPTED_RISK', 'FALSE_POSITIVE']).optional(),
  targetId: z.string().uuid().optional(),
  scanId: z.string().uuid().optional(),
})

const updateVulnSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'REMEDIATION', 'VERIFIED_FIXED', 'ACCEPTED_RISK', 'FALSE_POSITIVE']).optional(),
  falsePositive: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function vulnerabilityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/vulnerabilities ────────────────────────────────────────────
  app.get('/api/vulnerabilities', async (request, reply) => {
    const { page = 1, limit = 20, severity, status, targetId, scanId } = validate(listVulnsSchema, request.query)
    const orgId = request.authUser!.orgId

    const where = {
      orgId,
      ...(severity && { severity }),
      ...(status && { status }),
      ...(targetId && { targetId }),
      ...(scanId && { scanId }),
    }

    const [vulns, total] = await Promise.all([
      prisma.vulnerability.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        include: {
          target: { select: { id: true, name: true, value: true } },
          _count: { select: { remediations: true, attackChainNodes: true } },
        },
      }),
      prisma.vulnerability.count({ where }),
    ])

    return reply.send({
      success: true,
      data: vulns,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })

  // ─── GET /api/vulnerabilities/stats ──────────────────────────────────────
  app.get('/api/vulnerabilities/stats', async (request, reply) => {
    const orgId = request.authUser!.orgId

    const [bySeverity, byStatus, recentTrend] = await Promise.all([
      prisma.vulnerability.groupBy({
        by: ['severity'],
        where: { orgId, status: { notIn: ['VERIFIED_FIXED', 'FALSE_POSITIVE'] } },
        _count: true,
      }),
      prisma.vulnerability.groupBy({
        by: ['status'],
        where: { orgId },
        _count: true,
      }),
      prisma.vulnerability.groupBy({
        by: ['createdAt'],
        where: {
          orgId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const totalOpen = bySeverity.reduce((sum, g) => sum + g._count, 0)

    return reply.send({
      success: true,
      data: {
        totalOpen,
        bySeverity: bySeverity.map((g) => ({ severity: g.severity, count: g._count })),
        byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
        recentTrend: recentTrend.length,
      },
    })
  })

  // ─── GET /api/vulnerabilities/:id ────────────────────────────────────────
  app.get('/api/vulnerabilities/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const vuln = await prisma.vulnerability.findFirst({
      where: { id, orgId },
      include: {
        target: { select: { id: true, name: true, value: true, type: true } },
        scan: { select: { id: true, scanType: true, createdAt: true } },
        remediations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, prUrl: true, prNumber: true,
            repo: true, branch: true, linesAdded: true, linesRemoved: true,
            mergedAt: true, createdAt: true,
          },
        },
        attackChainNodes: {
          include: {
            chain: {
              select: { id: true, name: true, finalSeverity: true, status: true },
            },
          },
        },
        complianceMappings: {
          include: {
            control: {
              include: { framework: { select: { name: true } } },
            },
          },
        },
      },
    })

    if (!vuln) throw new NotFoundError('Vulnerability', id)

    return reply.send({ success: true, data: vuln })
  })

  // ─── PATCH /api/vulnerabilities/:id ──────────────────────────────────────
  app.patch('/api/vulnerabilities/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const data = validate(updateVulnSchema, request.body)
    const orgId = request.authUser!.orgId

    const existing = await prisma.vulnerability.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundError('Vulnerability', id)

    // Validate status transitions
    if (data.status) {
      const validTransitions: Record<string, string[]> = {
        OPEN: ['IN_PROGRESS', 'REMEDIATION', 'ACCEPTED_RISK', 'FALSE_POSITIVE'],
        IN_PROGRESS: ['OPEN', 'REMEDIATION', 'ACCEPTED_RISK'],
        REMEDIATION: ['OPEN', 'VERIFIED_FIXED'],
        VERIFIED_FIXED: ['OPEN'], // can reopen
        ACCEPTED_RISK: ['OPEN'],
        FALSE_POSITIVE: ['OPEN'],
      }
      const allowed = validTransitions[existing.status] || []
      if (!allowed.includes(data.status)) {
        throw new BadRequestError(
          `Cannot transition from '${existing.status}' to '${data.status}'. Allowed: ${allowed.join(', ')}`
        )
      }
    }

    const updateData: Record<string, unknown> = { ...data }
    if (data.status === 'VERIFIED_FIXED') updateData.resolvedAt = new Date()
    if (data.status === 'FALSE_POSITIVE') updateData.falsePositive = true

    const vuln = await prisma.vulnerability.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'vulnerability.updated',
        resource: 'vulnerability',
        resourceId: id,
        metadata: { changes: data, previousStatus: existing.status },
      },
    })

    return reply.send({ success: true, data: vuln })
  })
}
