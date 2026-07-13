import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { validate } from '../lib/validate.js'
import { BadRequestError } from '../lib/errors.js'
import { signAccessToken, signRefreshToken } from '../lib/jwt.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const githubCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function oauthRoutes(app: FastifyInstance) {

  // ─── GET /api/auth/github ────────────────────────────────────────────────
  // Redirect to GitHub OAuth authorization page
  app.get('/api/auth/github', async (_request, reply) => {
    if (!env.GITHUB_CLIENT_ID) {
      throw new BadRequestError('GitHub OAuth is not configured')
    }

    const state = uuid()
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'user:email read:org',
      state,
    })

    return reply.redirect(`https://github.com/login/oauth/authorize?${params}`)
  })

  // ─── GET /api/auth/github/callback ───────────────────────────────────────
  app.get('/api/auth/github/callback', async (request, reply) => {
    const { code } = validate(githubCallbackSchema, request.query)

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new BadRequestError('GitHub OAuth is not configured')
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      }),
    })

    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string }
    if (!tokenData.access_token) {
      throw new BadRequestError(`GitHub OAuth failed: ${tokenData.error || 'unknown error'}`)
    }

    const githubToken = tokenData.access_token

    // Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/json' },
    })
    const githubUser = await userResponse.json() as {
      id: number; login: string; name: string; avatar_url: string; email: string | null
    }

    // Fetch primary email if not public
    let email = githubUser.email
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/json' },
      })
      const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>
      const primary = emails.find((e) => e.primary && e.verified)
      email = primary?.email || emails[0]?.email || null
    }

    if (!email) {
      throw new BadRequestError('Could not retrieve email from GitHub. Please make your email public or add a verified email.')
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ githubId: String(githubUser.id) }, { email }] },
      include: {
        memberships: { include: { org: true }, take: 1, orderBy: { createdAt: 'asc' } },
      },
    })

    if (!user) {
      // New user — create account + org
      const names = (githubUser.name || githubUser.login).split(' ')
      const firstName = names[0] || githubUser.login
      const lastName = names.slice(1).join(' ') || ''

      const orgName = `${firstName}'s Team`
      const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuid().slice(0, 6)}`

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            firstName,
            lastName,
            githubId: String(githubUser.id),
            githubToken,
            avatarUrl: githubUser.avatar_url,
            emailVerified: true,
          },
        })

        const org = await tx.organization.create({
          data: {
            name: orgName,
            slug,
            members: { create: { userId: newUser.id, role: 'OWNER' } },
          },
        })

        return { user: newUser, org }
      })

      user = {
        ...result.user,
        memberships: [{ id: '', role: 'OWNER' as const, userId: result.user.id, orgId: result.org.id, createdAt: new Date(), org: result.org }],
      }
    } else {
      // Existing user — update GitHub token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          githubId: String(githubUser.id),
          githubToken,
          avatarUrl: githubUser.avatar_url || user.avatarUrl,
          lastLoginAt: new Date(),
        },
      })
    }

    const membership = user.memberships[0]
    if (!membership) {
      throw new BadRequestError('User has no organization')
    }

    // Generate tokens
    const accessToken = signAccessToken(app, {
      sub: user.id,
      orgId: membership.orgId,
      role: membership.role,
    })
    const refreshToken = signRefreshToken(app, { sub: user.id })

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Redirect to frontend with tokens
    const redirectUrl = new URL('/auth/callback', env.CLIENT_URL)
    redirectUrl.searchParams.set('accessToken', accessToken)
    redirectUrl.searchParams.set('refreshToken', refreshToken)

    return reply.redirect(redirectUrl.toString())
  })
}
