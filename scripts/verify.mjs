// Browser verification harness for ozania.io (report only; never touches src/).
// Usage: node scripts/verify.mjs   (PREVIEW_URL defaults to http://localhost:4181)
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core/axe.min.js');
const BASE = (process.env.PREVIEW_URL || 'http://localhost:4181').replace(/\/$/, '');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, '.shots', 'qa');
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const ROUTES = ['/', '/expertise-odoo', '/accompagnement', '/vos-enjeux', '/a-propos', '/contact', '/confidentialite', '/une-page-qui-nexiste-pas'];
const slug = (r) => (r === '/' ? 'home' : r.slice(1));
const DESKTOP = { width: 1440, height: 900 };
const WIDTHS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 844 }];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const extra = { axe: {}, focusSequence: [], titles: {}, overflow: {}, screenshots: SHOTS };

class Check {
  constructor(id, name) { this.id = id; this.name = name; this.failures = []; this.notes = []; }
  assert(cond, msg) { if (!cond) this.failures.push(msg); return !!cond; }
  note(msg) { this.notes.push(msg); }
  get status() { return this.failures.length ? 'FAIL' : 'PASS'; }
}
async function check(id, name, fn) {
  const c = new Check(id, name);
  const t0 = Date.now();
  try { await fn(c); } catch (e) { c.failures.push(`HARNESS/EXCEPTION: ${String(e && e.message || e).split('\n').slice(0, 3).join(' | ')}`); }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${c.status === 'PASS' ? 'PASS' : 'FAIL'}  [${id}] ${name} (${secs}s)`);
  c.failures.forEach((f) => console.log(`        - ${f}`));
  c.notes.forEach((n) => console.log(`        . ${n}`));
  results.push({ id, name, status: c.status, failures: c.failures, notes: c.notes });
  return c;
}

const url = (r) => BASE + r;

async function slowScroll(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0;
    for (let i = 0; i < 400; i++) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (y >= max) break;
      y = Math.min(max, y + Math.round(window.innerHeight * 0.5));
      window.scrollTo(0, y);
      await wait(110);
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(400);
  });
}
async function toTop(page) { await page.evaluate(() => window.scrollTo(0, 0)); await sleep(250); }
async function openPage(page, route, extraWait = 400) {
  const resp = await page.goto(url(route), { waitUntil: 'load' });
  await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});
  await sleep(extraWait);
  return resp;
}
const newCtx = (browser, opts = {}) => browser.newContext({ viewport: DESKTOP, ...opts });

function attachMonitors(page, store) {
  page.on('console', (m) => { if (m.type() === 'error') store.console.push(`${m.text()} @ ${m.location().url || ''}`); });
  page.on('pageerror', (e) => store.pageerrors.push(String(e.message || e)));
  page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) store.failed.push(`${r.method()} ${r.url().replace(BASE, '')} ${r.failure()?.errorText}`); });
  page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) store.failed.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
}

import { existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
function findBrowser() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { if (existsSync(chromium.executablePath())) return undefined; } catch {}
  // Installed Chromium revision may differ from what this playwright expects: use any cached headless shell.
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  for (const d of readdirSync(cache).filter((x) => x.startsWith('chromium_headless_shell-')).sort().reverse()) {
    const exe = path.join(cache, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
    if (existsSync(exe)) return exe;
  }
  return undefined;
}
const browser = await chromium.launch({ executablePath: findBrowser() });

// ------------------------------------------------------------------ 1
await check(1, 'Direct route loads (status, h1, title, console, images, network)', async (c) => {
  const titles = new Map();
  for (const route of ROUTES) {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    const store = { console: [], pageerrors: [], failed: [] };
    attachMonitors(page, store);
    const resp = await openPage(page, route);
    const status = resp?.status();
    await slowScroll(page);
    await sleep(600);
    const h1s = await page.locator('h1:visible').allInnerTexts();
    const title = await page.title();
    const imgs = await page.evaluate(() => [...document.images].map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth, complete: i.complete, loading: i.loading })));
    const badImgs = imgs.filter((i) => !(i.w > 0));
    const problems = [];
    if (status !== 200) problems.push(`HTTP ${status}`);
    if (h1s.length !== 1 || !h1s[0].trim()) problems.push(`visible h1 count=${h1s.length} texts=${JSON.stringify(h1s)}`);
    if (!title) problems.push('empty title');
    if (store.console.length) problems.push(`console errors: ${store.console.join(' || ')}`);
    if (store.pageerrors.length) problems.push(`pageerrors: ${store.pageerrors.join(' || ')}`);
    if (badImgs.length) problems.push(`images with naturalWidth=0: ${badImgs.map((i) => i.src.replace(BASE, '')).join(', ')}`);
    if (store.failed.length) problems.push(`failed same-origin requests: ${store.failed.join(', ')}`);
    if (route === '/une-page-qui-nexiste-pas' && !(h1s[0] || '').includes('périmètre')) problems.push(`404 h1 lacks "périmètre": ${JSON.stringify(h1s)}`);
    titles.set(route, title);
    extra.titles[route] = title;
    problems.forEach((p) => c.assert(false, `${route}: ${p}`));
    c.note(`${route}: status=${status} h1=${JSON.stringify(h1s[0] || '')} title=${JSON.stringify(title)} imgs=${imgs.length}`);
    await ctx.close();
  }
  const vals = [...titles.values()];
  c.assert(new Set(vals).size === vals.length, `document.title not unique: ${JSON.stringify(Object.fromEntries(titles))}`);
});

// ------------------------------------------------------------------ 2
await check(2, 'No horizontal overflow at 1440 / 390 / 320', async (c) => {
  for (const vp of WIDTHS) {
    const ctx = await newCtx(browser, { viewport: vp });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      await openPage(page, route, 300);
      const measure = () => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      const before = await measure();
      await slowScroll(page);
      const after = await measure();
      const bad = before.sw > before.iw || after.sw > after.iw;
      if (bad) {
        const off = await page.evaluate(() => {
          const out = [];
          document.querySelectorAll('body *').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width && r.right > window.innerWidth + 1) out.push({ tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className).slice(0, 60), right: Math.round(r.right), w: Math.round(r.width) });
          });
          return out.sort((a, b) => b.right - a.right).slice(0, 5);
        });
        c.assert(false, `${vp.width}px ${route}: scrollWidth ${before.sw}/${after.sw} (after scroll) > innerWidth ${before.iw}; offenders ${JSON.stringify(off)}`);
        extra.overflow[`${vp.width}${route}`] = off;
      }
    }
    await ctx.close();
  }
});

// ------------------------------------------------------------------ 3
await check(3, 'Screenshots (full page x3 widths + above-the-fold of /)', async (c) => {
  for (const vp of WIDTHS) {
    const dir = path.join(SHOTS, String(vp.width));
    mkdirSync(dir, { recursive: true });
    const ctx = await newCtx(browser, { viewport: vp, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      await openPage(page, route, 300);
      await slowScroll(page);
      await toTop(page);
      await page.screenshot({ path: path.join(dir, `${slug(route)}.png`), fullPage: true });
    }
    await ctx.close();
  }
  for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) {
    const ctx = await newCtx(browser, { viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await openPage(page, '/', 800);
    await page.screenshot({ path: path.join(SHOTS, `fold-${w}.png`), fullPage: false });
    await ctx.close();
  }
  c.note(`written under ${SHOTS}`);
});

// ------------------------------------------------------------------ 4
await check(4, 'axe-core (wcag2a/2aa/21a/21aa) on every route at 1440', async (c) => {
  const ctx = await newCtx(browser, { reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await openPage(page, route, 300);
    await slowScroll(page);
    await toTop(page);
    await page.addScriptTag({ path: AXE_PATH });
    const res = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    const v = res.violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, nodes: x.nodes.length, targets: x.nodes.slice(0, 3).map((n) => n.target.join(' ')), detail: x.nodes.slice(0, 3).map((n) => (n.any[0]?.message || '').slice(0, 160)) }));
    extra.axe[route] = v;
    const bad = v.filter((x) => x.impact === 'serious' || x.impact === 'critical');
    bad.forEach((x) => c.assert(false, `${route}: [${x.impact}] ${x.id} - ${x.help} (${x.nodes} nodes) e.g. ${x.targets.join(' ; ')} :: ${x.detail[0]}`));
    v.filter((x) => !bad.includes(x)).forEach((x) => c.note(`${route}: [${x.impact}] ${x.id} - ${x.help} (${x.nodes}) e.g. ${x.targets.join(' ; ')}`));
    c.note(`${route}: ${v.length} violation(s), ${bad.length} serious/critical`);
  }
  await ctx.close();
});

// ------------------------------------------------------------------ 5
await check(5, 'Keyboard: skip link first, focus sequence, visible focus indicators', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/', 600);
  const describe = () => page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { tag: 'body', text: '', visibleIndicator: false };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const label = el.getAttribute('aria-label') || (el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    return {
      tag: el.tagName.toLowerCase(), text: label, href: el.getAttribute('href') || undefined,
      outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 50),
      visibleIndicator: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none',
      onScreen: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
    };
  });
  await page.keyboard.press('Tab');
  await sleep(500); // skip link slides in with a CSS transition
  const first = await describe();
  c.assert(first.tag === 'a' && /Aller au contenu/.test(first.text), `first Tab focus is not skip link: ${JSON.stringify(first)}`);
  c.assert(first.onScreen, 'skip link is not on screen when focused');
  const seq = [first];
  for (let i = 0; i < 15; i++) { await page.keyboard.press('Tab'); seq.push(await describe()); }
  seq.forEach((s, i) => c.assert(s.visibleIndicator, `Tab stop #${i + 1} <${s.tag}> "${s.text}" has no focus indicator (outline ${s.outline}, box-shadow ${s.boxShadow})`));
  extra.focusSequence = seq.map((s, i) => `${i + 1}. <${s.tag}> ${s.text}${s.href ? ` [${s.href}]` : ''} | outline: ${s.outline} | shadow: ${s.boxShadow}`);
  extra.focusSequence.forEach((s) => c.note(s));
  await ctx.close();
});

