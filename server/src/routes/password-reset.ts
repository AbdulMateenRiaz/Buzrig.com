import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { hashPassword } from '../lib/password.js'
import { validate, emailSchema, passwordSchema } from '../lib/validate.js'
import { BadRequestError, NotFoundError } from '../lib/errors.js'
import { sendEmail, buildResetEmail } from '../services/email/index.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: emailSchema,
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function passwordResetRoutes(app: FastifyInstance) {

  // ─── POST /api/auth/forgot-password ──────────────────────────────────────
  app.post('/api/auth/forgot-password', async (request, reply) => {
    const { email } = validate(forgotPasswordSchema, request.body)

    // Always return success (don't reveal if email exists)
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Generate reset token
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour

      // Store token (reuse RefreshToken model with a prefix)
      await prisma.refreshToken.create({
        data: {
          token: `reset_${token}`,
          userId: user.id,
          expiresAt,
        },
      })

      // Build reset URL
      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`
      const userName = user.firstName || user.email.split('@')[0]

      // Send email
      await sendEmail({
        to: email,
        subject: 'Reset your Buzrig password',
        html: buildResetEmail(resetUrl, userName),
      })
    }

    // Always return success to prevent email enumeration
    return reply.send({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    })
  })

  // ─── POST /api/auth/reset-password ───────────────────────────────────────
  app.post('/api/auth/reset-password', async (request, reply) => {
    const { token, password } = validate(resetPasswordSchema, request.body)

    // Find the reset token
    const stored = await prisma.refreshToken.findFirst({
      where: { token: `reset_${token}` },
      include: { user: true },
    })

    if (!stored) {
      throw new BadRequestError('Invalid or expired reset token')
    }

    if (stored.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: stored.id } })
      throw new BadRequestError('Reset token has expired. Please request a new one.')
    }

    // Update password
    const passwordHash = await hashPassword(password)
    await prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash },
    })

    // Delete the used reset token
    await prisma.refreshToken.delete({ where: { id: stored.id } })

    // Also invalidate all existing refresh tokens (force re-login everywhere)
    await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } })

    return reply.send({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    })
  })
}
