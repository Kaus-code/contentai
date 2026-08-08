// Register ts-node to allow requiring TypeScript files from Node
// Register tsconfig-paths first so TS path aliases like @/lib/* resolve correctly
try { require('tsconfig-paths').register() } catch (e) { /* optional */ }
// Then register ts-node to allow requiring TypeScript files from Node
require('ts-node').register({ transpileOnly: true, skipProject: false, transpilerOptions: { compilerOptions: { module: 'CommonJS' } } })
// Execute the TypeScript runner
require('./run-cycle.ts')
