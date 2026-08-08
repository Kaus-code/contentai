import * as db from './db'
import * as ab from './abTesting'

export async function runExperimentPromotionForAgent(agentId?: string) {
  const agents = agentId ? [await db.getAgentById(agentId)] : await db.getAllAgents()
  for (const a of agents) {
    if (!a) continue
    const posts: any[] = await db.listPostsByAgent(a.id)
    for (const p of posts) {
      const variants = await db.listPostVariants(p.id)
      if (!variants || variants.length === 0) continue
      const result = await ab.computeWinner(p.id)
      if (result && result.winner) {
        // create a PostVersion from winner
        await db.createPostVersion({ postId: p.id, text: result.winner.text, rationale: `Auto-promoted variant (rate=${result.bestRate})` })
        await db.createDecisionLog({ agentId: a.id, type: 'AB_PROMOTION', outcome: 'PROMOTED', payload: JSON.stringify({ postId: p.id, winnerId: result.winner.id, rate: result.bestRate }) })
      }
    }
  }
}

export async function runExperimentPromotionAll() {
  await runExperimentPromotionForAgent(undefined)
}

export default { runExperimentPromotionForAgent, runExperimentPromotionAll }
