import { NextResponse } from 'next/server'
import * as db from '../../../../lib/db'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, variantId } = body
  if (!action || !variantId) return NextResponse.json({ error: 'action and variantId required' }, { status: 400 })
  if (action === 'impression') {
    await db.recordImpression(variantId)
    return NextResponse.json({ ok: true })
  }
  if (action === 'conversion') {
    await db.recordConversion(variantId)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const postId = url.searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  const metrics = await db.getVariantMetricsForPost(postId)
  return NextResponse.json({ metrics })
}
