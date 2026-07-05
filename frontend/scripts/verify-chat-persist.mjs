// Verify the chat survives switching tabs. Usage: node verify-chat-persist.mjs <out> <base>
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
page.on('pageerror', (e) => errors.push(e.message))

const click = async (name) => {
  const b = page.getByRole('button', { name }).first()
  if (await b.count()) await b.click().catch(() => {})
}

await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' }).catch(() => {})
await page.waitForTimeout(2500)
for (let i = 0; i < 3; i++) { const s = page.getByRole('button', { name: /skip/i }); if (await s.count()) { await s.first().click().catch(() => {}); await page.waitForTimeout(600) } }

const Q = 'What externships did I apply to?'
console.log('1) ask a question')
const input = page.getByPlaceholder(/ask anything/i).first()
await input.fill(Q)
await input.press('Enter')
await page.waitForTimeout(28000)
let body = await page.evaluate(() => document.body.innerText)
const askedOk = body.includes(Q) && /RECALLED FROM/i.test(body)
console.log('   question + answer present:', askedOk)

console.log('2) switch to Sources, then People')
await click('Sources'); await page.waitForTimeout(1500)
await click('People'); await page.waitForTimeout(2000)

console.log('3) back to Ask')
await click('Ask'); await page.waitForTimeout(1500)
body = await page.evaluate(() => document.body.innerText)
const stillThere = body.includes(Q) && /RECALLED FROM/i.test(body)
console.log('   conversation still present after tab switches:', stillThere)
await page.screenshot({ path: `${OUT}/chat-persist.png` })

console.log('\nRESULT:', askedOk && stillThere ? 'PASS — chat persists' : 'FAIL')
console.log('pageerrors:', errors.length ? errors.slice(0, 4) : 'none')
await browser.close()