// ------------------------------------------------------------------ 6
await check(6, 'Mobile nav (390): open, Escape returns focus, link navigates and closes', async (c) => {
  const ctx = await newCtx(browser, { viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await openPage(page, '/', 500);
  const toggle = page.getByRole('button', { name: 'Ouvrir le menu' });
  await toggle.click();
  await page.waitForSelector('dialog[open]', { timeout: 3000 });
  c.assert((await page.locator('dialog[open]').count()) === 1, 'expected exactly one dialog[open]');
  const links = await page.locator('dialog[open] a').count();
  c.assert(links >= 4, `menu dialog has ${links} links`);
  await page.keyboard.press('Escape');
  await sleep(400);
  c.assert((await page.locator('dialog[open]').count()) === 0, 'dialog still open after Escape');
  const focusLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  c.assert(focusLabel === 'Ouvrir le menu', `focus after Escape is ${JSON.stringify(focusLabel)}, expected toggle button`);
  await toggle.click();
  await page.waitForSelector('dialog[open]', { timeout: 3000 });
  await sleep(300);
  await page.locator('dialog[open] a', { hasText: 'Vos enjeux' }).click();
  await page.waitForURL(/\/vos-enjeux$/, { timeout: 5000 }).catch(() => {});
  await sleep(500);
  c.assert(new URL(page.url()).pathname === '/vos-enjeux', `URL after link click: ${page.url()}`);
  c.assert((await page.locator('dialog[open]').count()) === 0, 'dialog still open after navigating');
  await ctx.close();
});

// ------------------------------------------------------------------ 7
await check(7, 'Browser history back/forward via header nav', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/', 500);
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await nav.getByRole('link', { name: 'Expertise Odoo' }).click();
  await page.waitForURL(/\/expertise-odoo$/);
  await nav.getByRole('link', { name: 'Accompagnement' }).click();
  await page.waitForURL(/\/accompagnement$/);
  await page.goBack();
  await page.waitForURL(/\/expertise-odoo$/, { timeout: 5000 }).catch(() => {});
  await sleep(500);
  c.assert(new URL(page.url()).pathname === '/expertise-odoo', `after back URL=${page.url()}`);
  const h1 = await page.locator('h1:visible').allInnerTexts();
  c.assert(h1.length === 1 && /Intégrer Odoo/.test(h1[0]), `h1 after back: ${JSON.stringify(h1)}`);
  await page.goForward();
  await page.waitForURL(/\/accompagnement$/, { timeout: 5000 }).catch(() => {});
  await sleep(400);
  c.assert(new URL(page.url()).pathname === '/accompagnement', `after forward URL=${page.url()}`);
  const h1b = await page.locator('h1:visible').allInnerTexts();
  c.assert(h1b.length === 1 && /Un projet Odoo/.test(h1b[0]), `h1 after forward: ${JSON.stringify(h1b)}`);
  await ctx.close();
});

// ------------------------------------------------------------------ 8
await check(8, 'Search dialog (open, focus, results, empty state, suggestion, Escape, Ctrl+K)', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/', 500);
  await page.getByRole('button', { name: 'Rechercher sur le site' }).click();
  await page.waitForSelector('dialog[open]');
  await sleep(300);
  const focusType = await page.evaluate(() => { const e = document.activeElement; return e ? `${e.tagName.toLowerCase()}[type=${e.getAttribute('type')}]` : 'none'; });
  c.assert(focusType === 'input[type=search]', `focus after open: ${focusType}`);
  await page.keyboard.type('stock', { delay: 30 });
  await sleep(250);
  const n = await page.locator('dialog[open] .search-results a').count();
  c.assert(n >= 1, `no result links for "stock" (${n})`);
  await page.locator('dialog[open] input[type=search]').fill('zzzqqq');
  await sleep(250);
  const empty = page.locator('dialog[open] .search-empty h2');
  c.assert(await empty.isVisible() && /Rien ne correspond/.test(await empty.innerText()), 'empty-state heading "Rien ne correspond" not visible');
  const sug = page.locator('dialog[open] .search-suggestions button');
  c.assert((await sug.count()) >= 1, 'no suggestion buttons');
  await sug.first().click();
  await sleep(300);
  c.assert((await page.locator('dialog[open] .search-results a').count()) >= 1, 'results did not reappear after clicking suggestion');
  await page.keyboard.press('Escape');
  await sleep(400);
  const stillOpen = (await page.locator('dialog[open]').count()) !== 0;
  c.assert(!stillOpen, 'dialog still open after first Escape while the search input contains text (native type=search Esc clears the field and swallows the event)');
  if (stillOpen) {
    await page.keyboard.press('Escape');
    await sleep(400);
    c.note(`second Escape closes dialog: ${(await page.locator('dialog[open]').count()) === 0}`);
  }
  await page.keyboard.press('Control+k');
  await sleep(400);
  c.assert((await page.locator('dialog[open]').count()) === 1, 'Ctrl+K did not reopen search');
  await ctx.close();
});

