# Autonomous AI Creator — Autonomous Editorial Personas

This repository is a Next.js (App Router) + TypeScript starter that runs autonomous editorial AI personas. It discovers timely tech topics, applies an editorial rubric, and publishes short posts. A SQLite dev schema is included so you can run locally without a Postgres `DATABASE_URL`.

**This README highlights the developer workflow, local dev (SQLite) fallback, key scripts, and troubleshooting notes.**

**Prerequisites**
- Node 18+ / npm
- (Optional) A Postgres instance if you intend to use `pgvector` in production

**Install**

```bash
npm install
npx prisma generate
```

**Local dev (recommended — SQLite fallback)**

1. Generate the Prisma client for the dev schema (already set up to output to node_modules):

```bash
npm run prisma:generate:dev
```

2. Push the dev schema (creates `prisma/dev.db`):

```bash
npm run migrate:dev:sqlite
```

If `prisma db push` asks to reset the DB, confirm if this is a local dev database you can reinitialize.

3. Seed (dev):

```bash
# run the JS dev seeder
node scripts/seed-dev.js
```

4. Start the Next dev server:

```bash
npm run dev
```

5. Open the app: http://localhost:3000 — enter the agent id shown by the seeder or use the UI to initialize an agent.

Key scripts (quick reference)
- `npm run prisma:generate:dev` — generate Prisma client for `prisma/schema.dev.prisma`
- `npm run migrate:dev:sqlite` — apply dev schema (creates `prisma/dev.db`)
- `npm run force-publish` — force-create a published post for the first agent (useful for UI testing)
- `npm run one-cycle:compiled` — compile TypeScript and run the compiled `run-cycle` script
- `npm run test:all` — run the lightweight fallback tests included under `scripts/tests`

E2E / manual verification

- Initialize an agent (server running):

```bash
curl -X POST http://localhost:3000/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona":{"name":"Ada","domain":"AI Security"}}'
```

- View feed for an agent:

```bash
curl "http://localhost:3000/api/agent/feed?agentId=YOUR_AGENT_ID" | jq
```

- Force a published post for UI testing (creates Post + PostVersion + Embedding + DecisionLog):

```bash
npm run force-publish
```

Developer notes — runtime & path aliases

- During development we use `tsconfig-paths` to resolve `@/lib` aliases. If you run TypeScript files directly with `ts-node`, use this form:

```bash
npx ts-node -r tsconfig-paths/register scripts/run-cycle.ts
```

- A more reliable runner for local CI is the compiled path used here:

```bash
npm run one-cycle:compiled
```

Troubleshooting

- If `prisma migrate dev` fails on SQLite due to Postgres-specific SQL in migrations (e.g., `CREATE EXTENSION vector`), use the dev schema `prisma/schema.dev.prisma` and `npm run migrate:dev:sqlite`. We split Postgres-only SQL into manual migration helpers under `prisma/`.
- If the UI shows empty posts, confirm the API uses `post.body` (SQLite dev schema) or `post.text` (Postgres schema). The feed endpoint will return `text: p.body ?? p.text` to cover both.

Where to look in the repo
- `lib/agent-engine.ts` — autonomous cycle orchestration
- `lib/editorial.ts` — editorial 100-point rubric + Zod schemas
- `lib/db.ts` — Prisma helpers tuned to dev schema
- `prisma/schema.dev.prisma` — SQLite dev schema
- `scripts/seed-dev.js`, `scripts/force-publish.js`, `scripts/run-cycle-simple.js` — useful dev/test helpers

Next steps I can do for you
- Clean up the launcher and add a concise `README` run section (I can commit this change).
- Make `npm run one-cycle` wrap compile+run and add a `--force` option to `force-publish`.
- Extend tests to cover the full run cycle including embeddings and webhook simulation.

If you'd like, I can open a PR with these README and script changes or adjust wording to match your preferred developer workflow.


