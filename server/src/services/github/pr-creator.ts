import { Octokit } from 'octokit'
import { prisma } from '../../config/database.js'
import { logger } from '../../lib/logger.js'
import { broadcastToOrg } from '../../routes/websocket.js'

interface CreatePROptions {
  remediationId: string
  userId: string  // who triggered it — we use their GitHub token
}

/**
 * Creates an actual GitHub PR with the generated remediation patch.
 * Requires the user to have a connected GitHub account with repo write access.
 */
export async function createGitHubPR(options: CreatePROptions): Promise<{ prUrl: string; prNumber: number } | null> {
  const { remediationId, userId } = options

  // Fetch remediation with vulnerability and user GitHub token
  const remediation = await prisma.remediation.findUnique({
    where: { id: remediationId },
    include: {
      vulnerability: {
        include: { target: true },
      },
    },
  })

  if (!remediation || !remediation.patch) {
    logger.error({ remediationId }, 'Remediation not found or has no patch')
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubToken: true },
  })

  if (!user?.githubToken) {
    logger.error({ userId }, 'User has no GitHub token — cannot create PR')
    await prisma.remediation.update({
      where: { id: remediationId },
      data: {
        status: 'FAILED',
        description: 'Cannot create PR: GitHub account not connected. Please connect GitHub in Settings.',
      },
    })
    return null
  }

  const octokit = new Octokit({ auth: user.githubToken })
  const vuln = remediation.vulnerability
  const orgId = vuln.orgId

  // Determine repo from remediation or target metadata
  const repoFullName = remediation.repo
  if (!repoFullName) {
    logger.error({ remediationId }, 'No repo configured on remediation')
    await prisma.remediation.update({
      where: { id: remediationId },
      data: { status: 'FAILED', description: 'No repository configured for this remediation.' },
    })
    return null
  }

  const [owner, repo] = repoFullName.split('/')
  if (!owner || !repo) {
    logger.error({ repoFullName }, 'Invalid repo format, expected owner/repo')
    return null
  }

  try {
    // 1. Get the default branch
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
    const defaultBranch = repoData.default_branch

    // 2. Get latest commit SHA on default branch
    const { data: refData } = await octokit.rest.git.getRef({
      owner, repo, ref: `heads/${defaultBranch}`,
    })
    const baseSha = refData.object.sha

    // 3. Create new branch
    const branchName = remediation.branch || `fix/penagent-${remediationId.slice(0, 8)}`
    try {
      await octokit.rest.git.createRef({
        owner, repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      })
    } catch (err: unknown) {
      // Branch might already exist
      const error = err as { status?: number }
      if (error.status !== 422) throw err
      logger.warn({ branchName }, 'Branch already exists, using it')
    }

    // 4. Parse patch and create/update files
    // For simplicity, we commit the full fixed file content
    // In production, you'd parse the unified diff and apply it
    const patchLines = remediation.patch.split('\n')
    const files: Array<{ path: string; content: string }> = []
    let currentFile = ''
    let currentContent: string[] = []

    for (const line of patchLines) {
      if (line.startsWith('+++ b/')) {
        if (currentFile && currentContent.length > 0) {
          files.push({ path: currentFile, content: currentContent.join('\n') })
        }
        currentFile = line.slice(6)
        currentContent = []
      } else if (currentFile && !line.startsWith('---') && !line.startsWith('@@')) {
        if (line.startsWith('+')) {
          currentContent.push(line.slice(1))
        } else if (!line.startsWith('-')) {
          currentContent.push(line)
        }
      }
    }
    if (currentFile && currentContent.length > 0) {
      files.push({ path: currentFile, content: currentContent.join('\n') })
    }

    // 5. Create blobs and tree
    if (files.length === 0) {
      // Fallback: create a single file with the patch
      files.push({ path: 'PENAGENT_FIX.patch', content: remediation.patch })
    }

    const blobs = await Promise.all(
      files.map(async (f) => {
        const { data } = await octokit.rest.git.createBlob({
          owner, repo, content: Buffer.from(f.content).toString('base64'), encoding: 'base64',
        })
        return { path: f.path, sha: data.sha }
      })
    )

    const { data: baseTree } = await octokit.rest.git.getTree({ owner, repo, tree_sha: baseSha })
    const { data: newTree } = await octokit.rest.git.createTree({
      owner, repo,
      base_tree: baseTree.sha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: b.sha,
      })),
    })

    // 6. Create commit
    const commitMessage = `fix: ${vuln.title}\n\n${remediation.description?.split('\n').slice(0, 5).join('\n') || ''}\n\nGenerated by PenAgent`
    const { data: commit } = await octokit.rest.git.createCommit({
      owner, repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [baseSha],
    })

    // 7. Update branch ref
    await octokit.rest.git.updateRef({
      owner, repo,
      ref: `heads/${branchName}`,
      sha: commit.sha,
    })

    // 8. Create Pull Request
    const { data: pr } = await octokit.rest.pulls.create({
      owner, repo,
      title: `🔒 [PenAgent] Fix: ${vuln.title}`,
      body: remediation.description || `Automated security fix for ${vuln.title}`,
      head: branchName,
      base: defaultBranch,
    })

    // 9. Update remediation record
    await prisma.remediation.update({
      where: { id: remediationId },
      data: {
        status: 'PR_OPEN',
        prUrl: pr.html_url,
        prNumber: pr.number,
        branch: branchName,
      },
    })

    // Notification
    await prisma.notification.create({
      data: {
        orgId,
        type: 'PR_OPENED',
        title: `PR #${pr.number} opened: ${vuln.title}`,
        body: `${repoFullName} — branch ${branchName}`,
        metadata: { prUrl: pr.html_url, prNumber: pr.number, remediationId },
      },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'remediation.pr_created',
        resource: 'remediation',
        resourceId: remediationId,
        metadata: { prUrl: pr.html_url, prNumber: pr.number, repo: repoFullName },
      },
    })

    // Broadcast
    broadcastToOrg(orgId, {
      type: 'remediation.pr_created',
      data: {
        remediationId,
        prUrl: pr.html_url,
        prNumber: pr.number,
        repo: repoFullName,
        branch: branchName,
        title: vuln.title,
      },
    })

    logger.info({
      remediationId,
      prNumber: pr.number,
      prUrl: pr.html_url,
      repo: repoFullName,
    }, 'GitHub PR created successfully')

    return { prUrl: pr.html_url, prNumber: pr.number }

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ remediationId, error: msg }, 'GitHub PR creation failed')

    await prisma.remediation.update({
      where: { id: remediationId },
      data: { status: 'FAILED', description: `PR creation failed: ${msg}` },
    })

    broadcastToOrg(orgId, {
      type: 'remediation.failed',
      data: { remediationId, error: msg },
    })

    return null
  }
}
