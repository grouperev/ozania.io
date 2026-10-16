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

const ROUTES = ['/', '/plateforme', '/tarifs', '/a-propos', '/contact', '/confidentialite', '/une-page-qui-nexiste-pas'];
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
    if (route === '/une-page-qui-nexiste-pas' && !(h1s[0] || '').includes('ne répond pas')) problems.push(`404 h1 lacks "ne répond pas": ${JSON.stringify(h1s)}`);
    if (route === '/') {
      const hero = await page.evaluate(() => { const i = document.querySelector('.hero-ui img'); return i ? { w: i.naturalWidth, src: i.currentSrc } : null; });
      if (!hero || !(hero.w > 0)) problems.push(`.hero-ui img missing or not loaded: ${JSON.stringify(hero)}`);
      if (!/Arrêtez de gérer vos serveurs\.\s*Commencez à gérer Odoo\./.test((h1s[0] || '').replace(/\s+/g, ' '))) problems.push(`home h1: ${JSON.stringify(h1s[0])}`);
      const pipe = await page.locator('.pipeline .pipe-step').count();
      if (pipe !== 4) problems.push(`.pipeline .pipe-step count=${pipe}, expected 4`);
    }
    if (route === '/plateforme') {
      const shots = await page.evaluate(() => [...document.querySelectorAll('figure.shot img')].map((i) => ({ src: new URL(i.currentSrc || i.src).pathname, w: i.naturalWidth })));
      if (!shots.length) problems.push('no figure.shot img');
      shots.filter((x) => !x.src.startsWith('/images/ui/') || !(x.w > 0)).forEach((x) => problems.push(`figure.shot img not a loaded /images/ui/ asset: ${JSON.stringify(x)}`));
      c.note(`/plateforme: ${shots.length} console screenshots`);
    }
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
          // Skip boxes clipped by a scrolling/hidden ancestor (e.g. a table inside an overflow-x:auto wrapper); absolutely positioned boxes can escape that clip, so keep them.
          const clipped = (el) => {
            if (getComputedStyle(el).position === 'absolute' || getComputedStyle(el).position === 'fixed') return false;
            for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).overflowX !== 'visible') return true;
            return false;
          };
          document.querySelectorAll('body *').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width && r.right > window.innerWidth + 1 && !clipped(el)) out.push({ tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className).slice(0, 60), right: Math.round(r.right), w: Math.round(r.width), parent: String(el.parentElement?.tagName || '').toLowerCase() + '.' + String(el.parentElement?.className || '').slice(0, 30) });
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
  c.assert(links >= 5, `menu dialog has ${links} links`);
  await page.keyboard.press('Escape');
  await sleep(400);
  c.assert((await page.locator('dialog[open]').count()) === 0, 'dialog still open after Escape');
  const focusLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  c.assert(focusLabel === 'Ouvrir le menu', `focus after Escape is ${JSON.stringify(focusLabel)}, expected toggle button`);
  await toggle.click();
  await page.waitForSelector('dialog[open]', { timeout: 3000 });
  await sleep(300);
  await page.locator('dialog[open] a', { hasText: 'Tarifs' }).click();
  await page.waitForURL(/\/tarifs$/, { timeout: 5000 }).catch(() => {});
  await sleep(500);
  c.assert(new URL(page.url()).pathname === '/tarifs', `URL after link click: ${page.url()}`);
  c.assert((await page.locator('dialog[open]').count()) === 0, 'dialog still open after navigating');
  await ctx.close();
});

// ------------------------------------------------------------------ 7
await check(7, 'Browser history back/forward via header nav', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/', 500);
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await nav.getByRole('link', { name: 'La plateforme' }).click();
  await page.waitForURL(/\/plateforme$/);
  await nav.getByRole('link', { name: 'Tarifs' }).click();
  await page.waitForURL(/\/tarifs$/);
  await page.goBack();
  await page.waitForURL(/\/plateforme$/, { timeout: 5000 }).catch(() => {});
  await sleep(500);
  c.assert(new URL(page.url()).pathname === '/plateforme', `after back URL=${page.url()}`);
  const h1 = await page.locator('h1:visible').allInnerTexts();
  c.assert(h1.length === 1 && /Une couche de contrôle/.test(h1[0]), `h1 after back: ${JSON.stringify(h1)}`);
  await page.goForward();
  await page.waitForURL(/\/tarifs$/, { timeout: 5000 }).catch(() => {});
  await sleep(400);
  c.assert(new URL(page.url()).pathname === '/tarifs', `after forward URL=${page.url()}`);
  const h1b = await page.locator('h1:visible').allInnerTexts();
  c.assert(h1b.length === 1 && /Commencez gratuitement/.test(h1b[0]), `h1 after forward: ${JSON.stringify(h1b)}`);
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
  const ph = await page.locator('dialog[open] input[type=search]').getAttribute('placeholder');
  c.assert(/Sauvegardes/.test(ph || ''), `search placeholder lacks "Sauvegardes": ${JSON.stringify(ph)}`);
  await page.keyboard.type('staging', { delay: 30 });
  await sleep(250);
  const n = await page.locator('dialog[open] .search-results a').count();
  c.assert(n >= 1, `no result links for "staging" (${n})`);
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
await check(9, 'Redirects of old routes (/expertise-odoo, /accompagnement -> /plateforme; /vos-enjeux -> /tarifs#trouver)', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  for (const [from, path_, hash] of [['/expertise-odoo', '/plateforme', ''], ['/accompagnement', '/plateforme', ''], ['/vos-enjeux', '/tarifs', '#trouver']]) {
    await openPage(page, from, 700);
    const u = new URL(page.url());
    c.assert(u.pathname === path_ && u.hash === hash, `${from} -> ${u.pathname}${u.hash}, expected ${path_}${hash}`);
    const h1 = await page.locator('h1:visible').allInnerTexts();
    c.assert(h1.length === 1, `${from}: visible h1 count=${h1.length}`);
  }
  await ctx.close();
});

