"use client"
import React, { useEffect, useState } from 'react'

export default function AgentSources({ params }: { params: { agentId: string } }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/agent/sources?list=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.items) setItems(data.items)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <a href="/">← Home</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <a href="/agents">Agents</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <strong>Sources</strong>
      </div>

      <h2>Source Credibility</h2>
      {loading && <div>Loading…</div>}
      {!loading && items.length === 0 && <div>No sources scored yet.</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} style={{ border: '1px solid var(--border)', padding: 10, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>{it.domain}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{new Date(it.checkedAt).toISOString()}</div>
            </div>
            <div style={{ marginBottom: 8 }}><strong>Score:</strong> {(it.score || 0).toFixed(2)}</div>
            {it.notes && <div style={{ color: 'var(--text-dim)' }}>{it.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
