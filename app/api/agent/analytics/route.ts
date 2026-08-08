import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listPostsByAgent, listPostMetricsByAgent } from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 })

    const posts = await listPostsByAgent(agentId)
    const metrics = await listPostMetricsByAgent(agentId)

    const totalImpressions = metrics.reduce((s, m) => s + (m.impressions ?? 0), 0)
    const totalClicks = metrics.reduce((s, m) => s + (m.clicks ?? 0), 0)

    return NextResponse.json({ postsCount: posts.length, metricsCount: metrics.length, totalImpressions, totalClicks, posts, metrics }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/analytics error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
