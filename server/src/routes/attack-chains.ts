import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, paginationSchema, idSchema } from '../lib/validate.js'
import { NotFoundError, BadRequestError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const listChainsSchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'RESOLVED', 'ACCEPTED_RISK']).optional(),
})

const createChainSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
  impact: z.string().min(1).max(500).trim(),
  finalSeverity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  aiAnalysis: z.string().optional(),
  vulnerabilityIds: z.array(z.string().uuid()).min(2, 'Attack chain must have at least 2 vulnerabilities'),
})

const updateChainSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  impact: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'RESOLVED', 'ACCEPTED_RISK']).optional(),
  aiAnalysis: z.string().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function attackChainRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/attack-chains ──────────────────────────────────────────────
  app.get('/api/attack-chains', async (request, reply) => {
    const { page = 1, limit = 20, status } = validate(listChainsSchema, request.query)
    const orgId = request.authUser!.orgId

    const where = {
      orgId,
      ...(status && { status }),
    }

    const [chains, total] = await Promise.all([
      prisma.attackChain.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ finalSeverity: 'asc' }, { createdAt: 'desc' }],
        include: {
          nodes: {
            orderBy: { position: 'asc' },
            include: {
              vulnerability: {
                select: { id: true, title: true, severity: true, status: true, category: true },
              },
            },
          },
        },
      }),
      prisma.attackChain.count({ where }),
    ])

    return reply.send({
      success: true,
      data: chains,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })

  // ─── POST /api/attack-chains ─────────────────────────────────────────────
  app.post('/api/attack-chains', async (request, reply) => {
    const data = validate(createChainSchema, request.body)
    const orgId = request.authUser!.orgId

    // Verify all vulnerabilities belong to org
    const vulns = await prisma.vulnerability.findMany({
      where: { id: { in: data.vulnerabilityIds }, orgId },
    })
    if (vulns.length !== data.vulnerabilityIds.length) {
      throw new BadRequestError('One or more vulnerability IDs are invalid or do not belong to your organization')
    }

    const chain = await prisma.attackChain.create({
      data: {
        orgId,
        name: data.name,
        description: data.description,
        impact: data.impact,
        finalSeverity: data.finalSeverity,
        aiAnalysis: data.aiAnalysis,
        nodes: {
          create: data.vulnerabilityIds.map((vulnId, idx) => ({
            vulnerabilityId: vulnId,
            position: idx + 1,
          })),
        },
      },
      include: {
        nodes: {
          orderBy: { position: 'asc' },
          include: {
            vulnerability: {
              select: { id: true, title: true, severity: true, category: true },
            },
          },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'attack_chain.created',
        resource: 'attack_chain',
        resourceId: chain.id,
        metadata: { name: chain.name, vulnCount: data.vulnerabilityIds.length },
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        orgId,
        type: 'ATTACK_CHAIN',
        title: `New attack chain identified: ${chain.name}`,
        body: chain.impact,
        metadata: { chainId: chain.id, severity: chain.finalSeverity },
      },
    })

    return reply.status(201).send({ success: true, data: chain })
  })

  // ─── GET /api/attack-chains/:id ──────────────────────────────────────────
  app.get('/api/attack-chains/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const chain = await prisma.attackChain.findFirst({
      where: { id, orgId },
      include: {
        nodes: {
          orderBy: { position: 'asc' },
          include: {
            vulnerability: {
              select: {
                id: true, title: true, severity: true, status: true,
                category: true, cvss: true, endpoint: true, description: true,
                target: { select: { id: true, name: true, value: true } },
              },
            },
          },
        },
      },
    })

    if (!chain) throw new NotFoundError('Attack Chain', id)

    return reply.send({ success: true, data: chain })
  })

  // ─── PATCH /api/attack-chains/:id ────────────────────────────────────────
  app.patch('/api/attack-chains/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const data = validate(updateChainSchema, request.body)
    const orgId = request.authUser!.orgId

    const existing = await prisma.attackChain.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundError('Attack Chain', id)

    const chain = await prisma.attackChain.update({
      where: { id },
      data,
    })

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'attack_chain.updated',
        resource: 'attack_chain',
        resourceId: id,
        metadata: { changes: data },
      },
    })

    return reply.send({ success: true, data: chain })
  })

  // ─── DELETE /api/attack-chains/:id ───────────────────────────────────────
  app.delete('/api/attack-chains/:id', async (request, reply) => {
    const { id } = validate(idSchema, request.params)
    const orgId = request.authUser!.orgId

    const existing = await prisma.attackChain.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundError('Attack Chain', id)

    await prisma.attackChain.delete({ where: { id } })

    return reply.send({ success: true, message: 'Attack chain deleted' })
  })
}
