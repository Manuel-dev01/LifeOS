// Responsive check: load landing + app at several widths, assert NO horizontal
// overflow (page body must not scroll sideways), and exercise the mobile drawer.
// Usage: node verify-responsive.mjs <out> <base>
import { chromium } from 'playwright'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const OUT = process.argv[2] || '.'
const BASE = process.argv[3] || 'http://localhost:4173'
const FULL = join(homedir(), 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe')
const browser = await chromium.launch(existsSync(FULL) ? { executablePath: FULL } : {})

const WIDTHS = [
  { w: 390, h: 844, name: 'mobile' },
  { w: 768, h: 1024, name: 'tablet' },
  { w: 1440, h: 900, name: 'desktop' },
]
const ROUTES = ['/', '/app']
let failed = false

for (const route of ROUTES) {
  for (const vp of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForTimeout(1500)
    // dismiss the onboarding overlay on /app so we measure the real views
    if (route === '/app') {
      const skip = page.getByText('Skip', { exact: false })
      if (await skip.count()) await skip.first().click().catch(() => {})
      await page.waitForTimeout(600)
    }
    const overflow = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    }))
    const over = overflow.docW - overflow.winW
    const bad = over > 2 // allow 2px rounding
    if (bad) failed = true
    console.log(`${route} @ ${vp.name} (${vp.w}px): docW=${overflow.docW} winW=${overflow.winW} ${bad ? `XX OVERFLOW +${over}px` : 'OK'}${errs.length ? ' [pageerror]' : ''}`)
    if (route === '/app' && vp.name === 'mobile') {
      // hamburger should exist, sidebar hidden; open drawer and screenshot
      const burger = page.getByRole('button', { name: /open menu/i })
      const hasBurger = await burger.count()
      console.log(`   mobile top bar hamburger present: ${!!hasBurger}`)
      if (hasBurger) {
        await burger.first().click()
        await page.waitForTimeout(500)
        await page.screenshot({ path: `${OUT}/resp-app-mobile-drawer.png` })
      }
      await page.screenshot({ path: `${OUT}/resp-app-mobile.png` })
    }
    await page.close()
  }
}
await browser.close()
console.log(failed ? '\nRESULT: horizontal overflow found' : '\nRESULT: no horizontal overflow at any width')
process.exit(failed ? 1 : 0)
