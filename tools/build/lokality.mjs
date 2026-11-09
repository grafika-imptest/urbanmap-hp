// /lokality/ a /lokalita/<obec>/ — rozcestník s mapou, zeměmi a datovou tabulkou; detail jako „area guide“ nad reálnými daty.
// Všechna čísla se počítají z projektů v katalogu (počty, ceny od, průměr Kč/m², volné jednotky).
import { stranka, kartaProjektu, ikona, esc, kc, mil, media, mapa, bodProjektu, zapis, drobecky, cislo, plural, sekceHlava, pasHlidani, ZEME, KATEGORIE } from './lib.mjs';

const bodObce = (o, R) => ({ id: o.slug, lat: o.lat, lon: o.lon, n: o.name, c: `${o.projekty.length} ${plural(o.projekty.length, 'projekt', 'projekty', 'projektů')}`, h: `${R}lokalita/${o.slug}/`, i: o.foto[0] ? R + media(o.foto[0], 640) : '', pocet: o.projekty.length });

export function lokality({ P, obceSerazene }) {
  const R = '../';
  const zeme = Object.entries(ZEME).map(([z, t]) => ({ z, t, obce: obceSerazene.filter((o) => o.zeme === z) })).filter((x) => x.obce.length);
  const top = obceSerazene.filter((o) => o.projekty.length >= 2).slice(0, 5); // 1 velká + 4 malé = dva plné řádky
  const m2 = P.map((p) => p.priceM2).filter(Boolean);

  const body = `
<section class="u-wrap u-hero-s">
  ${drobecky(R, [['Lokality']])}
  <div class="u-hero-s__radek"><div><span class="u-eyebrow">${obceSerazene.length} lokalit · ${zeme.length} ${plural(zeme.length, 'země', 'země', 'zemí')}</span><h1 class="u-h1">Kde se staví</h1></div>
  <p class="u-lead">Každé místo s počtem projektů, cenou od a průměrnou cenou za metr. Vyberte lokalitu na mapě, nebo si seřaďte tabulku podle toho, co je pro vás důležité.</p></div>
  <div class="u-zeme" role="tablist" aria-label="Země">
    ${zeme.map(({ z, t, obce }, i) => `<button type="button" role="tab" class="u-zeme__tab" data-zeme="${z}" aria-selected="${i ? 'false' : 'true'}"><b>${t}</b><span>${obce.reduce((a, o) => a + o.projekty.length, 0)} projektů</span></button>`).join('')}
    <span class="u-zeme__tab u-zeme__tab--brzy" aria-disabled="true"><b>Slovensko</b><span>připravujeme</span></span>
    <span class="u-zeme__tab u-zeme__tab--brzy" aria-disabled="true">${ikona('svet')}<b>Další země</b><span>brzy</span></span>
  </div>
</section>
<section class="u-wrap u-lokmapa">
  ${mapa(obceSerazene.map((o) => bodObce(o, R)), { vyska: 'velka', id: 'u-mapa-lokality', zaber: 'cz' })}
  <ol class="u-zebricek">${obceSerazene.slice(0, 8).map((o, i) => `<li><a href="${R}lokalita/${o.slug}/"><span class="u-zebricek__poradi">${i + 1}</span><span><b>${esc(o.name)}</b><span>${o.cenaOd ? 'od ' + mil(o.cenaOd) : 'cena na vyžádání'}</span></span><em>${o.projekty.length}</em></a></li>`).join('')}</ol>
</section>
<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Nejvíc projektů', nadpis: 'Hlavní lokality' })}
  <div class="u-lokkarty">${top.map((o, i) => `<a class="u-lokkarta${i === 0 ? ' u-lokkarta--velka' : ''}" href="${R}lokalita/${o.slug}/">
    <span class="u-lokkarta__foto">${o.foto.slice(0, 3).map((u) => `<img src="${R}${media(u, i === 0 ? 1200 : 640)}" alt="" loading="lazy"/>`).join('')}</span>
    <span class="u-lokkarta__telo"><b class="u-lokkarta__nazev">${esc(o.name)}</b>
    <span class="u-lokkarta__data"><span><em>${o.projekty.length}</em>${plural(o.projekty.length, 'projekt', 'projekty', 'projektů')}</span>${o.cenaOd ? `<span><em>${mil(o.cenaOd)}</em>cena od</span>` : ''}${o.prumerM2 ? `<span><em>${cislo(Math.round(o.prumerM2 / 1000))} tis.</em>Kč/m² průměr</span>` : ''}</span></span></a>`).join('')}</div>
</section>
<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Data', nadpis: 'Všechny lokality', text: `Průměrná cena za m² v katalogu je ${kc(m2.reduce((a, b) => a + b, 0) / m2.length)}. Klikem na záhlaví sloupce seřadíte.` })}
  <div class="u-tabulka-obal"><table class="u-tabulka" data-razeni-tabulky>
    <thead><tr><th scope="col" data-typ="text">Lokalita</th><th scope="col" data-typ="text">Země</th><th scope="col" data-typ="cislo" aria-sort="descending">Projektů</th><th scope="col" data-typ="cislo">Volné jednotky</th><th scope="col" data-typ="cislo">Cena od</th><th scope="col" data-typ="cislo">Průměr Kč/m²</th><th scope="col" data-typ="cislo">Developerů</th></tr></thead>
    <tbody>${obceSerazene.map((o) => `<tr data-zeme="${o.zeme}"><th scope="row"><a href="${R}lokalita/${o.slug}/">${esc(o.name)}</a>${o.casti.size ? `<span>${o.casti.size} ${plural(o.casti.size, 'část', 'části', 'částí')}</span>` : ''}</th><td>${ZEME[o.zeme]}</td><td data-hodnota="${o.projekty.length}">${o.projekty.length}</td><td data-hodnota="${o.volne}">${o.volne || '–'}</td><td data-hodnota="${o.cenaOd || 0}">${o.cenaOd ? mil(o.cenaOd) : '–'}</td><td data-hodnota="${Math.round(o.prumerM2 || 0)}">${o.prumerM2 ? kc(o.prumerM2) : '–'}</td><td data-hodnota="${o.developeri.length}">${o.developeri.length}</td></tr>`).join('')}</tbody></table></div>
</section>
<div class="u-wrap">${pasHlidani({ nadpis: 'Hlídejte lokalitu, ne inzeráty', text: 'Vyberte místo a pošleme vám každý nový projekt, který se tam objeví.' })}</div>`;

  zapis('lokality/index.html', stranka({ R, title: 'Lokality · Kde se staví · Urbanmap', description: `${obceSerazene.length} lokalit s novostavbami: počty projektů, ceny od a průměrná cena za m².`, active: 'lokality/', body, mapa: true, bodyAttr: 'data-stranka="lokality"' }));
}

