import { NextResponse } from 'next/server'
import * as db from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json()
  const { agentId, type, outcome, payload } = body
  if (!agentId || !type) return NextResponse.json({ error: 'agentId and type required' }, { status: 400 })

  const saved = await db.createDecisionLog({ agentId, type, outcome: outcome || null, payload: payload ? JSON.stringify(payload) : null })
  return NextResponse.json({ log: saved })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const logs = await db.listDecisionLogsByAgent(agentId)
  return NextResponse.json({ logs })
}
