-- Helper SQL to create pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Example: create index on embeddings table (run after migrations)
-- CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON "Embedding" USING ivfflat (vector vector_l2_ops) WITH (lists = 100);
