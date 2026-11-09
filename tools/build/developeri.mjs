// /developeri/ a /developer/<slug>/ — rozcestník a profil developera.
import { stranka, kartaProjektu, ikona, esc, mil, media, mapa, bodProjektu, zapis, drobecky, plural, sekceHlava, STAVY, KATEGORIE, slugify } from './lib.mjs';

// Modifikátor --tmave patří k první (základní) třídě, ne k celému seznamu tříd
const logo = (d, R, cls = 'u-devlogo') => `<span class="${cls}${d.logoDark ? ` ${cls.split(' ')[0]}--tmave` : ''}">${d.logo ? `<img src="${R}${media(d.logo, 640)}" alt="${esc(d.name)}"/>` : `<b>${esc(d.name.slice(0, 2))}</b>`}</span>`;
const vProdeji = (d) => d.projekty.filter((p) => ['v_prodeji', 'predprodej'].includes(p.status)).length;

export function developeri({ P, devs, obceSerazene }) {
  const R = '../';
  const hodnota = devs.reduce((a, d) => {
    const m = (d.totalValueText || '').match(/([\d,]+)\s*(mil|mld)/);
    return a + (m ? parseFloat(m[1].replace(',', '.')) * (m[2] === 'mld' ? 1000 : 1) : 0);
  }, 0);
  const kats = Object.keys(KATEGORIE).map((k) => ({ k, n: devs.filter((d) => d.projekty.some((p) => p.tags.includes(k))).length })).filter((x) => x.n);

  const karta = (d) => `<article class="u-devkarta" data-kat="${[...new Set(d.projekty.flatMap((p) => p.tags.filter((t) => KATEGORIE[t]).map((t) => KATEGORIE[t].slug)))].join(' ')}" data-obce="${esc(d.obce.join('|'))}" data-nazev="${esc(d.name)}">
<a class="u-devkarta__odkaz" href="${R}developer/${d.slug}/" aria-label="${esc(d.name)}"></a>
<div class="u-devkarta__hlava">${logo(d, R)}<div><h3 class="u-h4">${esc(d.name)}</h3><span class="u-meta">${esc((d.seat || '').split(',').pop().replace(/\d{3}\s?\d{2}/, '').trim() || '')}${d.founded ? ` · od ${d.founded}` : ''}</span></div></div>
<dl class="u-devkarta__cisla"><div><dt>Projektů</dt><dd>${d.projekty.length}</dd></div><div><dt>V prodeji</dt><dd>${vProdeji(d)}</dd></div><div><dt>Cena od</dt><dd>${d.cenaOd ? mil(d.cenaOd) : '–'}</dd></div></dl>
<div class="u-devkarta__fotky">${d.projekty.slice(0, 3).map((p) => `<img src="${R}${media(p.images[0], 640)}" alt="" loading="lazy"/>`).join('')}${d.projekty.length > 3 ? `<span>+${d.projekty.length - 3}</span>` : ''}</div>
<p class="u-devkarta__obce">${ikona('pin')}${esc(d.obce.slice(0, 4).join(', '))}${d.obce.length > 4 ? ` a ${d.obce.length - 4} další` : ''}</p></article>`;

  const body = `
<section class="u-wrap u-hero-s">
  ${drobecky(R, [['Developeři']])}
  <div class="u-hero-s__radek"><div><span class="u-eyebrow">Kdo staví</span><h1 class="u-h1">Developeři</h1></div><p class="u-lead">Firmy, které stavějí projekty v katalogu. U každé najdete, kde staví, co právě prodává a za kolik.</p></div>
  <dl class="u-kpi"><div><dt>Developerů</dt><dd>${devs.length}</dd></div><div><dt>Projektů</dt><dd>${P.length}</dd></div><div><dt>Lokalit</dt><dd>${obceSerazene.length}</dd></div>${hodnota ? `<div><dt>Hodnota nabídky</dt><dd>${(hodnota / 1000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} mld. Kč</dd></div>` : ''}</dl>
</section>
<div class="u-wrap u-logopas" aria-label="Developeři v katalogu"><div class="u-logopas__pas">${[...devs, ...devs].filter((d) => d.logo).map((d) => logo(d, R, 'u-logopas__logo')).join('')}</div></div>
<section class="u-wrap u-sekce">
  <div class="u-devfiltr" data-devfiltr>
    <label class="u-hledej u-hledej--s"><span>${ikona('hledat')}</span><input type="search" placeholder="Hledat developera nebo město" aria-label="Hledat developera nebo město" data-devhledat/></label>
    <div class="u-fchips"><button type="button" class="u-fchip" data-devkat="" aria-pressed="true">Vše<span>${devs.length}</span></button>${kats.map(({ k, n }) => `<button type="button" class="u-fchip" data-devkat="${KATEGORIE[k].slug}" aria-pressed="false">${esc(k)}<span>${n}</span></button>`).join('')}</div>
  </div>
  <div class="u-devmrizka" data-devvysledky>${devs.map(karta).join('')}</div>
  <p class="u-prazdne" data-devprazdne hidden>Žádný developer neodpovídá hledání.</p>
</section>
<section class="u-wrap u-sekce"><div class="u-cta-dev">
  <div><span class="u-eyebrow u-eyebrow--svetle">Pro developery</span><h2 class="u-h2">Máte projekt? Patří na mapu.</h2><p>Profil developera, projekty s ceníkem a poptávky přímo vám. Balíčky od 990 Kč měsíčně.</p></div>
  <div class="u-row"><a class="u-btn u-btn--primarni" href="${R}pro-developery/">Přidat projekt ${ikona('sipka')}</a><a class="u-btn u-btn--svetle" href="${R}developer/${devs[0].slug}/">Ukázka profilu</a></div>
</div></section>`;

  zapis('developeri/index.html', stranka({ R, title: 'Developeři · Urbanmap', description: `${devs.length} developerů a jejich ${P.length} projektů na jedné mapě.`, active: 'developeri/', body, bodyAttr: 'data-stranka="developeri"' }));
}

export function detailDevelopera({ devs }, d) {
  const R = '../../';
  const ps = d.projekty;
  const pocty = Object.entries(STAVY).map(([s, t]) => ({ s, t, n: ps.filter((p) => p.status === s).length })).filter((x) => x.n);
  const k = d.kontakt;
  const podobni = devs.filter((x) => x !== d && x.obce.some((o) => d.obce.includes(o))).slice(0, 4);
  const poptavka = `data-poptavka="${esc(d.name)}" data-kontext="Developer"`;

  const body = `
<section class="u-wrap u-devhero">
  ${drobecky(R, [['Developeři', R + 'developeri/'], [d.name]])}
  <div class="u-devhero__radek">
    <div class="u-devhero__text">${logo(d, R, 'u-devlogo u-devlogo--velke')}<h1 class="u-h1">${esc(d.name)}</h1>${d.description ? `<p class="u-lead">${esc(d.description)}</p>` : ''}
      <div class="u-row"><button type="button" class="u-btn u-btn--primarni" ${poptavka}>Kontaktovat developera ${ikona('sipka')}</button>${d.web ? `<a class="u-btn u-btn--obrys" href="https://${esc(d.web)}" target="_blank" rel="noopener nofollow">${ikona('web')}${esc(d.web)}</a>` : ''}</div></div>
    <div class="u-devhero__fotky">${ps.slice(0, 3).map((p, i) => `<a href="${R}projekt/${p.id}/"><img src="${R}${media(p.images[0], i ? 640 : 1200)}" alt="${esc(p.name)}" ${i ? 'loading="lazy"' : ''}/><span>${esc(p.name)}</span></a>`).join('')}</div>
  </div>
  <dl class="u-kpi"><div><dt>Projektů</dt><dd>${ps.length}</dd></div>${pocty.map(({ t, n }) => `<div><dt>${t}</dt><dd>${n}</dd></div>`).join('')}<div><dt>Cena od</dt><dd>${d.cenaOd ? mil(d.cenaOd) : '–'}</dd></div>${d.totalValueText ? `<div><dt>Hodnota nabídky</dt><dd>${esc(d.totalValueText)}</dd></div>` : ''}${d.founded ? `<div><dt>Založeno</dt><dd>${d.founded}</dd></div>` : ''}</dl>
</section>
<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Mapa realizací', nadpis: 'Kde developer staví', text: d.obce.map((o) => `<a href="${R}lokalita/${slugify(o)}/">${esc(o)}</a>`).join(', ') })}
  ${mapa(ps.map((p) => bodProjektu(p, R)), { vyska: 'detail', zaber: 'body' })}
</section>
<section class="u-wrap u-sekce" id="projekty">
  ${sekceHlava({ eyebrow: 'Portfolio', nadpis: 'Projekty developera' })}
  ${pocty.length > 1 ? `<div class="u-fchips u-fchips--taby" data-stavfiltr><button type="button" class="u-fchip" data-stav="" aria-pressed="true">Vše<span>${ps.length}</span></button>${pocty.map(({ s, t, n }) => `<button type="button" class="u-fchip" data-stav="${s}" aria-pressed="false">${t}<span>${n}</span></button>`).join('')}</div>` : ''}
  <div class="u-pgrid u-pgrid--3" data-stavvysledky>${ps.map((p) => kartaProjektu(p, R)).join('')}</div>
</section>
<section class="u-wrap u-sekce u-kontakt">
  <div><span class="u-eyebrow">Kontakt</span><h2 class="u-h2">Napište přímo developerovi</h2><p class="u-lead">Zeptejte se na ceník, termíny nebo připravované projekty. Zprávu dostane přímo ${esc(d.name)}.</p>
  <dl class="u-kontakt__udaje">${k.person ? `<div>${ikona('budova')}<dt>Kontaktní osoba</dt><dd>${esc(k.person)}</dd></div>` : ''}${k.email ? `<div>${ikona('mail')}<dt>E-mail</dt><dd><a href="mailto:${esc(k.email)}">${esc(k.email)}</a></dd></div>` : ''}${k.phone ? `<div>${ikona('telefon')}<dt>Telefon</dt><dd><a href="tel:${k.phone.replace(/\s/g, '')}">${esc(k.phone)}</a></dd></div>` : ''}${d.seat ? `<div>${ikona('pin')}<dt>Sídlo</dt><dd>${esc(d.seat)}</dd></div>` : ''}</dl></div>
  <form class="u-kontakt__form" data-formular="kontakt">
    <label class="u-pole"><span>Jméno a příjmení</span><input name="jmeno" autocomplete="name" required/></label>
    <label class="u-pole"><span>E-mail</span><input type="email" name="email" autocomplete="email" required/></label>
    <label class="u-pole"><span>Telefon</span><input type="tel" name="telefon" autocomplete="tel"/></label>
    <label class="u-pole"><span>O který projekt jde</span><select name="projekt"><option>Obecný dotaz</option>${ps.map((p) => `<option>${esc(p.name)}</option>`).join('')}</select></label>
    <label class="u-pole u-pole--siroke"><span>Zpráva</span><textarea name="zprava" rows="4"></textarea></label>
    <button class="u-btn u-btn--primarni">Odeslat zprávu ${ikona('sipka')}</button>
    <div class="u-dialog__hotovo" hidden>${ikona('check', 'u-ico u-ico--velka')}<h3 class="u-h3">Hotovo</h3><p>V tomto náhledu se zpráva nikam neodesílá.</p></div>
  </form>
</section>
${podobni.length ? `<section class="u-wrap u-sekce">${sekceHlava({ eyebrow: 'Ve stejných lokalitách', nadpis: 'Další developeři', odkaz: { href: R + 'developeri/', text: 'Všichni developeři' } })}
<div class="u-devmini u-devmini--mrizka">${podobni.map((x) => `<a href="${R}developer/${x.slug}/">${logo(x, R, 'u-devmini__logo')}<b>${esc(x.name)}</b><em>${x.projekty.length} ${plural(x.projekty.length, 'projekt', 'projekty', 'projektů')}</em></a>`).join('')}</div></section>` : ''}`;

  zapis(`developer/${d.slug}/index.html`, stranka({ R, title: `${d.name} · Developer · Urbanmap`, description: d.description || `${d.name}: ${ps.length} projektů na Urbanmapu.`, active: 'developeri/', body, mapa: true, bodyAttr: 'data-stranka="developer"' }));
}
