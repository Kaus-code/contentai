type Topic = {
  title: string
  url: string
  contentSnippet: string
  source: string
}

const FALLBACK_TOPICS: Topic[] = [
  {
    title: 'AI Safety Best Practices',
    url: 'https://example.com/ai-safety-best-practices',
    contentSnippet: 'A short primer on practical AI safety checks and guardrails.',
    source: 'fallback',
  },
  {
    title: 'Recent Advances in ML Tooling',
    url: 'https://example.com/ml-tooling',
    contentSnippet: 'Summary of notable open-source tooling that speeds up ML development.',
    source: 'fallback',
  },
]

async function safeFetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const data = (await res.json()) as T
    return data
  } finally {
    clearTimeout(id)
  }
}

export async function fetchLiveTechTopics(limit = 10): Promise<Topic[]> {
  // Try Hacker News first
  try {
    const ids = await safeFetchJson<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
    const top = ids.slice(0, Math.max(0, limit))
    const items = await Promise.all(
      top.map(async (id) => {
        try {
          const item = await safeFetchJson<any>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          const title: string = item?.title ?? `HN item ${id}`
          const url: string = item?.url ?? `https://news.ycombinator.com/item?id=${id}`
          const rawText = item?.text ?? ''
          const contentSnippet = rawText ? rawText.replace(/<[^>]+>/g, '').slice(0, 300) : title
          return { title, url, contentSnippet, source: 'hackernews' } as Topic
        } catch (e) {
          return null
        }
      })
    )
    const filtered = items.filter((i): i is Topic => i != null)
    if (filtered.length > 0) return filtered
    // fall through to dev.to if HN returned no items
  } catch (err) {
    // swallow and try dev.to
  }

  // Fallback to Dev.to public API (no API key required for public content)
  try {
    const articles = await safeFetchJson<any[]>(`https://dev.to/api/articles?per_page=${Math.max(1, limit)}`)
    if (Array.isArray(articles) && articles.length > 0) {
      const mapped: Topic[] = articles.slice(0, limit).map((a) => ({
        title: a.title ?? 'dev.to article',
        url: a.url ?? a.canonical_url ?? `https://dev.to/${a.user?.username}`,
        contentSnippet: (a.description ?? a.body_markdown ?? '').replace(/<[^>]+>/g, '').slice(0, 300),
        source: 'dev.to',
      }))
      return mapped
    }
  } catch (err) {
    // swallow and return fallback
  }

  // Final fallback
  return FALLBACK_TOPICS.slice(0, Math.max(1, Math.min(limit, FALLBACK_TOPICS.length)))
}

export type { Topic }
