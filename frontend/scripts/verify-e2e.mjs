// End-to-end drive: ask a real question, then open People/Timeline/Graph and
// confirm each populates with real data. Usage: node verify-e2e.mjs <out> <base>
import { chromium } from 'playwright'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const OUT = process.argv[2] || '.'
const BASE = process.argv[3] || 'https://life-os-facing.vercel.app'
const FULL = join(homedir(), 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe')
const browser = await chromium.launch(existsSync(FULL) ? { executablePath: FULL } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('response', (r) => {
  if (/\/(query|people|timeline|graph|datasets)\b/.test(r.url())) console.log(`  ${r.status()} ${r.url().replace(/https?:\/\/[^/]+/, '')}`)
})

const go = async (label) => {
  const btn = page.getByRole('button', { name: label }).first()
  if (await btn.count()) { await btn.click(); }
}

console.log(`\n=== load ${BASE}/app ===`)
await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' }).catch(() => {})
await page.waitForTimeout(2500)
// robustly dismiss onboarding overlay
for (let i = 0; i < 3; i++) {
  const skip = page.getByRole('button', { name: /skip/i })
  if (await skip.count()) { await skip.first().click().catch(() => {}); await page.waitForTimeout(800) }
}
const stillOnboarding = /Connect your memory sources/i.test(await page.evaluate(() => document.body.innerText))
console.log('  onboarding dismissed:', !stillOnboarding)
await page.waitForTimeout(500)

console.log('\n=== ASK a real question ===')
const input = page.getByPlaceholder(/ask anything/i).first()
if (await input.count()) {
  await input.fill('What have I been working on recently?')
  await input.press('Enter')
  await page.waitForTimeout(30000) // recall ~15-25s
  const body = await page.evaluate(() => document.body.innerText)
  const errored = /something went wrong/i.test(body)
  const recalled = /RECALLED FROM/i.test(body)
  console.log('  answer rendered:', recalled, '| error message:', errored)
  await page.screenshot({ path: `${OUT}/e2e-ask.png` })
}

for (const [label, file] of [['People', 'people'], ['Timeline', 'timeline'], ['Memory Graph', 'graph']]) {
  console.log(`\n=== open ${label} ===`)
  await go(label)
  await page.waitForTimeout(label === 'People' ? 6000 : 28000) // insights ~22s cold
  const body = await page.evaluate(() => document.body.innerText)
  const empty = /No (people|dated memories|connections)/i.test(body)
  const err = /couldn.t (load|build)/i.test(body)
  console.log(`  ${label}: empty=${empty} error=${err}`)
  await page.screenshot({ path: `${OUT}/e2e-${file}.png` })
}

const filtered = errors.filter((e) => !/favicon|net::ERR|ERR_CONNECTION/.test(e))
console.log('\nconsole errors:', filtered.length ? filtered.slice(0, 6) : 'none')
await browser.close()