// ------------------------------------------------------------------ 9
await check(9, 'Signature selector + carry scope to /contact', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/vos-enjeux', 700);
  const sel = page.locator('#selecteur');
  const btn = (label) => sel.locator('button.need', { has: page.locator('strong', { hasText: label }) });
  await btn('Connaître le stock réel').click();
  await btn('Organiser les achats fournisseurs').click();
  await sleep(500);
  c.assert((await btn('Connaître le stock réel').getAttribute('aria-pressed')) === 'true', 'stock button not aria-pressed=true');
  c.assert((await btn('Organiser les achats fournisseurs').getAttribute('aria-pressed')) === 'true', 'achats button not aria-pressed=true');
  const on = await sel.locator('.flow-node.on').count();
  c.assert(on >= 2, `.flow-node.on count=${on}`);
  const summary = await sel.locator('.summary-counts').innerText();
  c.assert(/2 besoins/.test(summary), `summary text: ${JSON.stringify(summary)}`);
  const lines = await sel.locator('path.flow-line').count();
  c.assert(lines >= 1, `path.flow-line count=${lines} at 1440 (summary: ${summary.replace(/\s+/g, ' ')})`);
  await sel.getByRole('link', { name: 'Préparer ma demande avec ce périmètre' }).click();
  await page.waitForURL(/\/contact\?besoins=/, { timeout: 5000 }).catch(() => {});
  await sleep(600);
  const u = new URL(page.url());
  const ids = (u.searchParams.get('besoins') || '').split(',');
  c.assert(u.pathname === '/contact' && ids.includes('stock') && ids.includes('achats'), `URL after click: ${page.url()}`);
  for (const [id, label] of [['stock', 'Connaître le stock réel'], ['achats', 'Organiser les achats fournisseurs']]) {
    const checked = await page.locator('label.chip', { hasText: label }).locator('input').isChecked();
    c.assert(checked, `contact checkbox "${label}" not checked`);
  }
  c.assert(await page.getByText('Applications envisagées', { exact: true }).first().isVisible(), '"Applications envisagées" not visible on contact');
  await ctx.close();
});

