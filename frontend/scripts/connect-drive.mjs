// Live browser drive: verify onboarding logos + the Gmail connect flow reaches
// Google cleanly (no InvalidGrantError / connect_error on our side).
// Usage: node connect-drive.mjs <outDir> <baseUrl>
import { chromium } from 'playwright'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const OUT = process.argv[2] || '.'
const BASE = process.argv[3] || 'https://life-os-facing.vercel.app'
const FULL_CHROME = join(homedir(), 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe')
const launchOpts = existsSync(FULL_CHROME) ? { executablePath: FULL_CHROME } : {}

const browser = await chromium.launch(launchOpts)
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
let connectorsBody = null
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('response', async (resp) => {
  const u = resp.url()
  if (/\/connectors(\?|$)/.test(u)) {
    try { connectorsBody = await resp.json() } catch {}
    console.log(`  backend: ${resp.status()} /connectors`)
  }
})

console.log(`\n=== 1. Load app onboarding (${BASE}/app) ===`)
await page.goto(BASE + '/app', { waitUntil: 'networkidle' }).catch(() => {})
await page.waitForTimeout(2500)

// Onboarding heading should be present on a fresh visit.
const heading = await page.textContent('h1').catch(() => '')
console.log('  heading:', JSON.stringify((heading || '').trim()))

// Count the brand SVGs we just added (each BrandIcon renders an <svg aria-label=...>).
const marks = await page.$$eval('svg[aria-label]', (els) => els.map((e) => e.getAttribute('aria-label')))
console.log('  brand marks rendered:', JSON.stringify(marks))
await page.screenshot({ path: `${OUT}/drive-onboarding.png` })
console.log(`  -> ${OUT}/drive-onboarding.png`)

if (connectorsBody) {
  const summary = Object.fromEntries(
    Object.entries(connectorsBody).map(([k, v]) => [k, { configured: v.configured, connected: v.connected }])
  )
  console.log('  /connectors:', JSON.stringify(summary))
}

console.log('\n=== 2. Click Gmail connect -> follow to Google ===')
const gmail = page.getByRole('button', { name: /gmail/i }).first()
const exists = await gmail.count()
if (!exists) {
  console.log('  !! Gmail card not found')
} else {
  await gmail.click().catch((e) => console.log('  click err', e.message))
  // full-page redirect: backend /auth/google/login -> 307 -> accounts.google.com
  await page.waitForTimeout(6000)
  const url = page.url()
  console.log('  landed on:', url.slice(0, 90))
  await page.screenshot({ path: `${OUT}/drive-google.png` })
  console.log(`  -> ${OUT}/drive-google.png`)
  if (/accounts\.google\.com/.test(url)) {
    console.log('  RESULT: reaches Google auth cleanly (our redirect + no-PKCE URL are correct)')
  } else if (/connect_error/.test(url)) {
    console.log('  RESULT: BROKEN — bounced back with connect_error:', url)
  } else {
    console.log('  RESULT: unexpected landing:', url)
  }
}

const filtered = errors.filter((e) => !/favicon|net::ERR|ERR_CONNECTION/.test(e))
console.log('\nconsole errors:', filtered.length ? filtered.slice(0, 8) : 'none')
await browser.close()
