import { NextResponse } from 'next/server'
import { getAllAgents } from '@/lib/db'

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ agents: [] }, { status: 200 })
    }

    const agents = await getAllAgents()
    return NextResponse.json({ agents }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/list error', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
