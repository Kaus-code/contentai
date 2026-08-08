import prisma from './prisma'

function hasModel(name: string) {
  // @ts-ignore
  return prisma && typeof (prisma as any)[name] !== 'undefined'
}

export async function createAgent(data: { id?: string; name: string; domain: string }) {
  return prisma.agent.create({ data })
}

export async function createPost(data: {
  agentId: string
  text: string
  rationale?: string | null
  sources?: any
}) {
  // Map incoming `text` to the Prisma `Post.body` field used in the dev schema.
  const mapped: any = { agentId: data.agentId, body: data.text }
  if (typeof data.sources !== 'undefined') mapped.sources = typeof data.sources === 'string' ? data.sources : JSON.stringify(data.sources)
  // Support optional publish flags
  if ((data as any).publishStatus) mapped.publishStatus = (data as any).publishStatus
  if ((data as any).publishedAt) mapped.publishedAt = (data as any).publishedAt

  return prisma.post.create({ data: mapped })
}

export async function createEvaluatedTopic(data: {
  agentId: string
  title: string
  url?: string | null
  status: string
  reason?: string | null
}) {
  // Map to CandidateTopic model in the dev schema
  const mapped: any = { agentId: data.agentId, title: data.title }
  if (data.url) mapped.originalUrl = data.url
  if (data.status) mapped.editorialDecision = data.status
  if (data.reason) mapped.rejectionReason = data.reason
  // discoveryMode is required in the dev schema; default to 'EDITORIAL' for evaluated topics
  if (!mapped.discoveryMode) mapped.discoveryMode = 'EDITORIAL'
  return prisma.candidateTopic.create({ data: mapped })
}

export async function getAgentById(id: string) {
  return prisma.agent.findUnique({ where: { id } })
}

export async function listPostsByAgent(agentId: string, includeDrafts = false) {
  const where: any = { agentId }
  if (!includeDrafts) where.publishStatus = 'PUBLISHED'
  return prisma.post.findMany({ where, orderBy: { createdAt: 'desc' } })
}

export async function listEvaluatedTopicsByAgent(agentId: string) {
  return prisma.candidateTopic.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
}

export async function getAllAgents() {
  return prisma.agent.findMany()
}

export async function updateAgentSchedule(agentId: string, intervalMinutes?: number | null, paused?: boolean | null) {
  const data: any = {}
  if (typeof intervalMinutes === 'number') data.scheduleIntervalMinutes = intervalMinutes
  if (typeof paused === 'boolean') data.schedulePaused = paused

  return prisma.agent.update({ where: { id: agentId }, data })
}

export async function createWorkflow(data: { agentId: string; name: string }) {
  return prisma.workflow.create({ data })
}

export async function listWorkflowsByAgent(agentId: string) {
  return prisma.workflow.findMany({ where: { agentId }, include: { steps: { orderBy: { stepOrder: 'asc' } } } })
}

export async function createWorkflowStep(data: { workflowId: string; stepOrder: number; stepType: string; config?: string }) {
  return prisma.workflowStep.create({ data })
}

export async function updateWorkflowStep(id: string, data: { stepOrder?: number; stepType?: string; config?: string }) {
  return prisma.workflowStep.update({ where: { id }, data })
}

export async function deleteWorkflowStep(id: string) {
  return prisma.workflowStep.delete({ where: { id } })
}

export async function listWorkflowSteps(workflowId: string) {
  return prisma.workflowStep.findMany({ where: { workflowId }, orderBy: { stepOrder: 'asc' } })
}

export async function createPostMetric(data: { postId: string; impressions?: number; clicks?: number }) {
  return prisma.postMetric.create({ data })
}

export async function listPostMetricsByAgent(agentId: string) {
  return prisma.postMetric.findMany({ where: { post: { agentId } }, include: { post: true } })
}

export async function createEmbedding(data: { postId?: string | null; agentId?: string | null; vector: string }) {
  if (!hasModel('embedding')) {
    console.warn('Prisma model `Embedding` not available. Did you run `prisma generate` after schema changes?')
    return null
  }
  // @ts-ignore
  return prisma.embedding.create({ data })
}

export async function listEmbeddingsByAgent(agentId: string) {
  if (!hasModel('embedding')) {
    console.warn('Prisma model `Embedding` not available. Returning empty list.')
    return []
  }
  // @ts-ignore
  return prisma.embedding.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
}

export async function findEmbeddings(limit = 50) {
  if (!hasModel('embedding')) {
    console.warn('Prisma model `Embedding` not available. Returning empty list.')
    return []
  }
  // @ts-ignore
  return prisma.embedding.findMany({ take: limit, orderBy: { createdAt: 'desc' } })
}

export async function createDecisionLog(data: { agentId: string; type: string; outcome?: string | null; payload?: string | null }) {
  if (!hasModel('decisionLog')) {
    console.warn('Prisma model `DecisionLog` not available. Skipping log write.')
    return null
  }
  // @ts-ignore
  return prisma.decisionLog.create({ data })
}

