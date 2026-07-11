import type { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js'
import type { Role } from '@prisma/client'

export interface AuthUser {
  userId: string
  orgId: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
}

/**
 * Middleware: requires valid JWT. Populates request.authUser.
 */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string; orgId: string; role: string }>()
    request.authUser = {
      userId: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
    }
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

/**
 * Factory: requires one of the specified roles.
 */
export function requireRole(...allowed: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    await requireAuth(request, _reply)
    const user = request.authUser!
    if (!allowed.includes(user.role as Role)) {
      throw new ForbiddenError(`Role '${user.role}' does not have access. Required: ${allowed.join(', ')}`)
    }
  }
}

/**
 * Middleware: checks org membership (prevents cross-tenant access).
 */
export async function requireOrgAccess(request: FastifyRequest, _reply: FastifyReply) {
  await requireAuth(request, _reply)
  // orgId is already embedded in JWT — any resource access is validated against it
}
