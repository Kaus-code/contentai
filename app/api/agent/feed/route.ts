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
        const rawSources = p.sources
        let sources: string[] = []

        if (rawSources == null) {
          sources = []
        } else if (typeof rawSources === 'string') {
          try {
            const parsed = JSON.parse(rawSources)
            sources = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
          } catch (_) {
            sources = [rawSources]
          }
        } else {
          sources = [String(rawSources)]
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
