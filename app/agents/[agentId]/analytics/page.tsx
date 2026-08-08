"use client"
import React, { useEffect, useState } from 'react'

export default function AgentAnalytics({ params }: { params: { agentId: string } }) {
  const { agentId } = params
  const [data, setData] = useState<any | null>(null)
  const [simStatus, setSimStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/agent/analytics?agentId=${agentId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
  }, [agentId])

  if (!data) return <div style={{ padding: 16 }}>Loading analytics...</div>

  const simulate = async () => {
    if (!data.posts || data.posts.length === 0) return
    setSimStatus('simulating')
    const postId = data.posts[0].id
    const impressions = Math.floor(Math.random() * 500) + 10
    const clicks = Math.floor(impressions * (Math.random() * 0.2))
    const res = await fetch('/api/agent/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, impressions, clicks }) })
    if (res.ok) {
      setSimStatus('ok')
      // refresh
      const refreshed = await fetch(`/api/agent/analytics?agentId=${agentId}`).then((r) => r.json())
      setData(refreshed)
    } else {
      setSimStatus('error')
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <a href="/">← Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/agents">Agents</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <strong>Analytics</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="secondary-btn" href={`/agents/${agentId}/settings`}>Settings</a>
          <a className="secondary-btn" href={`/agents/${agentId}/workflow`}>Workflow</a>
        </div>
      </div>

      <h2 style={{ marginBottom: 8 }}>Agent Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="glass-card">
          <div>Posts: {data.postsCount}</div>
          <div>Metrics records: {data.metricsCount}</div>
          <div>Total impressions: {data.totalImpressions}</div>
          <div>Total clicks: {data.totalClicks}</div>
        </div>

        <div className="glass-card">
          <div style={{ marginBottom: 8 }}>Simulate metrics for recent post</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{data.posts?.[0]?.id ?? 'No posts'}</div>
          <button className="glow-btn" onClick={simulate} disabled={!data.posts || data.posts.length === 0}>{simStatus === 'simulating' ? 'Simulating...' : 'Simulate'}</button>
          {simStatus && <div style={{ marginTop: 8 }}>{simStatus}</div>}
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: 8 }}>Recent Posts</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.posts.map((p: any) => (
            <div key={p.id} className="glass-card">
              <div style={{ fontWeight: 700 }}>{p.text.slice(0, 120)}{p.text.length > 120 ? '…' : ''}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>id: {p.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
