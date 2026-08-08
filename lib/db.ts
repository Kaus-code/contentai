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
