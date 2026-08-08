import '../lib/prisma'
import { runExperimentPromotionAll } from '../lib/experimentRunner'

;(async () => {
  try {
    console.log('Running experiment promotions...')
    await runExperimentPromotionAll()
    console.log('Done')
    process.exit(0)
  } catch (e) {
    console.error('Error running experiments', e)
    process.exit(1)
  }
})()
