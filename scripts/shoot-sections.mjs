// Screenshots of named home sections after scroll-triggered motion settles.
// Usage: node scripts/shoot-sections.mjs   (expects `npm run preview` on :4181)
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4181';
const OUT = '.shots/v3';
mkdirSync(OUT, { recursive: true });

function findBrowser() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { if (existsSync(chromium.executablePath())) return undefined; } catch {}
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  for (const d of readdirSync(cache).filter((x) => x.startsWith('chromium_headless_shell-')).sort().reverse()) {
    const exe = path.join(cache, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

const sections = ['.home-hero', '.infra', '.pipeline', '.bento-section', '.stack-section', '.finder', '.closing'];
const browser = await chromium.launch({ executablePath: findBrowser() });
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  // Walk the page so every scroll trigger fires, then let animations finish.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 300) { await page.mouse.wheel(0, 300); await page.waitForTimeout(120); }
  await page.waitForTimeout(4500);
  for (const selector of sections) {
    const el = page.locator(selector).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await el.screenshot({ path: `${OUT}/${width}-${selector.slice(1)}.png` });
  }
  await page.close();
}
await browser.close();
console.log(`saved to ${OUT}`);
