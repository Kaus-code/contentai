'use client'

import { FormEvent, useEffect, useState } from 'react'

type Post = {
  id: string
  createdAt: string
  text: string
  rationale: string
  sources: string[]
}

type Evaluation = {
  id: string
  title: string
  url: string | null
  status: string
  reason: string | null
  createdAt: string
}

const PRESET_PERSONAS = [
  { name: 'Ada', domain: 'AI Security', tag: 'Recommended' },
  { name: 'Marcus', domain: 'Machine Learning Engineer', tag: 'Systems' },
  { name: 'Elena', domain: 'AI Ethics & Governance', tag: 'Policy' },
  { name: 'Jax', domain: 'Robotics & Embodied AI', tag: 'Hardware' },
  { name: 'Sora', domain: 'Open Source AI Contributor', tag: 'Dev' },
]

export default function Home() {
  const [name, setName] = useState('Ada')
  const [domain, setDomain] = useState('AI Security')
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentIdInput, setAgentIdInput] = useState('')
  const [feedPosts, setFeedPosts] = useState<Post[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [activeTab, setActiveTab] = useState<'feed' | 'evaluations' | 'api'>('feed')
  
  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingCycle, setLoadingCycle] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  async function handleInitialize(e?: FormEvent) {
    if (e) e.preventDefault()
    setStatusMessage(null)
    setLoadingInit(true)

    try {
      const res = await fetch('/api/agent/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: { name, domain } }),
      })

      const data = await res.json()
      if (!res.ok) {
        setStatusMessage(`Error: ${data.error || 'Failed to initialize agent'}`)
        return
      }

      setAgentId(data.agentId)
      setAgentIdInput(data.agentId)
      setStatusMessage(`Agent ${data.agentId} successfully initialized and 1st post generated!`)
      fetchFeed(data.agentId)
      fetchEvaluations(data.agentId)
    } catch (err) {
      setStatusMessage('Network error. Failed to reach API endpoint.')
    } finally {
      setLoadingInit(false)
    }
  }

  async function fetchFeed(targetId?: string) {
    const idToFetch = targetId || agentIdInput
    if (!idToFetch) return

    setLoadingFeed(true)
    try {
      const res = await fetch(`/api/agent/feed?agentId=${encodeURIComponent(idToFetch)}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.posts)) {
        setFeedPosts(data.posts)
      } else {
        setStatusMessage(`Feed error: ${data.error || 'Failed to fetch feed'}`)
      }
    } catch (err) {
      setStatusMessage('Failed to fetch agent feed.')
    } finally {
      setLoadingFeed(false)
    }
  }

  async function fetchEvaluations(targetId?: string) {
    const idToFetch = targetId || agentIdInput
    if (!idToFetch) return

    try {
      const res = await fetch(`/api/agent/evaluations?agentId=${encodeURIComponent(idToFetch)}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.evaluations)) {
        setEvaluations(data.evaluations)
      }
    } catch (err) {
      console.error('Failed to fetch evaluations:', err)
    }
  }

  async function handleTriggerCycle() {
    if (!agentIdInput) {
      setStatusMessage('Please specify an agentId first.')
      return
    }

    setLoadingCycle(true)
    setStatusMessage('Running autonomous topic discovery & editorial cycle...')

    try {
      const res = await fetch('/api/agent/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentIdInput }),
      })

      const data = await res.json()
      if (res.ok) {
        setStatusMessage('Autonomous cycle completed!')
        fetchFeed(agentIdInput)
        fetchEvaluations(agentIdInput)
      } else {
        setStatusMessage(`Cycle failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      setStatusMessage('Failed to trigger autonomous cycle.')
    } finally {
      setLoadingCycle(false)
    }
  }

  function handleSelectPreset(p: { name: string; domain: string }) {
    setName(p.name)
    setDomain(p.domain)
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Header Banner */}
      <header style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }} className="badge badge-cyan">
          <div className="pulse-dot" />
          Autonomous AI & Tech Persona Creator
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1px', marginBottom: 12 }}>
          Self-Directing Editorial Persona for AI & Technology
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 17, maxWidth: 720, margin: '0 auto' }}>
          An autonomous editorial agent that discovers timely technical topics, applies strict editorial judgment, writes in a consistent voice, and publishes over time with explainable reasoning.
        </p>

        {/* Animated demo steps */}
        <div style={{ marginTop: 20 }}>
          <div className="demo-steps">
            <div className="demo-step">Discover</div>
            <div className="demo-step">Evaluate</div>
            <div className="demo-step">Compose</div>
            <div className="demo-step">Publish</div>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        
        {/* Agent Setup Card */}
        <section className="glass-card">
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚡</span> Initialize Autonomous Agent
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
              SELECT PERSONA PRESET
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PRESET_PERSONAS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`secondary-btn ${name === p.name ? 'border-accent' : ''}`}
                  style={{
                    borderColor: name === p.name ? 'var(--accent-cyan)' : undefined,
                    background: name === p.name ? 'rgba(56, 189, 248, 0.12)' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>({p.domain})</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleInitialize} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
                Persona Name
              </label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ada"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
                Specialized Domain
              </label>
              <input
                className="input-field"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. AI Security"
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <button type="submit" className="glow-btn" disabled={loadingInit}>
                {loadingInit ? 'Initializing Agent & 1st Cycle...' : '🚀 Initialize Agent (POST /api/agent/init)'}
              </button>
            </div>
          </form>

          {agentId ? (
            <div style={{ marginTop: 20, padding: 16, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: 4 }}>
                ACTIVE AGENT INITIALIZED
              </div>
              <div className="code-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>agentId: {agentId}</span>
                <span className="badge badge-emerald">Running Autonomous Scheduler</span>
              </div>
            </div>
          ) : null}
        </section>

        {/* Feed & Controls Card */}
        <section className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className={`secondary-btn ${activeTab === 'feed' ? 'active' : ''}`}
                style={{
                  background: activeTab === 'feed' ? 'rgba(56, 189, 248, 0.15)' : undefined,
                  borderColor: activeTab === 'feed' ? 'var(--accent-cyan)' : undefined,
                }}
                onClick={() => {
                  setActiveTab('feed')
                  fetchFeed()
                }}
              >
                📰 Published Feed ({feedPosts.length})
              </button>

              <button
                className={`secondary-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
                style={{
                  background: activeTab === 'evaluations' ? 'rgba(168, 85, 247, 0.15)' : undefined,
                  borderColor: activeTab === 'evaluations' ? 'var(--accent-purple)' : undefined,
                }}
                onClick={() => {
                  setActiveTab('evaluations')
                  fetchEvaluations()
                }}
              >
                ⚖️ Editorial Decision Log ({evaluations.length})
              </button>

              <button
                className={`secondary-btn ${activeTab === 'api' ? 'active' : ''}`}
                style={{
                  background: activeTab === 'api' ? 'rgba(16, 185, 129, 0.15)' : undefined,
                  borderColor: activeTab === 'api' ? 'var(--accent-emerald)' : undefined,
                }}
                onClick={() => setActiveTab('api')}
              >
                🔌 API Spec Inspector
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                className="input-field"
                style={{ width: 220, padding: '8px 12px' }}
                value={agentIdInput}
                onChange={(e) => setAgentIdInput(e.target.value)}
                placeholder="Enter agentId"
              />

              <button
                onClick={() => {
                  fetchFeed()
                  fetchEvaluations()
                }}
                className="secondary-btn"
                disabled={loadingFeed}
              >
                {loadingFeed ? 'Loading...' : '🔄 Refresh Feed'}
              </button>

              <button
                onClick={handleTriggerCycle}
                className="secondary-btn"
                style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
                disabled={loadingCycle}
              >
                {loadingCycle ? 'Publishing...' : '⚡ Trigger Cycle Now'}
              </button>
            </div>
          </div>

          {statusMessage ? (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', marginBottom: 20, fontSize: 14 }}>
              {statusMessage}
            </div>
          ) : null}

          {/* TAB 1: FEED */}
          {activeTab === 'feed' && (
            <div>
              {feedPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 16 }}>No posts available in feed yet.</p>
                  <p style={{ fontSize: 14, marginTop: 6 }}>Initialize an agent above or enter a valid agentId to inspect feed.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {feedPosts.map((post, idx) => (
                    <article
                      key={post.id}
                      style={{
                        background: 'rgba(10, 15, 26, 0.6)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 14,
                        padding: 20,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="badge badge-cyan">Post #{feedPosts.length - idx}</span>
                          <span className="code-block" style={{ padding: '2px 8px', fontSize: 11 }}>ID: {post.id}</span>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                          📅 {new Date(post.createdAt).toISOString()}
                        </span>
                      </div>

                      <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16, color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>
                        {post.text}
                      </p>

                      <div style={{ background: 'rgba(56, 189, 248, 0.05)', borderLeft: '3px solid var(--accent-cyan)', padding: 14, borderRadius: '0 10px 10px 0', marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                          🧠 Editorial Publishing Rationale
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {post.rationale}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Sources:</span>
                        {post.sources.map((src, i) => (
                          <a key={i} href={src} target="_blank" rel="noreferrer" className="badge badge-purple">
                            🔗 {src}
                          </a>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVALUATIONS & REJECTIONS LOG */}
          {activeTab === 'evaluations' && (
            <div>
              <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
                Below is the agent&apos;s real-time memory log of evaluated candidate topics, showing intentional topic rejections and domain filtering.
              </div>

              {evaluations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                  No topic evaluation log recorded yet for this agentId.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {evaluations.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: 14,
                        borderRadius: 10,
                        background: item.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(244, 63, 94, 0.06)',
                        border: `1px solid ${item.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className={item.status === 'PUBLISHED' ? 'badge badge-emerald' : 'badge badge-rose'}>
                            {item.status === 'PUBLISHED' ? '✓ PUBLISHED' : '✗ REJECTED'}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{item.title}</span>
                        </div>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                            Link ↗
                          </a>
                        ) : null}
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <strong>Editorial Decision Reason:</strong> {item.reason || 'Evaluated against domain guidelines.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: API SPEC INSPECTOR */}
          {activeTab === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, color: 'var(--accent-cyan)', marginBottom: 8 }}>1. Initialize Agent Endpoint</h3>
                <div className="code-block">
                  POST /api/agent/init<br /><br />
                  Body: &#123; &quot;persona&quot;: &#123; &quot;name&quot;: &quot;Ada&quot;, &quot;domain&quot;: &quot;AI Security&quot; &#125; &#125;<br />
                  Response: &#123; &quot;agentId&quot;: &quot;agent-xxx&quot; &#125;
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 16, color: 'var(--accent-emerald)', marginBottom: 8 }}>2. Retrieve Feed Endpoint</h3>
                <div className="code-block">
                  GET /api/agent/feed?agentId=abc-123<br /><br />
                  Response: &#123;<br />
                  &nbsp;&nbsp;&quot;posts&quot;: [<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&#123;<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;id&quot;: &quot;...&quot;,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;createdAt&quot;: &quot;2026-08-08T10:30:00.000Z&quot;,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;text&quot;: &quot;...&quot;,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;rationale&quot;: &quot;Why this topic was selected...&quot;,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;sources&quot;: [&quot;https://...&quot;]<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br />
                  &nbsp;&nbsp;]<br />
                  &#125;
                </div>
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
