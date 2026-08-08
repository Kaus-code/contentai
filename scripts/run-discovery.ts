import { fetchLiveTechTopics } from '../lib/discovery'

async function run() {
  try {
    const topics = await fetchLiveTechTopics(5)
    console.log(JSON.stringify(topics, null, 2))
  } catch (err) {
    console.error('Error running discovery:', err)
    process.exit(1)
  }
}

run()
