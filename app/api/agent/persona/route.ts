import { NextResponse } from 'next/server'
import * as db from '../../../../lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const persona = await db.getAgentPersona(agentId)
  return NextResponse.json({ persona })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { agentId, personaConfig } = body
  if (!agentId || typeof personaConfig !== 'string') return NextResponse.json({ error: 'agentId and personaConfig required' }, { status: 400 })

  const saved = await db.upsertAgentPersona(agentId, personaConfig)
  return NextResponse.json({ saved })
}
