const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const agents = await prisma.agent.findMany({ orderBy: { createdAt: 'asc' } })
    if (!agents.length) {
      console.log('No agents found')
      return
    }

    console.log('Agents:')
    for (const a of agents) {
      console.log('---')
      console.log('id:', a.id)
      console.log('name:', a.name)
      console.log('description:', a.description)
      console.log('createdAt:', a.createdAt)
    }
  } catch (e) {
    console.error('Error listing agents', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
