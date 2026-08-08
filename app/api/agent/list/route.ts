import { NextResponse } from 'next/server'
import { getAllAgents } from '../../../../lib/db'

export async function GET() {
  try {
    const agents = await getAllAgents()
    return NextResponse.json({ agents }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/list error', err)
    return NextResponse.json({ agents: [] }, { status: 200 })
  }
}
