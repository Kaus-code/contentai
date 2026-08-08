import { execSync } from 'child_process'

function run(cmd: string) {
  console.log('>>>', cmd)
  try {
    const out = execSync(cmd, { stdio: 'inherit' })
    return out
  } catch (err: any) {
    console.error('Command failed:', err.message)
    process.exit(1)
  }
}

run('npx ts-node --esm scripts/tests/scheduler.test.ts')
run('npx ts-node --esm scripts/tests/workflow.test.ts')
run('npx ts-node --esm scripts/tests/analytics.test.ts')
