"use client"
import React, { useEffect, useState } from 'react'

export default function AgentSettings({ params }: { params: { agentId: string } }) {
  const { agentId } = params
  const [interval, setInterval] = useState<number | null>(15)
  const [paused, setPaused] = useState<boolean>(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/agent/schedule?agentId=${agentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setInterval(data.scheduleIntervalMinutes ?? 15)
          setPaused(!!data.schedulePaused)
        }
      })
  }, [agentId])

  const save = async () => {
    setStatus('saving')
    const res = await fetch('/api/agent/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, intervalMinutes: interval, paused }) })
    const json = await res.json()
    if (res.ok) setStatus('saved')
    else setStatus(json?.error ?? 'error')
  }
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <a href="/">← Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/agents">Agents</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <strong>Settings</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="secondary-btn" href={`/agents/${agentId}/workflow`}>Workflow</a>
          <a className="secondary-btn" href={`/agents/${agentId}/analytics`}>Analytics</a>
        </div>
      </div>

      <h2 style={{ marginBottom: 8 }}>Agent Settings</h2>
      <div>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Publish Interval (minutes)</label>
        <div style={{ maxWidth: 220 }}>
          <input className="input-field" type="number" value={interval ?? 15} onChange={(e) => setInterval(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 6px', fontWeight: 500 }}>Pause Scheduler</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>When paused, automatic cycles will not run.</span>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={save} className="glow-btn">Save Settings</button>
        {status && <span style={{ marginLeft: 8 }}>{status}</span>}
      </div>
    </div>
  )
}
