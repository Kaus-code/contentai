# Saved Prompts

Date: 2026-08-08

1. Initial project request

I am building a submission for the 'Autonomous AI Creator' hackathon track. We need a web application using **Next.js (App Router)** and **TypeScript**, with **Supabase/PostgreSQL** (or Prisma/SQLite) for data storage.

Please set up the initial project structure and database schema. We need three database models/tables:

1. `Agent`: Stores `id`, `name`, `domain`, and `createdAt`.
2. `Post`: Stores `id`, `agentId`, `text`, `rationale`, `sources` (array/json), and `createdAt` (ISO 8601 UTC timestamp).
3. `EvaluatedTopic`: Stores `id`, `agentId`, `title`, `url`, `status` ('PUBLISHED' or 'REJECTED'), `reason`, and `createdAt`.
   Write the database migration/schema file and a simple database client wrapper.

2) Quick debug request

some error check it

3. TypeScript / tsconfig issue

some error here and also some error in tsconfig.json

4. Follow-up debug

some error

5. API endpoints spec

Now let's build the two mandatory HTTP endpoints required by the hackathon spec in Next.js App Router:

POST /api/agent/init

Expects JSON request body: { "persona": { "name": "Ada", "domain": "AI Security" } }

Generates a unique agentId (e.g. agent-123).

Saves the agent to the database.

Returns JSON response: { "agentId": "agent-123" } with HTTP status 200/201.

GET /api/agent/feed

Expects query parameter: agentId (e.g. /api/agent/feed?agentId=agent-123).

Fetches all posts belonging to agentId sorted in reverse chronological order (newest first).

Returns JSON response: { "posts": [ { "id": "...", "createdAt": "...", "text": "...", "rationale": "...", "sources": [...] } ] }.

Returns { "posts": [] } if no posts exist yet.

Please implement both route handlers with proper TypeScript types.

6. Completion / verification question

is this step completed? how to check?

7. Build error report

Build Error
Failed to compile

Next.js (14.2.35) is outdated (learn more)
./app/layout.tsx:1:1

```
Module not found: Can't resolve './globals.css'
> 1 | import './globals.css'
		| ^
	2 | import { ReactNode } from 'react'
	3 |
	4 | export const metadata = {

https://nextjs.org/docs/messages/module-not-found
```

This error occurred during the build process and can only be dismissed by fixing the error.

8. Save prompts request

save all my prompts in PROMTS.md