// ------------------------------------------------------------------ finder helpers
const finderOption = (page, label) => page.locator('#trouver label.finder-option').filter({ has: page.locator('strong', { hasText: new RegExp(`^${label}$`) }) });
const planName = (page) => page.locator('#trouver .finder-plan-name strong').innerText();
const envState = (page) => page.locator('#trouver .finder-envs .env').evaluateAll((els) => els.map((e) => ({ text: e.textContent.replace(/\s*:\s*(non )?inclus/, '').trim(), on: e.classList.contains('on') })));

await check(10, 'Plan finder on /tarifs (Integrator+gere, Discovery, Solo/Integrator switch, keyboard radios)', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/tarifs', 600);
  await page.locator('#trouver').scrollIntoViewIfNeeded();
  await finderOption(page, 'Mes clients').click();
  await finderOption(page, 'Hébergement géré Ozania').click();
  await sleep(500);
  c.assert((await planName(page)).trim() === 'Integrator', `plan for Mes clients: ${await planName(page).catch(() => '?')}`);
  const href = await page.locator('#trouver .finder-actions a.button-primary').getAttribute('href');
  c.assert(href === '/contact?offre=integrator&hebergement=gere', `finder link href: ${href}`);
  let envs = await envState(page);
  c.assert(envs.length === 3 && envs.every((e) => e.on), `env chips for Integrator: ${JSON.stringify(envs)}`);
  c.assert((await page.locator('#trouver .env.on').count()) === 3, '.env.on count != 3 for Integrator');

  await finderOption(page, 'Tester un projet').click();
  await sleep(500);
  c.assert((await planName(page)).trim() === 'Discovery', `plan for Tester un projet: ${await planName(page).catch(() => '?')}`);
  envs = await envState(page);
  const prod = envs.find((e) => /Production/.test(e.text));
  c.assert(prod && !prod.on, `Production chip should be off for Discovery: ${JSON.stringify(envs)}`);
  c.assert(envs.filter((e) => e.on).length === 2, `Discovery should have 2 chips on: ${JSON.stringify(envs)}`);

  await finderOption(page, 'Mon entreprise').click();
  const sw = page.locator('#trouver input[role=switch]');
  const swLabel = page.locator('#trouver label.finder-switch');
  await swLabel.click();
  await sleep(400);
  c.assert(await sw.isChecked(), 'switch not checked after click');
  c.assert((await planName(page)).trim() === 'Integrator', `Mon entreprise + switch on: ${await planName(page).catch(() => '?')}`);
  await swLabel.click();
  await sleep(400);
  c.assert(!(await sw.isChecked()), 'switch still checked after second click');
  c.assert((await planName(page)).trim() === 'Solo', `Mon entreprise + switch off: ${await planName(page).catch(() => '?')}`);
  await finderOption(page, 'Mes clients, sous ma marque').click();
  await sleep(400);
  c.assert((await planName(page)).trim() === 'Agency', `Mes clients sous ma marque: ${await planName(page).catch(() => '?')}`);

  // Keyboard: fresh page, focus first audience radio, ArrowDown selects the next one.
  await openPage(page, '/tarifs', 600);
  const radios = page.locator('#trouver .finder-question').first().locator('input[type=radio]');
  c.assert((await radios.count()) === 4, `audience radios=${await radios.count()}`);
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await sleep(300);
  const checkedIdx = await radios.evaluateAll((els) => els.findIndex((e) => e.checked));
  const focusIdx = await radios.evaluateAll((els) => els.indexOf(document.activeElement));
  c.assert(checkedIdx === 1 && focusIdx === 1, `ArrowDown from radio 0: checked=${checkedIdx} focused=${focusIdx}`);
  c.assert((await planName(page).catch(() => '')).trim() === 'Solo', `plan after ArrowDown (Mon entreprise): ${await planName(page).catch(() => '?')}`);
  await page.keyboard.press('ArrowDown');
  await sleep(300);
  c.assert((await radios.evaluateAll((els) => els.findIndex((e) => e.checked))) === 2, 'second ArrowDown did not select radio 2');
  // The switch is operable with Space.
  await page.locator('#trouver input[role=switch]').focus();
  await page.keyboard.press('Space');
  await sleep(300);
  c.assert(await page.locator('#trouver input[role=switch]').isChecked(), 'Space did not toggle the switch');
  // Compact finder on the home page.
  await openPage(page, '/', 600);
  const homeOpt = page.locator('#quel-plan label.finder-option').filter({ has: page.locator('strong', { hasText: /^Mes clients$/ }) });
  await homeOpt.scrollIntoViewIfNeeded();
  await homeOpt.click();
  await sleep(400);
  c.assert((await page.locator('#quel-plan .finder-plan-name strong').innerText()).trim() === 'Integrator', 'home #quel-plan: Mes clients does not give Integrator');
  await ctx.close();
});

