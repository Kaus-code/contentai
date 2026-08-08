"use client"
import React, { useEffect, useState } from 'react'

export default function PersonaEditor({ params }: { params: { agentId: string } }) {
  const { agentId } = params
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch(`/api/agent/persona?agentId=${agentId}`).then((r) => r.json()).then((d) => {
      setText(d?.persona?.personaConfig ?? '')
    })
  }, [agentId])

  const save = async () => {
    setStatus('saving')
    const res = await fetch('/api/agent/persona', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, personaConfig: text }) })
    if (res.ok) setStatus('saved')
    else setStatus('error')
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <a href="/">← Home</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <a href="/agents">Agents</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <strong>Persona</strong>
      </div>

      <h2>Persona Editor</h2>
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Provide a JSON or text config that guides the agent's voice and style. E.g., voice, tone, prohibited topics, example paragraphs.</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', minHeight: 260, padding: 12, borderRadius: 8, fontFamily: 'var(--font-code)' }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="glow-btn" onClick={save}>Save Persona</button>
        <span style={{ marginLeft: 12 }}>{status}</span>
      </div>
    </div>
  )
}
