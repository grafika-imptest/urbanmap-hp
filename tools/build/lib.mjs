// Sdílené pomůcky buildu: data, formátování, média, layout stránky (hlavička a patička z HP), ikony, karty.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
export const PUB = path.join(ROOT, 'public');
export const P = 'katalog-module__1b44Qq__';
export const ORIGIN = 'https://urbanmap.cz';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nb = (s) => s.replace(/ /g, ' ');
export const kc = (n) => (n == null ? null : nb(Math.round(n).toLocaleString('cs-CZ').replace(/\s/g, ' ') + ' Kč'));
// Pod milion v tisících (např. parkovací stání), jinak v milionech na jedno desetinné místo
export const mil = (n) => (n == null ? null : n < 1e6 ? nb(Math.round(n / 1000) + ' tis. Kč') : nb((n / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' mil. Kč'));
export const cislo = (n) => nb(Number(n).toLocaleString('cs-CZ').replace(/\s/g, ' '));
export const plural = (n, a, b, c) => (n === 1 ? a : n >= 2 && n <= 4 ? b : c);

// Kategorie projektů (štítky z HP) — barvy jsou tokeny původního webu
export const KATEGORIE = {
  'Rezidenční': { slug: 'rezidencni', barva: 'var(--k-kat-rezidencni)', ikona: 'budova' },
  'Investiční': { slug: 'investicni', barva: 'var(--k-kat-investicni)', ikona: 'rust' },
  'Rekreační': { slug: 'rekreacni', barva: 'var(--k-kat-rekreacni)', ikona: 'hory' },
  'Luxusní': { slug: 'luxusni', barva: 'var(--k-kat-luxusni)', ikona: 'diamant' },
  'Rodinné domy': { slug: 'rodinne', barva: 'var(--k-kat-rodinne)', ikona: 'dum' },
};
export const STAVY = {
  predprodej: 'V předprodeji', v_prodeji: 'V prodeji', pripravovany: 'Připravovaný',
  v_realizaci: 'V realizaci', dokonceny: 'Dokončený', vyprodano: 'Vyprodáno',
};

// Obec z názvu lokality: „Brno - Černovice“ → Brno, „Praha 5“ → Praha, „Plzeň 3 – Skvrňany“ → Plzeň.
// „Rostěnice-Zvonovice“ je název obce, proto se dělí jen na pomlčce s mezerami (Brno/Praha zvlášť).
export function obecZ(lokalita) {
  if (!lokalita) return null;
  if (/^Brno\b/.test(lokalita)) return 'Brno';
  if (/^Praha\b/.test(lokalita)) return 'Praha';
  return lokalita.split(/\s+[-–]\s+/)[0].replace(/\s+\d+$/, '').trim();
}

// Jediný zahraniční projekt je Altea (Španělsko); JSON-LD živého webu u něj chybně uvádí CZ.
const CZ_BBOX = { s: 48.5, n: 51.1, w: 12.0, e: 18.9 };
export const zeme = (p) => (p.lat >= CZ_BBOX.s && p.lat <= CZ_BBOX.n && p.lon >= CZ_BBOX.w && p.lon <= CZ_BBOX.e ? 'CZ' : 'ES');
export const ZEME = { CZ: 'Česko', ES: 'Španělsko' };

export function vzdalenostKm(a, b) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// --- Média: stahují se přes optimalizaci urbanmap.cz (/_next/image), lokálně se cachují ---------
const MEDIA = path.join(PUB, 'assets', 'media');
fs.mkdirSync(MEDIA, { recursive: true });
const fronta = new Map();
const pouzite = new Set();
export function media(url, w = 1200) {
  if (!url) return null;
  const svg = /\.svg($|\?)/i.test(url); // SVG optimalizace Next.js nebere — stahuje se napřímo
  if (svg) w = 0;
  const hash = crypto.createHash('sha1').update(url + '|' + w).digest('hex').slice(0, 12);
  const name = svg ? `${hash}.svg` : `${hash}-${w}.webp`;
  pouzite.add(name);
  if (!fs.existsSync(path.join(MEDIA, name))) fronta.set(name, { url, w });
  return 'assets/media/' + name;
}
export async function stahniMedia() {
  const list = [...fronta.entries()];
  let i = 0, chyby = 0;
  async function worker() {
    while (i < list.length) {
      const [name, { url, w }] = list[i++];
      const src = w ? `${ORIGIN}/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75` : new URL(url, ORIGIN).href;
      try {
        const r = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/webp,image/*' } });
        if (!r.ok) throw new Error(r.status);
        fs.writeFileSync(path.join(MEDIA, name), Buffer.from(await r.arrayBuffer()));
      } catch (e) { chyby++; console.warn('médium', url, e.message); }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  if (list.length) console.log('média staženo', list.length - chyby, '/', list.length);
  // Úklid: soubory, na které už žádná stránka neodkazuje
  const stare = fs.readdirSync(MEDIA).filter((f) => !pouzite.has(f));
  stare.forEach((f) => fs.unlinkSync(path.join(MEDIA, f)));
  if (stare.length) console.log('média smazáno (nepoužitá)', stare.length);
}

// --- Ikony (inline SVG, 24×24, stroke) ---------------------------------------------------
const I = {
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  sipka: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  zpet: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  srdce: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  porovnat: '<path d="M8 3v18M16 3v18M3 8h5M16 16h5"/>',
  zvonek: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  telefon: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  dum: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  plocha: '<path d="M4 4h16v16H4z"/><path d="M4 9h5V4M15 20v-5h5"/>',
  cena: '<path d="M4 12V4h8l8 8-8 8z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
  kalendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  klic: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  graf: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  fotky: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sdilet: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  filtr: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  mapa: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  mrizka: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  hledat: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  budova: '<path d="M5 21V5l7-2v18M12 8l7 2v11M3 21h18M8 8v.01M8 12v.01M8 16v.01M15 13v.01M15 17v.01"/>',
  hvezda: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  kalkulacka: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  ctení: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  svet: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9"/>',
  stit: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  blesk: '<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',
  rust: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  hory: '<path d="M2 19 8.5 8l3 5"/><path d="M10.5 10.5 14 5l8 14"/><path d="M9 19v-4l3-2.5 3 2.5v4z"/>',
  diamant: '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
  vodovaha: '<path d="M3 12h18M3 6h18M3 18h18"/>',
};
export const ikona = (n, cls = 'u-ico') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

// Ikona pro položku vybavení podle klíčových slov (fallback: check)
export function ikonaVybaveni(t) {
  const s = t.toLowerCase();
  if (/energ|tepeln|fotovolt|čerpadl|rekuper/.test(s)) return 'blesk';
  if (/park|garáž|stání/.test(s)) return 'dum';
  if (/zahrad|terasa|balkon|lodži|předzahr/.test(s)) return 'plocha';
  if (/chytr|smart|čip|kamer|zabezp/.test(s)) return 'stit';
  if (/výtah|sklep|komor/.test(s)) return 'budova';
  return 'check';
}

// --- Hlavička, patička a cookie lišta z HP (stejný vzhled 1:1) -----------------------------
let chrome = null;
export function nactiChrome(hpHtml) {
  const vyrez = (start, endTag) => {
    const i = hpHtml.indexOf(start);
    if (i < 0) throw new Error('V HP chybí ' + start);
    const j = hpHtml.indexOf(endTag, i) + endTag.length;
    return hpHtml.slice(i, j);
  };
  chrome = {
    htmlClass: (hpHtml.match(/<html[^>]*class="([^"]*)"/) || [])[1] || '',
    css: [...hpHtml.matchAll(/<link rel="stylesheet" href="(assets\/css\/[^"]+)"\/>/g)].map((m) => m[1]).filter((h) => !h.endsWith('kopie.css')),
    header: vyrez(`<header class="${P}bleed ${P}hlavicka"`, '</header>'),
    footer: vyrez(`<footer class="${P}paticka"`, '</footer>'),
    cookie: vyrez(`<section class="${P}cookieLista"`, '</section>'),
    tema: (hpHtml.match(/<script>\(function\(\)\{try\{var t=localStorage[\s\S]*?<\/script>/) || [''])[0],
  };
  return chrome;
}

// Odkazy z HP (už relativní k rootu) přepočteme na hloubku stránky.
const prefixuj = (html, R) => (R ? html.replace(/(\s(?:href|src|action)=")(?!https?:|mailto:|tel:|#|\/\/|data:)([^"]*)"/g, (m, a, u) => `${a}${R}${u}"`) : html);

export function stranka({ R = '', title, description = '', active = '', body, mapa = false, bodyAttr = '', ogImage = '' }) {
  if (!chrome) throw new Error('nactiChrome() nezavoláno');
  let header = prefixuj(chrome.header, R);
  if (active) header = header.replace(new RegExp(`(<a class="${P}navOdkaz") (href="[^"]*${active}[^"]*")`), `$1 aria-current="page" $2`);
  return `<!DOCTYPE html><html lang="cs" class="${chrome.htmlClass}"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/>${ogImage ? `<meta property="og:image" content="${R}${ogImage}"/>` : ''}
${chrome.css.map((h) => `<link rel="stylesheet" href="${R}${h}"/>`).join('')}
<link rel="icon" type="image/svg+xml" href="${R}assets/img/logo/favicon.svg"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&amp;display=swap"/>
<link rel="stylesheet" href="${R}assets/css/kopie.css"/><link rel="stylesheet" href="${R}assets/css/site.css"/>
${chrome.tema}</head><body ${bodyAttr}><main class="${P}stranka">${header}<div class="u-page">${body}</div>${prefixuj(chrome.footer, R)}${prefixuj(chrome.cookie, R)}</main>
${dialogy()}
${mapa ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.js"></script>' : ''}<script>window.UM_R=${JSON.stringify(R)};</script><script src="${R}assets/js/kopie.js"></script><script src="${R}assets/js/site.js"></script></body></html>`;
}

// Společné dialogy: poptávka a hlídací pes. Nic neodesílají — náhled UI.
function dialogy() {
  return `<dialog class="u-dialog" id="u-poptavka" aria-labelledby="u-poptavka-nadpis"><form method="dialog" class="u-dialog__okno" data-formular="poptavka">
<button class="u-dialog__zavrit" value="zavrit" aria-label="Zavřít">${ikona('x')}</button>
<span class="u-eyebrow" data-pole="kontext">Poptávka</span><h2 class="u-h3" id="u-poptavka-nadpis" data-pole="nadpis">Mám zájem</h2>
<div class="u-segment" role="radiogroup" aria-label="Co potřebujete">
<label><input type="radio" name="typ" value="cenik" checked/><span>Ceník a dostupnost</span></label>
<label><input type="radio" name="typ" value="prohlidka"/><span>Prohlídka</span></label>
<label><input type="radio" name="typ" value="dotaz"/><span>Dotaz</span></label></div>
<div class="u-pole-mrizka"><label class="u-pole"><span>Jméno a příjmení</span><input name="jmeno" autocomplete="name" required/></label>
<label class="u-pole"><span>E-mail</span><input type="email" name="email" autocomplete="email" required/></label>
<label class="u-pole"><span>Telefon</span><input type="tel" name="telefon" autocomplete="tel"/></label>
<label class="u-pole u-pole--siroke"><span>Zpráva</span><textarea name="zprava" rows="3" data-pole="zprava"></textarea></label></div>
<p class="u-drobne">Zprávu dostane přímo kancelář nebo developer, který projekt prodává. Odesláním souhlasíte s předáním údajů.</p>
<button class="u-btn u-btn--primarni u-btn--plne" value="odeslat">Odeslat poptávku ${ikona('sipka')}</button>
<div class="u-dialog__hotovo" hidden>${ikona('check', 'u-ico u-ico--velka')}<h3 class="u-h3">Hotovo</h3><p>V tomto náhledu se poptávka nikam neodesílá.</p></div>
</form></dialog>
<dialog class="u-dialog" id="u-hlidani" aria-labelledby="u-hlidani-nadpis"><form method="dialog" class="u-dialog__okno" data-formular="hlidani">
<button class="u-dialog__zavrit" value="zavrit" aria-label="Zavřít">${ikona('x')}</button>
<span class="u-eyebrow">${ikona('zvonek')} Hlídací pes</span><h2 class="u-h3" id="u-hlidani-nadpis" data-pole="nadpis">Pošleme vám nové projekty</h2>
<p class="u-lead-s" data-pole="popis">Jakmile se objeví projekt, který odpovídá vašemu hledání, dáme vědět e-mailem.</p>
<label class="u-pole"><span>E-mail</span><input type="email" name="email" autocomplete="email" required/></label>
<div class="u-segment" role="radiogroup" aria-label="Jak často"><label><input type="radio" name="frekvence" value="hned" checked/><span>Hned</span></label><label><input type="radio" name="frekvence" value="tyden"/><span>Jednou týdně</span></label></div>
<button class="u-btn u-btn--primarni u-btn--plne" value="odeslat">Zapnout hlídání ${ikona('zvonek')}</button>
<div class="u-dialog__hotovo" hidden>${ikona('check', 'u-ico u-ico--velka')}<h3 class="u-h3">Hlídání zapnuto</h3><p>V tomto náhledu se nic neukládá.</p></div>
</form></dialog>
<dialog class="u-dialog u-dialog--galerie" id="u-galerie" aria-label="Galerie"><div class="u-galerie-dialog"><button class="u-dialog__zavrit" data-zavrit aria-label="Zavřít">${ikona('x')}</button><img alt=""/><button class="u-galerie-dialog__sipka" data-smer="-1" aria-label="Předchozí">${ikona('zpet')}</button><button class="u-galerie-dialog__sipka" data-smer="1" aria-label="Další">${ikona('sipka')}</button><span class="u-galerie-dialog__pocet"></span></div></dialog>`;
}

// --- Stavební bloky ---------------------------------------------------------------------
export const stitekStavu = (p, plny = true) => (p.status ? `<span class="${P}stitek${plny ? ' ' + P + 'stitekPlny' : ''}" data-stav="${p.status}">${esc(p.statusText || STAVY[p.status])}</span>` : '');
export const kategorieProjektu = (p) => p.tags.filter((t) => KATEGORIE[t]);
export const lifestyleProjektu = (p) => p.tags.filter((t) => !KATEGORIE[t]);

export function cenaProjektu(p) {
  return p.priceFrom ? `od ${mil(p.priceFrom)}` : 'Cena na vyžádání';
}

// Karta projektu — karusel fotek, stav, uložit/porovnat, klíčová data, poptávka přímo z karty
export function kartaProjektu(p, R, { velka = false } = {}) {
  const foto = p.images.slice(0, 4);
  const kat = kategorieProjektu(p);
  const data = {
    id: p.id, stav: p.status, kat: kat.map((k) => KATEGORIE[k].slug).join(' '), disp: p.layouts.join(' '),
    cena: p.priceFrom || '', m2: p.priceM2 || '', obec: obecZ(p.cityKey || p.city), zeme: zeme(p), lat: p.lat, lon: p.lon,
    tagy: lifestyleProjektu(p).map(slugify).join(' '), volne: p.unitsAvailable ?? '', nazev: p.name,
  };
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<article class="u-pcard${velka ? ' u-pcard--velka' : ''}" ${attrs}>
<div class="u-pcard__foto"><div class="u-pcard__karusel" tabindex="-1">${foto.map((u, i) => `<img src="${R}${media(u, 640)}" alt="${i ? '' : esc(p.name)}" loading="lazy" decoding="async"/>`).join('')}</div>
${foto.length > 1 ? `<div class="u-pcard__tecky" aria-hidden="true">${foto.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
<div class="u-pcard__horni">${stitekStavu(p)}${kat.slice(0, 1).map((k) => `<span class="u-kat" style="--barva:${KATEGORIE[k].barva}">${esc(k)}</span>`).join('')}</div>
<div class="u-pcard__akce"><button type="button" class="u-ikbtn" data-ulozit="${p.id}" aria-label="Uložit projekt" aria-pressed="false">${ikona('srdce')}</button><button type="button" class="u-ikbtn" data-porovnat="${p.id}" aria-label="Přidat k porovnání" aria-pressed="false">${ikona('porovnat')}</button></div></div>
<a class="u-pcard__telo" href="${R}projekt/${p.id}/">
<span class="u-pcard__misto">${ikona('pin')}${esc(p.city)} · ${esc(p.developer.name)}</span>
<h3 class="u-pcard__nazev">${esc(p.name)}</h3>
<span class="u-pcard__cena"><b>${cenaProjektu(p)}</b>${p.priceM2 ? `<span>${kc(p.priceM2)}/m²</span>` : ''}</span>
<span class="u-pcard__fakta">${p.layouts.length ? `<span>${ikona('dum')}${esc(p.layouts.length > 3 ? p.layouts[0] + ' – ' + p.layouts.at(-1) : p.layouts.join(', '))}</span>` : ''}${p.unitsAvailable ? `<span>${ikona('klic')}${p.unitsAvailable} ${plural(p.unitsAvailable, 'volná jednotka', 'volné jednotky', 'volných jednotek')}</span>` : ''}${p.completion ? `<span>${ikona('kalendar')}${esc(p.completion)}</span>` : ''}</span></a>
<button type="button" class="u-pcard__zajem" data-poptavka="${esc(p.name)}" data-kontext="${esc(p.city)} · ${esc(p.developer.name)}">Mám zájem ${ikona('sipka')}</button>
</article>`;
}

export function sekceHlava({ eyebrow, nadpis, text = '', odkaz = null, id = '' }) {
  return `<div class="u-shead"${id ? ` id="${id}"` : ''}><div>${eyebrow ? `<span class="u-eyebrow">${eyebrow}</span>` : ''}<h2 class="u-h2">${nadpis}</h2></div>${text || odkaz ? `<div class="u-shead__aside">${text ? `<p>${text}</p>` : ''}${odkaz ? `<a class="u-link" href="${odkaz.href}">${odkaz.text} ${ikona('sipka')}</a>` : ''}</div>` : ''}</div>`;
}

export const drobecky = (R, items) => `<nav class="u-crumbs" aria-label="Drobečková navigace"><a href="${R}index.html">Urbanmap</a>${items.map(([t, h]) => (h ? `<a href="${h}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`)).join('')}</nav>`;

// Pás „Hlídací pes“ — opakovaný lead na výpisech, lokalitách i v magazínu
export function pasHlidani({ nadpis = 'Nový projekt vám neuteče', text = 'Nastavte si hlídání a jako první se dozvíte o projektech, které odpovídají vašemu hledání.', kontext = '' } = {}) {
  return `<section class="u-band"><div class="u-band__text"><span class="u-eyebrow u-eyebrow--svetle">${ikona('zvonek')} Hlídací pes</span><h2 class="u-h2">${nadpis}</h2><p>${text}</p></div>
<form class="u-band__form" data-hlidani-inline="${esc(kontext)}"><label class="u-pole u-pole--tmave"><span>E-mail</span><input type="email" name="email" placeholder="vas@email.cz" autocomplete="email" required/></label><button class="u-btn u-btn--primarni">Hlídat ${ikona('zvonek')}</button><p class="u-drobne">Bez spamu, odhlásit jde jedním klikem.</p></form></section>`;
}

// Mapa: data bodů jako JSON v atributu, inicializuje site.js
export function mapa(body, { vyska = '', id = '', zaber = 'cz' } = {}) {
  return `<div class="u-map${vyska ? ' u-map--' + vyska : ''}"${id ? ` id="${id}"` : ''} data-mapa='${esc(JSON.stringify(body))}' data-zaber="${zaber}"><span class="u-map__nacitani">Mapa se načítá…</span></div>`;
}
export const bodProjektu = (p, R) => ({ id: p.id, lat: p.lat, lon: p.lon, n: p.name, c: cenaProjektu(p), h: `${R}projekt/${p.id}/`, i: p.images[0] ? R + media(p.images[0], 640) : '' });

export function zapis(rel, html) {
  const f = path.join(PUB, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}
