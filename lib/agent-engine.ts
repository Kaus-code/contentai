import { OpenAI } from 'openai'
import { fetchLiveTechTopics, Topic } from './discovery'
import {
  createEvaluatedTopic,
  createPost,
  getAgentById,
  listEvaluatedTopicsByAgent,
} from './db'

const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type AgentPersona = {
  id: string
  name: string
  domain: string
}

const editorialSystemPrompt = `You are an editorial AI assistant. Your job is to judge whether candidate technology topics are relevant, original, and well aligned to the agent persona and previously published topics. The agent persona has a domain and your evaluation must prioritize domain fit, uniqueness, audience value, and current relevance. Decide whether each candidate topic should be published or rejected, and choose the best single topic if any are good enough.`

const editorialUserPrompt = ({ persona, previousTopics, candidates }: {
  persona: AgentPersona
  previousTopics: string[]
  candidates: Topic[]
}) => `Agent persona:
Name: ${persona.name}
Domain: ${persona.domain}

Previously evaluated or published topics:
${previousTopics.length ? previousTopics.map((t, i) => `${i + 1}. ${t}`).join('\n') : 'None'}

Candidate topics:
${candidates.map((t, i) => `${i + 1}. ${t.title} (${t.url}) — snippet: ${t.contentSnippet}`).join('\n')}

Instructions:
1. Evaluate each candidate against the persona's domain and previously covered ideas.
2. Filter out irrelevant or duplicate topics.
3. Score each candidate from 0 to 10.
4. Choose the single best topic to publish, or reject all if none are suitable.
5. For rejected topics, explain why they were rejected.
6. Return a JSON object with:
  - selected: index of the chosen topic, or null
  - results: array of { title, score, decision, reason }
`

const contentSystemPrompt = `You are a creative social content writer. Use the agent persona voice and write one high-quality social post and rationale. The post should feel concise, persuasive, and relevant to the agent's domain. Include a short rationale explaining why this topic was chosen and why it is timely.`

const contentUserPrompt = ({ persona, topic }: { persona: AgentPersona; topic: Topic }) => `Persona Name: ${persona.name}
Domain: ${persona.domain}

Topic: ${topic.title}
URL: ${topic.url}
Snippet: ${topic.contentSnippet}

Produce JSON with:
  - text: A high-quality social post in the persona's voice.
  - rationale: Why this topic was selected and why it is relevant now.
  - sources: [topic URL]
`

function parseJson<T>(input: string): T | null {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

export async function runAutonomousCycle(agentId: string) {
  const agent = await getAgentById(agentId)
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`)
  }

  const previousTopics = await listEvaluatedTopicsByAgent(agentId)
  const previousTitles = previousTopics.map((topic) => topic.title)
  const candidateTopics = await fetchLiveTechTopics(8)

  const editorialResponse = await openAi.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      { role: 'system', content: editorialSystemPrompt },
      { role: 'user', content: editorialUserPrompt({ persona: { id: agent.id, name: agent.name, domain: agent.domain }, previousTopics: previousTitles, candidates: candidateTopics }) },
    ],
    max_output_tokens: 800,
  })

  const editorialText = editorialResponse.output_text || ''
  const editorialData = parseJson<{ selected: number | null; results: Array<{ title: string; score: number; decision: 'PUBLISHED' | 'REJECTED'; reason: string }> }>(editorialText)
  if (!editorialData || !Array.isArray(editorialData.results)) {
    throw new Error('Invalid editorial result from LLM')
  }

  const chosenIndex = editorialData.selected
  const publishedResults = editorialData.results.map((result) => ({
    ...result,
    decision: result.decision === 'PUBLISHED' ? 'PUBLISHED' : 'REJECTED',
  }))

  if (chosenIndex === null || chosenIndex < 0 || chosenIndex >= candidateTopics.length) {
    await Promise.all(
      publishedResults.map((result) =>
        createEvaluatedTopic({
          agentId,
          title: result.title,
          url: candidateTopics.find((topic) => topic.title === result.title)?.url,
          status: 'REJECTED',
          reason: result.reason,
        })
      )
    )
    return { status: 'rejected', reasons: publishedResults }
  }

  const winningTopic = candidateTopics[chosenIndex]
  const contentResponse = await openAi.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      { role: 'system', content: contentSystemPrompt },
      { role: 'user', content: contentUserPrompt({ persona: { id: agent.id, name: agent.name, domain: agent.domain }, topic: winningTopic }) },
    ],
    max_output_tokens: 800,
  })

  const contentText = contentResponse.output_text || ''
  const contentData = parseJson<{ text: string; rationale: string; sources: string[] }>(contentText)
  if (!contentData || !contentData.text || !contentData.rationale || !Array.isArray(contentData.sources)) {
    throw new Error('Invalid content generation result from LLM')
  }

  const post = await createPost({
    agentId,
    text: contentData.text,
    rationale: contentData.rationale,
    sources: contentData.sources,
  })

  await createEvaluatedTopic({
    agentId,
    title: winningTopic.title,
    url: winningTopic.url,
    status: 'PUBLISHED',
    reason: `Selected by editorial judgment based on persona ${agent.name} in ${agent.domain}`,
  })

  return { status: 'published', post, topic: winningTopic }
}
