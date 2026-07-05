// Visual verification: load the landing + app, capture console errors, screenshot.
// Usage: node scripts/verify.mjs [outDir]
import { chromium } from 'playwright'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const OUT = process.argv[2] || '.'
const BASE = process.argv[3] || 'http://localhost:5173'

// Prefer the full chromium build if the headless-shell download was incomplete.
const FULL_CHROME = join(
  homedir(),
  'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
)
const launchOpts = existsSync(FULL_CHROME) ? { executablePath: FULL_CHROME } : {}

const routes = [
  { path: '/', name: 'landing', waitMs: 2500 },
  { path: '/app', name: 'app', waitMs: 2000 },
]

const browser = await chromium.launch(launchOpts)
let failed = false

for (const r of routes) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('response', (resp) => {
    const u = resp.url()
    if (/railway\.app|onrender\.com|localhost:8000/.test(u)) {
      console.log(`  backend: ${resp.status()} ${u.replace(/https?:\/\/[^/]+/, '')}`)
    }
  })

  await page.goto(BASE + r.path, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(r.waitMs)
  const shot = `${OUT}/verify-${r.name}.png`
  await page.screenshot({ path: shot, fullPage: r.name === 'landing' })

  const filtered = errors.filter((e) => !/favicon|ERR_CONNECTION_REFUSED.*8000|net::ERR/.test(e))
  console.log(`\n[${r.name}] ${BASE}${r.path}  ->  ${shot}`)
  if (filtered.length) {
    failed = true
    console.log(`  console errors (${filtered.length}):`)
    filtered.slice(0, 10).forEach((e) => console.log('   - ' + e.slice(0, 200)))
  } else {
    console.log('  no console errors')
  }
  await page.close()
}

await browser.close()
console.log(failed ? '\nRESULT: errors found' : '\nRESULT: clean')
process.exit(failed ? 1 : 0)
