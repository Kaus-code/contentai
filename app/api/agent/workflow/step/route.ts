import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createWorkflowStep, listWorkflowSteps, updateWorkflowStep, deleteWorkflowStep } from '../../../../../../lib/db'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const workflowId = url.searchParams.get('workflowId')
    if (!workflowId) return NextResponse.json({ error: 'workflowId is required' }, { status: 400 })

    const steps = await listWorkflowSteps(workflowId)
    return NextResponse.json({ steps }, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/agent/workflow/step error', err)
    return NextResponse.json({ steps: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { workflowId, stepOrder = 1, stepType, config } = body
    if (!workflowId || !stepType) return NextResponse.json({ error: 'workflowId and stepType are required' }, { status: 400 })

    const step = await createWorkflowStep({ workflowId, stepOrder: Number(stepOrder), stepType, config })
    return NextResponse.json({ step }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/agent/workflow/step error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, stepOrder, stepType, config } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const step = await updateWorkflowStep(id, { stepOrder: stepOrder ? Number(stepOrder) : undefined, stepType, config })
    return NextResponse.json({ step }, { status: 200 })
  } catch (err: any) {
    console.error('PUT /api/agent/workflow/step error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await deleteWorkflowStep(id)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    console.error('DELETE /api/agent/workflow/step error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
