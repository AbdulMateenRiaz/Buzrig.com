import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { validate, idSchema } from '../lib/validate.js'
import { NotFoundError } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const frameworkIdSchema = z.object({
  frameworkId: z.string().uuid(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function complianceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/compliance/frameworks ──────────────────────────────────────
  app.get('/api/compliance/frameworks', async (request, reply) => {
    const orgId = request.authUser!.orgId

    const frameworks = await prisma.complianceFramework.findMany({
      include: {
        controls: {
          include: {
            mappings: {
              where: { vulnerability: { orgId } },
              select: { status: true },
            },
          },
        },
      },
    })

    // Calculate compliance stats per framework
    const data = frameworks.map((fw) => {
      let passing = 0
      let failing = 0
      let warning = 0
      let notApplicable = 0

      fw.controls.forEach((ctrl) => {
        if (ctrl.mappings.length === 0) {
          passing++ // no findings = passing
        } else {
          const hasFailure = ctrl.mappings.some((m) => m.status === 'FAILING')
          const hasWarning = ctrl.mappings.some((m) => m.status === 'WARNING')
          if (hasFailure) failing++
          else if (hasWarning) warning++
          else passing++
        }
      })

      const totalControls = fw.controls.length
      const compliancePercent = totalControls > 0
        ? Math.round((passing / totalControls) * 100)
        : 100

      return {
        id: fw.id,
        name: fw.name,
        version: fw.version,
        totalControls,
        passing,
        failing,
        warning,
        notApplicable,
        compliancePercent,
      }
    })

    return reply.send({ success: true, data })
  })

  // ─── GET /api/compliance/frameworks/:frameworkId/controls ─────────────────
  app.get('/api/compliance/frameworks/:frameworkId/controls', async (request, reply) => {
    const { frameworkId } = validate(frameworkIdSchema, request.params)
    const orgId = request.authUser!.orgId

    const framework = await prisma.complianceFramework.findUnique({
      where: { id: frameworkId },
    })
    if (!framework) throw new NotFoundError('Compliance Framework', frameworkId)

    const controls = await prisma.complianceControl.findMany({
      where: { frameworkId },
      include: {
        mappings: {
          where: { vulnerability: { orgId } },
          include: {
            vulnerability: {
              select: { id: true, title: true, severity: true, status: true },
            },
          },
        },
      },
      orderBy: { controlId: 'asc' },
    })

    const data = controls.map((ctrl) => {
      let status: 'pass' | 'fail' | 'warning' = 'pass'
      if (ctrl.mappings.some((m) => m.status === 'FAILING')) status = 'fail'
      else if (ctrl.mappings.some((m) => m.status === 'WARNING')) status = 'warning'

      return {
        id: ctrl.id,
        controlId: ctrl.controlId,
        name: ctrl.name,
        description: ctrl.description,
        status,
        findings: ctrl.mappings.length,
        vulnerabilities: ctrl.mappings.map((m) => m.vulnerability),
      }
    })

    return reply.send({
      success: true,
      data: {
        framework: { id: framework.id, name: framework.name, version: framework.version },
        controls: data,
      },
    })
  })

  // ─── GET /api/compliance/summary ─────────────────────────────────────────
  app.get('/api/compliance/summary', async (request, reply) => {
    const orgId = request.authUser!.orgId

    // Overall compliance score across all frameworks
    const allMappings = await prisma.complianceMapping.findMany({
      where: { vulnerability: { orgId } },
      select: { status: true },
    })

    const totalMappings = allMappings.length
    const failingMappings = allMappings.filter((m) => m.status === 'FAILING').length
    const warningMappings = allMappings.filter((m) => m.status === 'WARNING').length

    // Open vulns affecting compliance
    const affectedVulns = await prisma.vulnerability.count({
      where: {
        orgId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'REMEDIATION'] },
        complianceMappings: { some: {} },
      },
    })

    return reply.send({
      success: true,
      data: {
        totalMappings,
        failingMappings,
        warningMappings,
        passingMappings: totalMappings - failingMappings - warningMappings,
        affectedVulnerabilities: affectedVulns,
        overallScore: totalMappings > 0
          ? Math.round(((totalMappings - failingMappings) / totalMappings) * 100)
          : 100,
      },
    })
  })
}
