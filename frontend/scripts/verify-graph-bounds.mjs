// Verify Memory Graph nodes stay within their container. Usage: node ... <out> <base>
import { chromium } from 'playwright'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const OUT = process.argv[2] || '.'
const BASE = process.argv[3] || 'https://life-os-facing.vercel.app'
const FULL = join(homedir(), 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe')
const browser = await chromium.launch(existsSync(FULL) ? { executablePath: FULL } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' }).catch(() => {})
await page.waitForTimeout(4000)
// dismiss onboarding until its heading is gone
for (let i = 0; i < 8; i++) {
  const gone = !/Connect your memory sources/i.test(await page.evaluate(() => document.body.innerText))
  if (gone) break
  const s = page.getByRole('button', { name: /skip/i })
  if (await s.count()) await s.first().click().catch(() => {})
  await page.waitForTimeout(700)
}
console.log('onboarding gone:', !/Connect your memory sources/i.test(await page.evaluate(() => document.body.innerText)))

await page.getByRole('button', { name: 'Memory Graph' }).first().click().catch(() => {})
await page.waitForTimeout(30000) // build graph (~24s) + settle

const res = await page.evaluate(() => {
  // the graph is the LARGEST svg on the page (not a nav/logo icon)
  const svgs = [...document.querySelectorAll('svg')]
  let svg = null, maxA = 0
  for (const s of svgs) { const b = s.getBoundingClientRect(); const a = b.width * b.height; if (a > maxA) { maxA = a; svg = s } }
  if (!svg) return { ok: false, reason: 'no svg' }
  const box = svg.getBoundingClientRect()
  const circles = [...svg.querySelectorAll('circle')]
  let outside = 0
  for (const c of circles) {
    const r = c.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    if (cx < box.left - 2 || cx > box.right + 2 || cy < box.top - 2 || cy > box.bottom + 2) outside++
  }
  return { ok: true, nodes: circles.length, outside, box: { w: Math.round(box.width), h: Math.round(box.height) } }
})
console.log('graph bounds check:', JSON.stringify(res))
console.log(res.ok && res.outside === 0 ? 'PASS — all nodes inside the container' : `FAIL — ${res.outside} node(s) outside`)
await page.screenshot({ path: `${OUT}/graph-bounds.png` })
await browser.close()
