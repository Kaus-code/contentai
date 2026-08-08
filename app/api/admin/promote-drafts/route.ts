import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const agentId = body.agentId as string | undefined
    const hours = typeof body.hours === 'number' ? body.hours : 24
    const limit = typeof body.limit === 'number' ? body.limit : 50
    const promoteAll = !!body.all

    const where: any = { publishStatus: { not: 'PUBLISHED' }, publishedAt: null }
    if (agentId) where.agentId = agentId
    if (!promoteAll) {
      const cutoff = new Date(Date.now() - Math.max(1, hours) * 60 * 60 * 1000)
      where.createdAt = { gte: cutoff }
    }

    const drafts = await prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit })
    const promoted: string[] = []
    for (const p of drafts) {
      const upd = await prisma.post.update({ where: { id: p.id }, data: { publishStatus: 'PUBLISHED', publishedAt: new Date() } })
      promoted.push(upd.id)
      try {
        await prisma.decisionLog.create({ data: { agentId: upd.agentId, type: 'PROMOTE_DRAFT', outcome: 'PUBLISHED', payload: JSON.stringify({ postId: upd.id }) } })
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ promoted }, { status: 200 })
  } catch (err: any) {
    console.error('POST /api/admin/promote-drafts error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
