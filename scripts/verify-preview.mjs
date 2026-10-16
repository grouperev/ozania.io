// Checks exports/ozania-io-preview.html opened through file://.
// Usage: node scripts/export-preview.mjs && node scripts/verify-preview.mjs
import { existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const file = path.resolve('exports/ozania-io-preview.html');
if (!existsSync(file)) { console.error('FAIL exports/ozania-io-preview.html introuvable (npm run export:preview)'); process.exit(1); }
const url = pathToFileURL(file).href;

async function launchChromium() {
  if (process.env.CHROMIUM_PATH) return chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  try { return await chromium.launch(); } catch (error) {
    const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
    const names = existsSync(cache) ? readdirSync(cache).filter((n) => n.startsWith('chromium')).sort().reverse() : [];
    for (const name of names) {
      for (const sub of ['chrome-headless-shell-mac-arm64/chrome-headless-shell', 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-linux/chrome', 'chrome-linux64/chrome']) {
        const executablePath = path.join(cache, name, sub);
        if (existsSync(executablePath)) return chromium.launch({ executablePath });
      }
    }
    throw error;
  }
}

let failures = 0;
async function check(name, fn) {
  try { const detail = await fn(); console.log(`PASS ${name}${detail ? ` (${detail})` : ''}`); }
  catch (error) { failures += 1; console.log(`FAIL ${name}: ${String(error.message || error).split('\n')[0]}`); }
}
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const browser = await launchChromium();
try {
  await check('(a) sans JavaScript : h1 et images chargées', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
    assert(h1.includes('Odoo, à la mesure'), `h1 inattendu : ${h1}`);
    // Lazy images only load when near the viewport: force eager loading via DOM is impossible without JS,
    // so check the data URIs decode: scroll through the page to trigger loading.
    for (let y = 0; y <= 20000; y += 800) { await page.mouse.wheel(0, 800); await page.waitForTimeout(30); }
    await page.waitForTimeout(500);
    const images = await page.locator('img').evaluateAll((list) => list.map((i) => ({ ok: i.complete && i.naturalWidth > 0, src: i.currentSrc.slice(0, 30) })));
    assert(images.length > 0, 'aucune image');
    const bad = images.filter((i) => !i.ok);
    assert(bad.length === 0, `${bad.length}/${images.length} images non chargées`);
    await context.close();
    return `${images.length} images`;
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const consoleErrors = [], requests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('request', (r) => { if (/^https?:/i.test(r.url())) requests.push(r.url()); });
  await page.goto(url, { waitUntil: 'load' });

  await check('(b1) h1 de l’accueil avec JavaScript', async () => {
    await page.waitForFunction(() => document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').includes('Odoo, à la mesure'));
  });
  const h1 = async () => (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });

  await check('(b2) navigation #/vos-enjeux par le menu', async () => {
    const before = await h1();
    await nav.getByRole('link', { name: 'Vos enjeux' }).click();
    await page.waitForFunction((b) => document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() !== b, before);
    assert(page.url().includes('#/vos-enjeux'), `URL : ${page.url()}`);
    return await h1();
  });

  await check('(b3) navigation #/contact par le menu', async () => {
    const before = await h1();
    await page.locator('.header-cta').click();
    await page.waitForFunction((b) => document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() !== b, before);
    assert(page.url().includes('#/contact'), `URL : ${page.url()}`);
    assert((await h1()).includes('Votre projet Odoo'), `h1 : ${await h1()}`);
  });

  await check('(b4) sélecteur vers contact : « Applications envisagées »', async () => {
    await nav.getByRole('link', { name: 'Vos enjeux' }).click();
    await page.waitForFunction(() => location.hash.startsWith('#/vos-enjeux'));
    const selecteur = page.locator('#selecteur');
    await selecteur.waitFor();
    await selecteur.getByRole('button', { name: /Connaître le stock réel/ }).click();
    await selecteur.getByRole('link', { name: 'Préparer ma demande avec ce périmètre' }).click();
    await page.waitForFunction(() => location.hash.startsWith('#/contact'));
    await page.getByText('Applications envisagées').first().waitFor({ timeout: 5000 });
  });

  await check('(b5) aucune erreur console', async () => {
    assert(consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  });
  await check('(b6) aucune requête réseau http(s)', async () => {
    assert(requests.length === 0, requests.slice(0, 3).join(' | '));
  });
  await context.close();
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
process.exit(failures ? 1 : 0);
