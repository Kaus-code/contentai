(async () => {
  try {
    const base = 'http://localhost:3000'
    const persona = { persona: { name: 'SmokeAgent', domain: 'AI' } }

    console.log('Creating agent...')
    const initRes = await fetch(`${base}/api/agent/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(persona),
    })
    const initJson = await initRes.json()
    console.log('INIT', initRes.status, JSON.stringify(initJson))

    const agentId = initJson?.agentId
    if (!agentId) {
      console.error('No agentId returned; aborting smoke tests.')
      process.exit(1)
    }

    const apis = ['schedule', 'workflow', 'analytics']
    for (const api of apis) {
      const res = await fetch(`${base}/api/agent/${api}?agentId=${agentId}`)
      const text = await res.text()
      console.log(`API /api/agent/${api} ->`, res.status, text)
    }

    const pages = ['settings', 'workflow', 'analytics']
    for (const p of pages) {
      const res = await fetch(`${base}/agents/${agentId}/${p}`)
      console.log(`PAGE /agents/${agentId}/${p} ->`, res.status)
    }

    console.log('Smoke tests completed successfully.')
    process.exit(0)
  } catch (err) {
    console.error('Smoke test failed:', err)
    process.exit(2)
  }
})()
