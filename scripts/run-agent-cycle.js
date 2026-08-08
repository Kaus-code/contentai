const { spawnSync } = require('child_process')
const { existsSync } = require('fs')
const path = require('path')

async function main() {
  const agentId = process.argv[2]
  if (!agentId) {
    console.error('Usage: node scripts/run-agent-cycle.js <agentId>')
    process.exit(1)
  }

  // Prefer compiled runner if available
  const compiled = path.join(__dirname, '..', 'dist', 'scripts', 'run-cycle.js')
  if (existsSync(compiled)) {
    console.log('Using compiled runner:', compiled)
    const res = spawnSync(process.execPath, [compiled, agentId], { stdio: 'inherit' })
    process.exit(res.status || 0)
  }

  console.error('Compiled runner not found. Please run `npx tsc -p tsconfig.build.json` to compile first, or run via ts-node.')
  process.exit(2)
}

main()
