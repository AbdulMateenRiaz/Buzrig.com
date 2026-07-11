import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, paginationSchema, idSchema } from '../lib/validate.js'
import { NotFoundError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const listNotificationsSchema = paginationSchema.extend({
  read: z.coerce.boolean().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/notifications ──────────────────────────────────────────────
  app.get('/api/notifications', async (request, reply) => {
    const { page = 1, limit = 20, read } = validate(listNotificationsSchema, request.query)
    const orgId = request.authUser!.orgId
    const userId = request.authUser!.userId

    const where = {
      orgId,
      OR: [{ userId }, { userId: null }], // user-specific or org-wide
      ...(read !== undefined && { read }),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { orgId, OR: [{ userId }, { userId: null }], read: false },
      }),
    ])

    return reply.send({
      success: true,
      data: notifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), unreadCount },
    })
  })

  // ─── POST /api/notifications/:id/read ────────────────────────────────────
  app.post('/api/notifications/:id/read', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const notification = await prisma.notification.findFirst({
      where: { id, orgId },
    })
    if (!notification) throw new NotFoundError('Notification', id)

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    return reply.send({ success: true, message: 'Marked as read' })
  })

  // ─── POST /api/notifications/read-all ────────────────────────────────────
  app.post('/api/notifications/read-all', async (request, reply) => {
    const orgId = request.authUser!.orgId
    const userId = request.authUser!.userId

    await prisma.notification.updateMany({
      where: { orgId, OR: [{ userId }, { userId: null }], read: false },
      data: { read: true },
    })

    return reply.send({ success: true, message: 'All notifications marked as read' })
  })
}
