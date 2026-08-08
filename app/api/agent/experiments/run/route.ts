import { NextResponse } from 'next/server'
import * as ab from '@/lib/abTesting'
import * as db from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json()
  const { postId } = body
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  const res = await ab.computeWinner(postId)
  if (!res || !res.winner) return NextResponse.json({ ok: false, message: 'no winner' })
  // promote winner
  await db.createPostVersion({ postId, text: res.winner.text, rationale: `Promoted by experiments (rate=${res.bestRate})` })
  await db.createDecisionLog({ agentId: res.winner.post.agentId, type: 'AB_PROMOTION', outcome: 'PROMOTED', payload: JSON.stringify({ postId, winnerId: res.winner.id, rate: res.bestRate }) })
  return NextResponse.json({ ok: true, winner: res.winner, rate: res.bestRate })
}
