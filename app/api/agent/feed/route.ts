import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listPostsByAgent } from '../../../../lib/db'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) return NextResponse.json({ error: 'Missing agentId query param' }, { status: 400 })

    const posts = await listPostsByAgent(agentId)

    const normalized = posts.map((p) => {
      let sources: any = []
      if (p.sources == null) {
        sources = []
      } else if (typeof p.sources === 'string') {
        try {
          sources = JSON.parse(p.sources)
        } catch (_) {
          sources = [p.sources]
        }
      } else {
        sources = p.sources
      }

      return {
        id: p.id,
        createdAt: p.createdAt.toISOString(),
        text: p.text,
        rationale: p.rationale ?? null,
        sources,
      }
    })

    return NextResponse.json({ posts: normalized }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/feed error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
