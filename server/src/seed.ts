import { PrismaClient } from '@prisma/client'
import { hashPassword } from './lib/password.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.auditLog.deleteMany()
  await prisma.complianceMapping.deleteMany()
  await prisma.complianceControl.deleteMany()
  await prisma.complianceFramework.deleteMany()
  await prisma.attackChainNode.deleteMany()
  await prisma.attackChain.deleteMany()
  await prisma.remediation.deleteMany()
  await prisma.vulnerability.deleteMany()
  await prisma.scan.deleteMany()
  await prisma.target.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.orgMember.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  // Create demo user
  const passwordHash = await hashPassword('Demo@1234')
  const user = await prisma.user.create({
    data: {
      email: 'demo@buzrig.com',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Chen',
      emailVerified: true,
    },
  })

  // Create org
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: 'GROWTH',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })

  // Create targets
  const targets = await Promise.all([
    prisma.target.create({
      data: { orgId: org.id, name: 'API Server', type: 'API_ENDPOINT', value: 'api.acme.com', verified: true, verifiedAt: new Date() },
    }),
    prisma.target.create({
      data: { orgId: org.id, name: 'Web Application', type: 'WEB_APPLICATION', value: 'app.acme.com', verified: true, verifiedAt: new Date() },
    }),
    prisma.target.create({
      data: { orgId: org.id, name: 'Auth Service', type: 'API_ENDPOINT', value: 'auth.acme.com', verified: true, verifiedAt: new Date() },
    }),
  ])

  // Create a completed scan
  const scan = await prisma.scan.create({
    data: {
      orgId: org.id,
      targetId: targets[0].id,
      status: 'COMPLETED',
      scanType: 'FULL',
      progress: 100,
      findingsCount: 5,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
    },
  })

  // Create vulnerabilities
  await prisma.vulnerability.createMany({
    data: [
      { orgId: org.id, targetId: targets[0].id, scanId: scan.id, title: 'SQL Injection in /api/users/search', description: 'User input passed directly into SQL query without parameterization.', severity: 'CRITICAL', cvss: 9.8, status: 'OPEN', category: 'Injection', cwe: 'CWE-89', owasp: 'A03:2021', endpoint: '/api/users/search' },
      { orgId: org.id, targetId: targets[1].id, scanId: scan.id, title: 'Broken Access Control — IDOR on invoice download', description: 'Invoice endpoint accepts arbitrary IDs without ownership check.', severity: 'HIGH', cvss: 8.1, status: 'REMEDIATION', category: 'Broken Access Control', cwe: 'CWE-639', owasp: 'A01:2021', endpoint: '/api/invoices/:id/download' },
      { orgId: org.id, targetId: targets[1].id, scanId: scan.id, title: 'Stored XSS via user display name', description: 'User display names rendered without sanitization in comments.', severity: 'HIGH', cvss: 7.5, status: 'OPEN', category: 'Cross-Site Scripting', cwe: 'CWE-79', owasp: 'A07:2021', endpoint: '/comments' },
      { orgId: org.id, targetId: targets[2].id, scanId: scan.id, title: 'Missing rate limiting on password reset', description: 'No rate limiting on reset-password allows brute-force.', severity: 'MEDIUM', cvss: 5.9, status: 'REMEDIATION', category: 'Security Misconfiguration', cwe: 'CWE-307', owasp: 'A05:2021', endpoint: '/auth/reset-password' },
      { orgId: org.id, targetId: targets[2].id, scanId: scan.id, title: 'Weak JWT signing secret', description: 'JWT uses HS256 with a dictionary word as secret.', severity: 'CRITICAL', cvss: 9.1, status: 'OPEN', category: 'Cryptographic Failures', cwe: 'CWE-326', owasp: 'A02:2021', endpoint: '/auth/login' },
    ],
  })

  // Create compliance frameworks
  const soc2 = await prisma.complianceFramework.create({
    data: {
      name: 'SOC 2 Type II',
      version: '2023',
      controls: {
        createMany: {
          data: [
            { controlId: 'CC6.1', name: 'Logical and Physical Access Controls', description: 'Restricts logical and physical access to information assets.' },
            { controlId: 'CC6.6', name: 'Security Event Monitoring', description: 'Monitors the system for anomalies.' },
            { controlId: 'CC7.2', name: 'System Monitoring & Anomaly Detection', description: 'Detects unauthorized access and anomalies.' },
          ],
        },
      },
    },
  })

  await prisma.complianceFramework.create({
    data: {
      name: 'PCI-DSS v4.0',
      version: '4.0',
      controls: {
        createMany: {
          data: [
            { controlId: 'Req-6.4', name: 'Address Common Coding Vulnerabilities', description: 'Applications are developed securely.' },
            { controlId: 'Req-11.3', name: 'Penetration Testing', description: 'Regular penetration testing performed.' },
          ],
        },
      },
    },
  })

  await prisma.complianceFramework.create({
    data: {
      name: 'HIPAA',
      version: '2023',
      controls: {
        createMany: {
          data: [
            { controlId: '164.312(a)', name: 'Access Control', description: 'Technical safeguards for access control.' },
            { controlId: '164.312(e)', name: 'Transmission Security', description: 'Guard against unauthorized access to ePHI in transit.' },
          ],
        },
      },
    },
  })

  console.log('✅ Seed complete')
  console.log(`   User: demo@buzrig.com / Demo@1234`)
  console.log(`   Org: ${org.name} (${org.slug})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
