import prisma from './prisma.ts'

export async function createAgent(data: { id?: string; name: string; domain: string }) {
  return prisma.agent.create({ data })
}

export async function createPost(data: {
  agentId: string
  text: string
  rationale?: string | null
  sources?: any
}) {
  return prisma.post.create({ data })
}

export async function createEvaluatedTopic(data: {
  agentId: string
  title: string
  url?: string | null
  status: string
  reason?: string | null
}) {
  return prisma.evaluatedTopic.create({ data })
}

export async function getAgentById(id: string) {
  return prisma.agent.findUnique({ where: { id } })
}

export async function listPostsByAgent(agentId: string) {
  return prisma.post.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
}

export async function listEvaluatedTopicsByAgent(agentId: string) {
  return prisma.evaluatedTopic.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
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
  return prisma.embedding.create({ data })
}

export async function listEmbeddingsByAgent(agentId: string) {
  return prisma.embedding.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
}

export async function findEmbeddings(limit = 50) {
  return prisma.embedding.findMany({ take: limit, orderBy: { createdAt: 'desc' } })
}

export async function createDecisionLog(data: { agentId: string; type: string; outcome?: string | null; payload?: string | null }) {
  return prisma.decisionLog.create({ data })
}

export async function listDecisionLogsByAgent(agentId: string) {
  return prisma.decisionLog.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
}

export async function upsertSourceCredibility(domain: string, score: number, notes?: string | null) {
  return prisma.sourceCredibility.upsert({
    where: { domain },
    update: { score, notes, checkedAt: new Date() },
    create: { domain, score, notes },
  })
}

export async function getSourceCredibility(domain: string) {
  return prisma.sourceCredibility.findUnique({ where: { domain } })
}

export async function listSourceCredibilities() {
  return prisma.sourceCredibility.findMany({ orderBy: { checkedAt: 'desc' } })
}
