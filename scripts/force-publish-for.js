const { PrismaClient } = require('@prisma/client')

async function main() {
  const agentId = process.argv[2] || process.env.AGENT_ID
  if (!agentId) {
    console.error('Usage: node scripts/force-publish-for.js <agentId>')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } })
    if (!agent) {
      console.error('Agent not found for id', agentId)
      process.exit(1)
    }

    const now = new Date()
    const body = `Test published post for agent ${agent.name} at ${now.toISOString()}`
    const sources = JSON.stringify(['https://example.com/test'])

    const post = await prisma.post.create({ data: { agentId: agent.id, body, sources, publishStatus: 'PUBLISHED', publishedAt: now } })
    console.log('Created post', post.id)

    await prisma.postVersion.create({ data: { postId: post.id, text: body, rationale: 'Forced publish for UI test', sources } })
    console.log('Created post version')

    await prisma.decisionLog.create({ data: { agentId: agent.id, type: 'FORCE_PUBLISH', outcome: 'PUBLISHED', payload: JSON.stringify({ postId: post.id }) } })
    console.log('Logged decision')

    await prisma.embedding.create({ data: { postId: post.id, agentId: agent.id, vector: JSON.stringify([0]) } })
    console.log('Created embedding')

    console.log('Force-publish complete. Agent ID:', agent.id)
    process.exit(0)
  } catch (e) {
    console.error('Force-publish failed', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
