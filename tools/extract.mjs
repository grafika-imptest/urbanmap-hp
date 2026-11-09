// Vytáhne data z vykreslených stránek urbanmap.cz (_raw/dom, viz crawl.mjs) do data/site.json.
// Žádná data se tu nevymýšlejí: co na živém webu není, zůstane null.
// Použití: node tools/extract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { parseHTML } from 'linkedom';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const DOM = path.join(ROOT, '_raw', 'dom');
const P = 'katalog-module__1b44Qq__';

const load = (f) => parseHTML(fs.readFileSync(path.join(DOM, f), 'utf8')).document;
const $ = (root, cls) => root.querySelector('.' + P + cls);
const $$ = (root, cls) => [...root.querySelectorAll('.' + P + cls)];
const txt = (el) => (el ? el.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : null);
const num = (s) => (s ? Number(String(s).replace(/[^\d]/g, '')) || null : null);
// Obrázky jsou v DOM jako /_next/image?url=<původní>&w=..; uložíme původní URL, build si je stáhne přes urbanmap.cz
const imgUrl = (src) => {
  if (!src) return null;
  const s = src.replace(/&amp;/g, '&');
  if (s.includes('/_next/image')) return new URL(s, 'https://urbanmap.cz').searchParams.get('url');
  return s;
};
const kv = (dl) => {
  const o = {};
  if (!dl) return o;
  for (const d of dl.querySelectorAll(':scope > div')) {
    const k = txt(d.querySelector('dt'));
    const dd = d.querySelector('dd');
    if (k) o[k] = { text: txt(dd), href: dd.querySelector('a')?.getAttribute('href') || null };
  }
  return o;
};
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// --- Karty z homepage (počet volných jednotek, kategorie, dokončení) ------------------
const hp = fs.readFileSync(path.join(ROOT, '_raw', 'index.html'), 'utf8');
const payload = [...hp.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)].map((m) => JSON.parse('"' + m[1] + '"')).join('');
const karty = new Map();
for (const m of payload.matchAll(/\{"id":"(cm[a-z0-9]+)","nazev"/g)) {
  let d = 0, i = m.index;
  for (; i < payload.length; i++) { if (payload[i] === '{') d++; else if (payload[i] === '}' && !--d) break; }
  try { const o = JSON.parse(payload.slice(m.index, i + 1)); karty.set(o.id, { ...(karty.get(o.id) || {}), ...o }); } catch {}
}
const hpDoc = parseHTML(hp).document;
const volna = new Map([...hpDoc.querySelectorAll('a[data-projekt][data-volna]')].map((a) => [a.dataset.projekt, Number(a.dataset.volna)]));

// --- Projekty ---------------------------------------------------------------------------
const projects = [];
for (const f of fs.readdirSync(path.join(DOM, 'projekt'))) {
  const doc = load('projekt/' + f);
  const id = f.replace('.html', '');
  // Na stránce je víc JSON-LD (WebSite, projekt…) — bereme ten, který popisuje projekt.
  const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch { return {}; } })
    .find((o) => o['@type'] && o['@type'] !== 'WebSite' && o['@type'] !== 'BreadcrumbList') || {};
  const hlava = $(doc, 'detailHlava');
  const fakta = kv($(doc, 'detailObsah')?.querySelector('dl'));
  const bloky = Object.fromEntries($$(doc, 'blok').map((b) => [txt($(b, 'blokNadpis')), b]));
  const kontakt = kv(bloky['Kontakt na developera']?.querySelector('dl'));
  const mestoA = hlava?.querySelector('.' + P + 'meta a');
  const stav = $(hlava, 'detailMeta')?.querySelector('[data-stav]');
  const devHref = ld.brand?.url || fakta.Developer?.href || '';
  const karta = karty.get(id) || {};
  projects.push({
    id,
    name: ld.name || txt(hlava?.querySelector('h1')),
    slogan: txt($(hlava, 'lead')),
    city: txt(mestoA),
    cityKey: mestoA ? new URL(mestoA.getAttribute('href'), 'https://urbanmap.cz').searchParams.get('mesto') : null,
    address: ld.address?.streetAddress || null,
    country: ld.address?.addressCountry || null,
    lat: ld.geo?.latitude ?? null,
    lon: ld.geo?.longitude ?? null,
    status: stav?.dataset.stav || null,
    statusText: txt(stav),
    developer: { slug: devHref.split('/developer/')[1]?.split(/[/?#]/)[0] || null, name: ld.brand?.name || fakta.Developer?.text || null },
    priceFrom: ld.offers?.lowPrice ?? num(fakta['Cena od']?.text),
    priceTo: ld.offers?.highPrice ?? null,
    priceFromText: fakta['Cena od']?.text || null,
    priceM2: num(fakta['Cena / m²']?.text),
    priceM2Text: fakta['Cena / m²']?.text || null,
    layouts: (fakta.Dispozice?.text || '').split(',').map((s) => s.trim()).filter((s) => s && s !== '–'),
    areas: fakta.Plochy?.text || null,
    completion: fakta['Dokončení']?.text || (karta.dokonceni && karta.dokonceni !== '–' ? karta.dokonceni : null),
    web: fakta['Web projektu']?.text || null,
    description: (bloky['O projektu']?.querySelector('p')?.textContent || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
    amenities: [...(bloky['Vybavení a plusy']?.querySelectorAll('li') || [])].map(txt),
    contact: {
      person: kontakt['Kontaktní osoba']?.text || null,
      email: kontakt['E-mail']?.text || null,
      phone: kontakt.Telefon?.text || null,
      seat: kontakt['Sídlo']?.text || null,
    },
    images: (ld.image || []).map(imgUrl).filter(Boolean),
    unitsAvailable: volna.get(id) ?? null,
    tags: karta.stitky || [],
  });
}

// --- Developeři -------------------------------------------------------------------------
const developers = [];
for (const f of fs.readdirSync(path.join(DOM, 'developer'))) {
  const doc = load('developer/' + f);
  const slug = f.replace('.html', '');
  const boxy = Object.fromEntries($$(doc, 'devBox').map((b) => [txt(b.querySelector('.' + P + 'meta')), { text: txt($(b, 'devBoxHodnota')), href: b.getAttribute('href') }]));
  const logo = $(doc, 'devLogo')?.querySelector('img');
  developers.push({
    slug,
    name: txt($(doc, 'devHlava')?.querySelector('h1')),
    description: txt($(doc, 'devHlava')?.querySelector('.' + P + 'odstavce')),
    logo: imgUrl(logo?.getAttribute('src')),
    logoDark: logo?.dataset.tmave === 'true',
    founded: num(boxy['Rok založení']?.text),
    seat: boxy['Sídlo']?.text || null,
    web: boxy['Web developera']?.text || null,
    totalValueText: boxy['Součet cen všech jednotek']?.text || null,
    projectIds: [...doc.querySelectorAll('#projekty a[data-id]')].map((a) => a.dataset.id),
  });
}

// --- Magazín ----------------------------------------------------------------------------
const articles = [];
for (const f of fs.readdirSync(path.join(DOM, 'magazin'))) {
  const doc = load('magazin/' + f);
  const hlava = $(doc, 'magHlava');
  const meta = [...($(hlava, 'magMeta')?.children || [])].map(txt);
  articles.push({
    slug: f.replace('.html', ''),
    title: txt(hlava?.querySelector('h1')),
    perex: txt($(hlava, 'magUvod')),
    category: meta[0] || null,
    date: meta[1] || null,
    readTime: meta[2] || null,
    author: txt(hlava?.querySelector('.' + P + 'meta'))?.replace(/^Autor:\s*/, '') || null,
    image: imgUrl($(doc, 'magObrazek')?.getAttribute('src')),
    html: $(doc, 'magText')?.innerHTML.trim() || '',
  });
}
articles.sort((a, b) => {
  const d = (s) => { const [dd, mm, yy] = (s || '').split('.').map((x) => +x.trim()); return new Date(yy, mm - 1, dd).getTime() || 0; };
  return d(b.date) - d(a.date);
});

// --- Lokality (z karet na /lokality + agregace z projektů) -------------------------------
const lokDoc = load('lokality.html');
const lokKarty = $$(lokDoc, 'lcard').map((c) => ({ name: txt($(c, 'lcardNazev')), href: c.getAttribute('href') }));
const cities = new Map();
for (const p of projects) {
  const key = p.cityKey || p.city;
  if (!key) continue;
  const c = cities.get(key) || { key, name: p.city, slug: slugify(key), projectIds: [] };
  c.projectIds.push(p.id);
  cities.set(key, c);
}

// --- Pro developery (ceník balíčků a texty, beze změny obsahu) ----------------------------
const proDoc = load('pro-developery.html');
const plans = $$(proDoc, 'cenikKarta').map((k) => ({
  name: txt($(k, 'cenikNazev')),
  badge: txt($(k, 'cenikStitek')),
  price: txt($(k, 'cenikCena')),
  note: txt($(k, 'cenikPopis')),
  features: [...k.querySelectorAll('li')].map(txt),
  extra: txt($(k, 'cenikNavic')),
}));
const proBloky = $$(proDoc, 'blok').map((b) => ({ title: txt($(b, 'blokNadpis')), items: [...b.querySelectorAll('li, p')].map(txt).filter(Boolean) }));

// --- Kraje a investiční profil ---------------------------------------------------------
// U projektu je živý web nemá, ale umí podle nich filtrovat: členství zjistíme z filtrovaných
// výpisů (SSR výpis obsahuje a[data-projekt]). Mapa krajů = SVG z konfigurátoru na HP.
const kraje = [...hpDoc.querySelectorAll('svg.' + P + 'mapaKraju a[data-kraj]')].map((a) => ({
  slug: a.dataset.kraj,
  name: (a.getAttribute('aria-label') || '').split(' · ')[0],
  d: [...a.querySelectorAll('path')].map((p) => p.getAttribute('d')).join(' '),
})).filter((k, i, a) => a.findIndex((x) => x.slug === k.slug) === i); // mapa je na HP dvakrát (filtr + konfigurátor)
const krajSvg = hpDoc.querySelector('svg.' + P + 'mapaKraju')?.getAttribute('viewBox') || '0 0 1000 569';
const INVEST = { pronajem: 'Vhodné na pronájem', flip: 'Vhodné na flip', turisticka: 'Turistická lokalita', studentska: 'Studentská lokalita', nizky_vstup: 'Nízká vstupní cena', premium: 'Premium segment', kratkodoby_pronajem: 'Krátkodobý pronájem', yield: 'Vysoký yield', rust_lokality: 'Očekávaný růst lokality' };
async function clenove(param) {
  const html = await (await fetch('https://urbanmap.cz/?' + param, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  return new Set([...html.matchAll(/data-projekt="(cm[a-z0-9]+)"/g)].map((m) => m[1]));
}
for (const k of kraje) {
  const ids = await clenove('kraj=' + k.slug);
  k.count = ids.size;
  for (const p of projects) if (ids.has(p.id)) p.kraj = k.slug;
}
const invest = [];
for (const [key, label] of Object.entries(INVEST)) {
  const ids = await clenove('invest=' + key);
  invest.push({ key, label, count: ids.size });
  for (const p of projects) if (ids.has(p.id)) (p.invest ||= []).push(key);
}
for (const p of projects) { p.kraj ||= null; p.invest ||= []; }

// --- Podmínky (text) --------------------------------------------------------------------
const podDoc = load('podminky.html');
const podminky = (podDoc.querySelector('.' + P + 'obsah article') || $(podDoc, 'obsah'))?.innerHTML || '';

const out = { generated: new Date().toISOString(), projects, developers, articles, cities: [...cities.values()], lokalityKarty: lokKarty, kraje, krajSvg, invest, plans, proBloky, podminkyHtml: podminky };
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'site.json'), JSON.stringify(out, null, 1));
console.log('projekty', projects.length, '| developeři', developers.length, '| články', articles.length, '| města', cities.size, '| balíčky', plans.length);
