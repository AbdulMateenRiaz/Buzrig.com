import Redis from 'ioredis'
import { env } from './env.js'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message)
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected')
    })
  }
  return redis
}

export async function connectRedis() {
  const client = getRedis()
  try {
    await client.connect()
  } catch (error) {
    console.warn('⚠️  Redis not available, running without cache/queue:', (error as Error).message)
  }
}

export async function disconnectRedis() {
  if (redis) {
    await redis.quit()
    redis = null
  }
}
