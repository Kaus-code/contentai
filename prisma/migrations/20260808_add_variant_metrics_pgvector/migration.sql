-- Migration helper: add pgvector extension and embeddings table for pgvector integration
-- Run this on a Postgres DB with superuser privileges before enabling pgvector usage.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
  id text PRIMARY KEY,
  vector vector(1536),
  payload jsonb,
  created_at timestamptz DEFAULT now()
);
