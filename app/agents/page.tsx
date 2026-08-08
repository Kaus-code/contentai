"use client"
import React, { useEffect, useState } from 'react'

export default function AgentsIndex() {
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/agent/list').then((r) => r.json()).then((d) => setAgents(d.agents || []))
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <a href="/">← Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <strong>Agents</strong>
        </div>
      </div>

      <div className="agents-list">
        {agents.map((a) => (
          <a key={a.id} href={`/agents/${a.id}/settings`} className="glass-card agent-card" style={{ display: 'block' }}>
            <div style={{ fontWeight: 700 }}>{a.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{a.domain}</div>
            <div style={{ marginTop: 8 }} className="code-block">{a.id}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
