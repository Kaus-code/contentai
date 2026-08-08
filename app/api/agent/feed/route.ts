import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listPostsByAgent } from '../../../../lib/db'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 })
    }

    const posts = await listPostsByAgent(agentId)

    const normalized = posts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((p) => {
        let sources: string[] = []
        if (p.sources == null) {
          sources = []
        } else if (typeof p.sources === 'string') {
          try {
            const parsed = JSON.parse(p.sources)
            sources = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
          } catch (_) {
            sources = [p.sources]
          }
        } else if (Array.isArray(p.sources)) {
          sources = p.sources.map(String)
        } else {
          sources = [String(p.sources)]
        }

        return {
          id: p.id,
          createdAt: p.createdAt.toISOString(),
          text: p.text,
          rationale: p.rationale ?? '',
          sources,
        }
      })

    return NextResponse.json({ posts: normalized }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/feed error', err)
    return NextResponse.json({ posts: [] }, { status: 200 })
  }
}
