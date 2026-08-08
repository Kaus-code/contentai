import * as db from './db'

const trustedPatterns = [/^arxiv\.org$/, /^(?:www\.)?github\.com$/, /^(?:www\.)?nature\.com$/, /^(?:www\.)?ieee\.org$/]
const untrustedPatterns = [/blogspot\./, /medium\.com/, /example\.com/]

export async function scoreDomain(domain: string): Promise<{ domain: string; score: number; notes?: string }> {
  // normalize
  const d = domain.replace(/^https?:\/\//, '').split('/')[0].toLowerCase()

  // fast heuristics
  for (const p of trustedPatterns) if (p.test(d)) {
    const score = 0.95
    await db.upsertSourceCredibility(d, score, 'Matched trusted pattern')
    return { domain: d, score, notes: 'Matched trusted pattern' }
  }

  for (const p of untrustedPatterns) if (p.test(d)) {
    const score = 0.35
    await db.upsertSourceCredibility(d, score, 'Matched untrusted pattern')
    return { domain: d, score, notes: 'Matched untrusted pattern' }
  }

  // try a lightweight HEAD fetch to check reachability and content-type
  try {
    // dynamic import fetch for environments without global fetch
    // @ts-ignore
    const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default
    const res = await fetchFn(`https://${d}`, { method: 'HEAD', redirect: 'follow', timeout: 3000 })
    const ct = res.headers.get('content-type') || ''
    const status = res.status
    // heuristics: OK status and HTML-ish content-type
    const score = (status >= 200 && status < 400 && ct.includes('text/html')) ? 0.75 : 0.5
    const notes = `HEAD status ${status}; content-type ${ct}`
    await db.upsertSourceCredibility(d, score, notes)
    return { domain: d, score, notes }
  } catch (e) {
    const score = 0.4
    const notes = `Lookup failed: ${String(e)}`
    await db.upsertSourceCredibility(d, score, notes)
    return { domain: d, score, notes }
  }
}
