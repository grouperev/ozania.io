// Export a single self-contained HTML preview (exports/ozania-io-preview.html).
// Inlines CSS, JS, fonts and images (data URIs), forces HashRouter through
// <meta name="oz-preview">, and embeds a static snapshot of the homepage so that
// script-blocking viewers do not see an empty page.
// Usage: npm run build && node scripts/export-preview.mjs
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';


// Launch Chromium: CHROMIUM_PATH if set, else Playwright's default, else any
// Chromium found in the local Playwright cache (version mismatch tolerant).
async function launchChromium() {
  if (process.env.CHROMIUM_PATH) return chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  try { return await chromium.launch(); } catch (error) {
    const { existsSync, readdirSync } = await import('node:fs');
    const os = await import('node:os');
    const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
    const candidates = existsSync(cache) ? readdirSync(cache).filter((n) => n.startsWith('chromium')).sort().reverse() : [];
    for (const name of candidates) {
      for (const sub of ['chrome-headless-shell-mac-arm64/chrome-headless-shell', 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-linux/chrome', 'chrome-linux64/chrome']) {
        const executablePath = path.join(cache, name, sub);
        if (existsSync(executablePath)) return chromium.launch({ executablePath });
      }
    }
    throw error;
  }
}

const root = path.resolve('dist');
const destination = path.resolve('exports/ozania-io-preview.html');
const mime = {
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8',
};
const embeddable = new Set(['.webp', '.png', '.svg', '.woff2', '.woff']);

const assets = new Map();
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    else if (embeddable.has(path.extname(entry.name))) {
      const publicPath = '/' + path.relative(root, absolute).split(path.sep).join('/');
      assets.set(publicPath, `data:${mime[path.extname(entry.name)]};base64,${(await readFile(absolute)).toString('base64')}`);
    }
  }
}
await collect(root);
// Longest paths first so that no path can be clobbered by a shorter prefix.
const ordered = [...assets].sort((a, b) => b[0].length - a[0].length);
const embedAssets = (text) => {
  for (const [assetPath, data] of ordered) text = text.split(assetPath).join(data);
  return text;
};

const source = await readFile(path.join(root, 'index.html'), 'utf8');
const script = source.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const stylesheet = source.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (!script || !stylesheet) throw new Error('Bundle JS/CSS introuvable dans dist/index.html. Lancez npm run build.');

// 1. Static snapshot of the homepage, taken from the real production build.
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  let file = path.join(root, pathname);
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  try {
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(data);
  } catch {
    const data = await readFile(path.join(root, 'index.html'));
    response.writeHead(200, { 'Content-Type': mime['.html'] }).end(data);
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let snapshot;
const browser = await launchChromium();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
  await page.locator('h1').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.images);
    images.forEach((image) => { image.loading = 'eager'; });
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    window.scrollTo(0, 0);
  });
  if (errors.length) throw new Error(errors.join('\n'));
  // In-site links must work without a server: rewrite to hash routes.
  await page.evaluate(() => {
    document.querySelectorAll('#root a[href^="/"]').forEach((link) => {
      link.setAttribute('href', '#' + link.getAttribute('href'));
    });
  });
  snapshot = await page.locator('#root').innerHTML();
} finally {
  await browser.close();
  server.close();
}

// 2. Assemble the single file.
const js = embedAssets(await readFile(path.join(root, script[1]), 'utf8')).replace(/<\/script/gi, '<\\/script');
const css = embedAssets(await readFile(path.join(root, stylesheet[1]), 'utf8'));
let html = source
  .replace(script[0], '')
  .replace(stylesheet[0], () => `<style>${css}</style>`)
  .replace(/<link\b[^>]*rel="preload"[^>]*>\s*/g, '')
  .replace('<head>', '<head>\n    <meta name="oz-preview" content="standalone" />');
html = embedAssets(html);
const root$ = '<div id="root"></div>';
if (!html.includes(root$)) throw new Error('Point de montage #root introuvable.');
html = html.replace(root$, () => `<div id="root">${embedAssets(snapshot)}</div>`);
html = html.replace('</body>', () => `<script type="module">${js}</script></body>`);

if (!html.includes('<meta name="robots" content="noindex, nofollow"')) throw new Error('Meta robots noindex absente.');
const leftovers = html.match(/(?:src|href|srcset)="\/(?:images|assets|favicon)[^"]*/g);
if (leftovers) throw new Error(`Références non embarquées : ${leftovers.slice(0, 3).join(', ')}`);

await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, html);
const size = Buffer.byteLength(html) / 1024 / 1024;
console.log(`Aperçu autonome : ${destination} (${size.toFixed(2)} Mo)`);
if (size >= 16) { console.error('ERREUR : le fichier dépasse 16 Mo.'); process.exitCode = 1; }