// ------------------------------------------------------------------ 11
await check(11, 'Finder -> /contact carry (Integrator topic + managed hosting preselected)', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/tarifs', 600);
  await finderOption(page, 'Mes clients').click();
  await finderOption(page, 'Hébergement géré Ozania').click();
  await sleep(400);
  await page.locator('#trouver .finder-actions a.button-primary').click();
  await page.waitForURL(/\/contact\?/, { timeout: 5000 }).catch(() => {});
  await sleep(600);
  const u = new URL(page.url());
  c.assert(u.pathname === '/contact' && u.searchParams.get('offre') === 'integrator' && u.searchParams.get('hebergement') === 'gere', `URL after click: ${page.url()}`);
  c.assert(await page.getByRole('heading', { name: 'Que souhaitez-vous ?' }).isVisible(), 'step-1 heading "Que souhaitez-vous ?" not visible');
  const topic = page.locator('label.topic').filter({ has: page.locator('strong', { hasText: /^Integrator$/ }) }).locator('input');
  c.assert(await topic.isChecked(), 'Integrator topic not checked');
  const host = page.locator('label.radio', { hasText: 'Hébergement géré Ozania' }).locator('input');
  c.assert(await host.isChecked(), 'hosting "Hébergement géré Ozania" not checked');
  c.assert((await page.locator('label.topic input[type=radio]').count()) === 5, `topic radios=${await page.locator('label.topic input[type=radio]').count()}, expected 5 (4 plans + question)`);
  // Direct deep link preselects too.
  await openPage(page, '/contact?offre=solo&hebergement=vps', 500);
  c.assert(await page.locator('label.topic').filter({ has: page.locator('strong', { hasText: /^Solo$/ }) }).locator('input').isChecked(), '?offre=solo: Solo not checked');
  c.assert(await page.locator('label.radio', { hasText: 'Mon VPS ou serveur dédié' }).locator('input').isChecked(), '?hebergement=vps: VPS not checked');
  await ctx.close();
});

// ------------------------------------------------------------------ 12
await check(12, 'Contact: intro, validation, full flow, download, copy, mailto, no storage/cookies', async (c) => {
  const ctx = await newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const page = await ctx.newPage();
  await openPage(page, '/contact', 600);
  const intro = await page.locator('.contact-intro').innerText();
  c.assert(intro.includes('contact@ozania.com'), 'contact@ozania.com not shown in intro');
  c.assert(intro.includes('+90 552 360 0708'), '+90 552 360 0708 not shown in intro');
  c.assert((await page.locator('label.topic input:checked').count()) === 0, 'a topic is pre-checked on bare /contact');
  await page.getByRole('button', { name: 'Continuer' }).click();
  const alert = page.locator('#step-error');
  await alert.waitFor({ timeout: 3000 }).catch(() => {});
  c.assert(/Choisissez un plan/.test((await alert.innerText().catch(() => '')) || ''), 'step-1 alert "Choisissez un plan" missing');
  await page.locator('label.topic').filter({ has: page.locator('strong', { hasText: /^Solo$/ }) }).click();
  await page.locator('label.radio', { hasText: 'Mon VPS ou serveur dédié' }).click();
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
  await page.fill('#field-message', 'Nous gérons plusieurs instances Odoo et voulons automatiser le staging et les sauvegardes.');
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
  c.assert(preview.includes('test@exemple.fr') && /Plan : Solo/.test(preview), 'textarea preview lacks email or "Plan : Solo"');
  const mailto = await page.getByRole('link', { name: 'Ouvrir dans ma messagerie' }).getAttribute('href').catch(() => null);
  c.assert(!!mailto && mailto.startsWith('mailto:contact@ozania.com'), `mailto href: ${mailto && mailto.slice(0, 80)}`);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.getByRole('button', { name: 'Télécharger (.txt)' }).click()]);
  c.assert(!!dl && dl.suggestedFilename() === 'demande-ozania-io.txt', `download event: ${dl ? dl.suggestedFilename() : 'none'}`);
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
  const leak = [...stor.local, ...stor.session].filter((x) => x.includes('test@exemple.fr') || x.includes('Test Personne'));
  c.assert(!leak.length, `storage leaks personal data: ${JSON.stringify(leak)}`);
  c.assert(stor.cookie === '', `document.cookie not empty: ${JSON.stringify(stor.cookie)}`);
  c.assert((await ctx.cookies()).length === 0, `context cookies: ${JSON.stringify((await ctx.cookies()).map((x) => x.name))}`);
  c.note(`localStorage keys=${stor.local.length} sessionStorage keys=${stor.session.length}`);
  await ctx.close();
});

