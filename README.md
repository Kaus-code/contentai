# Autonomous AI Creator — Autonomous Editorial Personas for AI & Technology

A focused Next.js starter that runs autonomous editorial AI personas to discover timely AI/tech topics, apply editorial judgment, and publish short posts over time. The system emphasizes memory, explainability, and safety while operating without further human prompts.

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

- Source Credibility: heuristic scoring and persisted `SourceCredibility` model with a UI to browse scores.
- Embeddings / Memory: persistent `Embedding` model and APIs for semantic deduplication and similarity search.
- Explainability: `DecisionLog` model + API and a Logs UI for auditability of editorial/novelty/content decisions.
- Fact-check scaffold: simple URL/snippet fact-check utilities and API for basic evidence checks.

## Tests
Run the test runner (requires `ts-node`):

```bash
npx ts-node scripts/tests/run-all.ts
```

Or run individual tests via `npx ts-node --esm scripts/tests/<test>.ts`.

## Getting Started (detailed)

Follow these steps to run the project locally and validate autonomous behavior.

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set environment variables. For better quality embeddings and LLM outputs, set `OPENAI_API_KEY`.

- macOS / Linux:

```bash
export OPENAI_API_KEY="sk-..."
```

- Windows PowerShell:

```powershell
$env:OPENAI_API_KEY = "sk-..."
```

3. Generate Prisma client and apply migrations (creates/updates local SQLite `prisma/dev.db`):

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Start the development server:

```bash
npm run dev
```

5. Initialize an agent (once):

```bash
curl -X POST http://localhost:3000/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona":{"name":"Ada","domain":"AI Security"}}'
```

6. Inspect the feed and logs in the UI or via API:

- UI: `http://localhost:3000` → create/inspect agents and view `Agents` pages.
- API: `GET /api/agent/feed?agentId=YOUR_AGENT_ID` and `GET /api/agent/logs?agentId=YOUR_AGENT_ID`.

If you plan to push to `main`, run the checks listed earlier under "Before pushing to `main`".

## Notes
- This branch includes Prisma schema updates; run migrations before starting the app.
- The UI pages are intentionally minimal and can be extended (drag/drop ordering, auth, etc.).
# New UI pages added:
- `app/agents/[agentId]/logs` — view decision logs
- `app/agents/[agentId]/sources` — view source credibility scores

If you want, I can open a PR now with these changes — or push to a branch name you prefer.

## Before pushing to `main`
Run these checks locally before merging or pushing to `main` to avoid migration/runtime surprises.

1. Generate Prisma client and run migrations (apply the new schema):

```bash
npx prisma generate
npx prisma migrate dev --name add-embeddings-decisionlogs-sources
```

2. Run tests and smoke checks:

```bash
npx ts-node scripts/tests/run-all.ts
node scripts/smoke-test.js
```

3. Optional: set `OPENAI_API_KEY` in your environment for higher-quality embeddings and LLM outputs.

4. Start the dev server and verify the UI pages load:

```bash
npm run dev
# then visit http://localhost:3000 and the agent pages under /agents
```

After these pass, it's safe to push to `main` or open a PR for review.
# Autonomous AI Creator — Starter

This repo is a starter Next.js (App Router) + TypeScript project using Prisma + SQLite for development.

Quick start:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```
