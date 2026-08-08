import { createAgent, listPostsByAgent } from '../../lib/db'
import { runAutonomousCycle } from '../../lib/agent-engine'

async function main() {
  const agent = await createAgent({ name: 'TestScheduler', domain: 'Testing' })
  await runAutonomousCycle(agent.id)
  const posts = await listPostsByAgent(agent.id)
  if (!posts || posts.length === 0) throw new Error('Scheduler test failed: no posts produced')
  console.log('scheduler.test: OK')
}

main().catch((err) => { console.error(err); process.exit(1) })
