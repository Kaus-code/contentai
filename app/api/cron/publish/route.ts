import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getAllAgents, tryAcquireAgentLock, releaseAgentLock } from '@/lib/db'
import { runAutonomousCycle } from '@/lib/agent-engine'
import prisma from '@/lib/prisma'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  // Fail closed: require CRON_SECRET to be set and match the provided token
  if (!CRON_SECRET || token !== CRON_SECRET) {
    console.warn('Unauthorized cron request or CRON_SECRET not configured')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Select active agents that are due to run (nextRunAt <= now or null)
    const now = new Date()
    // @ts-ignore
    const dueAgents = await prisma.agent.findMany({ where: { isActive: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] } })

    const results: any[] = []
    for (const agent of dueAgents) {
      const acquired = await tryAcquireAgentLock(agent.id, 1000 * 60 * 5) // 5 minutes
      if (!acquired) {
        results.push({ agentId: agent.id, status: 'skipped', reason: 'locked' })
        continue
      }

      try {
        const res = await runAutonomousCycle(agent.id)
        // update lastRunAt and nextRunAt
        const interval = agent.intervalMinutes ?? 15
        const next = new Date(Date.now() + (interval * 60 * 1000))
        // @ts-ignore
        await prisma.agent.update({ where: { id: agent.id }, data: { lastRunAt: new Date(), nextRunAt: next, lockedUntil: null } })
        results.push({ agentId: agent.id, status: 'ok', res })
      } catch (err: any) {
        console.error(`cron publish failed for ${agent.id}`, err)
        // release lock and record failure without faking success
        await releaseAgentLock(agent.id)
        results.push({ agentId: agent.id, status: 'error', message: err?.message ?? String(err) })
      }
    }

    return NextResponse.json({ results }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/cron/publish error', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
