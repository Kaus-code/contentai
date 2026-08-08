import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { runAutonomousCycle } from '../../../../lib/agent-engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { agentId } = body
    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const result = await runAutonomousCycle(agentId)
    return NextResponse.json({ result }, { status: 200 })
  } catch (err: any) {
    console.error('POST /api/agent/cycle error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
