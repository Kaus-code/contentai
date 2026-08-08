"use client"
import React, { useEffect, useState } from 'react'

export default function WebhooksPage({ params }: { params: { agentId: string } }) {
  const { agentId } = params
  const [list, setList] = useState<any[]>([])
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    const res = await fetch(`/api/agent/webhooks?agentId=${agentId}`)
    const data = await res.json()
    setList(data.webhooks || [])
  }

  useEffect(() => { load() }, [agentId])

  const add = async () => {
    setStatus('creating')
    const res = await fetch('/api/agent/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, url }) })
    if (res.ok) { setStatus('created'); setUrl(''); load() } else setStatus('error')
  }

  const remove = async (id: string) => {
    await fetch(`/api/agent/webhooks?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <a href="/">← Home</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <a href="/agents">Agents</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <strong>Webhooks</strong>
      </div>

      <h2>Webhooks</h2>
      <div style={{ marginBottom: 12, color: 'var(--text-muted)' }}>Register a callback URL to receive `POST_PUBLISHED` events when this agent publishes a post.</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="input-field" placeholder="https://example.com/webhook" />
        <button className="secondary-btn" onClick={add}>Add</button>
        <span style={{ marginLeft: 8 }}>{status}</span>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {list.map((w) => (
          <div key={w.id} style={{ border: '1px solid var(--border-card)', padding: 10, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{w.url}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Events: {w.events}</div>
            </div>
            <div>
              <button className="secondary-btn" onClick={() => remove(w.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
