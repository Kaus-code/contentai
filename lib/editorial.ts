import { z } from 'zod'

export const CandidateSchema = z.object({
  title: z.string(),
  score: z.number().min(0).max(10),
  decision: z.enum(['PUBLISHED', 'REJECTED']),
  reason: z.string(),
})

export const EditorialSchema = z.object({
  selected: z.number().int().nullable(),
  results: z.array(CandidateSchema),
})

import { z } from 'zod'

// 100-point rubric breakdown
export const BreakdownSchema = z.object({
  domainAlignment: z.number().min(0).max(30),
  novelty: z.number().min(0).max(30),
  technicalDepth: z.number().min(0).max(25),
  timeliness: z.number().min(0).max(15),
  total: z.number().min(0).max(100),
})

export const CandidateSchema = z.object({
  title: z.string(),
  score: z.number().min(0).max(100),
  decision: z.enum(['PUBLISHED', 'REJECTED']),
  reason: z.string(),
  breakdown: BreakdownSchema.optional(),
})

export const EditorialSchema = z.object({
  selected: z.number().int().nullable(),
  results: z.array(CandidateSchema),
})

export type Breakdown = z.infer<typeof BreakdownSchema>
export type Candidate = z.infer<typeof CandidateSchema>
export type EditorialResult = z.infer<typeof EditorialSchema>

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function computeBreakdownForCandidate(
  personaDomain: string,
  publishedHistory: string[],
  candidateTitle: string,
  candidateSnippet = '',
  source = ''
): Breakdown {
  const title = candidateTitle.toLowerCase()
  const snippet = (candidateSnippet || '').toLowerCase()
  const domain = (personaDomain || '').toLowerCase()

  const domainKeywords = domain.split(/\s+/).filter((k) => k.length > 2)
  const domainMatches = domainKeywords.reduce((acc, k) => acc + (title.includes(k) || snippet.includes(k) ? 1 : 0), 0)

  // Domain alignment: up to 30
  const domainAlignment = clamp(Math.round((domainMatches / Math.max(1, domainKeywords.length)) * 30), 0, 30)

  // Novelty: penalize similarity to publishedHistory; simple containment heuristic
  const lowerPublished = publishedHistory.map((p) => p.toLowerCase())
  const isDuplicate = lowerPublished.some((p) => p.includes(title.slice(0, 20)) || title.includes(p.slice(0, 20)))
  const novelty = isDuplicate ? 0 : 30

  // Technical depth: heuristic by presence of technical keywords
  const techKeywords = ['benchmark', 'implementation', 'architecture', 'performance', 'scalability', 'dataset', 'evaluation', 'method', 'model', 'algorithm']
  const techMatches = techKeywords.reduce((acc, k) => acc + (title.includes(k) || snippet.includes(k) ? 1 : 0), 0)
  const technicalDepth = clamp(Math.round((techMatches / techKeywords.length) * 25), 0, 25)

  // Timeliness: prefer sources like arxiv, news, dev.to, medium, or known news hosts
  const timelyHosts = ['arxiv', 'news', 'techcrunch', 'theverge', 'vercel', 'dev.to']
  const hostScore = timelyHosts.some((h) => source.toLowerCase().includes(h)) ? 15 : 7
  const timeliness = clamp(hostScore, 0, 15)

  const total = clamp(domainAlignment + novelty + technicalDepth + timeliness, 0, 100)
  return { domainAlignment, novelty, technicalDepth, timeliness, total }
}

export function validateEditorialResult(obj: unknown): { valid: true; data: EditorialResult } | { valid: false; error: string } {
  const result = EditorialSchema.safeParse(obj)
  if (!result.success) return { valid: false, error: result.error.message }

  // Normalize scores in case someone used 0-10 scale: detect max <=10
  const maxScore = Math.max(...result.data.results.map((r) => r.score))
  let data = result.data
  if (maxScore <= 10) {
    // scale to 0-100
    data = {
      ...data,
      results: data.results.map((r) => ({ ...r, score: clamp(Math.round(r.score * 10), 0, 100) })),
    }
  }

  // sanity check selected index
  const sel = data.selected
  if (sel !== null && (sel < 0 || sel >= data.results.length)) {
    return { valid: false, error: `selected index ${sel} out of bounds (0..${data.results.length - 1})` }
  }

  return { valid: true, data }
}

// Fallback deterministic evaluator that returns 100-point scores
export function fallbackEditorialEvaluation(
  persona: { id: string; name: string; domain: string },
  publishedHistory: string[],
  candidates: Array<{ title: string; contentSnippet?: string; source?: string; url?: string }>
): EditorialResult {
  let bestIndex: number | null = null
  let bestScore = -1

  const results = candidates.map((c, idx) => {
    const breakdown = computeBreakdownForCandidate(persona.domain, publishedHistory, c.title, c.contentSnippet || '', c.source || '')
    const score = breakdown.total
    const decision = score >= 60 ? 'PUBLISHED' : 'REJECTED'
    if (score > bestScore && decision === 'PUBLISHED') {
      bestScore = score
      bestIndex = idx
    }
    return { title: c.title, score, decision, reason: decision === 'PUBLISHED' ? `Selected with score ${score}/100` : `Rejected with score ${score}/100`, breakdown }
  })

  if (bestIndex !== null) {
    // ensure only the best marked PUBLISHED
    for (let i = 0; i < results.length; i++) {
      if (i === bestIndex) results[i].decision = 'PUBLISHED'
      else if (results[i].decision === 'PUBLISHED') results[i].decision = 'REJECTED'
    }
  }

  return { selected: bestIndex, results }
}

export default validateEditorialResult
