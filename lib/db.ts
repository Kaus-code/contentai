import prisma from './prisma'

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
