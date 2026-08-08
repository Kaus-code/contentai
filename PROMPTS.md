# Saved Prompts

Date: 2026-08-08

## Stage 1 Hackathon Prompts

### 1. Project Setup & Database Schema

"I am building a submission for the 'Autonomous AI Creator' hackathon track. We need a web application using **Next.js (App Router)** and **TypeScript**, with **Supabase/PostgreSQL** (or Prisma/SQLite) for data storage.

Please set up the initial project structure and database schema. We need three database models/tables:

1. `Agent`: Stores `id`, `name`, `domain`, and `createdAt`.
2. `Post`: Stores `id`, `agentId`, `text`, `rationale`, `sources` (array/json), and `createdAt` (ISO 8601 UTC timestamp).
3. `EvaluatedTopic`: Stores `id`, `agentId`, `title`, `url`, `status` ('PUBLISHED' or 'REJECTED'), `reason`, and `createdAt`.
Write the database migration/schema file and a simple database client wrapper."

### 2. Required API Endpoints

"Now let's build the two mandatory HTTP endpoints required by the hackathon spec in Next.js App Router:

1. `POST /api/agent/init`
- Expects JSON request body: `{ "persona": { "name": "Ada", "domain": "AI Security" } }`
- Generates a unique `agentId` (e.g. `agent-123`).
- Saves the agent to the database.
- Returns JSON response: `{ "agentId": "agent-123" }` with HTTP status 200/201.

2. `GET /api/agent/feed`
- Expects query parameter: `agentId` (e.g. `/api/agent/feed?agentId=agent-123`).
- Fetches all posts belonging to `agentId` sorted in reverse chronological order (newest first).
- Returns JSON response: `{ "posts": [ { "id": "...", "createdAt": "...", "text": "...", "rationale": "...", "sources": [...] } ] }`.
- Returns `{ "posts": [] }` if no posts exist yet.
Please implement both route handlers with proper TypeScript types."

### 3. Information Discovery

"Next, let's build a Live Information Source helper script (`lib/discovery.ts`).

Create a function `fetchLiveTechTopics()` that:
1. Fetches top stories from the official Hacker News API (`https://hacker-news.firebaseio.com/v0/topstories.json`) or Dev.to API.
2. Returns an array of standardized objects: `{ title: string, url: string, contentSnippet: string, source: string }`.
3. Handles network errors gracefully and returns fallback items if the external API fails.
Make sure it does not require any paid API keys."

### 4. Editorial Judgment & Content Generation Engine

"Now let's build the core AI logic (`lib/agent-engine.ts`) using OpenAI / Gemini SDK.

Create an async function `runAutonomousCycle(agentId: string)` that performs the following:
1. Loads the agent's persona (`name`, `domain`) and previously published/evaluated topics from the database.
2. Calls `fetchLiveTechTopics()` to get fresh articles.
3. **Editorial Judgment Step:** Prompts an LLM to evaluate the candidate topics against the persona domain and memory history. The LLM must filter out irrelevant or duplicate topics, scoring each candidate and picking the single best topic. If all topics are bad or repetitive, it logs them as REJECTED in the DB and stops.
4. **Content Generation Step:** For the winning topic, prompt the LLM to generate:
- `text`: A high-quality social post in the persona's voice.
- `rationale`: Clear explanation of why the topic was selected, why it's relevant now, and why it beat candidate topics.
- `sources`: Array containing the topic URL.
5. Saves the new post and evaluated topics to the database.
Include the full LLM system and user prompt strings in this file."

### 5. Autonomous Execution

"Let's hook up the autonomous execution:
1. Update `POST /api/agent/init` so that immediately after creating a new agent, it triggers `runAutonomousCycle(agentId)` once so the feed isn't empty upon creation.
2. Create a background execution endpoint `GET /api/cron/publish` (protected by a `CRON_SECRET` bearer token/header).
- This endpoint should query all active agents from the DB and trigger `runAutonomousCycle(agentId)` for each.
3. Configure `vercel.json` with a cron configuration to hit `/api/cron/publish` every 2 to 3 hours automatically so the agent runs continuously for 48 hours without human input."

## LLM Prompts and System Instructions

### `lib/agent-engine.ts`

#### Editorial System Prompt
"You are an editorial AI assistant. Your job is to judge whether candidate technology topics are relevant, original, and well aligned to the agent persona and previously published topics. The agent persona has a domain and your evaluation must prioritize domain fit, uniqueness, audience value, and current relevance. Decide whether each candidate topic should be published or rejected, and choose the best single topic if any are good enough."

#### Editorial User Prompt
- Includes agent persona name/domain, previously evaluated/published topics, and candidate topics with title/snippet/URL.
- Instructs the model to:
  1. Evaluate each candidate against the persona domain and previously covered ideas.
  2. Filter out irrelevant or duplicate topics.
  3. Score each candidate from 0 to 10.
  4. Choose the single best topic to publish, or reject all if none are suitable.
  5. Explain why rejected topics were rejected.
  6. Return JSON with `selected` and `results`.

#### Content System Prompt
"You are a creative social content writer. Use the agent persona voice and write one high-quality social post and rationale. The post should feel concise, persuasive, and relevant to the agent's domain. Include a short rationale explaining why this topic was chosen and why it is timely."

#### Content User Prompt
- Includes persona name/domain, topic title, URL, and snippet.
- Instructs the model to return JSON with:
  - `text`: social post text
  - `rationale`: why this topic was chosen and why it is relevant now
  - `sources`: array containing the topic URL

## Testing and Verification

### Integration Test Script
- `scripts/test-integration.js`
- Verifies:
  - `POST /api/agent/init` returns `agentId`
  - `GET /api/agent/feed?agentId=...` returns a generated post
  - post includes valid ISO `createdAt`, `rationale`, and `sources`

### API and Cron Endpoints
- `POST /api/agent/init`
- `GET /api/agent/feed`
- `GET /api/cron/publish`

### Vercel Cron Configuration
- `vercel.json` uses schedule `0 */2 * * *` UTC to run `/api/cron/publish` every 2 hours.

## Environment Variables
- `OPENAI_API_KEY`
- `CRON_SECRET`


## Additional Notes
- The project uses Next.js App Router, TypeScript, Prisma/SQLite, and the OpenAI SDK.
- `lib/discovery.ts` uses Hacker News or Dev.to without paid keys.
- `package.json` includes `test:integration` and `test:discovery` scripts.

