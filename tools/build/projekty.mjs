// /projekty/ — výpis: seznam + mapa vedle sebe, filtry (mapa krajů, posuvníky ceny, investiční profil),
// konfigurátor „Sestavit hledání“, hlídací pes, porovnání, poptávka z karty.
// Hledání textem je jen v hlavičce webu (na této stránce filtruje výpis živě) — žádné zdvojené pole.
import { stranka, kartaProjektu, ikona, esc, KATEGORIE, STAVY, mapa, bodProjektu, zapis, cislo, slugify, ZEME } from './lib.mjs';

// Ikony investičních profilů (stejný význam jako na živém webu)
const INVEST_IKONY = { pronajem: 'klic', flip: 'kladivo', turisticka: 'stan', studentska: 'cepice', nizky_vstup: 'mince', premium: 'diamant', kratkodoby_pronajem: 'kalhod', yield: 'procenta', rust_lokality: 'rust' };
// Metriky závislé na transakčních datech — UI je, data ve fázi 2 (stejně jako na živém webu)
const FAZE2 = ['yield', 'rust_lokality'];

export function projekty({ data, P, obceSerazene, devs }) {
  const R = '../';
  const pocet = (f) => P.filter(f).length;
  const kategorie = Object.keys(KATEGORIE).map((k) => ({ k, n: pocet((p) => p.tags.includes(k)) })).filter((x) => x.n);
  const lifestyle = [...new Set(P.flatMap((p) => p.tags.filter((t) => !KATEGORIE[t])))].map((t) => ({ t, n: pocet((p) => p.tags.includes(t)) })).sort((a, b) => b.n - a.n);
  const dispozice = [...new Set(P.flatMap((p) => p.layouts))].sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));
  const stavy = Object.entries(STAVY).map(([s, t]) => ({ s, t, n: pocet((p) => p.status === s) })).filter((x) => x.n);
  const volne = P.reduce((a, p) => a + (p.unitsAvailable || 0), 0);

  // Rozsahy posuvníků: horní mez zaokrouhlená nahoru, s rozumným stropem (krajní hodnota = „a víc“)
  const ceny = P.map((p) => p.priceFrom).filter(Boolean);
  const m2 = P.map((p) => p.priceM2).filter(Boolean);
  const cenaMax = Math.min(Math.ceil(Math.max(...ceny) / 1e6), 30) * 1e6;
  const m2Max = Math.min(Math.ceil(Math.max(...m2) / 5e4) * 5e4, 300000);

  const karty = [];
  P.forEach((p, i) => {
    karty.push(kartaProjektu(p, R));
    if (i === 5) karty.push(`<aside class="u-promo u-promo--hlidani">${ikona('zvonek', 'u-ico u-ico--velka')}<h3 class="u-h3">Nenašli jste to pravé?</h3><p>Nastavte si hlídání podle aktuálních filtrů. Nové projekty vám pošleme e-mailem.</p><button type="button" class="u-btn u-btn--primarni" data-hlidani="aktualni">Hlídat toto hledání</button></aside>`);
    if (i === 17) karty.push(`<aside class="u-promo u-promo--tmave"><span class="u-eyebrow u-eyebrow--svetle">Pro developery</span><h3 class="u-h3">Patří sem i váš projekt?</h3><p>Ceník, dostupnost a poptávky přímo vám. Od 990 Kč měsíčně.</p><a class="u-btn u-btn--primarni" href="${R}pro-developery/">Přidat projekt ${ikona('sipka')}</a></aside>`);
  });

  // --- Stavební bloky filtrů (použité v dropdownech i v konfigurátoru, stav se synchronizuje v JS) ---
  const chip = (attr, val, text, n) => `<button type="button" class="u-fchip" data-filtr="${attr}" data-hodnota="${esc(val)}" aria-pressed="false"${n === 0 ? ' disabled' : ''}>${text}${n != null ? `<span>${n}</span>` : ''}</button>`;
  const mapaKraju = () => `<div class="u-krajmapa"><svg viewBox="${data.krajSvg}" role="group" aria-label="Kraje">${data.kraje.map((k) => `<path d="${k.d}" data-filtr="kraj" data-hodnota="${k.slug}" aria-pressed="false" role="button" tabindex="${k.count ? 0 : -1}" aria-label="${esc(k.name)} · ${k.count}"${k.count ? '' : ' data-prazdny'}><title>${esc(k.name)} · ${k.count} ${k.count === 1 ? 'projekt' : k.count < 5 && k.count ? 'projekty' : 'projektů'}</title></path>`).join('')}</svg></div>`;
  const histogram = (hodnoty, max) => {
    const N = 28, kos = Array(N).fill(0);
    hodnoty.forEach((v) => { kos[Math.min(N - 1, Math.floor((v / max) * N))]++; });
    const vrchol = Math.max(...kos);
    return `<div class="u-histogram" aria-hidden="true">${kos.map((n, i) => `<i data-od="${Math.round((i / N) * max)}" data-do="${Math.round(((i + 1) / N) * max)}" style="--h:${n ? Math.max(8, (n / vrchol) * 100) : 3}%"></i>`).join('')}</div>`;
  };
  const rozsah = (nazev, hodnoty, max, krok, mena = false) => `<div class="u-rozsah" data-rozsah="${nazev}" data-max="${max}">
${histogram(hodnoty, max)}
<div class="u-rozsah__draha"><i class="u-rozsah__vypln"></i><input type="range" min="0" max="${max}" step="${krok}" value="0" data-konec="od" aria-label="Od"/><input type="range" min="0" max="${max}" step="${krok}" value="${max}" data-konec="do" aria-label="Do"/></div>
<div class="u-rozsah__pole"><label class="u-pole"><span>Od</span><input inputmode="numeric" data-pole="od" placeholder="0"/></label><label class="u-pole"><span>Do</span><input inputmode="numeric" data-pole="do" placeholder="bez omezení"/></label>${mena ? `<label class="u-pole u-pole--mena"><span>Měna</span><select aria-label="Měna"><option>CZK</option><option disabled>EUR — brzy</option><option disabled>USD — brzy</option><option disabled>PLN — brzy</option></select></label>` : ''}</div></div>`;
  const rychleCeny = () => `<div class="u-fchips">${[[0, 6e6, 'do 6 mil.'], [6e6, 1e7, '6–10 mil.'], [1e7, 2e7, '10–20 mil.'], [2e7, 0, '20 mil. a víc']].map(([a, b, t]) => `<button type="button" class="u-fchip" data-rychla="cena" data-od="${a}" data-do="${b}">${t}<span>${pocet((p) => p.priceFrom >= a && (!b || p.priceFrom < b))}</span></button>`).join('')}</div>`;
  const investDlazdice = () => `<div class="u-invest">${data.invest.map((x) => {
    const faze2 = FAZE2.includes(x.key);
    return `<button type="button" class="u-investbtn" data-filtr="invest" data-hodnota="${x.key}" aria-pressed="false"${x.count && !faze2 ? '' : ' disabled'}><span class="u-investbtn__ikona">${ikona(INVEST_IKONY[x.key])}</span><span><b>${esc(x.label)}</b><em>${faze2 ? 'fáze 2 · data z transakcí' : x.count ? `${x.count} ${x.count === 1 ? 'projekt' : x.count < 5 ? 'projekty' : 'projektů'}` : 'zatím žádný projekt'}</em></span></button>`;
  }).join('')}</div>`;
  const zobrazit = () => `<button type="button" class="u-btn u-btn--primarni u-btn--plne" data-zavrit-filtr>Zobrazit <b data-pocet-tl>${P.length}</b>&nbsp;projektů</button>`;

  const lokalitaPanel = () => `<span class="u-meta">Země</span><div class="u-fchips">${Object.entries(ZEME).map(([z, t]) => chip('zeme', z, t, pocet((p) => p.zeme === z))).join('')}<span class="u-fchip u-fchip--brzy">Slovensko<span>připravujeme</span></span></div>
<span class="u-meta">Kraj — klikněte do mapy</span>${mapaKraju()}
<span class="u-meta">Obec</span><div class="u-fchips">${obceSerazene.filter((o) => o.zeme === 'CZ').slice(0, 16).map((o) => chip('obec', o.name, esc(o.name), o.projekty.length)).join('')}</div>`;
  const cenaPanel = () => `<span class="u-meta">Rychlá volba ceny</span>${rychleCeny()}<span class="u-meta">Cena od — posuňte jezdce</span>${rozsah('cena', ceny, cenaMax, 100000, true)}<span class="u-meta">Cena za m²</span>${rozsah('m2', m2, m2Max, 5000)}`;
  const okoliPanel = () => `<div class="u-fchips">${lifestyle.map(({ t, n }) => chip('tagy', slugify(t), esc(t), n)).join('')}</div>`;

  const body = `
<section class="u-wrap u-listhead">
  <div class="u-listhead__titul"><span class="u-eyebrow">${cislo(P.length)} projektů · ${devs.length} developerů · ${cislo(volne)} volných jednotek</span><h1 class="u-h1">Novostavby na mapě</h1></div>
  <button type="button" class="u-konfcta" data-konfigurator><span class="u-konfcta__ikona">${ikona('posuvnik')}</span><span class="u-konfcta__text"><b>Sestavit hledání</b><span>Místo, typ, rozpočet a investiční profil — ve 4 krocích</span></span>${ikona('sipka')}</button>
</section>
<nav class="u-wrap u-katpas" aria-label="Typ projektu">
  <button type="button" class="u-kattile" data-filtr="kat" data-hodnota="" aria-pressed="true"><span class="u-kattile__ikona">${ikona('mrizka')}</span><span class="u-kattile__text"><b>Vše</b><span>${P.length}</span></span></button>
  ${kategorie.map(({ k, n }) => `<button type="button" class="u-kattile" style="--barva:${KATEGORIE[k].barva}" data-filtr="kat" data-hodnota="${KATEGORIE[k].slug}" aria-pressed="false"><span class="u-kattile__ikona">${ikona(KATEGORIE[k].ikona)}</span><span class="u-kattile__text"><b>${esc(k)}</b><span>${n}</span></span></button>`).join('')}
</nav>
<div class="u-wrap u-filtrbar" data-filtrbar>
  <button type="button" class="u-fbtn-konf" data-konfigurator>${ikona('posuvnik')}Sestavit hledání</button>
  <details class="u-fdrop" data-skupina="lokalita"><summary>${ikona('pin')}Lokalita</summary><div class="u-fdrop__panel u-fdrop__panel--siroky">${lokalitaPanel()}${zobrazit()}</div></details>
  <details class="u-fdrop" data-skupina="cena"><summary>${ikona('cena')}Cena</summary><div class="u-fdrop__panel u-fdrop__panel--siroky">${cenaPanel()}${zobrazit()}</div></details>
  <details class="u-fdrop" data-skupina="disp"><summary>${ikona('dum')}Dispozice</summary><div class="u-fdrop__panel"><div class="u-fchips">${dispozice.map((d) => chip('disp', d, d, pocet((p) => p.layouts.includes(d)))).join('')}</div></div></details>
  <details class="u-fdrop" data-skupina="stav"><summary>${ikona('kalendar')}Stav projektu</summary><div class="u-fdrop__panel"><div class="u-fchips">${stavy.map(({ s, t, n }) => chip('stav', s, t, n)).join('')}</div></div></details>
  <details class="u-fdrop" data-skupina="tagy"><summary>${ikona('filtr')}V okolí</summary><div class="u-fdrop__panel">${okoliPanel()}</div></details>
  <details class="u-fdrop" data-skupina="invest"><summary>${ikona('rust')}Investiční profil</summary><div class="u-fdrop__panel u-fdrop__panel--siroky u-fdrop__panel--vpravo">${investDlazdice()}</div></details>
  <button type="button" class="u-fchip u-fchip--volne" data-filtr="volne" data-hodnota="1" aria-pressed="false">${ikona('klic')}Jen s volnými jednotkami</button>
  <button type="button" class="u-zrusit" data-zrusit-filtry hidden>Zrušit filtry</button>
  <div class="u-filtrbar__aktivni" data-aktivni-filtry></div>
</div>
<div class="u-wrap u-vysledkyhead">
  <p><b data-pocet>${P.length}</b> <span data-pocet-text>projektů</span><span class="u-vysledkyhead__dotaz" data-dotaz hidden></span></p>
  <div class="u-vysledkyhead__akce">
    <button type="button" class="u-btn u-btn--obrys u-btn--s" data-hlidani="aktualni">${ikona('zvonek')}Uložit hledání</button>
    <label class="u-select"><span class="u-sr">Řazení</span><select data-razeni><option value="doporucene">Doporučené</option><option value="cena-asc">Nejlevnější</option><option value="cena-desc">Nejdražší</option><option value="m2-asc">Nejnižší cena za m²</option><option value="volne-desc">Nejvíc volných jednotek</option></select></label>
    <div class="u-prepinac" role="group" aria-label="Zobrazení"><button type="button" data-pohled="split" aria-pressed="true">${ikona('mapa')}<span>Mapa</span></button><button type="button" data-pohled="mrizka" aria-pressed="false">${ikona('mrizka')}<span>Mřížka</span></button><button type="button" data-pohled="seznam" aria-pressed="false">${ikona('seznam')}<span>Seznam</span></button></div>
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
<div class="u-porovnani" data-porovnani hidden><div class="u-porovnani__vnitrek"><div class="u-porovnani__nahledy" data-porovnani-nahledy></div><p><b data-porovnani-pocet>0</b> z 3 k porovnání</p><button type="button" class="u-btn u-btn--obrys u-btn--s" data-porovnani-zrusit>Zrušit</button><button type="button" class="u-btn u-btn--tmave u-btn--s" data-porovnani-otevrit>Porovnat</button><button type="button" class="u-btn u-btn--primarni u-btn--s" data-poptat-vybrane>Poptat vybrané</button></div></div>
<dialog class="u-dialog u-dialog--siroky" id="u-porovnani-dialog" aria-label="Porovnání projektů"><div class="u-dialog__okno"><button class="u-dialog__zavrit" data-zavrit aria-label="Zavřít">${ikona('x')}</button><h2 class="u-h3">Porovnání projektů</h2><div class="u-tabulka-obal" data-porovnani-tabulka></div></div></dialog>
<dialog class="u-dialog u-dialog--konf" id="u-konf" aria-labelledby="u-konf-nadpis"><div class="u-konf">
  <header class="u-konf__hlava"><div><span class="u-eyebrow">${ikona('posuvnik')}Konfigurátor</span><h2 class="u-h3" id="u-konf-nadpis">Sestavit hledání</h2></div><button class="u-dialog__zavrit" data-zavrit aria-label="Zavřít">${ikona('x')}</button></header>
  <nav class="u-konf__kroky" role="tablist">${['Místo', 'Typ a dispozice', 'Rozpočet', 'Investice a okolí'].map((t, i) => `<button type="button" role="tab" data-krok="${i}" aria-selected="${i ? 'false' : 'true'}"><span>${i + 1}</span>${t}</button>`).join('')}</nav>
  <div class="u-konf__telo">
    <section data-krok-panel="0"><h3 class="u-h4">Kde hledáte?</h3>${lokalitaPanel()}</section>
    <section data-krok-panel="1" hidden><h3 class="u-h4">Jaký typ bydlení?</h3><div class="u-fchips">${kategorie.map(({ k, n }) => `<button type="button" class="u-fchip" data-filtr="kat" data-hodnota="${KATEGORIE[k].slug}" aria-pressed="false">${ikona(KATEGORIE[k].ikona)}${esc(k)}<span>${n}</span></button>`).join('')}</div>
      <span class="u-meta">Dispozice</span><div class="u-fchips">${dispozice.map((d) => chip('disp', d, d, pocet((p) => p.layouts.includes(d)))).join('')}</div>
      <span class="u-meta">Stav projektu</span><div class="u-fchips">${stavy.map(({ s, t, n }) => chip('stav', s, t, n)).join('')}</div></section>
    <section data-krok-panel="2" hidden><h3 class="u-h4">Kolik chcete investovat?</h3>${cenaPanel()}</section>
    <section data-krok-panel="3" hidden><h3 class="u-h4">Investiční profil</h3>${investDlazdice()}<span class="u-meta">Co má být v okolí</span>${okoliPanel()}</section>
  </div>
  <footer class="u-konf__pata"><button type="button" class="u-btn u-btn--obrys" data-zrusit-filtry>Zrušit vše</button><span class="u-konf__mezera"></span><button type="button" class="u-btn u-btn--obrys" data-krok-posun="-1">Zpět</button><button type="button" class="u-btn u-btn--tmave" data-krok-posun="1">Další krok</button><button type="button" class="u-btn u-btn--primarni" data-zavrit>Zobrazit <b data-pocet-tl>${P.length}</b>&nbsp;projektů</button></footer>
</div></dialog>`;

  zapis('projekty/index.html', stranka({ R, title: 'Novostavby na mapě · Projekty · Urbanmap', description: `${P.length} developerských projektů na mapě: ceny, dispozice, volné jednotky a poptávka přímo developerovi.`, active: 'projekty/', body, mapa: true, bodyAttr: 'data-stranka="projekty"' }));
}
