import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAgent } from '../../../../lib/db'
import { runAutonomousCycle } from '../../../../lib/agent-engine'

type Persona = {
  name: string
  domain: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const persona: Persona | undefined = body?.persona
    if (!persona || !persona.name || !persona.domain) {
      return NextResponse.json({ error: 'Missing persona.name or persona.domain' }, { status: 400 })
    }

    const agentId = `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`

    await createAgent({ id: agentId, name: persona.name, domain: persona.domain })
    await runAutonomousCycle(agentId).catch((err) => {
      console.error(`runAutonomousCycle failed for ${agentId}`, err)
    })

    return NextResponse.json({ agentId }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/agent/init error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
