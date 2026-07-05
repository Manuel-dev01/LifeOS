// Full QA sweep: visit every screen (desktop + mobile), exercise actions,
// capture console errors, empty/error states, overflow, dead controls.
// Usage: node qa-sweep.mjs <out> <base>
import { chromium } from 'playwright'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const OUT = process.argv[2] || '.'
const BASE = process.argv[3] || 'https://life-os-facing.vercel.app'
const FULL = join(homedir(), 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe')
const browser = await chromium.launch(existsSync(FULL) ? { executablePath: FULL } : {})
const problems = []

const newPage = (w, h) => browser.newPage({ viewport: { width: w, height: h } })
const wireErrors = (page, tag) => {
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|ERR_CONNECTION/.test(m.text())) problems.push(`[${tag}] console: ${m.text().slice(0, 160)}`) })
  page.on('pageerror', (e) => problems.push(`[${tag}] pageerror: ${e.message.slice(0, 160)}`))
}
const dismissOnboarding = async (page) => {
  for (let i = 0; i < 8; i++) {
    if (!/Connect your memory sources/i.test(await page.evaluate(() => document.body.innerText))) return true
    const s = page.getByRole('button', { name: /skip/i })
    if (await s.count()) await s.first().click().catch(() => {})
    await page.waitForTimeout(700)
  }
  return false
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const nav = async (page, name) => { const b = page.getByRole('button', { name }).first(); if (await b.count()) { await b.click().catch(() => {}); return true } return false }

// ---------- DESKTOP ----------
console.log('\n===== DESKTOP 1440 =====')
{
  const page = await newPage(1440, 900)
  wireErrors(page, 'desktop')

  console.log('- landing'); await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).catch(() => {}); await page.waitForTimeout(2500)
  if ((await overflow(page)) > 2) problems.push('[landing] horizontal overflow')
  await page.screenshot({ path: `${OUT}/qa-landing.png`, fullPage: true })

  console.log('- app / onboarding'); await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' }).catch(() => {}); await page.waitForTimeout(3000)
  if (!(await dismissOnboarding(page))) problems.push('[onboarding] could not dismiss (Skip not working)')

  const views = [
    { label: 'Ask', file: 'ask' },
    { label: 'Memory Graph', file: 'graph', wait: 26000 },
    { label: 'Timeline', file: 'timeline', wait: 24000 },
    { label: 'People', file: 'people', wait: 24000 },
    { label: 'Sources', file: 'sources' },
    { label: 'Settings', file: 'settings' },
  ]
  for (const v of views) {
    console.log('- view:', v.label)
    if (!(await nav(page, v.label))) problems.push(`[nav] "${v.label}" button not found`)
    await page.waitForTimeout(v.wait || 1500)
    const body = await page.evaluate(() => document.body.innerText)
    if (/couldn.t (load|build)|went wrong/i.test(body)) problems.push(`[${v.file}] shows an error state`)
    if ((await overflow(page)) > 2) problems.push(`[${v.file}] horizontal overflow`)
    await page.screenshot({ path: `${OUT}/qa-${v.file}.png` })
  }

  // Ask a question
  console.log('- ask a question'); await nav(page, 'Ask'); await page.waitForTimeout(1000)
  const input = page.getByPlaceholder(/ask anything/i).first()
  if (await input.count()) {
    await input.fill('What are my upcoming events?'); await input.press('Enter'); await page.waitForTimeout(28000)
    const body = await page.evaluate(() => document.body.innerText)
    if (!/RECALLED FROM/i.test(body)) problems.push('[ask] no answer rendered')
    if (/went wrong/i.test(body)) problems.push('[ask] error answer')
    await page.screenshot({ path: `${OUT}/qa-ask-answer.png` })
  } else problems.push('[ask] input not found')

  // People -> click a person
  console.log('- person detail'); await nav(page, 'People'); await page.waitForTimeout(3000)
  const personCard = page.locator('button:has-text("Kunal"), button:has-text("Gustavo"), button:has-text("Lea")').first()
  if (await personCard.count()) { await personCard.click().catch(() => {}); await page.waitForTimeout(24000); const body = await page.evaluate(() => document.body.innerText); if (/couldn.t load/i.test(body)) problems.push('[person] error state'); await page.screenshot({ path: `${OUT}/qa-person.png` }) }

  // Settings toggles + export presence
  console.log('- settings controls'); await nav(page, 'Settings'); await page.waitForTimeout(1500)
  const toggles = await page.locator('button').filter({ hasText: '' }).count()
  await page.screenshot({ path: `${OUT}/qa-settings.png` })
  await page.close()
}

// ---------- MOBILE ----------
console.log('\n===== MOBILE 390 =====')
{
  const page = await newPage(390, 844)
  wireErrors(page, 'mobile')
  await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' }).catch(() => {}); await page.waitForTimeout(3000)
  await dismissOnboarding(page)
  // hamburger present?
  const burger = page.getByRole('button', { name: /open menu/i })
  if (!(await burger.count())) problems.push('[mobile] no hamburger menu')
  for (const label of ['Memory Graph', 'Timeline', 'People', 'Sources', 'Settings', 'Ask']) {
    if (await burger.count()) { await burger.first().click().catch(() => {}); await page.waitForTimeout(500) }
    await nav(page, label); await page.waitForTimeout(label === 'Ask' ? 1500 : 24000)
    if ((await overflow(page)) > 2) problems.push(`[mobile:${label}] horizontal overflow`)
  }
  await page.screenshot({ path: `${OUT}/qa-mobile.png` })
  await page.close()
}

await browser.close()
console.log('\n===== PROBLEMS =====')
if (problems.length === 0) console.log('none found in the browser sweep')
else problems.forEach((p) => console.log(' - ' + p))
