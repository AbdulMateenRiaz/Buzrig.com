import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { errorHandler } from './middleware/error-handler.js'
import { authRoutes } from './routes/auth.js'
import { targetRoutes } from './routes/targets.js'
import { scanRoutes } from './routes/scans.js'
import { vulnerabilityRoutes } from './routes/vulnerabilities.js'
import { remediationRoutes } from './routes/remediations.js'
import { attackChainRoutes } from './routes/attack-chains.js'
import { complianceRoutes } from './routes/compliance.js'
import { notificationRoutes } from './routes/notifications.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { auditLogRoutes } from './routes/audit-logs.js'
import { oauthRoutes } from './routes/oauth.js'
import { websocketRoutes } from './routes/websocket.js'
import { actionRoutes } from './routes/actions.js'
import { logger } from './lib/logger.js'

async function buildApp() {
  const app = Fastify({
    logger: false, // we use pino directly
    trustProxy: true,
  })

  // ─── Plugins ─────────────────────────────────────────────────────────────

  await app.register(cors, {
    origin: [env.CLIENT_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(jwt, { secret: env.JWT_SECRET })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  })

  // WebSocket support
  const websocket = await import('@fastify/websocket')
  await app.register(websocket.default)

  // ─── Error Handler ───────────────────────────────────────────────────────

  app.setErrorHandler(errorHandler)

  // ─── Health Check ────────────────────────────────────────────────────────

  app.get('/api/health', async () => ({
    success: true,
    data: {
      status: 'healthy',
      version: '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  }))

  // ─── Routes ──────────────────────────────────────────────────────────────

  await app.register(authRoutes)
  await app.register(oauthRoutes)
  await app.register(targetRoutes)
  await app.register(scanRoutes)
  await app.register(vulnerabilityRoutes)
  await app.register(remediationRoutes)
  await app.register(attackChainRoutes)
  await app.register(complianceRoutes)
  await app.register(notificationRoutes)
  await app.register(dashboardRoutes)
  await app.register(auditLogRoutes)
  await app.register(websocketRoutes)
  await app.register(actionRoutes)

  // ─── 404 Handler ─────────────────────────────────────────────────────────

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    })
  })

  return app
}

// ─── Start Server ────────────────────────────────────────────────────────────

async function start() {
  try {
    await connectDatabase()

    const app = await buildApp()

    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    logger.info(`🚀 Buzrig API running on port ${env.PORT} (${env.NODE_ENV})`)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...')
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...')
  await disconnectDatabase()
  process.exit(0)
})

start()
