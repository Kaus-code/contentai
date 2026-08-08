-- Manual SQL migration for PostgreSQL
-- Run this file with: psql "postgresql://user:pass@host:5432/dbname" -f prisma/pgvector_setup.sql -f prisma/manual_migration.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Agents
CREATE TABLE IF NOT EXISTS "Agent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT,
  domain TEXT NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  intervalMinutes INT DEFAULT 15,
  lastRunAt TIMESTAMP,
  nextRunAt TIMESTAMP,
  lockedUntil TIMESTAMP,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Agent runs
CREATE TABLE IF NOT EXISTS "AgentRun" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agentId UUID NOT NULL REFERENCES "Agent"(id) ON DELETE CASCADE,
  status TEXT,
  currentStage TEXT,
  candidatesTotal INT DEFAULT 0,
  acceptedCount INT DEFAULT 0,
  rejectedCount INT DEFAULT 0,
  selectedTopicId UUID,
  errorMessage TEXT,
  retryCount INT DEFAULT 0,
  startedAt TIMESTAMP,
  finishedAt TIMESTAMP,
  durationMs INT
);

-- Candidate topics
CREATE TABLE IF NOT EXISTS "CandidateTopic" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agentId UUID NOT NULL REFERENCES "Agent"(id) ON DELETE CASCADE,
  runId UUID REFERENCES "AgentRun"(id),
  title TEXT NOT NULL,
  summary TEXT,
  sourceName TEXT,
  originalUrl TEXT,
  canonicalUrl TEXT,
  publishedAt TIMESTAMP,
  discoveryMode TEXT,
  fingerprint TEXT,
  relevanceScore DOUBLE PRECISION DEFAULT 0,
  noveltyScore DOUBLE PRECISION DEFAULT 0,
  sourceTrustScore DOUBLE PRECISION DEFAULT 0,
  recencyScore DOUBLE PRECISION DEFAULT 0,
  depthScore DOUBLE PRECISION DEFAULT 0,
  totalScore DOUBLE PRECISION DEFAULT 0,
  editorialDecision TEXT,
  rejectionReason TEXT,
  memorySimilarity DOUBLE PRECISION DEFAULT 0,
  verificationStatus TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Posts
CREATE TABLE IF NOT EXISTS "Post" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agentId UUID NOT NULL REFERENCES "Agent"(id) ON DELETE CASCADE,
  candidateId UUID UNIQUE REFERENCES "CandidateTopic"(id),
  title TEXT,
  body TEXT NOT NULL,
  mainClaims TEXT,
  sources TEXT,
  platform TEXT,
  publishStatus TEXT DEFAULT 'DRAFT',
  publishMode TEXT,
  scheduledAt TIMESTAMP,
  publishedAt TIMESTAMP,
  externalId TEXT,
  failureMessage TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Post versions
CREATE TABLE IF NOT EXISTS "PostVersion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postId UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  rationale TEXT,
  sources TEXT,
  createdAt TIMESTAMP DEFAULT now()
);

-- Embeddings
CREATE TABLE IF NOT EXISTS "Embedding" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postId UUID REFERENCES "Post"(id) ON DELETE SET NULL,
  agentId UUID,
  vector vector,
  createdAt TIMESTAMP DEFAULT now()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS "Webhook" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agentId UUID NOT NULL,
  url TEXT NOT NULL,
  events TEXT,
  createdAt TIMESTAMP DEFAULT now()
);

-- PostVariant
CREATE TABLE IF NOT EXISTS "PostVariant" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postId UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  variant TEXT,
  text TEXT,
  createdAt TIMESTAMP DEFAULT now()
);

-- VariantMetric
CREATE TABLE IF NOT EXISTS "VariantMetric" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postVariantId UUID NOT NULL REFERENCES "PostVariant"(id) ON DELETE CASCADE,
  impressions INT DEFAULT 0,
  conversions INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- DecisionLog
CREATE TABLE IF NOT EXISTS "DecisionLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agentId UUID,
  type TEXT,
  outcome TEXT,
  payload TEXT,
  createdAt TIMESTAMP DEFAULT now()
);

-- SourceCredibility
CREATE TABLE IF NOT EXISTS "SourceCredibility" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE,
  score DOUBLE PRECISION DEFAULT 0,
  notes TEXT,
  checkedAt TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_nextRunAt ON "Agent" (nextRunAt);
CREATE INDEX IF NOT EXISTS idx_embedding_postId ON "Embedding" (postId);
