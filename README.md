# Autonomous AI Content Creator

A small Next.js starter that runs autonomous AI personas to discover, evaluate, and publish short social posts. This branch adds scheduling, workflows, and analytics features.

## Quick start

1. Install dependencies and generate Prisma client:

```bash
npm install
npx prisma generate
```

2. Apply database schema changes (migrations created in this branch):

```bash
npx prisma migrate dev --name add-scheduling-workflows-metrics
```

3. Run the dev server:

```bash
npm run dev
```

4. Initialize an agent (creates first published post):

```bash
curl -X POST http://localhost:3000/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona":{"name":"Ada","domain":"AI Security"}}'
```

## New features in this branch
- Scheduling: `scheduleIntervalMinutes` and `schedulePaused` on `Agent`, scheduler functions in `lib/scheduler.ts`, and schedule API at `/api/agent/schedule`.
- Workflows: `Workflow` and `WorkflowStep` models, APIs to create/list workflows and CRUD for steps at `/api/agent/workflow` and `/api/agent/workflow/step`.
- Analytics: `PostMetric` model, endpoints at `/api/agent/metrics` and aggregated view `/api/agent/analytics`, plus a simulate button in the UI.
- Frontend: Agent settings, workflows, and analytics pages under `/agents/[agentId]/` with basic CRUD.
- Tests: lightweight integration tests in `scripts/tests/` and a runner `scripts/tests/run-all.ts`.

## Tests
Run the test runner (requires `ts-node`):

```bash
npx ts-node scripts/tests/run-all.ts
```

Or run individual tests via `npx ts-node --esm scripts/tests/<test>.ts`.

## Notes
- This branch includes Prisma schema updates; run migrations before starting the app.
- The UI pages are intentionally minimal and can be extended (drag/drop ordering, auth, etc.).

If you want, I can open a PR now with these changes — or push to a branch name you prefer.
# Autonomous AI Creator — Starter

This repo is a starter Next.js (App Router) + TypeScript project using Prisma + SQLite for development.

Quick start:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```
