import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAgentById, updateAgentSchedule } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 })

    const agent = await getAgentById(agentId)
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    return NextResponse.json({ scheduleIntervalMinutes: agent.scheduleIntervalMinutes ?? null, schedulePaused: agent.schedulePaused ?? false }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/schedule error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { agentId, intervalMinutes, paused } = body
    if (!agentId) return NextResponse.json({ error: 'agentId is required' }, { status: 400 })

    const updated = await updateAgentSchedule(agentId, typeof intervalMinutes === 'number' ? intervalMinutes : undefined, typeof paused === 'boolean' ? paused : undefined)
    return NextResponse.json({ updated }, { status: 200 })
  } catch (err: any) {
    console.error('POST /api/agent/schedule error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
