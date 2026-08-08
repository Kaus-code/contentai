import { NextResponse } from 'next/server'
import * as db from '../../../../lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const list = await db.listWebhooksByAgent(agentId)
  return NextResponse.json({ webhooks: list })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { agentId, url, events } = body
  if (!agentId || !url) return NextResponse.json({ error: 'agentId and url required' }, { status: 400 })

  const saved = await db.createWebhook({ agentId, url, events: events || 'POST_PUBLISHED' })
  return NextResponse.json({ webhook: saved })
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const removed = await db.deleteWebhook(id)
  return NextResponse.json({ removed })
}
