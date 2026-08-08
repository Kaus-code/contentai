import { Client } from 'pg'

const PG_URL = process.env.PGVECTOR_URL || process.env.DATABASE_URL

function getClient() {
  if (!PG_URL) throw new Error('PGVECTOR_URL or DATABASE_URL not set')
  return new Client({ connectionString: PG_URL })
}

export async function upsertEmbeddingPg(id: string | null, vector: number[], payload: any = {}) {
  const client = getClient()
  await client.connect()
  try {
    // Ensure table exists (best-effort)
    await client.query(`CREATE TABLE IF NOT EXISTS embeddings (id text primary key, vector vector, payload jsonb, created_at timestamptz DEFAULT now())`)
    const vid = id || require('crypto').randomUUID()
    const q = `INSERT INTO embeddings (id, vector, payload) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET vector = EXCLUDED.vector, payload = EXCLUDED.payload`
    await client.query(q, [vid, vector, JSON.stringify(payload)])
    return { id: vid }
  } finally {
    await client.end()
  }
}

export async function searchVectorPg(vector: number[], k = 5) {
  const client = getClient()
  await client.connect()
  try {
    // requires pgvector extension and vector column
    const q = `SELECT id, payload, vector <-> $1 as distance FROM embeddings ORDER BY vector <-> $1 LIMIT $2`
    const res = await client.query(q, [vector, k])
    return res.rows.map((r: any) => ({ id: r.id, payload: r.payload, distance: r.distance }))
  } finally {
    await client.end()
  }
}