export async function listDecisionLogsByAgent(agentId: string) {
  if (!hasModel('decisionLog')) {
    console.warn('Prisma model `DecisionLog` not available. Returning empty list.')
    return []
  }
  // @ts-ignore
  return prisma.decisionLog.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
}

export async function upsertSourceCredibility(domain: string, score: number, notes?: string | null) {
  if (!hasModel('sourceCredibility')) {
    console.warn('Prisma model `SourceCredibility` not available. Skipping upsert.')
    return null
  }
  // @ts-ignore
  return prisma.sourceCredibility.upsert({
    where: { domain },
    update: { score, notes, checkedAt: new Date() },
    create: { domain, score, notes },
  })
}

export async function getSourceCredibility(domain: string) {
  if (!hasModel('sourceCredibility')) {
    return null
  }
  // @ts-ignore
  return prisma.sourceCredibility.findUnique({ where: { domain } })
}

export async function listSourceCredibilities() {
  if (!hasModel('sourceCredibility')) {
    return []
  }
  // @ts-ignore
  return prisma.sourceCredibility.findMany({ orderBy: { checkedAt: 'desc' } })
}

export async function upsertAgentPersona(agentId: string, personaConfig: string) {
  // Dev schema does not have personaConfig; store under description
  return prisma.agent.update({ where: { id: agentId }, data: { description: personaConfig } })
}

export async function getAgentPersona(agentId: string) {
  return prisma.agent.findUnique({ where: { id: agentId }, select: { id: true, description: true } })
}

export async function createPostVersion(data: { postId: string; text: string; rationale?: string | null; sources?: string | null }) {
  if (!hasModel('postVersion')) {
    console.warn('Prisma model `PostVersion` not available. Skipping version write.')
    return null
  }
  // @ts-ignore
  return prisma.postVersion.create({ data })
}

export async function createWebhook(data: { agentId: string; url: string; events?: string }) {
  if (!hasModel('webhook')) {
    console.warn('Prisma model `Webhook` not available. Skipping webhook create.')
    return null
  }
  // @ts-ignore
  return prisma.webhook.create({ data })
}

export async function listWebhooksByAgent(agentId: string) {
  if (!hasModel('webhook')) return []
  // @ts-ignore
  return prisma.webhook.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
}

export async function deleteWebhook(id: string) {
  if (!hasModel('webhook')) return null
  // @ts-ignore
  return prisma.webhook.delete({ where: { id } })
}

export async function createPostVariant(data: { postId: string; variant: string; text: string }) {
  if (!hasModel('postVariant')) {
    console.warn('Prisma model `PostVariant` not available. Skipping variant write.')
    return null
  }
  // @ts-ignore
  return prisma.postVariant.create({ data })
}

export async function listPostVariants(postId: string) {
  if (!hasModel('postVariant')) return []
  // @ts-ignore
  return prisma.postVariant.findMany({ where: { postId }, orderBy: { createdAt: 'desc' } })
}

export async function createVariantMetric(data: { postVariantId: string }) {
  if (!hasModel('variantMetric')) {
    console.warn('Prisma model `VariantMetric` not available. Skipping metric write.')
    return null
  }
  // @ts-ignore
  return prisma.variantMetric.create({ data })
}

export async function recordImpression(postVariantId: string) {
  if (!hasModel('variantMetric')) return null
  // Try to find existing
  // @ts-ignore
  let m = await prisma.variantMetric.findFirst({ where: { postVariantId } })
  if (!m) {
    // @ts-ignore
    m = await prisma.variantMetric.create({ data: { postVariantId } })
  }
  // @ts-ignore
  return prisma.variantMetric.update({ where: { id: m.id }, data: { impressions: { increment: 1 } } })
}

export async function recordConversion(postVariantId: string) {
  if (!hasModel('variantMetric')) return null
  // @ts-ignore
  let m = await prisma.variantMetric.findFirst({ where: { postVariantId } })
  if (!m) {
    // @ts-ignore
    m = await prisma.variantMetric.create({ data: { postVariantId } })
  }
  // @ts-ignore
  return prisma.variantMetric.update({ where: { id: m.id }, data: { conversions: { increment: 1 } } })
}

export async function getVariantMetricsForPost(postId: string) {
  if (!hasModel('variantMetric')) return []
  // @ts-ignore
  return prisma.variantMetric.findMany({
    where: { postVariant: { postId } },
    include: {
      postVariant: {
        include: {
          post: true,
        },
      },
    },
  })
}

export async function tryAcquireAgentLock(agentId: string, lockMs = 5 * 60 * 1000) {
  const until = new Date(Date.now() + lockMs)
  try {
    // @ts-ignore
    const res = await prisma.agent.updateMany({ where: { id: agentId, OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }] }, data: { lockedUntil: until } })
    return (res && (res as any).count && (res as any).count > 0) || (res.count && res.count > 0)
  } catch (e) {
    console.warn('tryAcquireAgentLock failed', e)
    return false
  }
}

export async function releaseAgentLock(agentId: string) {
  try {
    // @ts-ignore
    return prisma.agent.update({ where: { id: agentId }, data: { lockedUntil: null } })
  } catch (e) {
    console.warn('releaseAgentLock failed', e)
    return null
  }
}
