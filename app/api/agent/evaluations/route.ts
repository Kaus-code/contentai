import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listEvaluatedTopicsByAgent } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 })
    }

    const topics = await listEvaluatedTopicsByAgent(agentId)
    return NextResponse.json({ evaluations: topics }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/evaluations error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
