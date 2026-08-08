import { NextResponse } from 'next/server'
import * as db from '../../../../lib/db'
import * as emb from '../../../../lib/embeddings'

export async function POST(request: Request) {
  const body = await request.json()
  const { postId, agentId, vector } = body
  if (!vector) return NextResponse.json({ error: 'vector required' }, { status: 400 })

  const saved = await db.createEmbedding({ postId: postId || null, agentId: agentId || null, vector: JSON.stringify(vector) })
  return NextResponse.json({ embedding: saved })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')
  const k = Number(url.searchParams.get('k') || '5')

  // If a target vector is provided as JSON in `q`, parse and run a search.
  if (q) {
    let target: number[] = []
    try {
      target = JSON.parse(q)
    } catch (e) {
      return NextResponse.json({ error: 'invalid q' }, { status: 400 })
    }

    const candidates = await db.findEmbeddings(200)
    const results = emb.topKBySimilarity(target, candidates.map((c) => ({ id: c.id, vector: c.vector })), k)
    return NextResponse.json({ results })
  }

  const agentId = url.searchParams.get('agentId')
  if (agentId) {
    const list = await db.listEmbeddingsByAgent(agentId)
    return NextResponse.json({ embeddings: list })
  }

  const all = await db.findEmbeddings(100)
  return NextResponse.json({ embeddings: all })
}
