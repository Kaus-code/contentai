// Lightweight fallback test for content schema
function validateContent(obj) {
  if (!obj || typeof obj !== 'object') return { valid: false, reason: 'not object' }
  if (typeof obj.text !== 'string' || obj.text.length < 10) return { valid: false, reason: 'text too short' }
  if (typeof obj.rationale !== 'string' || obj.rationale.length < 10) return { valid: false, reason: 'rationale too short' }
  if (!Array.isArray(obj.sources) || obj.sources.length === 0) return { valid: false, reason: 'missing sources' }
  // minimal url check
  if (!/^https?:\/\//.test(obj.sources[0])) return { valid: false, reason: 'source must be a URL' }
  return { valid: true }
}

function run() {
  console.log('Running fallback content tests...')
  const good = {
    text: 'This is a substantial post about systems and implementations.',
    rationale: 'It is timely and technical with actionable guidance.',
    sources: ['https://arxiv.org/abs/1234.5678'],
  }

  const bad = { text: 'short', rationale: 'short', sources: [] }

  const r1 = validateContent(good)
  if (!r1.valid) throw new Error('good content should validate: ' + r1.reason)

  const r2 = validateContent(bad)
  if (r2.valid) throw new Error('bad content should not validate')

  console.log('Fallback content tests passed')
}

run()
