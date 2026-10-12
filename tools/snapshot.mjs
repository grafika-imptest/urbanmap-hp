// Jednorázový snapshot homepage urbanmap.cz -> statické soubory v ../public
// Použití: node tools/snapshot.mjs [cesta k raw index.html]
// Raw HTML se stahuje z https://urbanmap.cz/ (SSR výstup Next.js).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ORIGIN = 'https://urbanmap.cz';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'public');
const rawPath = process.argv[2] || path.join(ROOT, '_raw', 'index.html');

let html = fs.readFileSync(rawPath, 'utf8');
for (const d of ['assets/css', 'assets/fonts', 'assets/img']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const decode = (s) => s.replace(/&amp;/g, '&');
const extFromType = (t = '') => ({ 'image/webp': '.webp', 'image/avif': '.avif', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/svg+xml': '.svg', 'image/gif': '.gif', 'image/x-icon': '.ico' })[t.split(';')[0].trim()] || '';

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/webp,image/*,*/*' } });
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') || '' };
    } catch (e) { if (i === 2) throw e; }
  }
}

// --- 1) Odstranit Next.js runtime, RSC payload a měření -------------------
html = html.replace(/<script\b[^>]*\bsrc="[^"]*"[^>]*><\/script>/g, '');
html = html.replace(/<script>([\s\S]*?)<\/script>/g, (m, body) => (body.includes('localStorage.getItem("tema")') ? m : ''));
html = html.replace(/<link rel="preload" as="script"[^>]*\/>/g, '');
html = html.replace(/<noscript><iframe src="https:\/\/www\.googletagmanager\.com[\s\S]*?<\/noscript>/g, '');
html = html.replace(/<meta name="next-size-adjust"[^>]*\/>/g, '');

// --- 2) CSS + fonty -------------------------------------------------------
const cssLinks = [...html.matchAll(/<link rel="stylesheet" href="(\/[^"]+\.css)"[^>]*\/>/g)];
for (const [tag, href] of cssLinks) {
  const name = path.basename(href);
  let css = (await get(ORIGIN + href)).buf.toString('utf8');
  // url(...) v CSS bývají relativní k /_next/static/chunks/ (např. ../media/font.woff)
  const urls = [...new Set([...css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)].map((m) => m[2]).filter((u) => !u.startsWith('data:')))];
  for (const u of urls) {
    const abs = new URL(u, ORIGIN + href).href;
    const fname = path.basename(new URL(abs).pathname);
    const dir = /\.(woff2?|ttf|otf)$/i.test(fname) ? 'fonts' : 'img';
    const { buf } = await get(abs);
    fs.writeFileSync(path.join(OUT, 'assets', dir, fname), buf);
    css = css.split(u).join(`../${dir}/${fname}`);
  }
  fs.writeFileSync(path.join(OUT, 'assets/css', name), css);
  html = html.replace(tag, `<link rel="stylesheet" href="assets/css/${name}"/>`);
  console.log('css', name, urls.length, 'fontů');
}

// --- 3) Obrázky (src, srcSet, preload) -----------------------------------
const isAsset = (p) => p.startsWith('/_next/image') || /\.(svg|png|jpe?g|webp|avif|gif|ico)(\?|$)/i.test(p);
const assetUrls = new Set();
html.replace(/\s(?:src|href)="(\/[^"?][^"]*)"/g, (m, p) => { if (isAsset(decode(p))) assetUrls.add(p); return m; });
html.replace(/\s(?:srcSet|srcset|imageSrcSet)="([^"]+)"/g, (m, v) => {
  v.split(',').map((s) => s.trim().split(/\s+/)[0]).forEach((p) => p.startsWith('/') && assetUrls.add(p));
  return m;
});

const map = new Map();
const list = [...assetUrls];
let done = 0;
async function worker() {
  while (list.length) {
    const p = list.shift();
    const real = decode(p);
    let base = real;
    let w = '';
    if (real.startsWith('/_next/image')) {
      const q = new URL(ORIGIN + real).searchParams;
      base = q.get('url');
      w = '-' + q.get('w');
    }
    const stem = path.basename(base.split('?')[0]).replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40);
    const hash = crypto.createHash('sha1').update(base).digest('hex').slice(0, 6);
    try {
      const { buf, type } = await get(ORIGIN + real);
      const ext = extFromType(type) || path.extname(base.split('?')[0]) || '.bin';
      const fname = `${stem}-${hash}${w}${ext}`;
      fs.writeFileSync(path.join(OUT, 'assets/img', fname), buf);
      map.set(p, 'assets/img/' + fname);
    } catch (e) {
      console.warn('CHYBA', real, e.message);
    }
    if (++done % 25 === 0) console.log('obrázky', done);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const swap = (p) => map.get(p) || p;
html = html.replace(/(\s(?:src|href)=")(\/[^"?][^"]*)"/g, (m, a, p) => (map.has(p) ? a + swap(p) + '"' : m));
html = html.replace(/(\s(?:srcSet|srcset|imageSrcSet)=")([^"]+)"/g, (m, a, v) =>
  a + v.split(',').map((s) => { const [u, ...r] = s.trim().split(/\s+/); return [swap(u), ...r].join(' '); }).join(', ') + '"');

// --- 4) Ostatní interní odkazy míří na živý web --------------------------
html = html.replace(/(\s(?:href|action)=")\/(?!\/)([^"]*)"/g, (m, a, p) => `${a}${ORIGIN}/${p}"`);

// --- 5) Vlastní skripty kopie (mapa, cookie lišta) -----------------------
html = html.replace('</head>',
  '<link rel="stylesheet" href="assets/css/kopie.css"/></head>');
html = html.replace('</body>',
  '<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>' +
  '<script src="assets/js/kopie.js"></script></body>');

fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('hotovo:', map.size, 'obrázků, index.html', (html.length / 1024).toFixed(0), 'kB');
