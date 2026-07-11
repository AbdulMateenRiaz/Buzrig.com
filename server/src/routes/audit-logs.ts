import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, paginationSchema } from '../lib/validate.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const listAuditLogsSchema = paginationSchema.extend({
  resource: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function auditLogRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireRole('OWNER', 'ADMIN', 'SECURITY_LEAD'))

  // ─── GET /api/audit-logs ─────────────────────────────────────────────────
  app.get('/api/audit-logs', async (request, reply) => {
    const { page = 1, limit = 20, resource, action, userId, from, to } = validate(listAuditLogsSchema, request.query)
    const orgId = request.authUser!.orgId

    const where = {
      orgId,
      ...(resource && { resource }),
      ...(action && { action: { contains: action } }),
      ...(userId && { userId }),
      ...(from || to ? {
        createdAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      } : {}),
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    return reply.send({
      success: true,
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })
}
