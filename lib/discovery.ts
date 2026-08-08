export type Topic = {
  title: string
  url: string
  contentSnippet: string
  source: string
  publishedAt?: string
}

const FALLBACK_TOPICS: Topic[] = [
  {
    title: 'Zero-Trust Architecture for Autonomous LLM Agents',
    url: 'https://arxiv.org/abs/2402.01234',
    contentSnippet: 'Analyzing runtime security boundaries, sandbox isolation, and prompt injection mitigation patterns for agentic workflows.',
    source: 'arxiv',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Open Source Quantized MoE Models Outperforming Proprietary APIs',
    url: 'https://huggingface.co/blog/moe-quantization',
    contentSnippet: 'Recent benchmarks demonstrate 4-bit quantized Mixture of Experts models operating efficiently on consumer hardware.',
    source: 'huggingface',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Hardware Acceleration Breakthroughs in Optical Neural Networks',
    url: 'https://news.mit.edu/2024/photonic-chip-neural-networks',
    contentSnippet: 'Photonic computing chips achieve 100x efficiency gains in transformer inference matrix multiplication.',
    source: 'mit-news',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Robotics Transformer Architectures for Complex Manipulation',
    url: 'https://github.com/google-deepmind/robotics_transformer',
    contentSnippet: 'End-to-end vision-language-action models enabling zero-shot generalization across robotic arms.',
    source: 'github-trending',
    publishedAt: new Date().toISOString(),
  },
]

async function safeFetchText(url: string, timeoutMs = 7000): Promise<string> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AutonomousAICreator/1.0',
      },
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.text()
  } finally {
    clearTimeout(id)
  }
}

async function safeFetchJson<T>(url: string, timeoutMs = 7000): Promise<T> {
  const text = await safeFetchText(url, timeoutMs)
  return JSON.parse(text) as T
}

function cleanSnippet(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280)
}

async function fetchHackerNewsTopics(limit: number): Promise<Topic[]> {
  try {
    const ids = await safeFetchJson<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
    const topIds = ids.slice(0, limit * 2)
    const items = await Promise.all(
      topIds.map(async (id) => {
        try {
          const item = await safeFetchJson<any>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          if (!item || !item.title) return null
          const title: string = item.title
          const url: string = item.url || `https://news.ycombinator.com/item?id=${id}`
          const rawText = item.text || title
          return {
            title,
            url,
            contentSnippet: cleanSnippet(rawText),
            source: 'hackernews',
            publishedAt: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
          } as Topic
        } catch {
          return null
        }
      })
    )
    return items.filter((i): i is Topic => i != null)
  } catch {
    return []
  }
}

async function fetchDevToTopics(limit: number): Promise<Topic[]> {
  try {
    const articles = await safeFetchJson<any[]>(`https://dev.to/api/articles?tag=ai&per_page=${limit}`)
    if (Array.isArray(articles)) {
      return articles.map((a) => ({
        title: a.title || 'Dev.to AI Article',
        url: a.url || a.canonical_url || `https://dev.to/${a.user?.username}`,
        contentSnippet: cleanSnippet(a.description || a.body_markdown || a.title),
        source: 'dev.to',
        publishedAt: a.published_at || new Date().toISOString(),
      }))
    }
  } catch {
    // try default top articles
    try {
      const articles = await safeFetchJson<any[]>(`https://dev.to/api/articles?per_page=${limit}`)
      if (Array.isArray(articles)) {
        return articles.map((a) => ({
          title: a.title || 'Dev.to Article',
          url: a.url || a.canonical_url || `https://dev.to/${a.user?.username}`,
          contentSnippet: cleanSnippet(a.description || a.body_markdown || a.title),
          source: 'dev.to',
          publishedAt: a.published_at || new Date().toISOString(),
        }))
      }
    } catch {}
  }
  return []
}

async function fetchGoogleNewsRssTopics(query: string = 'artificial intelligence technology'): Promise<Topic[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
    const xml = await safeFetchText(rssUrl, 6000)
    const items: Topic[] = []
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>/g
    let match
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const title = cleanSnippet(match[1])
      const url = match[2].trim()
      const pubDateStr = match[3]
      if (title && url) {
        items.push({
          title,
          url,
          contentSnippet: `Google News report: ${title}`,
          source: 'google-news',
          publishedAt: pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString(),
        })
      }
    }
    return items
  } catch {
    return []
  }
}

export async function fetchLiveTechTopics(limit = 10, domain?: string): Promise<Topic[]> {
  const searchQuery = domain ? `${domain} AI technology` : 'artificial intelligence technology'
  
  const [hnTopics, devTopics, rssTopics] = await Promise.all([
    fetchHackerNewsTopics(limit),
    fetchDevToTopics(limit),
    fetchGoogleNewsRssTopics(searchQuery),
  ])

  const combined = [...hnTopics, ...devTopics, ...rssTopics]

  // Deduplicate by title similarity
  const uniqueTopics: Topic[] = []
  const seenTitles = new Set<string>()

  for (const topic of combined) {
    const normalized = topic.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (normalized.length < 5) continue
    if (!seenTitles.has(normalized)) {
      seenTitles.add(normalized)
      uniqueTopics.push(topic)
    }
  }

  if (uniqueTopics.length === 0) {
    return FALLBACK_TOPICS.slice(0, Math.min(limit, FALLBACK_TOPICS.length))
  }

  return uniqueTopics.slice(0, limit)
}

