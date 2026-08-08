import { NextResponse } from 'next/server'
import * as db from '../../../../lib/db'
import { scoreDomain } from '../../../../lib/sourceCred'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const domain = url.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  const existing = await db.getSourceCredibility(domain)
  if (existing) return NextResponse.json({ domain: existing.domain, score: existing.score, notes: existing.notes })

  const scored = await scoreDomain(domain)
  return NextResponse.json(scored)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { domain, score, notes } = body
  if (!domain || typeof score !== 'number') return NextResponse.json({ error: 'domain and numeric score required' }, { status: 400 })
  const saved = await db.upsertSourceCredibility(domain, score, notes || null)
  return NextResponse.json({ saved })
}
