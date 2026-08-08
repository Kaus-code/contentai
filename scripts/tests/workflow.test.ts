import { createAgent, createWorkflow, createWorkflowStep, listWorkflowsByAgent } from '../../lib/db'

async function main() {
  const agent = await createAgent({ name: 'TestWorkflow', domain: 'Testing' })
  const wf = await createWorkflow({ agentId: agent.id, name: 'CI Workflow' })
  await createWorkflowStep({ workflowId: wf.id, stepOrder: 1, stepType: 'discover', config: '{}' })
  await createWorkflowStep({ workflowId: wf.id, stepOrder: 2, stepType: 'editorial', config: '{}' })
  const list = await listWorkflowsByAgent(agent.id)
  if (!list || list.length === 0) throw new Error('Workflow test failed: no workflows found')
  const found = list.find((x) => x.id === wf.id)
  if (!found || !found.steps || found.steps.length < 2) throw new Error('Workflow test failed: steps missing')
  console.log('workflow.test: OK')
}

main().catch((err) => { console.error(err); process.exit(1) })
