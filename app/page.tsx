'use client'

import { FormEvent, useState } from 'react'

type Post = {
  id: string
  createdAt: string
  text: string
  rationale: string | null
  sources: string[]
}

const containerStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '24px',
  fontFamily: 'system-ui, sans-serif',
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 18,
  marginBottom: 18,
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  marginBottom: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 600,
}

export default function Home() {
  const [name, setName] = useState('Ada')
  const [domain, setDomain] = useState('AI Security')
  const [initializedAgentId, setInitializedAgentId] = useState<string | null>(null)
  const [agentIdInput, setAgentIdInput] = useState('')
  const [feedPosts, setFeedPosts] = useState<Post[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingFeed, setLoadingFeed] = useState(false)

  async function handleInitialize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setLoadingInit(true)

    try {
      const response = await fetch('/api/agent/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: { name, domain } }),
      })

      const result = await response.json()
      if (!response.ok) {
        setMessage(result?.error || 'Failed to initialize agent')
        return
      }

      setInitializedAgentId(result.agentId)
      setAgentIdInput(result.agentId)
      setMessage('Agent initialized successfully')
    } catch (error) {
      setMessage('Unable to reach the API. Check your server.')
    } finally {
      setLoadingInit(false)
    }
  }

  async function handleFetchFeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setLoadingFeed(true)

    if (!agentIdInput) {
      setMessage('Enter an agentId to fetch feed')
      setLoadingFeed(false)
      return
    }

    try {
      const response = await fetch(`/api/agent/feed?agentId=${encodeURIComponent(agentIdInput)}`)
      const result = await response.json()
      if (!response.ok) {
        setMessage(result?.error || 'Failed to fetch feed')
        return
      }

      setFeedPosts(Array.isArray(result.posts) ? result.posts : [])
      setMessage('Feed loaded successfully')
    } catch (error) {
      setMessage('Unable to fetch feed. Check your server.')
    } finally {
      setLoadingFeed(false)
    }
  }

  return (
    <main style={containerStyle}>
      <div style={sectionStyle}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Autonomous AI Creator</h1>
        <p style={{ color: '#475569', marginBottom: 24 }}>
          Use this dashboard to initialize an agent and inspect published posts from the API.
        </p>
      </div>

      <section style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Initialize Agent</h2>
          <form onSubmit={handleInitialize}>
            <label style={labelStyle} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              style={inputStyle}
              placeholder="Agent name"
            />

            <label style={labelStyle} htmlFor="domain">
              Domain
            </label>
            <input
              id="domain"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              style={inputStyle}
              placeholder="Agent domain"
            />

            <button type="submit" style={buttonStyle} disabled={loadingInit}>
              {loadingInit ? 'Initializing...' : 'Initialize Agent'}
            </button>
          </form>

          {initializedAgentId ? (
            <div style={{ marginTop: 18, padding: 14, background: '#f1f5f9', borderRadius: 10 }}>
              <strong>Agent ID:</strong>
              <div style={{ marginTop: 6, wordBreak: 'break-all', color: '#0f172a' }}>{initializedAgentId}</div>
            </div>
          ) : null}
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Feed Inspector</h2>
          <form onSubmit={handleFetchFeed}>
            <label style={labelStyle} htmlFor="agentId">
              Agent ID
            </label>
            <input
              id="agentId"
              value={agentIdInput}
              onChange={(event) => setAgentIdInput(event.target.value)}
              style={inputStyle}
              placeholder="Enter or paste agentId"
            />

            <button type="submit" style={buttonStyle} disabled={loadingFeed}>
              {loadingFeed ? 'Fetching...' : 'Fetch Feed'}
            </button>
          </form>

          {message ? (
            <p style={{ marginTop: 16, color: '#334155' }}>{message}</p>
          ) : null}

          {feedPosts.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              {feedPosts.map((post) => (
                <article key={post.id} style={cardStyle}>
                  <div style={{ marginBottom: 12, color: '#64748b', fontSize: 14 }}>
                    Published: {new Date(post.createdAt).toLocaleString()}
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 16, lineHeight: 1.6 }}>{post.text}</p>
                  <div style={{ marginBottom: 12, color: '#475569' }}>
                    <strong>Rationale:</strong>
                    <p style={{ margin: '8px 0 0' }}>{post.rationale ?? 'No rationale provided.'}</p>
                  </div>
                  <div>
                    <strong>Sources:</strong>
                    <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                      {post.sources.map((source) => (
                        <li key={source}>
                          <a href={source} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
