// Fallback editorial test that doesn't require external deps.
function validateEditorial(obj) {
  if (obj === null || typeof obj !== 'object') return { valid: false, reason: 'not an object' }
  if (!('selected' in obj)) return { valid: false, reason: 'missing selected' }
  if (!Array.isArray(obj.results)) return { valid: false, reason: 'results not array' }
  for (const r of obj.results) {
    if (typeof r.title !== 'string') return { valid: false, reason: 'title not string' }
    if (typeof r.score !== 'number' || r.score < 0 || r.score > 100) return { valid: false, reason: 'score out of range' }
    if (!(r.decision === 'PUBLISHED' || r.decision === 'REJECTED')) return { valid: false, reason: 'invalid decision' }
    if (typeof r.reason !== 'string') return { valid: false, reason: 'reason not string' }
  }
  const sel = obj.selected
  if (sel !== null && (!Number.isInteger(sel) || sel < 0 || sel >= obj.results.length)) return { valid: false, reason: 'selected out of bounds' }
  return { valid: true }
}

function run() {
  console.log('Running fallback editorial tests...')
  const good = {
    selected: 0,
    results: [
      { title: 'AI for Databases', score: 80, decision: 'PUBLISHED', reason: 'Good fit' },
      { title: 'Cute kittens', score: 10, decision: 'REJECTED', reason: 'Off domain' },
    ],
  }

  const bad = {
    selected: 5,
    results: [
      { title: 'Only one', score: 50, decision: 'REJECTED', reason: 'meh' },
    ],
  }

  const r1 = validateEditorial(good)
  if (!r1.valid) throw new Error('good payload should validate: ' + r1.reason)

  const r2 = validateEditorial(bad)
  if (r2.valid) throw new Error('bad payload should not validate')

  console.log('Fallback editorial tests passed')
}

run()
