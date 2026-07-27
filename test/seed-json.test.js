import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

test('seed.json is valid JSON', () => {
  const raw = readFileSync(join(__dirname, '..', 'data', 'seed.json'), 'utf-8')
  JSON.parse(raw)
})

function test(name, fn) {
  try { fn(); console.log('PASS:', name) } catch (e) { console.error('FAIL:', name, '-', e.message); process.exit(1) }
}
