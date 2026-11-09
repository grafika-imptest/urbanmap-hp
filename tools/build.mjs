// Generuje podstránky kopie urbanmap.cz z data/site.json (viz extract.mjs) do public/.
// HP (public/index.html) zůstává ručně upravená — build v ní jen převede odkazy z živého webu na lokální stránky.
// Použití: node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PUB, ROOT, obecZ, slugify, zeme, nactiChrome, stahniMedia, vzdalenostKm } from './build/lib.mjs';
import { projekty } from './build/projekty.mjs';
import { detailProjektu } from './build/projekt.mjs';
import { lokality, detailLokality } from './build/lokality.mjs';
import { developeri, detailDevelopera } from './build/developeri.mjs';
import { magazin, clanek } from './build/magazin.mjs';
import { proDevelopery, podminky } from './build/ostatni.mjs';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'site.json'), 'utf8'));

// --- Agregace -------------------------------------------------------------------------------
const P = data.projects;
const byId = new Map(P.map((p) => [p.id, p]));
for (const p of P) { p.obec = obecZ(p.cityKey || p.city); p.zeme = zeme(p); }

// Obce (lokality) — hlavní město + jeho části
const obce = new Map();
for (const p of P) {
  const o = obce.get(p.obec) || { name: p.obec, slug: slugify(p.obec), zeme: p.zeme, projekty: [], casti: new Map() };
  o.projekty.push(p);
  if ((p.cityKey || p.city) !== p.obec) o.casti.set(p.cityKey || p.city, (o.casti.get(p.cityKey || p.city) || 0) + 1);
  obce.set(p.obec, o);
}
for (const o of obce.values()) {
  const ps = o.projekty;
  const ceny = ps.map((p) => p.priceFrom).filter(Boolean);
  const m2 = ps.map((p) => p.priceM2).filter(Boolean);
  o.cenaOd = ceny.length ? Math.min(...ceny) : null;
  o.prumerM2 = m2.length ? m2.reduce((a, b) => a + b, 0) / m2.length : null;
  o.volne = ps.reduce((a, p) => a + (p.unitsAvailable || 0), 0);
  o.developeri = [...new Set(ps.map((p) => p.developer.slug))];
  o.lat = ps.reduce((a, p) => a + p.lat, 0) / ps.length;
  o.lon = ps.reduce((a, p) => a + p.lon, 0) / ps.length;
  o.foto = ps.flatMap((p) => p.images.slice(0, 1));
}
const obceSerazene = [...obce.values()].sort((a, b) => b.projekty.length - a.projekty.length || a.name.localeCompare(b.name, 'cs'));
for (const o of obceSerazene) {
  o.okoli = obceSerazene.filter((x) => x !== o && x.zeme === o.zeme).map((x) => ({ o: x, km: vzdalenostKm(o, x) })).sort((a, b) => a.km - b.km).slice(0, 6);
}

// Developeři — doplníme projekty, počty podle stavu, kontakt z projektů
const devs = data.developers.map((d) => {
  const ps = d.projectIds.map((id) => byId.get(id)).filter(Boolean);
  const kontakt = ps.find((p) => p.contact.email || p.contact.phone)?.contact || {};
  const ceny = ps.map((p) => p.priceFrom).filter(Boolean);
  return { ...d, projekty: ps, kontakt, cenaOd: ceny.length ? Math.min(...ceny) : null, obce: [...new Set(ps.map((p) => p.obec))] };
}).sort((a, b) => b.projekty.length - a.projekty.length || a.name.localeCompare(b.name, 'cs'));
const devBySlug = new Map(devs.map((d) => [d.slug, d]));

const ctx = { data, P, byId, obce, obceSerazene, devs, devBySlug, articles: data.articles };

// --- HP: odkazy z živého webu → lokální stránky ----------------------------------------------
export function lokalniOdkaz(url) {
  const u = new URL(url);
  const p = u.pathname.replace(/\/$/, '');
  if (p === '' || p === '/') {
    const mesto = u.searchParams.get('mesto');
    if (mesto) return 'lokalita/' + slugify(obecZ(mesto)) + '/';
    if (u.search) return 'projekty/' + u.search;
    return 'index.html' + u.hash;
  }
  const m = p.match(/^\/(projekt|developer|magazin)\/([^/]+)$/);
  if (m) return `${m[1]}/${m[2]}/`;
  if (['/lokality', '/developeri', '/magazin', '/pro-developery', '/podminky'].includes(p)) return p.slice(1) + '/' + u.search + u.hash;
  return url;
}
let hp = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
hp = hp.replace(/(\s(?:href|action)=")https:\/\/urbanmap\.cz(\/[^"]*)?"/g, (m, a, rest) => a + lokalniOdkaz('https://urbanmap.cz' + (rest || '/').replace(/&amp;/g, '&')).replace(/&/g, '&amp;') + '"');
fs.writeFileSync(path.join(PUB, 'index.html'), hp);
nactiChrome(hp);

// --- Stránky ----------------------------------------------------------------------------------
projekty(ctx);
for (const p of P) detailProjektu(ctx, p);
lokality(ctx);
for (const o of obce.values()) detailLokality(ctx, o);
developeri(ctx);
for (const d of devs) detailDevelopera(ctx, d);
magazin(ctx);
for (const a of ctx.articles) clanek(ctx, a);
proDevelopery(ctx);
podminky(ctx);

await stahniMedia();
console.log(`hotovo: ${P.length} projektů, ${obce.size} lokalit, ${devs.length} developerů, ${ctx.articles.length} článků`);
