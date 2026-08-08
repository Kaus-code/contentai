import { runAutonomousCycle } from './agent-engine'
import { listPostsByAgent, tryAcquireAgentLock, releaseAgentLock } from './db'

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
    // Check for any posts (include drafts) to avoid repeatedly running initial cycles
    const posts = await listPostsByAgent(agentId, true)
    if (!posts || posts.length === 0) {
      // If no post exists at all, attempt to acquire a lock and run an initial cycle
      const locked = await tryAcquireAgentLock(agentId)
      if (!locked) {
        console.log(`[Scheduler] Initial cycle already running or locked for agent ${agentId}. Skipping.`)
        return
      }

      try {
        console.log(`[Scheduler] No posts found for agent ${agentId}. Running initial cycle...`)
        await runAutonomousCycle(agentId)
      } finally {
        await releaseAgentLock(agentId)
      }

      return
    }

    // Filter to published posts only for interval checks
    const published = posts.filter((p: any) => p.publishStatus === 'PUBLISHED')
    if (!published || published.length === 0) {
      // There are posts but none published yet; do not auto-run initial cycle continuously
      console.log(`[Scheduler] Agent ${agentId} has ${posts.length} post(s) but none are published. Skipping auto-publish.`)
      return
    }

    const newestPost = published[0]
    const newestTime = new Date(newestPost.createdAt).getTime()
    const elapsedMinutes = (Date.now() - newestTime) / (1000 * 60)

    if (elapsedMinutes >= minIntervalMinutes) {
      const locked = await tryAcquireAgentLock(agentId)
      if (!locked) {
        console.log(`[Scheduler] Auto-publish already running or locked for agent ${agentId}. Skipping.`)
        return
      }

      try {
        console.log(`[Scheduler] Elapsed time since last post (${elapsedMinutes.toFixed(1)} mins) >= ${minIntervalMinutes} mins. Triggering auto-publish cycle...`)
        await runAutonomousCycle(agentId)
      } finally {
        await releaseAgentLock(agentId)
      }
    }
  } catch (err) {
    console.error(`[Scheduler] Auto-publish check failed for agent ${agentId}:`, err)
  }
}
