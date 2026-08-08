export function cosineSimilarity(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function parseVector(json: string): number[] {
  try {
    const v = JSON.parse(json)
    if (Array.isArray(v)) return v.map((x) => Number(x))
  } catch (e) {
    // fallthrough
  }
  return []
}

export function serializeVector(vec: number[]) {
  return JSON.stringify(vec)
}

export function topKBySimilarity(target: number[], candidates: Array<{ id: string; vector: string }>, k = 5) {
  const scored = candidates.map((c) => ({ id: c.id, score: cosineSimilarity(target, parseVector(c.vector)) }))
  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, k)
}

// Generate an embedding for text. Uses OpenAI if API key is present, otherwise a deterministic fallback hash vector.
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      // Lazy import to avoid top-level dependency issues in environments without the package
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OpenAI } = require('openai')
      const client = new OpenAI({ apiKey })
      // use a compact embeddings model; adjust if unavailable
      const resp = await client.embeddings.create({ model: 'text-embedding-3-small', input: text })
      const vec = resp.data[0].embedding
      return vec.map((n: any) => Number(n))
    } catch (e) {
      // fallthrough to deterministic fallback
      console.warn('OpenAI embedding generation failed, falling back to deterministic hash', e)
    }
  }

  // Deterministic fallback: simple hashed vector of char codes, normalized
  const v: number[] = new Array(153).fill(0)
  for (let i = 0; i < text.length; i++) {
    const idx = i % v.length
    v[idx] += text.charCodeAt(i)
  }
  // normalize
  let norm = 0
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i]
  norm = Math.sqrt(norm) || 1
  for (let i = 0; i < v.length; i++) v[i] = v[i] / norm
  return v
}
