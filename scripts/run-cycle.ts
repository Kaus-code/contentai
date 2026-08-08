require('../lib/prisma')
const { runAutonomousCycle } = require('../lib/agent-engine')
const db = require('../lib/db')

async function main() {
  const agents = await db.getAllAgents()
  if (!agents || agents.length === 0) {
    console.error('No agents found to run cycle')
    process.exit(1)
  }
  const agent = agents[0]
  console.log('Running autonomous cycle for agent:', agent.id)
  try {
    const result = await runAutonomousCycle(agent.id)
    console.log('Cycle result:', result)
    process.exit(0)
  } catch (e) {
    console.error('Cycle failed', e)
    process.exit(1)
  }
}

main()
