require('ts-node/register');

(async () => {
  try {
    const mod = require('../lib/discovery')
    const topics = await mod.fetchLiveTechTopics(5)
    console.log(JSON.stringify(topics, null, 2))
  } catch (err) {
    console.error('Error running discovery (CJS bootstrap):', err)
    process.exit(1)
  }
})()
