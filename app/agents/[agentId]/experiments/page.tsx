'use client'
import React, { useEffect, useState } from 'react'

export default function ExperimentsPage({ params }: { params: { agentId: string } }) {
  const { agentId } = params
  const [postId, setPostId] = useState('')
  const [metrics, setMetrics] = useState<any[]>([])
  const [msg, setMsg] = useState('')

  async function fetchMetrics() {
    if (!postId) return
    const res = await fetch(`/api/agent/experiments?postId=${encodeURIComponent(postId)}`)
    const j = await res.json()
    setMetrics(j.metrics || [])
  }

  async function runPromotion() {
    if (!postId) return setMsg('postId required')
    setMsg('running...')
    const res = await fetch('/api/agent/experiments/run', { method: 'POST', body: JSON.stringify({ postId }) })
    const j = await res.json()
    setMsg(JSON.stringify(j))
    fetchMetrics()
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Experiments</h2>
      <div>
        <label>Post ID: </label>
        <input value={postId} onChange={(e) => setPostId(e.target.value)} />
        <button onClick={fetchMetrics}>Fetch Metrics</button>
        <button onClick={runPromotion}>Run Promotion</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Metrics:</strong>
        <pre>{JSON.stringify(metrics, null, 2)}</pre>
      </div>
      <div>
        <strong>Result:</strong>
        <pre>{msg}</pre>
      </div>
    </div>
  )
}
