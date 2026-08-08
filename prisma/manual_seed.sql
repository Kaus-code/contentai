-- Manual seed SQL to create a default agent and sample data
-- Run after manual_migration.sql, and after pgvector_setup.sql

-- Insert default persona agent
INSERT INTO "Agent" (id, name, role, domain, description, isActive, intervalMinutes, createdAt, updatedAt)
VALUES (
  uuid_generate_v4(),
  'Sentinel Signal',
  'Autonomous AI Editor',
  'AI and Systems Engineering',
  'Default seeded editorial agent',
  true,
  60,
  now(),
  now()
)
RETURNING id;

-- Note: Add more seed data as needed; use returned agent id to create webhooks, etc.
