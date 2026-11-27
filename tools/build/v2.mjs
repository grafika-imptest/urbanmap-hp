// /v2/ — HP „verze 2“: světlejší, veselejší a luxusnější směr s maskotem Urbi.
// Data stejná jako zbytek webu (žádná vymyšlená čísla), odkazy vedou do stávajících podstránek.
import { stranka, kartaProjektu, ikona, esc, media, zapis, mapa, bodProjektu, cislo, mil, plural, KATEGORIE, kategorieProjektu, cenaProjektu } from './lib.mjs';

const M = (R, n) => `${R}assets/img/maskot/${n}.webp`;

// Pastelové plochy kategorií (barvu ikony bere z tokenů katalogu)
const PASTEL = { 'Rezidenční': '#fff1e8', 'Investiční': '#e8f6fb', 'Rekreační': '#e9f8ee', 'Luxusní': '#f3edff', 'Rodinné domy': '#fff8de' };

export function hpV2({ P, devs, obceSerazene, articles }) {
  const R = '../';
  const volne = P.reduce((a, p) => a + (p.unitsAvailable || 0), 0);
  const sFotkou = P.filter((p) => p.images.length);
  // Doporučené = v prodeji s nejvíce volnými jednotkami (stejné pořadí jako výpis „Doporučené“)
  const doporucene = sFotkou.filter((p) => p.status === 'v_prodeji').sort((a, b) => (b.unitsAvailable || 0) - (a.unitsAvailable || 0)).slice(0, 6);
  const [hA, hB, hC] = doporucene;
  // Každá kategorie jinou fotku — projekt může mít víc kategorií, ať se snímky neopakují
  const pouzite = new Set();
  const kategorie = Object.keys(KATEGORIE).map((k) => {
    const ps = P.filter((p) => kategorieProjektu(p).includes(k) && p.images.length).sort((a, b) => kategorieProjektu(a).length - kategorieProjektu(b).length);
    const vyber = ps.find((p) => !pouzite.has(p.id)) || ps[0];
    if (vyber) pouzite.add(vyber.id);
    return { k, n: P.filter((p) => kategorieProjektu(p).includes(k)).length, foto: vyber?.images[0] };
  }).filter((x) => x.n);
  const mesta = obceSerazene.filter((o) => o.foto.length).slice(0, 5);
  const rychle = [
    ['Praha', `${R}projekty/?obec=Praha`], ['Brno', `${R}projekty/?obec=Brno`], ['Plzeň', `${R}projekty/?obec=Plze%C5%88`],
    ['Do 5 mil. Kč', `${R}projekty/?cenaDo=5000000`], ['Na investici', `${R}projekty/?kat=investicni`], ['Rodinné domy', `${R}projekty/?kat=rodinne`],
  ];
  const minikarta = (p, cls) => p ? `<a class="v2-float ${cls}" href="${R}projekt/${p.id}/"><img src="${R}${media(p.images[0], 640)}" alt="" loading="eager"/><span><b>${esc(p.name)}</b><span>${esc(p.city)} · ${cenaProjektu(p)}</span></span></a>` : '';

  const body = `
<section class="v2-hero">
  <div class="v2-hero__blob v2-hero__blob--a" aria-hidden="true"></div><div class="v2-hero__blob v2-hero__blob--b" aria-hidden="true"></div>
  <div class="v2-wrap v2-hero__mrizka">
    <div class="v2-hero__text">
      <span class="v2-chip"><i></i>${P.length} novostaveb · ${cislo(volne)} volných jednotek</span>
      <h1 class="v2-h1">Nový domov<br/>začíná <em>na mapě</em></h1>
      <p class="v2-lead">Byty a domy přímo od developerů — s cenou, dostupností a polohou na jednom místě. Vyberte si, kde chcete bydlet. Zbytek najdeme spolu.</p>
      <form class="v2-hledani" action="${R}projekty/" method="get" role="search">
        ${ikona('pin')}<input name="q" type="search" placeholder="Kde chcete bydlet? Město, projekt, developer" aria-label="Kde chcete bydlet"/>
        <button class="v2-btn v2-btn--zelene">Hledat ${ikona('sipka')}</button>
      </form>
      <div class="v2-rychle" aria-label="Rychlé hledání">${rychle.map(([t, h]) => `<a href="${h}">${esc(t)}</a>`).join('')}</div>
    </div>
    <div class="v2-hero__scena" aria-hidden="true">
      <div class="v2-hero__kruh"></div>
      ${minikarta(hA, 'v2-float--a')}${minikarta(hB, 'v2-float--b')}
      <div class="v2-bublina">Ahoj, já jsem <b>Urbi</b>! Ukážu vám nové projekty kolem vás.</div>
      <img class="v2-maskot v2-maskot--hero" src="${M(R, 'mava')}" alt="" width="720" height="695" fetchpriority="high"/>
    </div>
  </div>
  <div class="v2-wrap"><dl class="v2-cisla">
    <div><dt>Projektů</dt><dd>${P.length}</dd></div><div><dt>Developerů</dt><dd>${devs.length}</dd></div>
    <div><dt>Volných jednotek</dt><dd>${cislo(volne)}</dd></div><div><dt>Lokalit</dt><dd>${obceSerazene.length}</dd></div>
  </dl></div>
</section>

<section class="v2-wrap v2-sekce">
  <div class="v2-hlava"><div><span class="v2-eyebrow">Co hledáte</span><h2 class="v2-h2">Bydlení podle <em>vašeho</em> života</h2></div><a class="v2-odkaz" href="${R}projekty/">Všechny projekty ${ikona('sipka')}</a></div>
  <div class="v2-kat">${kategorie.map(({ k, n, foto }) => `<a class="v2-kat__dlazdice" href="${R}projekty/?kat=${KATEGORIE[k].slug}" style="--pastel:${PASTEL[k]};--barva:${KATEGORIE[k].barva}">
    <span class="v2-kat__ikona">${ikona(KATEGORIE[k].ikona)}</span><span class="v2-kat__nazev">${esc(k)}</span><span class="v2-kat__pocet">${n} ${plural(n, 'projekt', 'projekty', 'projektů')}</span>
    ${foto ? `<img src="${R}${media(foto, 640)}" alt="" loading="lazy"/>` : ''}</a>`).join('')}</div>
</section>

<section class="v2-wrap v2-sekce">
  <div class="v2-hlava"><div><span class="v2-eyebrow">Právě v prodeji</span><h2 class="v2-h2">Projekty, kde je <em>z čeho vybírat</em></h2></div><a class="v2-odkaz" href="${R}projekty/?pohled=mrizka">Celý katalog ${ikona('sipka')}</a></div>
  <div class="v2-karty">${doporucene.map((p) => kartaProjektu(p, R)).join('')}</div>
</section>

<section class="v2-mapablok">
  <div class="v2-wrap v2-mapablok__mrizka">
    <div class="v2-mapablok__text">
      <img class="v2-maskot v2-maskot--lupa" src="${M(R, 'lupa')}" alt="" width="694" height="720" loading="lazy"/>
      <span class="v2-eyebrow">Mapa novostaveb</span>
      <h2 class="v2-h2">Hledejte podle <em>místa</em>, ne podle inzerátů</h2>
      <p class="v2-lead">Všechny projekty vidíte na mapě i s cenou. Přibližte si čtvrť, kde chcete bydlet, a hned víte, co se tam staví a kolik to stojí.</p>
      <a class="v2-btn v2-btn--zelene" href="${R}projekty/?pohled=mapa">Otevřít mapu ${ikona('mapa')}</a>
    </div>
    <div class="v2-mapablok__mapa">${mapa(P.map((p) => bodProjektu(p, R)), { zaber: 'cz', ukazka: true })}</div>
  </div>
</section>

<section class="v2-wrap v2-sekce">
  <div class="v2-hlava"><div><span class="v2-eyebrow">Lokality</span><h2 class="v2-h2">Kde se teď <em>nejvíc staví</em></h2></div><a class="v2-odkaz" href="${R}lokality/">Všechny lokality ${ikona('sipka')}</a></div>
  <div class="v2-mesta">${mesta.map((o, i) => `<a class="v2-mesto${i === 0 ? ' v2-mesto--velke' : ''}" href="${R}lokalita/${o.slug}/"><img src="${R}${media(o.foto[0], i === 0 ? 1200 : 640)}" alt="" loading="lazy"/>
    <span class="v2-mesto__text"><b>${esc(o.name)}</b><span>${o.projekty.length} ${plural(o.projekty.length, 'projekt', 'projekty', 'projektů')}${o.cenaOd ? ` · od ${mil(o.cenaOd)}` : ''}</span></span></a>`).join('')}</div>
</section>

<section class="v2-wrap v2-sekce">
  <div class="v2-hlidani">
    <img class="v2-maskot v2-maskot--zvonek" src="${M(R, 'zvonek')}" alt="" width="720" height="643" loading="lazy"/>
    <div class="v2-hlidani__text"><span class="v2-eyebrow">${ikona('zvonek')} Hlídací pes</span><h2 class="v2-h2">Urbi vám <em>pohlídá</em> nové projekty</h2><p>Nastavte, co hledáte, a jakmile se na mapě objeví projekt, který sedí, pošleme vám ho e-mailem.</p></div>
    <form class="v2-hlidani__form" data-hlidani-inline="v2-hp"><label class="u-pole"><span>E-mail</span><input type="email" name="email" placeholder="vas@email.cz" autocomplete="email" required/></label><button class="v2-btn v2-btn--zelene">Hlídat ${ikona('zvonek')}</button><p class="u-drobne">Bez spamu, odhlásit jde jedním klikem.</p></form>
  </div>
</section>

<section class="v2-wrap v2-sekce">
  <div class="v2-hlava"><div><span class="v2-eyebrow">Magazín</span><h2 class="v2-h2">Než si <em>vyberete</em></h2></div><a class="v2-odkaz" href="${R}magazin/">Všechny články ${ikona('sipka')}</a></div>
  <div class="v2-clanky">${articles.slice(0, 3).map((a) => `<a class="v2-clanek" href="${R}magazin/${a.slug}/">${a.image ? `<img src="${R}${media(a.image, 640)}" alt="" loading="lazy"/>` : ''}<span class="v2-clanek__meta">${esc(a.category)} · ${esc(a.readTime)}</span><b>${esc(a.title)}</b></a>`).join('')}</div>
</section>

<section class="v2-wrap v2-sekce v2-sekce--posledni">
  <div class="v2-dev">
    <div class="v2-dev__text"><span class="v2-eyebrow">Pro developery a kanceláře</span><h2 class="v2-h2">Máte projekt? <em>Dostaňte ho na mapu</em></h2><p>Ukažte ho kupujícím, kteří hledají podle místa. Projekt si založíte sami — fotky, jednotky, ceník — a poptávky chodí přímo vám.</p>
      <div class="v2-dev__akce"><a class="v2-btn v2-btn--zelene" href="${R}pro-developery/#registrace">Zaregistrovat firmu ${ikona('sipka')}</a><a class="v2-btn v2-btn--svetle" href="${R}pro-developery/#cenik">Ceník balíčků</a></div></div>
    <img class="v2-maskot v2-maskot--klic" src="${M(R, 'klic')}" alt="" width="720" height="712" loading="lazy"/>
  </div>
</section>`;

  const head = `<link rel="stylesheet" href="${R}assets/css/v2.css"/>`;
  zapis('v2/index.html', stranka({ R, title: 'Urbanmap – Nový domov začíná na mapě (verze 2)', description: 'Katalog novostaveb na mapě: byty a domy přímo od developerů s cenou, dostupností a polohou.', body, mapa: true, bodyAttr: 'data-stranka="v2" data-verze="2"', head, verze: '2' }));
}