export function detailLokality({ devBySlug, articles }, o) {
  const R = '../../';
  const ps = o.projekty;
  const v = (n, a, b, c) => `${n} ${plural(n, a, b, c)}`;
  const kats = Object.keys(KATEGORIE).map((k) => ({ k, n: ps.filter((p) => p.tags.includes(k)).length })).filter((x) => x.n);
  const lifestyle = [...new Set(ps.flatMap((p) => p.tags.filter((t) => !KATEGORIE[t])))];
  const m2 = ps.filter((p) => p.priceM2).sort((a, b) => b.priceM2 - a.priceM2);
  const maxM2 = m2[0]?.priceM2 || 1;
  const devs = o.developeri.map((s) => devBySlug.get(s)).filter(Boolean);
  const stav = (s) => ps.filter((p) => p.status === s).length;
  const uvod = `V lokalitě ${o.name} je v katalogu ${v(ps.length, 'projekt', 'projekty', 'projektů')} od ${v(devs.length, 'developera', 'developerů', 'developerů')}${o.cenaOd ? `, ceny začínají na ${mil(o.cenaOd)}` : ''}${o.volne ? ` a volných je ${v(o.volne, 'jednotka', 'jednotky', 'jednotek')}` : ''}.`;

  const body = `
<section class="u-wrap u-hero-l">
  ${drobecky(R, [['Lokality', R + 'lokality/'], [o.name]])}
  <div class="u-hero-l__radek"><div><span class="u-eyebrow">${ikona('pin')}${ZEME[o.zeme]}</span><h1 class="u-h1">Novostavby ${esc(o.name)}</h1><p class="u-lead">${esc(uvod)}</p>
  <div class="u-row"><button type="button" class="u-btn u-btn--primarni" data-hlidani="${esc(o.name)}">${ikona('zvonek')}Hlídat ${esc(o.name)}</button><a class="u-btn u-btn--obrys" href="#projekty">Projekty v lokalitě</a></div></div>
  <div class="u-hero-l__foto">${o.foto.slice(0, 3).map((u, i) => `<img src="${R}${media(u, i ? 640 : 1200)}" alt="" ${i ? 'loading="lazy"' : ''}/>`).join('')}</div></div>
  <dl class="u-kpi"><div><dt>Projektů</dt><dd>${ps.length}</dd></div><div><dt>Volných jednotek</dt><dd>${o.volne || '–'}</dd></div><div><dt>Cena od</dt><dd>${o.cenaOd ? mil(o.cenaOd) : '–'}</dd></div><div><dt>Průměr za m²</dt><dd>${o.prumerM2 ? kc(o.prumerM2) : '–'}</dd></div><div><dt>Developerů</dt><dd>${devs.length}</dd></div></dl>
</section>
${o.casti.size ? `<nav class="u-wrap u-casti" aria-label="Části"><span class="u-meta">Části obce</span>${[...o.casti].map(([c, n]) => `<span class="u-tag">${esc(c)} <b>${n}</b></span>`).join('')}</nav>` : ''}
<section class="u-wrap u-sekce" id="projekty">
  ${sekceHlava({ eyebrow: 'V nabídce', nadpis: `Projekty v lokalitě ${esc(o.name)}`, text: `${stav('v_prodeji') ? v(stav('v_prodeji'), 'projekt', 'projekty', 'projektů') + ' v prodeji' : ''}${stav('predprodej') ? ', ' + stav('predprodej') + ' v předprodeji' : ''}${stav('pripravovany') ? ', ' + stav('pripravovany') + ' připravované' : ''}`.replace(/^, /, '') })}
  <div class="u-lokgrid">${mapa(ps.map((p) => bodProjektu(p, R)), { vyska: 'sticky', zaber: 'body' })}<div class="u-pgrid u-pgrid--2">${ps.map((p) => kartaProjektu(p, R)).join('')}</div></div>
</section>
${m2.length >= 2 ? `<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Ceny', nadpis: 'Cena za metr podle projektu', text: 'Srovnání cen za m² u projektů, které je v katalogu uvádějí.' })}
  <ul class="u-sloupce">${m2.map((p) => `<li><a href="${R}projekt/${p.id}/"><span class="u-sloupce__nazev">${esc(p.name)}</span><span class="u-sloupce__pruh" style="--w:${((p.priceM2 / maxM2) * 100).toFixed(1)}%"></span><b>${kc(p.priceM2)}</b></a></li>`).join('')}</ul>
</section>` : ''}
<section class="u-wrap u-sekce u-lokinfo">
  <div><h2 class="u-h3">Typ bydlení</h2><ul class="u-pruhy">${kats.map(({ k, n }) => `<li style="--barva:${KATEGORIE[k].barva}"><span>${esc(k)}</span><i style="--w:${(n / ps.length) * 100}%"></i><b>${n}</b></li>`).join('') || '<li><span>Neuvedeno</span></li>'}</ul></div>
  ${lifestyle.length ? `<div><h2 class="u-h3">Co je v okolí projektů</h2><div class="u-tagy">${lifestyle.map((t) => `<span class="u-tag">${esc(t)}</span>`).join('')}</div><p class="u-drobne">Podle štítků, které u projektů uvádí developer.</p></div>` : ''}
  ${devs.length ? `<div><h2 class="u-h3">Kdo tu staví</h2><ul class="u-devmini">${devs.map((d) => `<li><a href="${R}developer/${d.slug}/"><span class="u-devmini__logo${d.logoDark ? ' u-devmini__logo--tmave' : ''}">${d.logo ? `<img src="${R}${media(d.logo, 640)}" alt=""/>` : ''}</span><b>${esc(d.name)}</b><em>${d.projekty.filter((p) => p.obec === o.name).length}</em></a></li>`).join('')}</ul></div>` : ''}
</section>
<div class="u-wrap">${pasHlidani({ nadpis: `Hlídat novostavby ${esc(o.name)}`, text: `Jako první se dozvíte o novém projektu v lokalitě ${esc(o.name)}.`, kontext: o.name })}</div>
<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Okolí', nadpis: 'Lokality v okolí', odkaz: { href: R + 'lokality/', text: 'Všechny lokality' } })}
  <div class="u-okolilok">${o.okoli.map(({ o: x, km }) => `<a href="${R}lokalita/${x.slug}/">${x.foto[0] ? `<img src="${R}${media(x.foto[0], 640)}" alt="" loading="lazy"/>` : ''}<span><b>${esc(x.name)}</b><span>${v(x.projekty.length, 'projekt', 'projekty', 'projektů')} · ${Math.round(km)} km</span></span></a>`).join('')}</div>
</section>
${articles.length ? `<section class="u-wrap u-sekce">${sekceHlava({ eyebrow: 'Magazín', nadpis: 'Než se rozhodnete', odkaz: { href: R + 'magazin/', text: 'Celý magazín' } })}<div class="u-magmrizka u-magmrizka--3">${articles.slice(0, 3).map((a) => `<a class="u-magkarta" href="${R}magazin/${a.slug}/"><span class="u-magkarta__foto"><img src="${R}${media(a.image, 640)}" alt="" loading="lazy"/></span><span class="u-magkarta__meta"><b>${esc(a.category)}</b>${esc(a.readTime || '')}</span><b class="u-magkarta__nazev">${esc(a.title)}</b></a>`).join('')}</div></section>` : ''}`;

  zapis(`lokalita/${o.slug}/index.html`, stranka({ R, title: `Novostavby ${o.name} · Urbanmap`, description: uvod, active: 'lokality/', body, mapa: true, bodyAttr: 'data-stranka="lokalita"', ogImage: o.foto[0] ? media(o.foto[0], 1200) : '' }));
}
