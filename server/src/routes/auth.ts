import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { validate, emailSchema, passwordSchema } from '../lib/validate.js'
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../lib/errors.js'
import { signAccessToken, signRefreshToken } from '../lib/jwt.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  company: z.string().min(1).max(100).trim().optional(),
})

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance) {
  // ─── POST /api/auth/signup ───────────────────────────────────────────────
  app.post('/api/auth/signup', async (request, reply) => {
    const data = validate(signupSchema, request.body)

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new ConflictError('An account with this email already exists')
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user + organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      })

      // Create default organization
      const orgName = data.company || `${data.firstName}'s Team`
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const uniqueSlug = `${slug}-${uuid().slice(0, 6)}`

      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: uniqueSlug,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      })

      return { user, org }
    })

    // Generate tokens
    const accessToken = signAccessToken(app, {
      sub: result.user.id,
      orgId: result.org.id,
      role: 'OWNER',
    })
    const refreshToken = signRefreshToken(app, { sub: result.user.id })

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Update last login
    await prisma.user.update({
      where: { id: result.user.id },
      data: { lastLoginAt: new Date() },
    })

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        org: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug,
        },
        accessToken,
        refreshToken,
      },
    })
  })

  // ─── POST /api/auth/login ────────────────────────────────────────────────
  app.post('/api/auth/login', async (request, reply) => {
    const data = validate(loginSchema, request.body)

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        memberships: {
          include: { org: true },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const validPassword = await verifyPassword(data.password, user.passwordHash)
    if (!validPassword) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const membership = user.memberships[0]
    if (!membership) {
      throw new NotFoundError('Organization')
    }

    // Generate tokens
    const accessToken = signAccessToken(app, {
      sub: user.id,
      orgId: membership.orgId,
      role: membership.role,
    })
    const refreshToken = signRefreshToken(app, { sub: user.id })

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        org: {
          id: membership.org.id,
          name: membership.org.name,
          slug: membership.org.slug,
        },
        accessToken,
        refreshToken,
      },
    })
  })

  // ─── POST /api/auth/refresh ──────────────────────────────────────────────
  app.post('/api/auth/refresh', async (request, reply) => {
    const { refreshToken } = validate(refreshSchema, request.body)

    // Find and validate the stored refresh token
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            memberships: {
              include: { org: true },
              take: 1,
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!stored) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    if (stored.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: stored.id } })
      throw new UnauthorizedError('Refresh token expired')
    }

    const membership = stored.user.memberships[0]
    if (!membership) {
      throw new NotFoundError('Organization')
    }

    // Rotate: delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } })

    const newAccessToken = signAccessToken(app, {
      sub: stored.userId,
      orgId: membership.orgId,
      role: membership.role,
    })
    const newRefreshToken = signRefreshToken(app, { sub: stored.userId })

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.send({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    })
  })

  // ─── POST /api/auth/logout ───────────────────────────────────────────────
  app.post('/api/auth/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const { refreshToken } = validate(refreshSchema, request.body)

    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId: request.authUser!.userId },
    })

    return reply.send({ success: true, message: 'Logged out successfully' })
  })

  // ─── GET /api/auth/me ────────────────────────────────────────────────────
  app.get('/api/auth/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.authUser!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            org: {
              select: { id: true, name: true, slug: true, plan: true },
            },
          },
        },
      },
    })

    if (!user) throw new NotFoundError('User')

    return reply.send({ success: true, data: user })
  })
}
