import validateEditorialResult from '../../lib/editorial'

function assert(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg || 'Assertion failed')
}

function run() {
  console.log('Running editorial validation tests...')

  const good = {
    selected: 0,
    results: [
      { title: 'AI for Databases', score: 8, decision: 'PUBLISHED', reason: 'Good fit' },
      { title: 'Cute kittens', score: 1, decision: 'REJECTED', reason: 'Off domain' },
    ],
  }

  const bad = {
    selected: 5,
    results: [
      { title: 'Only one', score: 5, decision: 'REJECTED', reason: 'meh' },
    ],
  }

  const r1 = validateEditorialResult(good)
  assert(r1.valid === true, 'good payload should validate')

  const r2 = validateEditorialResult(bad)
  assert(r2.valid === false, 'bad payload should not validate')

  console.log('All editorial tests passed')
}

run()
