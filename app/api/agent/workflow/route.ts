import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createWorkflow, listWorkflowsByAgent, createWorkflowStep } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    if (!agentId) return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 })

    const workflows = await listWorkflowsByAgent(agentId)
    return NextResponse.json({ workflows }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/workflow error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { agentId, name, step } = body
    if (!agentId || !name) return NextResponse.json({ error: 'agentId and name are required' }, { status: 400 })

    const wf = await createWorkflow({ agentId, name })

    if (step && step.stepType) {
      await createWorkflowStep({ workflowId: wf.id, stepOrder: step.stepOrder ?? 1, stepType: step.stepType, config: step.config ?? null })
    }

    return NextResponse.json({ workflow: wf }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/agent/workflow error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
