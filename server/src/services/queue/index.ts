import { Queue, Worker, type Job } from 'bullmq'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { generateRemediation } from '../llm/remediation-generator.js'
import { analyzeAttackChains } from '../llm/attack-chain-analyzer.js'
import { generatePoC } from '../llm/poc-generator.js'
import { createGitHubPR } from '../github/pr-creator.js'
import { executeScan } from '../scanner/scan-executor.js'

// ─── Queue Definitions ───────────────────────────────────────────────────────

const redisAvailable = !!env.REDIS_URL && env.REDIS_URL.length > 0

let connection: { host: string; port: number; password?: string; tls?: object } | undefined

if (redisAvailable) {
  try {
    const url = new URL(env.REDIS_URL)
    connection = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      ...(url.password && { password: url.password }),
      ...(url.protocol === 'rediss:' && { tls: {} }),
    }
  } catch {
    logger.warn('Invalid REDIS_URL, running without job queue')
  }
}

export const scanQueue = connection ? new Queue('scan', { connection }) : null
export const remediationQueue = connection ? new Queue('remediation', { connection }) : null
export const attackChainQueue = connection ? new Queue('attack-chain', { connection }) : null
export const pocQueue = connection ? new Queue('poc', { connection }) : null
export const githubQueue = connection ? new Queue('github', { connection }) : null

// ─── Workers ─────────────────────────────────────────────────────────────────

let scanWorker: Worker | null = null
let remediationWorker: Worker | null = null
let attackChainWorker: Worker | null = null
let pocWorker: Worker | null = null
let githubWorker: Worker | null = null

/**
 * Start all background job workers.
 * Each worker processes jobs from its respective queue.
 */
export function startWorkers() {
  if (!connection) {
    logger.warn('⚠️  Redis not configured — background workers disabled. Scans and LLM jobs will run inline.')
    return
  }

  // Scan execution worker
  scanWorker = new Worker(
    'scan',
    async (job: Job<{ scanId: string }>) => {
      logger.info({ jobId: job.id, scanId: job.data.scanId }, 'Processing scan job')
      await executeScan(job.data.scanId)
    },
    {
      connection: connection!,
      concurrency: 5,
    }
  )

  scanWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Scan job completed')
  })

  scanWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Scan job failed')
  })

  // Remediation generation worker
  remediationWorker = new Worker(
    'remediation',
    async (job: Job<{ remediationId: string }>) => {
      logger.info({ jobId: job.id, remediationId: job.data.remediationId }, 'Processing remediation job')
      await generateRemediation(job.data.remediationId)
    },
    {
      connection: connection!,
      concurrency: 3,
      limiter: { max: 10, duration: 60_000 },
    }
  )

  remediationWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Remediation job completed')
  })

  remediationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Remediation job failed')
  })

  // Attack chain analysis worker
  attackChainWorker = new Worker(
    'attack-chain',
    async (job: Job<{ orgId: string }>) => {
      logger.info({ jobId: job.id, orgId: job.data.orgId }, 'Processing attack chain analysis')
      await analyzeAttackChains(job.data.orgId)
    },
    {
      connection: connection!,
      concurrency: 2,
      limiter: { max: 5, duration: 60_000 },
    }
  )

  attackChainWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Attack chain job failed')
  })

  // PoC generation worker
  pocWorker = new Worker(
    'poc',
    async (job: Job<{ vulnerabilityId: string }>) => {
      logger.info({ jobId: job.id, vulnerabilityId: job.data.vulnerabilityId }, 'Processing PoC generation')
      await generatePoC(job.data.vulnerabilityId)
    },
    {
      connection: connection!,
      concurrency: 3,
      limiter: { max: 10, duration: 60_000 },
    }
  )

  pocWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'PoC generation job failed')
  })

  // GitHub PR creation worker
  githubWorker = new Worker(
    'github',
    async (job: Job<{ remediationId: string; userId: string }>) => {
      logger.info({ jobId: job.id, remediationId: job.data.remediationId }, 'Processing GitHub PR creation')
      await createGitHubPR(job.data)
    },
    {
      connection: connection!,
      concurrency: 2,
      limiter: { max: 30, duration: 60_000 },
    }
  )

  githubWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'GitHub PR job failed')
  })

  logger.info('✅ Background workers started (scan, remediation, attack-chain, poc, github)')
}

/**
 * Gracefully shut down all workers
 */
export async function stopWorkers() {
  await Promise.all([
    scanWorker?.close(),
    remediationWorker?.close(),
    attackChainWorker?.close(),
    pocWorker?.close(),
    githubWorker?.close(),
  ])
  logger.info('Workers stopped')
}

// ─── Helper: enqueue jobs ────────────────────────────────────────────────────

export async function enqueueScan(scanId: string) {
  if (!scanQueue) {
    logger.info({ scanId }, 'No Redis — running scan inline')
    await executeScan(scanId)
    return
  }
  await scanQueue.add('execute', { scanId }, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  })
}

export async function enqueueRemediation(remediationId: string) {
  if (!remediationQueue) {
    logger.info({ remediationId }, 'No Redis — running remediation inline')
    await generateRemediation(remediationId)
    return
  }
  await remediationQueue.add('generate', { remediationId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  })
}

export async function enqueueAttackChainAnalysis(orgId: string) {
  if (!attackChainQueue) {
    await analyzeAttackChains(orgId)
    return
  }
  await attackChainQueue.add('analyze', { orgId }, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: 50,
    jobId: `attack-chain-${orgId}`,
  })
}

export async function enqueuePoCGeneration(vulnerabilityId: string) {
  if (!pocQueue) {
    await generatePoC(vulnerabilityId)
    return
  }
  await pocQueue.add('generate', { vulnerabilityId }, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
  })
}

export async function enqueueGitHubPR(remediationId: string, userId: string) {
  if (!githubQueue) {
    await createGitHubPR({ remediationId, userId })
    return
  }
  await githubQueue.add('create-pr', { remediationId, userId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
  })
}
