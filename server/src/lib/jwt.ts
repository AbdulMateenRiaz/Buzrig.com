import type { FastifyInstance } from 'fastify'
import { env } from '../config/env.js'

export interface JwtPayload {
  sub: string      // userId
  orgId: string
  role: string
}

export function signAccessToken(app: FastifyInstance, payload: JwtPayload): string {
  return app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN })
}

export function signRefreshToken(app: FastifyInstance, payload: { sub: string }): string {
  // Use a different secret for refresh tokens
  return app.jwt.sign(payload, { expiresIn: env.JWT_REFRESH_EXPIRES_IN })
}

export function verifyToken(app: FastifyInstance, token: string): JwtPayload {
  return app.jwt.verify(token) as JwtPayload
}
