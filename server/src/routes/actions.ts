import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, idSchema } from '../lib/validate.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'
import { enqueueRemediation, enqueuePoCGeneration, enqueueGitHubPR, enqueueAttackChainAnalysis } from '../services/queue/index.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const generateRemediationSchema = z.object({
  vulnerabilityId: z.string().uuid(),
  repo: z.string().min(1).max(200).optional(), // owner/repo
})

const createPRSchema = z.object({
  remediationId: z.string().uuid(),
})

const generatePoCSchema = z.object({
  vulnerabilityId: z.string().uuid(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function actionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── POST /api/actions/generate-remediation ──────────────────────────────
  // Triggers LLM code fix generation for a vulnerability
  app.post('/api/actions/generate-remediation', async (request, reply) => {
    const data = validate(generateRemediationSchema, request.body)
    const orgId = request.authUser!.orgId
    const role = request.authUser!.role

    if (!['OWNER', 'ADMIN', 'SECURITY_LEAD'].includes(role)) {
      throw new ForbiddenError('Only admins and security leads can trigger remediations')
    }

    // Validate vulnerability
    const vuln = await prisma.vulnerability.findFirst({
      where: { id: data.vulnerabilityId, orgId },
    })
    if (!vuln) throw new NotFoundError('Vulnerability', data.vulnerabilityId)
    if (vuln.status === 'VERIFIED_FIXED') {
      throw new BadRequestError('Vulnerability is already fixed')
    }

    // Check for existing active remediation
    const existingActive = await prisma.remediation.findFirst({
      where: {
        vulnerabilityId: data.vulnerabilityId,
        status: { in: ['GENERATING', 'PR_OPEN', 'IN_REVIEW'] },
      },
    })
    if (existingActive) {
      throw new BadRequestError('An active remediation already exists. Cancel it first to regenerate.')
    }

    // Create remediation record
    const remediation = await prisma.remediation.create({
      data: {
        vulnerabilityId: data.vulnerabilityId,
        status: 'GENERATING',
        repo: data.repo || null,
      },
    })

    // Update vuln status
    await prisma.vulnerability.update({
      where: { id: data.vulnerabilityId },
      data: { status: 'REMEDIATION' },
    })

    // Queue the LLM job
    await enqueueRemediation(remediation.id)

    await prisma.auditLog.create({
      data: {
        orgId,
        userId: request.authUser!.userId,
        action: 'remediation.generation_queued',
        resource: 'remediation',
        resourceId: remediation.id,
        metadata: { vulnerabilityId: data.vulnerabilityId, repo: data.repo },
      },
    })

    return reply.status(202).send({
      success: true,
      message: 'Remediation generation queued',
      data: { remediationId: remediation.id, status: 'GENERATING' },
    })
  })

  // ─── POST /api/actions/create-pr ─────────────────────────────────────────
  // Pushes the generated fix to GitHub as a Pull Request
  app.post('/api/actions/create-pr', async (request, reply) => {
    const data = validate(createPRSchema, request.body)
    const orgId = request.authUser!.orgId
    const userId = request.authUser!.userId

    const remediation = await prisma.remediation.findFirst({
      where: { id: data.remediationId, vulnerability: { orgId } },
    })
    if (!remediation) throw new NotFoundError('Remediation', data.remediationId)
    if (!remediation.patch) {
      throw new BadRequestError('Remediation has no generated patch. Wait for generation to complete.')
    }
    if (!remediation.repo) {
      throw new BadRequestError('No repository configured. Set repo on the remediation first.')
    }

    // Check user has GitHub connected
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { githubToken: true },
    })
    if (!user?.githubToken) {
      throw new BadRequestError('GitHub account not connected. Please connect GitHub in Settings.')
    }

    // Queue PR creation
    await enqueueGitHubPR(data.remediationId, userId)

    return reply.status(202).send({
      success: true,
      message: 'PR creation queued',
      data: { remediationId: data.remediationId },
    })
  })

  // ─── POST /api/actions/generate-poc ──────────────────────────────────────
  // Generates a proof-of-concept exploit for verification
  app.post('/api/actions/generate-poc', async (request, reply) => {
    const data = validate(generatePoCSchema, request.body)
    const orgId = request.authUser!.orgId

    const vuln = await prisma.vulnerability.findFirst({
      where: { id: data.vulnerabilityId, orgId },
    })
    if (!vuln) throw new NotFoundError('Vulnerability', data.vulnerabilityId)

    // Queue PoC generation
    await enqueuePoCGeneration(data.vulnerabilityId)

    return reply.status(202).send({
      success: true,
      message: 'PoC generation queued',
      data: { vulnerabilityId: data.vulnerabilityId },
    })
  })

  // ─── POST /api/actions/analyze-chains ────────────────────────────────────
  // Triggers attack chain analysis for the current org
  app.post('/api/actions/analyze-chains', async (request, reply) => {
    const orgId = request.authUser!.orgId
    const role = request.authUser!.role

    if (!['OWNER', 'ADMIN', 'SECURITY_LEAD'].includes(role)) {
      throw new ForbiddenError('Only admins and security leads can trigger analysis')
    }

    await enqueueAttackChainAnalysis(orgId)

    return reply.status(202).send({
      success: true,
      message: 'Attack chain analysis queued',
    })
  })
}