// ------------------------------------------------------------------ 10
await check(10, 'Contact form validation, draft result, download, copy, no storage', async (c) => {
  const ctx = await newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const page = await ctx.newPage();
  await openPage(page, '/contact', 600);
  c.note(`default: "Le périmètre reste à définir" pre-checked = ${await page.locator('label.chip-wide input').isChecked()} (so Continuer with nothing chosen advances without an alert)`);
  await page.locator('label.chip-wide').click(); // uncheck the pre-checked "to define together" option
  await page.getByRole('button', { name: 'Continuer' }).click();
  const alert = page.locator('#step-error');
  await alert.waitFor({ timeout: 3000 }).catch(() => {});
  c.assert(/Choisissez au moins un besoin/.test((await alert.innerText().catch(() => '')) || ''), 'step-1 alert "Choisissez au moins un besoin" missing');
  await page.locator('label.chip', { hasText: 'Connaître le stock réel' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('heading', { name: 'Faisons connaissance.' }).waitFor({ timeout: 3000 }).catch(() => c.assert(false, 'step-2 heading "Faisons connaissance." missing'));
  await page.getByRole('button', { name: 'Relire ma demande' }).click();
  await sleep(400);
  c.assert(await page.locator('.error-summary').isVisible(), '.error-summary not visible');
  const invalid = await page.locator('[aria-invalid="true"]').count();
  c.assert(invalid >= 5, `aria-invalid="true" count=${invalid} (expected >=5: name, company, email, message, consent)`);
  const fe = await page.locator('.field-error').count();
  c.assert(fe >= 5, `.field-error count=${fe}, expected >=5`);
  await page.fill('#field-email', 'abc@');
  await page.getByRole('button', { name: 'Relire ma demande' }).click();
  await sleep(300);
  const emailErr = (await page.locator('#email-error').innerText().catch(() => '')) || '';
  c.assert(/incomplète/.test(emailErr), `email error text: ${JSON.stringify(emailErr)}`);
  await page.fill('#field-name', 'Test Personne');
  await page.fill('#field-company', 'Entreprise Test');
  await page.fill('#field-email', 'test@exemple.fr');
  await page.fill('#field-message', 'Nous voulons connaître notre stock réel et fiabiliser les achats fournisseurs.');
  await page.locator('#field-consent').check({ force: true });
  await page.getByRole('button', { name: 'Relire ma demande' }).click();
  await page.getByRole('heading', { name: 'Relisez votre demande.' }).waitFor({ timeout: 3000 }).catch(() => c.assert(false, 'step-3 heading "Relisez votre demande." missing'));
  c.assert((await page.locator('.review').innerText()).includes('test@exemple.fr'), 'review step does not show entered email');
  await page.getByRole('button', { name: 'Préparer mon message' }).click();
  await sleep(500);
  const h2 = ((await page.locator('.contact-result h2').innerText().catch(() => '')) || '').trim();
  c.assert(h2 === 'Votre demande est prête. Elle n’a pas encore été envoyée.', `result heading: ${JSON.stringify(h2)}`);
  const bodyText = await page.evaluate(() => document.body.innerText);
  c.assert(!bodyText.includes('a bien été envoyée'), 'page claims "a bien été envoyée"');
  const preview = await page.locator('.result-preview textarea').inputValue().catch(() => '');
  c.assert(preview.includes('test@exemple.fr'), 'textarea preview lacks email');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.getByRole('button', { name: 'Télécharger (.txt)' }).click()]);
  c.assert(!!dl && dl.suggestedFilename().endsWith('.txt'), `download event: ${dl ? dl.suggestedFilename() : 'none'}`);
  await page.getByRole('button', { name: /Copier le message/ }).click();
  await sleep(500);
  const copiedLabel = await page.locator('.result-actions button').first().innerText();
  const notice = await page.locator('.form-alert').innerText().catch(() => '');
  c.assert(/Message copié/.test(copiedLabel) || /La copie n’est pas disponible/.test(notice), `copy: button="${copiedLabel}" notice="${notice}"`);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch((e) => 'ERR ' + e.message));
  c.note(`copy button label after click: "${copiedLabel.trim()}"; clipboard has email: ${String(clip).includes('test@exemple.fr')}`);
  const stor = await page.evaluate(() => {
    const dump = (s) => Object.keys(s).map((k) => k + '=' + s.getItem(k));
    return { local: dump(localStorage), session: dump(sessionStorage), cookie: document.cookie };
  });
  const leak = [...stor.local, ...stor.session].filter((x) => x.includes('test@exemple.fr'));
  c.assert(!leak.length, `storage leaks email: ${JSON.stringify(leak)}`);
  c.assert(stor.cookie === '', `document.cookie not empty: ${JSON.stringify(stor.cookie)}`);
  c.note(`localStorage keys=${stor.local.length} sessionStorage keys=${stor.session.length}`);
  await ctx.close();
});