// ------------------------------------------------------------------ 13
await check(13, 'Pricing page: 4 plan cards, comparison table 5 header columns, 17 FAQ details', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/tarifs', 600);
  for (const id of ['discovery', 'solo', 'integrator', 'agency']) c.assert((await page.locator(`#plan-${id}`).count()) === 1, `#plan-${id} missing`);
  const cols = await page.locator('#comparatif table thead tr').first().locator('th').allInnerTexts();
  c.assert(cols.length === 5, `table header columns=${cols.length} ${JSON.stringify(cols)}`);
  const faqCount = await page.locator('#questions details').count();
  c.assert(faqCount === 17, `#questions details count=${faqCount}, expected 17`);
  await ctx.close();
});

// ------------------------------------------------------------------ 14
await check(14, 'Header: "Se connecter" href (not followed) and "Compte gratuit" CTA', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/', 500);
  const login = page.locator('.header-login');
  c.assert((await login.getAttribute('href')) === 'https://www.ozania.io/web/login', `Se connecter href: ${await login.getAttribute('href')}`);
  c.assert(/Se connecter/.test(await login.innerText()), 'link text lacks "Se connecter"');
  const cta = page.locator('.header-cta');
  c.assert(/Compte gratuit/.test(await cta.innerText()) && (await cta.getAttribute('href')) === '/contact?offre=discovery', `CTA: ${await cta.innerText()} -> ${await cta.getAttribute('href')}`);
  const navLabels = await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link').allInnerTexts();
  c.assert(JSON.stringify(navLabels) === JSON.stringify(['La plateforme', 'Tarifs', 'À propos', 'Contact']), `nav labels: ${JSON.stringify(navLabels)}`);
  await ctx.close();
});

// ------------------------------------------------------------------ 15
await check(15, '/plateforme sticky .expertise-nav updates aria-current', async (c) => {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  await openPage(page, '/plateforme', 700);
  const nav = page.locator('.expertise-nav');
  c.assert((await nav.count()) === 1, `.expertise-nav count=${await nav.count()}`);
  const pos = await nav.evaluate((e) => getComputedStyle(e).position);
  c.assert(pos === 'sticky', `.expertise-nav position=${pos}, expected sticky`);
  const links = nav.locator('a');
  const n = await links.count();
  c.assert(n >= 3, `expertise-nav links=${n}`);
  const seen = new Set();
  for (const i of [1, Math.floor(n / 2), n - 1]) {
    const href = await links.nth(i).getAttribute('href');
    await links.nth(i).scrollIntoViewIfNeeded();
    await links.nth(i).click();
    await page.waitForFunction((h) => document.querySelector(`.expertise-nav a[href="${h}"]`)?.getAttribute('aria-current') === 'true', href, { timeout: 6000 }).catch(() => {});
    await sleep(300);
    const cur = await page.evaluate(() => [...document.querySelectorAll('.expertise-nav a[aria-current]')].map((a) => a.getAttribute('href')));
    c.assert(cur.length === 1 && cur[0] === href, `after click ${href}: aria-current on ${JSON.stringify(cur)}`);
    seen.add(cur[0]);
  }
  c.assert(seen.size >= 2, 'aria-current never changed');
  await ctx.close();
});

// ------------------------------------------------------------------ 16
await check(16, 'FAQ details toggle by click and Enter', async (c) => {
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

// ------------------------------------------------------------------ 17
await check(17, 'Reduced motion: hero visible immediately, [data-reveal] opacity 1', async (c) => {
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

// ------------------------------------------------------------------ 18
await check(18, 'First paint without reduced motion: h1 visible within 300ms of DCL', async (c) => {
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
