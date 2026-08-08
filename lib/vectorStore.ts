import * as db from './db'
import * as emb from './embeddings'
import * as pgv from './pgvector'

// Simple vector store wrapper that uses DB embeddings and linear scan when no external vector DB configured.
export async function upsertEmbedding(postId: string | null, agentId: string | null, vector: number[]) {
  // If pgvector configured, also insert into pg vector store
  const payload = { postId, agentId }
  if (process.env.PGVECTOR_URL) {
    try {
      await pgv.upsertEmbeddingPg(null, vector, payload)
    } catch (e) {
      console.warn('pgvector upsert failed, falling back to DB:', (e as any)?.message || e)
    }
  }
  return db.createEmbedding({ postId, agentId, vector: JSON.stringify(vector) })
}

export async function semanticSearchByVector(target: number[], k = 5) {
  if (process.env.PGVECTOR_URL) {
    try {
      const res = await pgv.searchVectorPg(target, k)
      return res
    } catch (e) {
      console.warn('pgvector search failed, falling back to DB:', (e as any)?.message || e)
    }
  }
  const candidates = await db.findEmbeddings(1000)
  const mapped = candidates.map((c: any) => ({ id: c.id, vector: c.vector, postId: c.postId, agentId: c.agentId }))
  const results = emb.topKBySimilarity(target, mapped, k)
  return results
}

export async function semanticSearchByText(text: string, k = 5) {
  const v = await emb.generateEmbedding(text)
  return semanticSearchByVector(v, k)
}
