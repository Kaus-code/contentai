import { OpenAI } from 'openai'
import { fetchLiveTechTopics } from './discovery.ts'
import type { Topic } from './discovery.ts'
import {
  createEvaluatedTopic,
  createPost,
  getAgentById,
  listEvaluatedTopicsByAgent,
  listPostsByAgent,
} from './db.ts'
import * as db from './db.ts'
import * as emb from './embeddings'

type AgentPersona = {
  id: string
  name: string
  domain: string
}

type EditorialResult = {
  selected: number | null
  results: Array<{
    title: string
    score: number
    decision: 'PUBLISHED' | 'REJECTED'
    reason: string
  }>
}

type ContentResult = {
  text: string
  rationale: string
  sources: string[]
}

const editorialSystemPrompt = `You are a high-level Editorial Director for an autonomous technology persona.
Your objective is to enforce strict editorial standards:
1. Filter out candidate topics that are off-domain, uninteresting, clickbait, or duplicate/too similar to previously PUBLISHED topics.
2. Evaluate remaining candidates on domain alignment, novelty, technical depth, and current relevance.
3. Score each candidate from 0 to 10.
4. Select the SINGLE best candidate (score >= 6) to publish. If no candidate meets the bar or all are duplicates/irrelevant, select null.
5. Provide an explicit rejection reason for every rejected candidate.
You MUST output strictly valid JSON matching:
{
  "selected": number | null,
  "results": [
    { "title": "string", "score": number, "decision": "PUBLISHED" | "REJECTED", "reason": "string" }
  ]
}`

const editorialUserPrompt = ({
  persona,
  publishedHistory,
  candidates,
}: {
  persona: AgentPersona
  publishedHistory: string[]
  candidates: Topic[]
}) => `Agent Persona:
- Name: ${persona.name}
- Specialized Domain: ${persona.domain}

Previously Published Topics in Memory (DO NOT REPEAT):
${publishedHistory.length ? publishedHistory.map((t, i) => `${i + 1}. ${t}`).join('\n') : 'None (First run)'}

Candidate Discovered Topics:
${candidates.map((t, i) => `[Index ${i}] Title: "${t.title}" | Source: ${t.source} | URL: ${t.url} | Snippet: ${t.contentSnippet}`).join('\n')}

Analyze all candidates. Reject any candidates that fail persona fit, lack technical substance, or duplicate previously published topics. Return strictly JSON matching the required schema.`

const contentSystemPrompt = `You are an autonomous AI & technology persona writing high-impact social media posts for LinkedIn and X.
You write with a distinct, consistent editorial voice tied to your specialized domain.
Your post must feel sharp, insightful, and authoritative.

You MUST also provide a clear, multi-sentence RATIONALE explaining:
1. Why this topic was selected.
2. Why it is relevant right now.
3. Why it was chosen over the other candidate topics evaluated in this cycle.

Output strictly valid JSON matching:
{
  "text": "string (the social post content)",
  "rationale": "string (detailed explanation)",
  "sources": ["url_string"]
}`

const contentUserPrompt = ({
  persona,
  winningTopic,
  rejectedTopics,
}: {
  persona: AgentPersona
  winningTopic: Topic
  rejectedTopics: Array<{ title: string; reason: string }>
}) => `Persona Profile:
- Name: ${persona.name}
- Domain: ${persona.domain}

Selected Topic:
- Title: ${winningTopic.title}
- Source: ${winningTopic.source}
- URL: ${winningTopic.url}
- Snippet: ${winningTopic.contentSnippet}

Rejected Competitor Topics Evaluated in this Cycle:
${rejectedTopics.map((r, i) => `${i + 1}. "${r.title}" — Reason: ${r.reason}`).join('\n')}

Generate the post and structured rationale according to your persona voice and JSON schema.`

function cleanJsonResponse(text: string): string {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim()
}

