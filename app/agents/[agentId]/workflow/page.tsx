"use client"
import React, { useEffect, useState } from 'react'

export default function AgentWorkflow({ params }: { params: { agentId: string } }) {
  const { agentId } = params
  const [workflows, setWorkflows] = useState<any[]>([])
  const [name, setName] = useState('')
  const [stepType, setStepType] = useState('')
  const [stepOrder, setStepOrder] = useState<number | ''>(1)
  const [stepConfig, setStepConfig] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`/api/agent/workflow?agentId=${agentId}`)
    const json = await res.json()
    if (!json?.error) setWorkflows(json.workflows || [])
    // load steps for each workflow
    if (json?.workflows && Array.isArray(json.workflows)) {
      const withSteps = await Promise.all(
        json.workflows.map(async (wf: any) => {
          const r = await fetch(`/api/agent/workflow/step?workflowId=${wf.id}`)
          const j = await r.json()
          return { ...wf, steps: j.steps || [] }
        })
      )
      setWorkflows(withSteps)
    }
  }

  useEffect(() => {
    load()
  }, [agentId])

  const create = async () => {
    setStatus('creating')
    const payload: any = { agentId, name }
    if (stepType) payload.step = { stepType, stepOrder: Number(stepOrder || 1), config: stepConfig || null }

    const res = await fetch('/api/agent/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (res.ok) {
      setStatus('created')
      setName('')
      setStepType('')
      setStepOrder(1)
      setStepConfig('')
      load()
    } else {
      setStatus(json?.error ?? 'error')
    }
  }

  const addStepToWorkflow = async (workflowId: string, stepType: string, order = 1, config?: string) => {
    const res = await fetch('/api/agent/workflow/step', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workflowId, stepType, stepOrder: order, config }) })
    if (res.ok) load()
  }

  const deleteStep = async (id: string) => {
    const res = await fetch(`/api/agent/workflow/step?id=${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  const updateStep = async (id: string, stepType: string, order: number, config?: string) => {
    const res = await fetch('/api/agent/workflow/step', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, stepType, stepOrder: order, config }) })
    if (res.ok) load()
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <a href="/">← Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/agents">Agents</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <strong>Workflows</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="secondary-btn" href={`/agents/${agentId}/settings`}>Settings</a>
          <a className="secondary-btn" href={`/agents/${agentId}/analytics`}>Analytics</a>
        </div>
      </div>

      <h2 style={{ marginBottom: 8 }}>Agent Workflows</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input className="input-field" placeholder="Workflow name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="glow-btn" onClick={create}>Create Workflow</button>
      </div>

      <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>
        Optionally create a first step alongside the workflow:
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 8, alignItems: 'center', marginBottom: 18 }}>
        <input className="input-field" placeholder="Step type (e.g. discover, editorial, publish)" value={stepType} onChange={(e) => setStepType(e.target.value)} />
        <input className="input-field" placeholder="Order" type="number" value={stepOrder} onChange={(e) => setStepOrder(Number(e.target.value))} />
        <input className="input-field" placeholder="Step config (json)" value={stepConfig} onChange={(e) => setStepConfig(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workflows.map((w) => (
          <div key={w.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{w.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Steps: {w.steps?.length ?? 0}</div>
              </div>
              <div>
                <a className="secondary-btn" href="#" onClick={(e) => { e.preventDefault(); }}>Edit</a>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="input-field" placeholder="Step type" id={`new-step-type-${w.id}`} />
                <input className="input-field" placeholder="Order" id={`new-step-order-${w.id}`} style={{ width: 100 }} />
                <input className="input-field" placeholder="Config (json)" id={`new-step-config-${w.id}`} />
                <button className="secondary-btn" onClick={async () => {
                  const typeEl = document.getElementById(`new-step-type-${w.id}`) as HTMLInputElement
                  const orderEl = document.getElementById(`new-step-order-${w.id}`) as HTMLInputElement
                  const configEl = document.getElementById(`new-step-config-${w.id}`) as HTMLInputElement
                  await addStepToWorkflow(w.id, typeEl.value, Number(orderEl.value || 1), configEl.value || undefined)
                  typeEl.value=''; orderEl.value='1'; configEl.value=''
                }}>Add Step</button>
              </div>

              {w.steps && w.steps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {w.steps.map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input className="input-field" defaultValue={s.stepType} id={`step-type-${s.id}`} style={{ width: 220 }} />
                      <input className="input-field" defaultValue={String(s.stepOrder)} id={`step-order-${s.id}`} style={{ width: 80 }} />
                      <input className="input-field" defaultValue={s.config || ''} id={`step-config-${s.id}`} />
                      <button className="secondary-btn" onClick={async () => {
                        const t = (document.getElementById(`step-type-${s.id}`) as HTMLInputElement).value
                        const o = Number((document.getElementById(`step-order-${s.id}`) as HTMLInputElement).value || 1)
                        const c = (document.getElementById(`step-config-${s.id}`) as HTMLInputElement).value || undefined
                        await updateStep(s.id, t, o, c)
                      }}>Save</button>
                      <button className="secondary-btn" onClick={async () => { await deleteStep(s.id) }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
