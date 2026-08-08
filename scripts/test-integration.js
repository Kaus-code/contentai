const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000'

async function fail(message) {
  console.error('ERROR:', message)
  process.exit(1)
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function validateIsoDate(value) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && value === date.toISOString()
}

async function run() {
  console.log(`Testing server at ${SERVER_URL}`)

  const initResponse = await fetch(`${SERVER_URL}/api/agent/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona: { name: 'Ada', domain: 'AI Security' } }),
  })

  if (initResponse.status !== 201) {
    const body = await initResponse.text()
    return fail(`Expected 201 from /api/agent/init, got ${initResponse.status}: ${body}`)
  }

  const initBody = await initResponse.json()
  const agentId = initBody.agentId
  if (!agentId || typeof agentId !== 'string') {
    return fail(`Invalid response from /api/agent/init: ${JSON.stringify(initBody)}`)
  }

  console.log(`Created agent ${agentId}`)

  const deadline = Date.now() + 60_000
  let feedBody
  while (Date.now() < deadline) {
    const feedResponse = await fetch(`${SERVER_URL}/api/agent/feed?agentId=${encodeURIComponent(agentId)}`)
    if (feedResponse.status !== 200) {
      const text = await feedResponse.text()
      return fail(`/api/agent/feed returned ${feedResponse.status}: ${text}`)
    }

    feedBody = await feedResponse.json()
    if (Array.isArray(feedBody.posts) && feedBody.posts.length > 0) {
      break
    }

    console.log('Waiting for feed to populate...')
    await wait(3000)
  }

  if (!feedBody || !Array.isArray(feedBody.posts) || feedBody.posts.length === 0) {
    return fail('No posts were generated after 60 seconds. Check OPENAI_API_KEY and server logs.')
  }

  const post = feedBody.posts[0]
  if (!post.id || typeof post.id !== 'string') return fail('Post id is missing or invalid')
  if (!post.text || typeof post.text !== 'string') return fail('Post text is missing or invalid')
  if (!post.rationale || typeof post.rationale !== 'string') return fail('Post rationale is missing or invalid')
  if (!Array.isArray(post.sources)) return fail('Post sources is missing or invalid')
  if (!validateIsoDate(post.createdAt)) return fail(`Post createdAt is not valid ISO timestamp: ${post.createdAt}`)

  console.log('Integration test passed.')
  console.log(JSON.stringify({ agentId, post }, null, 2))
}

run().catch((err) => {
  console.error('Integration test failed:', err)
  process.exit(1)
})
