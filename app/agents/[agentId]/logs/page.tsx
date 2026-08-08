"use client"
import React, { useEffect, useState } from 'react'

export default function AgentLogs({ params }: { params: { agentId: string } }) {
  const { agentId } = params
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/agent/logs?agentId=${agentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.logs) setLogs(data.logs)
      })
      .finally(() => setLoading(false))
  }, [agentId])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <a href="/">← Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/agents">Agents</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <strong>Logs</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="secondary-btn" href={`/agents/${agentId}/settings`}>Settings</a>
          <a className="secondary-btn" href={`/agents/${agentId}/workflow`}>Workflow</a>
        </div>
      </div>

      <h2 style={{ marginBottom: 8 }}>Decision Logs</h2>
      {loading && <div>Loading…</div>}
      {!loading && logs.length === 0 && <div>No logs yet.</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {logs.map((log) => (
          <div key={log.id} style={{ border: '1px solid var(--border)', padding: 10, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>{log.type}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{new Date(log.createdAt).toISOString()}</div>
            </div>
            <div style={{ marginBottom: 8 }}><strong>Outcome:</strong> {log.outcome || '—'}</div>
            <details>
              <summary style={{ cursor: 'pointer' }}>Details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{log.payload}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  )
}
