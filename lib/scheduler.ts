import { runAutonomousCycle } from './agent-engine.ts'
import { listPostsByAgent } from './db.ts'

const activeTimers = new Map<string, NodeJS.Timeout>()

export function registerAgentScheduler(agentId: string, intervalMinutes = 15) {
  if (activeTimers.has(agentId)) {
    return
  }

  const intervalMs = intervalMinutes * 60 * 1000
  console.log(`[Scheduler] Registered background autonomous timer for agent ${agentId} every ${intervalMinutes} minutes.`)

  const timer = setInterval(async () => {
    try {
      console.log(`[Scheduler] Triggering periodic autonomous cycle for agent ${agentId}...`)
      await runAutonomousCycle(agentId)
    } catch (err) {
      console.error(`[Scheduler] Error running autonomous cycle for agent ${agentId}:`, err)
    }
  }, intervalMs)

  // Allow Node process to exit cleanly if needed
  if (timer.unref) {
    timer.unref()
  }

  activeTimers.set(agentId, timer)
}

export async function checkAndAutoPublish(agentId: string, minIntervalMinutes = 15) {
  try {
    const posts = await listPostsByAgent(agentId)
    if (!posts || posts.length === 0) {
      // If no post exists, run a cycle now
      console.log(`[Scheduler] No posts found for agent ${agentId}. Running initial cycle...`)
      await runAutonomousCycle(agentId)
      return
    }

    const newestPost = posts[0]
    const newestTime = new Date(newestPost.createdAt).getTime()
    const elapsedMinutes = (Date.now() - newestTime) / (1000 * 60)

    if (elapsedMinutes >= minIntervalMinutes) {
      console.log(`[Scheduler] Elapsed time since last post (${elapsedMinutes.toFixed(1)} mins) >= ${minIntervalMinutes} mins. Triggering auto-publish cycle...`)
      await runAutonomousCycle(agentId)
    }
  } catch (err) {
    console.error(`[Scheduler] Auto-publish check failed for agent ${agentId}:`, err)
  }
}
