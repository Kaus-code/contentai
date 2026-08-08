import { NextResponse } from 'next/server'
import * as fc from '@/lib/factCheck'

export async function POST(request: Request) {
  const body = await request.json()
  const { url, snippet } = body
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const res = snippet ? await fc.quickFactCheckSummary(url, snippet) : await fc.factCheckUrl(url, [])
  return NextResponse.json(res)
}
