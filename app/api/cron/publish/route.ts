import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAllAgents } from '../../../../lib/db'
import { runAutonomousCycle } from '../../../../lib/agent-engine'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  // Enforce CRON_SECRET in production if configured
  if (process.env.NODE_ENV === 'production' && CRON_SECRET && token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const agents = await getAllAgents()
    const results = await Promise.allSettled(
      agents.map(async (agent) => {
        try {
          const res = await runAutonomousCycle(agent.id)
          return { agentId: agent.id, status: 'ok', res }
        } catch (err: any) {
          console.error(`cron publish failed for ${agent.id}`, err)
          return { agentId: agent.id, status: 'error', message: err?.message ?? String(err) }
        }
      })
    )

    return NextResponse.json({ results }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/cron/publish error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
