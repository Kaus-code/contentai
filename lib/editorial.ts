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

export type Candidate = z.infer<typeof CandidateSchema>
export type EditorialResult = z.infer<typeof EditorialSchema>

export function validateEditorialResult(obj: unknown): { valid: true; data: EditorialResult } | { valid: false; error: string } {
  const result = EditorialSchema.safeParse(obj)
  if (result.success) {
    // Additional sanity checks: selected index should be within results length or null
    const sel = result.data.selected
    if (sel !== null && (sel < 0 || sel >= result.data.results.length)) {
      return { valid: false, error: `selected index ${sel} out of bounds (0..${result.data.results.length - 1})` }
    }
    return { valid: true, data: result.data }
  }
  return { valid: false, error: result.error.message }
}

export default validateEditorialResult
