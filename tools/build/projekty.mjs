// /projekty/ — výpis: seznam + mapa vedle sebe, filtry, hlídací pes, porovnání, poptávka z karty.
import { stranka, kartaProjektu, ikona, esc, KATEGORIE, STAVY, mapa, bodProjektu, zapis, cislo, slugify, plural, ZEME } from './lib.mjs';

export function projekty({ P, obceSerazene, devs }) {
  const R = '../';
  const pocet = (f) => P.filter(f).length;
  const kategorie = Object.keys(KATEGORIE).map((k) => ({ k, n: pocet((p) => p.tags.includes(k)) })).filter((x) => x.n);
  const lifestyle = [...new Set(P.flatMap((p) => p.tags.filter((t) => !KATEGORIE[t])))].map((t) => ({ t, n: pocet((p) => p.tags.includes(t)) })).sort((a, b) => b.n - a.n);
  const dispozice = [...new Set(P.flatMap((p) => p.layouts))].sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));
  const stavy = Object.entries(STAVY).map(([s, t]) => ({ s, t, n: pocet((p) => p.status === s) })).filter((x) => x.n);
  const volne = P.reduce((a, p) => a + (p.unitsAvailable || 0), 0);

  // Řazení „Doporučené“ = pořadí z HP (topované napřed), stejně jako na živém webu
  const karty = [];
  P.forEach((p, i) => {
    karty.push(kartaProjektu(p, R));
    if (i === 5) karty.push(`<aside class="u-promo u-promo--hlidani">${ikona('zvonek', 'u-ico u-ico--velka')}<h3 class="u-h3">Nenašli jste to pravé?</h3><p>Nastavte si hlídání podle aktuálních filtrů. Nové projekty vám pošleme e-mailem.</p><button type="button" class="u-btn u-btn--primarni" data-hlidani="aktualni">Hlídat toto hledání</button></aside>`);
    if (i === 17) karty.push(`<aside class="u-promo u-promo--tmave"><span class="u-eyebrow u-eyebrow--svetle">Pro developery</span><h3 class="u-h3">Patří sem i váš projekt?</h3><p>Ceník, dostupnost a poptávky přímo vám. Od 990 Kč měsíčně.</p><a class="u-btn u-btn--primarni" href="${R}pro-developery/">Přidat projekt ${ikona('sipka')}</a></aside>`);
  });

  const chip = (attr, val, text, n) => `<button type="button" class="u-fchip" data-filtr="${attr}" data-hodnota="${esc(val)}" aria-pressed="false">${text}${n != null ? `<span>${n}</span>` : ''}</button>`;
  const body = `
<section class="u-wrap u-listhead">
  <div class="u-listhead__titul"><span class="u-eyebrow">${cislo(P.length)} projektů · ${devs.length} developerů · ${cislo(volne)} volných jednotek</span><h1 class="u-h1">Novostavby na mapě</h1></div>
  <form class="u-hledej" role="search" data-hledani><span>${ikona('hledat')}</span><input type="search" name="q" placeholder="Město, projekt nebo developer" aria-label="Hledat město, projekt nebo developera" autocomplete="off"/><button class="u-btn u-btn--tmave" type="submit">Hledat</button></form>
</section>
<nav class="u-wrap u-katpas" aria-label="Typ projektu">
  <button type="button" class="u-kattile" data-filtr="kat" data-hodnota="" aria-pressed="true"><span class="u-kattile__ikona">${ikona('mrizka')}</span><span class="u-kattile__text"><b>Vše</b><span>${P.length}</span></span></button>
  ${kategorie.map(({ k, n }) => `<button type="button" class="u-kattile" style="--barva:${KATEGORIE[k].barva}" data-filtr="kat" data-hodnota="${KATEGORIE[k].slug}" aria-pressed="false"><span class="u-kattile__ikona">${ikona(KATEGORIE[k].ikona)}</span><span class="u-kattile__text"><b>${esc(k)}</b><span>${n}</span></span></button>`).join('')}
</nav>
<div class="u-wrap u-filtrbar" data-filtrbar>
  <details class="u-fdrop"><summary>${ikona('pin')}Lokalita</summary><div class="u-fdrop__panel"><span class="u-meta">Země</span><div class="u-fchips">${Object.entries(ZEME).map(([z, t]) => chip('zeme', z, t, pocet((p) => p.zeme === z))).join('')}</div><span class="u-meta">Obec</span><div class="u-fchips">${obceSerazene.slice(0, 14).map((o) => chip('obec', o.name, esc(o.name), o.projekty.length)).join('')}</div></div></details>
  <details class="u-fdrop"><summary>${ikona('cena')}Cena</summary><div class="u-fdrop__panel"><span class="u-meta">Cena od</span><div class="u-fchips">${chip('cena', '0-6000000', 'do 6 mil.')}${chip('cena', '6000000-10000000', '6–10 mil.')}${chip('cena', '10000000-20000000', '10–20 mil.')}${chip('cena', '20000000-', '20 mil. a víc')}</div><span class="u-meta">Cena za m²</span><div class="u-fchips">${chip('m2', '0-100000', 'do 100 tis.')}${chip('m2', '100000-150000', '100–150 tis.')}${chip('m2', '150000-', '150 tis. a víc')}</div></div></details>
  <details class="u-fdrop"><summary>${ikona('dum')}Dispozice</summary><div class="u-fdrop__panel"><div class="u-fchips">${dispozice.map((d) => chip('disp', d, d, pocet((p) => p.layouts.includes(d)))).join('')}</div></div></details>
  <details class="u-fdrop"><summary>${ikona('kalendar')}Stav projektu</summary><div class="u-fdrop__panel"><div class="u-fchips">${stavy.map(({ s, t, n }) => chip('stav', s, t, n)).join('')}</div></div></details>
  <details class="u-fdrop"><summary>${ikona('filtr')}V okolí</summary><div class="u-fdrop__panel"><div class="u-fchips">${lifestyle.map(({ t, n }) => chip('tagy', slugify(t), esc(t), n)).join('')}</div></div></details>
  <button type="button" class="u-fchip u-fchip--volne" data-filtr="volne" data-hodnota="1" aria-pressed="false">${ikona('klic')}Jen s volnými jednotkami</button>
  <div class="u-filtrbar__aktivni" data-aktivni-filtry></div>
</div>
<div class="u-wrap u-vysledkyhead">
  <p><b data-pocet>${P.length}</b> <span data-pocet-text>projektů</span></p>
  <div class="u-vysledkyhead__akce">
    <button type="button" class="u-btn u-btn--obrys u-btn--s" data-hlidani="aktualni">${ikona('zvonek')}Uložit hledání</button>
    <label class="u-select"><span class="u-sr">Řazení</span><select data-razeni><option value="doporucene">Doporučené</option><option value="cena-asc">Nejlevnější</option><option value="cena-desc">Nejdražší</option><option value="m2-asc">Nejnižší cena za m²</option><option value="volne-desc">Nejvíc volných jednotek</option></select></label>
    <div class="u-prepinac" role="group" aria-label="Zobrazení"><button type="button" data-pohled="split" aria-pressed="true">${ikona('mapa')}<span>Mapa</span></button><button type="button" data-pohled="mrizka" aria-pressed="false">${ikona('mrizka')}<span>Mřížka</span></button></div>
  </div>
</div>
<div class="u-explorer" data-pohled-aktivni="split">
  <div class="u-explorer__seznam"><div class="u-pgrid" data-vysledky>${karty.join('')}</div>
  <div class="u-prazdne" data-prazdne hidden>${ikona('hledat', 'u-ico u-ico--velka')}<h3 class="u-h3">Tomu neodpovídá žádný projekt</h3><p>Zkuste uvolnit filtry, nebo si nastavte hlídání a ozveme se, až se něco objeví.</p><div class="u-row"><button type="button" class="u-btn u-btn--obrys" data-zrusit-filtry>Zrušit filtry</button><button type="button" class="u-btn u-btn--primarni" data-hlidani="aktualni">Hlídat</button></div></div></div>
  <div class="u-explorer__mapa">${mapa(P.map((p) => bodProjektu(p, R)), { id: 'u-mapa-vypis', vyska: 'plna' })}<button type="button" class="u-map__oblast" data-hledat-v-oblasti hidden>${ikona('hledat')}Hledat v této oblasti</button></div>
</div>
<section class="u-wrap u-seo">
  <div><h2 class="u-h4">Novostavby podle lokality</h2><ul>${obceSerazene.slice(0, 12).map((o) => `<li><a href="${R}lokalita/${o.slug}/">Novostavby ${esc(o.name)}</a><span>${o.projekty.length}</span></li>`).join('')}</ul></div>
  <div><h2 class="u-h4">Podle typu</h2><ul>${kategorie.map(({ k, n }) => `<li><a href="?kat=${KATEGORIE[k].slug}">${esc(k)} projekty</a><span>${n}</span></li>`).join('')}</ul></div>
  <div><h2 class="u-h4">Podle dispozice</h2><ul>${dispozice.slice(0, 10).map((d) => `<li><a href="?disp=${encodeURIComponent(d)}">Byty ${esc(d)}</a><span>${pocet((p) => p.layouts.includes(d))}</span></li>`).join('')}</ul></div>
</section>
<div class="u-porovnani" data-porovnani hidden><div class="u-porovnani__vnitrek"><div class="u-porovnani__nahledy" data-porovnani-nahledy></div><p><b data-porovnani-pocet>0</b> ${'z 3'} k porovnání</p><button type="button" class="u-btn u-btn--obrys u-btn--s" data-porovnani-zrusit>Zrušit</button><button type="button" class="u-btn u-btn--tmave u-btn--s" data-porovnani-otevrit>Porovnat</button><button type="button" class="u-btn u-btn--primarni u-btn--s" data-poptat-vybrane>Poptat vybrané</button></div></div>
<dialog class="u-dialog u-dialog--siroky" id="u-porovnani-dialog" aria-label="Porovnání projektů"><div class="u-dialog__okno"><button class="u-dialog__zavrit" data-zavrit aria-label="Zavřít">${ikona('x')}</button><h2 class="u-h3">Porovnání projektů</h2><div class="u-tabulka-obal" data-porovnani-tabulka></div></div></dialog>`;

  zapis('projekty/index.html', stranka({ R, title: 'Novostavby na mapě · Projekty · Urbanmap', description: `${P.length} developerských projektů na mapě: ceny, dispozice, volné jednotky a poptávka přímo developerovi.`, active: 'projekty/', body, mapa: true, bodyAttr: 'data-stranka="projekty"' }));
}
