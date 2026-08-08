const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const agent = await prisma.agent.findFirst()
    if (!agent) {
      console.error('No agent found in DB')
      process.exit(1)
    }

    console.log('Found agent:', agent.id, agent.name)

    const now = new Date().toISOString()
    const body = `Fallback post generated at ${now} for agent ${agent.name}. This is a simple smoke-test of the publishing pipeline.`
    const sources = JSON.stringify(['https://example.com/fallback'])

    const post = await prisma.post.create({ data: { agentId: agent.id, body, sources } })
    console.log('Created post', post.id)

    await prisma.postVersion.create({ data: { postId: post.id, text: body, rationale: 'Fallback rationale for smoke test', sources } })
    console.log('Created post version')

    process.exit(0)
  } catch (e) {
    console.error('Cycle failed', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