// ------------------------------------------------------------------ 11
await check(11, 'Tabs keyboard (journey + sector) and deep link', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/accompagnement', 600);
  const tabs = page.locator('.journey-tabs [role=tab]');
  const count = await tabs.count();
  const state = () => page.evaluate(() => {
    const t = [...document.querySelectorAll('.journey-tabs [role=tab]')];
    return { sel: t.findIndex((x) => x.getAttribute('aria-selected') === 'true'), foc: t.indexOf(document.activeElement) };
  });
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight'); await sleep(200);
  let s = await state();
  c.assert(s.sel === 1 && s.foc === 1, `ArrowRight: selected=${s.sel} focused=${s.foc}`);
  await page.keyboard.press('End'); await sleep(200);
  s = await state();
  c.assert(s.sel === count - 1 && s.foc === count - 1, `End: selected=${s.sel} focused=${s.foc} (count ${count})`);
  await page.keyboard.press('Home'); await sleep(200);
  s = await state();
  c.assert(s.sel === 0 && s.foc === 0, `Home: selected=${s.sel} focused=${s.foc}`);
  await openPage(page, '/accompagnement?etape=demarrer', 700);
  s = await state();
  c.assert(s.sel === 3, `?etape=demarrer selected index=${s.sel}, expected 3`);

  await openPage(page, '/vos-enjeux', 700);
  const st = page.locator('.sector-tabs [role=tab]');
  await st.first().focus();
  await page.keyboard.press('ArrowRight'); await sleep(300);
  const sstate = await page.evaluate(() => { const t = [...document.querySelectorAll('.sector-tabs [role=tab]')]; return { sel: t.findIndex((x) => x.getAttribute('aria-selected') === 'true'), foc: t.indexOf(document.activeElement) }; });
  c.assert(sstate.sel === 1 && sstate.foc === 1, `sector ArrowRight: ${JSON.stringify(sstate)}`);
  const labels = await page.locator('.sector-needs li').allInnerTexts();
  await page.getByRole('button', { name: 'Charger cet exemple dans le sélecteur' }).click();
  await sleep(700);
  const pressed = await page.evaluate((ls) => ls.map((l) => {
    const b = [...document.querySelectorAll('#selecteur button.need')].find((x) => x.querySelector('strong')?.textContent.trim() === l.trim());
    return [l, b ? b.getAttribute('aria-pressed') : 'MISSING'];
  }), labels);
  c.assert(labels.length > 0 && pressed.every(([, v]) => v === 'true'), `needs pressed after load: ${JSON.stringify(pressed)}`);
  const total = await page.locator('#selecteur button.need[aria-pressed="true"]').count();
  c.note(`sector 2 needs=${labels.length}, total pressed=${total}`);
  await ctx.close();
});

