import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listPostsByAgent, getAgentById } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 })
    }

    const agent = await getAgentById(agentId)
    if (!agent) {
      return NextResponse.json({ posts: [] }, { status: 200 })
    }

    // Do NOT auto-trigger cycles from read endpoints — reads should be idempotent.
    // Use `POST /api/agent/cycle` or registered background scheduler to trigger cycles.
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
        } else if (Array.isArray(rawSources)) {
          sources = (rawSources as any[]).map(String)
        } else {
          sources = [String(rawSources)]
        }

        const textVal = (p as any).body ?? (p as any).text ?? ''
        return {
          id: p.id,
          createdAt: p.createdAt.toISOString(),
          // Return both `body` and `text` to cover both schemas and frontend expectations
          body: (p as any).body ?? (p as any).text ?? '',
          text: textVal,
          rationale: (p as any).rationale ?? '',
          sources,
        }
      })

    return NextResponse.json({ posts: normalized }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/feed error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