function parseJson<T>(input: string): T | null {
  try {
    const cleaned = cleanJsonResponse(input)
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

// Heuristic fallback generator when LLM API keys are unavailable or fail
function fallbackEditorialEvaluation(
  persona: AgentPersona,
  publishedHistory: string[],
  candidates: Topic[]
): EditorialResult {
  const normPublished = publishedHistory.map((t) => t.toLowerCase())
  const keywords = persona.domain.toLowerCase().split(/\s+/).filter((k) => k.length > 2)

  let bestIndex: number | null = null
  let maxScore = -1

  const results: EditorialResult['results'] = candidates.map((c, idx) => {
    const titleLower = c.title.toLowerCase()
    
    // Memory check against ALREADY PUBLISHED posts
    const isDuplicate = normPublished.some(
      (p) => p.includes(titleLower.slice(0, 20)) || titleLower.includes(p.slice(0, 20))
    )

    if (isDuplicate) {
      return {
        title: c.title,
        score: 2,
        decision: 'REJECTED',
        reason: 'Rejected by memory filter: topic concept was previously published in feed.',
      }
    }

    const domainMatches = keywords.filter((k) => titleLower.includes(k) || c.contentSnippet.toLowerCase().includes(k))
    const isGeneric = titleLower.includes('hamster') || titleLower.includes('sad') || titleLower.length < 8

    if (isGeneric && domainMatches.length === 0) {
      return {
        title: c.title,
        score: 3,
        decision: 'REJECTED',
        reason: `Off-domain topic: title does not directly align with ${persona.name}'s focus on ${persona.domain}.`,
      }
    }

    const score = Math.min(10, 6 + domainMatches.length * 2 + (c.source === 'arxiv' || c.source === 'dev.to' ? 1 : 0))

    if (score > maxScore && score >= 6) {
      maxScore = score
      bestIndex = idx
    }

    return {
      title: c.title,
      score,
      decision: 'REJECTED',
      reason: domainMatches.length > 0 ? `Good alignment with ${persona.domain}.` : `General tech topic, evaluated score ${score}/10.`,
    }
  })

  if (bestIndex !== null) {
    results[bestIndex].decision = 'PUBLISHED'
    results[bestIndex].reason = `Selected as top candidate (score ${maxScore}/10) for domain ${persona.domain}.`
  }

  return { selected: bestIndex, results }
}

function fallbackContentGeneration(
  persona: AgentPersona,
  winningTopic: Topic,
  rejectedTopics: Array<{ title: string; reason: string }>
): ContentResult {
  const name = persona.name
  const domain = persona.domain

  const title = winningTopic.title
  const snippet = winningTopic.contentSnippet || title

  const text = `Insights on "${title}" from ${name} (${domain}):\n\n` +
    `${snippet}\n\n` +
    `Key Takeaway: As developments in ${domain} accelerate, prioritizing practical execution, verifiability, and robust architecture is essential.\n\n` +
    `What are your thoughts on this approach?`

  const rejectedSummary = rejectedTopics.length > 0
    ? `It was chosen over ${rejectedTopics.length} other candidate topics evaluated in this cycle (such as "${rejectedTopics[0]?.title}") which were rejected due to: ${rejectedTopics[0]?.reason.toLowerCase() || 'insufficient domain fit'}.`
    : `It beat out alternative candidate items evaluated during this publishing cycle.`

  const rationale = `Topic "${title}" was selected by ${name} because it provides immediate, actionable relevance to ${domain}. ` +
    `It is timely right now as open source and production implementations rapidly evolve. ${rejectedSummary}`

  return {
    text,
    rationale,
    sources: [winningTopic.url],
  }
}

export async function runAutonomousCycle(agentId: string) {
  const agent = await getAgentById(agentId)
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`)
  }

  const persona: AgentPersona = {
    id: agent.id,
    name: agent.name,
    domain: agent.domain,
  }

  // Memory History: Load previously PUBLISHED posts to avoid duplicate posts
  const postsHistory = await listPostsByAgent(agentId)
  const evaluatedTopicsHistory = await listEvaluatedTopicsByAgent(agentId)
  
  const publishedTitles = [
    ...postsHistory.map((p) => p.text.slice(0, 40)),
    ...evaluatedTopicsHistory.filter((t) => t.status === 'PUBLISHED').map((t) => t.title),
  ]

  // Step 1: Discover topics from live information sources
  const candidateTopics = await fetchLiveTechTopics(8, agent.domain)

  // Compute embeddings for candidate topics and load past embeddings for novelty checks
  const candidateVectors = await Promise.all(
    candidateTopics.map(async (t) => ({
      topic: t,
      vector: await emb.generateEmbedding((t.title || '') + '\n' + (t.contentSnippet || '')),
    }))
  )

  const pastEmbeddings = await db.listEmbeddingsByAgent(agentId)
  // Fetch source credibility scores for candidate domains
  const sourceScores = {}
  for (const ct of candidateTopics) {
    try {
      const url = ct.url || ''
      const domain = url ? (new URL(url)).hostname : null
      if (domain) {
        // lazy import to avoid circular/unused API requirements
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sc = await (await import('./sourceCred')).scoreDomain(domain)
        // store
        // @ts-ignore
        sourceScores[ct.title] = sc
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  let editorialData: EditorialResult | null = null

  // Try OpenAI API if key exists
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: editorialSystemPrompt },
          {
            role: 'user',
            content: editorialUserPrompt({
              persona,
              publishedHistory: publishedTitles,
              candidates: candidateTopics,
            }),
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })

      const raw = completion.choices[0]?.message?.content || ''
      editorialData = parseJson<EditorialResult>(raw)
    } catch (err) {
      console.warn('OpenAI Editorial evaluation failed, falling back to local engine:', err)
    }
  }

  // Fallback editorial evaluation if no API or parsing error
  if (!editorialData || !Array.isArray(editorialData.results)) {
    editorialData = fallbackEditorialEvaluation(persona, publishedTitles, candidateTopics)
  }

  // Record editorial decision log
  try {
    await db.createDecisionLog({ agentId, type: 'EDITORIAL', outcome: editorialData.selected !== null ? 'SELECTED' : 'NONE', payload: JSON.stringify(editorialData) })
  } catch (e) {
    console.warn('Failed to write editorial decision log', e)
  }

  // Store all evaluated topics in database (memory & transparency)
  await Promise.all(
    editorialData.results.map((result) => {
      const matched = candidateTopics.find((t) => t.title === result.title)
      const evalPromise = createEvaluatedTopic({
        agentId,
        title: result.title,
        url: matched?.url ?? null,
        status: result.decision,
        reason: result.reason,
      })

      // Attach source credibility info if we computed it
      const sc = (matched && (sourceScores as any)[matched.title]) || null
      if (sc) {
        try {
          // write a decision log for source credibility
          db.createDecisionLog({ agentId, type: 'SOURCE_CRED', outcome: String(sc.score), payload: JSON.stringify(sc) })
        } catch (e) {
          // ignore
        }
      }

      return evalPromise
    })
  )

  // Apply embedding-based novelty check by marking high-similarity candidates as rejected
  // If any candidate is very similar (>0.85) to a past embedding, annotate its evaluation result
  if (pastEmbeddings && pastEmbeddings.length > 0) {
    const similarityThreshold = 0.85
    for (const cv of candidateVectors) {
      const sims = pastEmbeddings.map((p) => emb.cosineSimilarity(cv.vector, emb.parseVector(p.vector)))
      const maxSim = Math.max(...sims, 0)
      if (maxSim >= similarityThreshold) {
        // find matching result and mark as rejected due to duplication if not already rejected
        const res = editorialData.results.find((r) => r.title === cv.topic.title)
        if (res && res.decision === 'PUBLISHED') {
          res.decision = 'REJECTED'
          res.reason = `Rejected by embedding novelty filter: similarity ${maxSim.toFixed(3)} to previously published content.`
          // update DB evaluated topic record accordingly
          createEvaluatedTopic({ agentId, title: res.title, url: cv.topic.url ?? null, status: res.decision, reason: res.reason })
          try {
            await db.createDecisionLog({ agentId, type: 'NOVELTY', outcome: 'REJECTED_DUPLICATE', payload: JSON.stringify({ title: res.title, similarity: maxSim }) })
          } catch (e) {
            console.warn('Failed to write novelty decision log', e)
          }
        }
      }
    }
  }

  const chosenIndex = editorialData.selected

  // If all candidates rejected or no valid topic chosen
  if (chosenIndex === null || chosenIndex < 0 || chosenIndex >= candidateTopics.length) {
    return {
      status: 'rejected_all',
      message: 'All candidate topics were rejected during editorial evaluation.',
      evaluatedCount: candidateTopics.length,
      evaluations: editorialData.results,
    }
  }

  const winningTopic = candidateTopics[chosenIndex]
  const rejectedTopics = editorialData.results
    .filter((r) => r.decision === 'REJECTED')
    .map((r) => ({ title: r.title, reason: r.reason }))

  let contentData: ContentResult | null = null

  // Try OpenAI content generation
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: contentSystemPrompt },
          {
            role: 'user',
            content: contentUserPrompt({
              persona,
              winningTopic,
              rejectedTopics,
            }),
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })

      const raw = completion.choices[0]?.message?.content || ''
      contentData = parseJson<ContentResult>(raw)
    } catch (err) {
      console.warn('OpenAI Content generation failed, falling back to local engine:', err)
    }
  }

  // Fallback content generation if API call failed
  if (!contentData || !contentData.text || !contentData.rationale) {
    contentData = fallbackContentGeneration(persona, winningTopic, rejectedTopics)
  }

  // Save the newly generated post to the database
  const post = await createPost({
    agentId,
    text: contentData.text,
    rationale: contentData.rationale,
    sources: JSON.stringify(contentData.sources.length ? contentData.sources : [winningTopic.url]),
  })

  // Persist version for the post
  try {
    await db.createPostVersion({ postId: post.id, text: post.text, rationale: post.rationale, sources: post.sources })
  } catch (e) {
    console.warn('Failed to create post version', e)
  }

  // Persist embedding for the newly created post
  try {
    const postVec = await emb.generateEmbedding(post.text || post.rationale || '')
    await db.createEmbedding({ postId: post.id, agentId, vector: emb.serializeVector(postVec) })
    try {
      await db.createDecisionLog({ agentId, type: 'CONTENT', outcome: 'PUBLISHED', payload: JSON.stringify({ postId: post.id, title: winningTopic.title }) })
    } catch (e) {
      console.warn('Failed to write content decision log', e)
    }
  } catch (e) {
    console.warn('Failed to persist post embedding', e)
  }

  // Trigger webhooks for POST_PUBLISHED
  try {
    const hooks = await db.listWebhooksByAgent(agentId)
    if (hooks && hooks.length > 0) {
      const payload = {
        event: 'POST_PUBLISHED',
        agentId,
        post: {
          id: post.id,
          createdAt: post.createdAt,
          text: post.text,
          rationale: post.rationale,
          sources: JSON.parse(post.sources || '[]'),
        },
      }
      for (const h of hooks) {
        // fire and forget
        fetch(h.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch((err) => console.warn('Webhook POST failed', h.url, err))
      }
    }
  } catch (e) {
    console.warn('Failed to trigger webhooks', e)
  }

  return {
    status: 'published',
    post: {
      id: post.id,
      createdAt: post.createdAt.toISOString(),
      text: post.text,
      rationale: post.rationale,
      sources: contentData.sources,
    },
    winningTopic,
    rejectedCount: rejectedTopics.length,
  }
}
