// Verify: landing nav/footer links scroll, app identity is dynamic (no "Alex
// Morgan"), suggestions are data-agnostic. Usage: node verify-fixes.mjs <out> <base>
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

console.log(`\n=== LANDING (${BASE}/) ===`)
await page.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {})
await page.waitForTimeout(2000)
const ids = await page.$$eval('section[id]', (els) => els.map((e) => e.id))
console.log('  section anchors:', JSON.stringify(ids))
// click nav "Memory Graph" and confirm the page scrolls
const before = await page.evaluate(() => window.scrollY)
const navBtn = page.getByRole('button', { name: 'Memory Graph' }).first()
if (await navBtn.count()) {
  await navBtn.click()
  await page.waitForTimeout(1200)
  const after = await page.evaluate(() => window.scrollY)
  console.log(`  nav "Memory Graph" scroll: ${before} -> ${after}  ${after > before ? 'OK (scrolled)' : 'XX (no scroll)'}`)
} else console.log('  !! nav button not found')
await page.screenshot({ path: `${OUT}/fixes-landing.png` })

console.log(`\n=== APP (${BASE}/app) ===`)
await page.goto(BASE + '/app', { waitUntil: 'networkidle' }).catch(() => {})
await page.waitForTimeout(2500)
const body = await page.evaluate(() => document.body.innerText)
console.log('  contains "Alex Morgan":', /Alex Morgan/.test(body), '(want false)')
console.log('  contains "My vault":', /My vault/.test(body), '(want true)')
console.log('  old demo suggestion present:', /final agreed marketing budget/.test(body), '(want false)')
console.log('  new suggestion present:', /follow up on this week|most recent conversations|talking to the most/.test(body), '(want true)')
await page.screenshot({ path: `${OUT}/fixes-app.png` })

const filtered = errors.filter((e) => !/favicon|net::ERR|ERR_CONNECTION/.test(e))
console.log('\nconsole errors:', filtered.length ? filtered.slice(0, 6) : 'none')
await browser.close()
