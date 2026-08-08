import { NextResponse } from 'next/server'
import * as db from '../../../../lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const postId = url.searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  const list = await db.listPostVariants(postId)
  return NextResponse.json({ variants: list })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { postId, variant, text } = body
  if (!postId || !variant || !text) return NextResponse.json({ error: 'postId, variant, text required' }, { status: 400 })
  const saved = await db.createPostVariant({ postId, variant, text })
  return NextResponse.json({ variant: saved })
}
