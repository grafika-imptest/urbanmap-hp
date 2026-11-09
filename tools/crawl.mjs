// Stáhne vykreslený DOM všech stránek urbanmap.cz (sitemap + podmínky) přes headless Chrome.
// Detaily projektů, developerů a článků se na živém webu skládají až v prohlížeči,
// proto nestačí obyčejný fetch. Výstup: _raw/dom/<cesta>.html
// Použití: node tools/crawl.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const OUT = path.join(ROOT, '_raw', 'dom');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const force = process.argv.includes('--force');

const sitemap = await (await fetch('https://urbanmap.cz/sitemap.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
urls.push('https://urbanmap.cz/podminky');

function dump(url, profile) {
  return new Promise((resolve, reject) => {
    execFile(CHROME, ['--headless=new', '--disable-gpu', '--virtual-time-budget=10000', `--user-data-dir=${profile}`, '--dump-dom', url],
      { maxBuffer: 64 * 1024 * 1024, timeout: 90000 }, (err, stdout) => (err ? reject(err) : resolve(stdout)));
  });
}

let i = 0, ok = 0;
async function worker(n) {
  const profile = path.join(os.tmpdir(), 'um-crawl-' + n);
  while (i < urls.length) {
    const url = urls[i++];
    const p = new URL(url).pathname;
    const file = path.join(OUT, (p === '/' ? 'index' : p.slice(1)) + '.html');
    if (!force && fs.existsSync(file)) { ok++; continue; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    try {
      const html = await dump(url, profile);
      fs.writeFileSync(file, html);
      ok++;
    } catch (e) { console.warn('CHYBA', url, e.message); }
    if (ok % 10 === 0) console.log(ok + '/' + urls.length);
  }
}
await Promise.all([0, 1, 2, 3].map(worker));
console.log('hotovo', ok, '/', urls.length);
