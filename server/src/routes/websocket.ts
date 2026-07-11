import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'

// Store active connections per org
const connections = new Map<string, Set<WebSocket>>()

/**
 * Broadcast an event to all connected clients in an organization
 */
export function broadcastToOrg(orgId: string, event: { type: string; data: unknown }) {
  const orgConnections = connections.get(orgId)
  if (!orgConnections) return

  const message = JSON.stringify(event)
  for (const ws of orgConnections) {
    if (ws.readyState === 1) { // OPEN
      ws.send(message)
    }
  }
}

export async function websocketRoutes(app: FastifyInstance) {
  // ─── WebSocket: /api/ws ──────────────────────────────────────────────────
  app.get('/api/ws', { websocket: true }, (socket, request) => {
    // Authenticate via query param token
    const url = new URL(request.url, 'http://localhost')
    const token = url.searchParams.get('token')

    if (!token) {
      socket.close(4001, 'Authentication required')
      return
    }

    let orgId: string
    try {
      const payload = app.jwt.verify<{ sub: string; orgId: string }>(token)
      orgId = payload.orgId
    } catch {
      socket.close(4001, 'Invalid token')
      return
    }

    // Register connection
    if (!connections.has(orgId)) {
      connections.set(orgId, new Set())
    }
    connections.get(orgId)!.add(socket)

    // Send welcome
    socket.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to PenAgent real-time feed', orgId },
    }))

    // Handle ping/pong for keepalive
    socket.on('message', (msg: Buffer | string) => {
      const str = msg.toString()
      if (str === 'ping') {
        socket.send('pong')
      }
    })

    // Cleanup on disconnect
    socket.on('close', () => {
      connections.get(orgId)?.delete(socket)
      if (connections.get(orgId)?.size === 0) {
        connections.delete(orgId)
      }
    })

    socket.on('error', () => {
      connections.get(orgId)?.delete(socket)
    })
  })
}
