import { z } from 'zod'

export const ContentSchema = z.object({
  text: z.string().min(10),
  rationale: z.string().min(10),
  sources: z.array(z.string().url()).min(1),
})

export type ContentResult = z.infer<typeof ContentSchema>

export function validateContentResult(obj: unknown): { valid: true; data: ContentResult } | { valid: false; error: string } {
  const result = ContentSchema.safeParse(obj)
  if (result.success) return { valid: true, data: result.data }
  return { valid: false, error: result.error.message }
}

export function fallbackContentGenerationStructured(persona: { name: string; domain: string }, winningTopic: { title: string; contentSnippet?: string; url?: string }, rejectedTopics: Array<{ title: string; reason: string }>) {
  const title = winningTopic.title
  const snippet = winningTopic.contentSnippet || title
  const text = `${persona.name} on ${title}: ${snippet}\n\nKey takeaway: prioritize verifiable implementations and robust evaluation.`
  const rationale = `Selected because it aligns with ${persona.domain} and offers actionable technical value. Rejected alternatives included ${rejectedTopics.slice(0,3).map(r=>r.title).join(', ')}.`
  const sources = [winningTopic.url || 'https://example.com']
  return { text, rationale, sources }
}

export default validateContentResult