// ------------------------------------------------------------------ 12
await check(12, 'FAQ details toggle by click and Enter', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/', 600);
  const d = page.locator('details').first();
  const sum = d.locator('summary');
  await sum.scrollIntoViewIfNeeded();
  c.assert(!(await d.evaluate((e) => e.open)), 'first details is open initially');
  await sum.click(); await sleep(250);
  c.assert(await d.evaluate((e) => e.open), 'click on summary did not open');
  await sum.focus();
  await page.keyboard.press('Enter'); await sleep(250);
  c.assert(!(await d.evaluate((e) => e.open)), 'Enter on focused summary did not toggle (close)');
  await page.keyboard.press('Enter'); await sleep(250);
  c.assert(await d.evaluate((e) => e.open), 'second Enter did not re-open');
  await ctx.close();
});

// ------------------------------------------------------------------ 13
await check(13, 'Reduced motion: hero visible immediately, [data-reveal] opacity 1', async (c) => {
  const ctx = await newCtx(browser, { reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1', { timeout: 3000 }).catch(() => {});
  const probe = () => page.evaluate(() => {
    const eff = (el) => { let o = 1; for (let n = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
    const info = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { opacity: cs.opacity, effOpacity: eff(el), visibility: cs.visibility, inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth, top: Math.round(r.top), h: Math.round(r.height) }; };
    return { h1: info(document.querySelector('h1')), img: info(document.querySelector('.hero-image img')) };
  });
  const p = await probe();
  c.assert(p.h1 && p.h1.effOpacity === 1 && p.h1.visibility === 'visible' && p.h1.inViewport, `h1 immediately: ${JSON.stringify(p.h1)}`);
  c.assert(p.img && p.img.effOpacity === 1 && p.img.visibility === 'visible' && p.img.inViewport, `.hero-image img immediately (1440x900): ${JSON.stringify(p.img)}`);
  await slowScroll(page);
  const reveal = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].map((e) => ({ cls: e.className || e.tagName, op: getComputedStyle(e).opacity })));
  const bad = reveal.filter((r) => r.op !== '1');
  c.assert(reveal.length > 0 && bad.length === 0, `[data-reveal] total=${reveal.length}, not opacity 1: ${JSON.stringify(bad.slice(0, 5))}`);
  c.note(`[data-reveal] count=${reveal.length}`);
  await ctx.close();
});

// ------------------------------------------------------------------ 14
await check(14, 'First paint without reduced motion: h1 visible within 300ms of DCL', async (c) => {
  for (let run = 0; run < 3; run++) {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
    const t0 = Date.now();
    const found = await page.waitForSelector('h1', { timeout: 300 }).then(() => true).catch(() => false);
    const probe = await page.evaluate(() => {
      const h = document.querySelector('h1');
      if (!h) return null;
      let eff = 1; for (let n = h; n; n = n.parentElement) eff *= parseFloat(getComputedStyle(n).opacity);
      const r = h.getBoundingClientRect();
      return { opacity: getComputedStyle(h).opacity, eff, visibility: getComputedStyle(h).visibility, inViewport: r.bottom > 0 && r.top < innerHeight };
    });
    const dt = Date.now() - t0;
    c.assert(found && probe && probe.eff === 1 && probe.visibility === 'visible' && probe.inViewport, `run ${run + 1}: h1 found=${found} after ${dt}ms probe=${JSON.stringify(probe)}`);
    await ctx.close();
  }
});

await browser.close();

const failed = results.filter((r) => r.status === 'FAIL');
writeFileSync(path.join(SHOTS, 'summary.json'), JSON.stringify({ base: BASE, generated: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, checks: results, extra }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Summary: ${path.join(SHOTS, 'summary.json')}`);
process.exit(failed.length ? 1 : 0);
