import { createAgent, createPost, createPostMetric, listPostMetricsByAgent } from '../../lib/db'

async function main() {
  const agent = await createAgent({ name: 'TestAnalytics', domain: 'Testing' })
  const post = await createPost({ agentId: agent.id, text: 'Test post', rationale: 'r', sources: '[]' })
  await createPostMetric({ postId: post.id, impressions: 100, clicks: 7 })
  await createPostMetric({ postId: post.id, impressions: 50, clicks: 3 })
  const metrics = await listPostMetricsByAgent(agent.id)
  const totalImpressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0)
  const totalClicks = metrics.reduce((s, m) => s + (m.clicks || 0), 0)
  if (totalImpressions !== 150 || totalClicks !== 10) throw new Error('Analytics aggregation mismatch')
  console.log('analytics.test: OK')
}

main().catch((err) => { console.error(err); process.exit(1) })
