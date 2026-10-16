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
    assert(h1.includes('Commencez à gérer Odoo'), `h1 inattendu : ${h1}`);
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
    await page.waitForFunction(() => document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').includes('Commencez à gérer Odoo'));
  });
  const h1 = async () => (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });

  await check('(b2) navigation #/tarifs par le menu', async () => {
    await nav.getByRole('link', { name: 'Tarifs' }).click();
    await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('Commencez gratuitement'), null, { timeout: 5000 }).catch(() => {});
    assert(page.url().includes('#/tarifs'), `URL : ${page.url()}`);
    assert((await h1()).includes('Commencez gratuitement'), `h1 : ${await h1()}`);
  });

  await check('(b3) navigation #/contact par le menu', async () => {
    await nav.getByRole('link', { name: 'Contact' }).click();
    await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('Votre compte Ozania.io'), null, { timeout: 5000 }).catch(() => {});
    assert(page.url().includes('#/contact'), `URL : ${page.url()}`);
    assert((await h1()).includes('Votre compte Ozania.io'), `h1 : ${await h1()}`);
  });

  await check('(b4) sélecteur de plan vers contact : « Que souhaitez-vous ? », Integrator coché', async () => {
    await nav.getByRole('link', { name: 'Tarifs' }).click();
    await page.waitForFunction(() => location.hash.startsWith('#/tarifs'));
    const finder = page.locator('#trouver');
    await finder.waitFor();
    await finder.locator('label.finder-option').filter({ has: page.locator('strong', { hasText: /^Mes clients$/ }) }).click();
    await finder.locator('label.finder-option').filter({ has: page.locator('strong', { hasText: /^Hébergement géré Ozania$/ }) }).click();
    assert((await finder.locator('.finder-plan-name strong').innerText()).trim() === 'Integrator', 'plan conseillé != Integrator');
    await finder.locator('.finder-actions a.button-primary').click();
    await page.waitForFunction(() => location.hash.startsWith('#/contact'));
    await page.getByRole('heading', { name: 'Que souhaitez-vous ?' }).waitFor({ timeout: 5000 });
    const topic = page.locator('label.topic').filter({ has: page.locator('strong', { hasText: /^Integrator$/ }) }).locator('input');
    assert(await topic.isChecked(), 'Integrator non coché');
    const host = page.locator('label.radio', { hasText: 'Hébergement géré Ozania' }).locator('input');
    assert(await host.isChecked(), 'hébergement géré non coché');
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
