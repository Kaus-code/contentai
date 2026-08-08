import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createPostMetric, listPostMetricsByAgent } from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 })

    const metrics = await listPostMetricsByAgent(agentId)
    return NextResponse.json({ metrics }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/metrics error:', err)
    return NextResponse.json({ metrics: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { postId, impressions = 0, clicks = 0 } = body
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })

    const record = await createPostMetric({ postId, impressions: Number(impressions), clicks: Number(clicks) })
    return NextResponse.json({ metric: record }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/agent/metrics error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
