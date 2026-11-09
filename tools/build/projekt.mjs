// /projekt/<id>/ — detail projektu. Pořadí sekcí podle benchmarku (docs/benchmark.md):
// galerie → klíčová fakta → dispozice s poptávkou → vybavení → lokalita → financování → developer → podobné.
// Sticky poptávkový box vpravo, na mobilu spodní lišta. Jen reálná data — co web nemá, tu není.
import { stranka, kartaProjektu, ikona, ikonaVybaveni, esc, kc, mil, media, mapa, bodProjektu, zapis, drobecky, stitekStavu, kategorieProjektu, lifestyleProjektu, KATEGORIE, cenaProjektu, vzdalenostKm, plural, sekceHlava, pasHlidani, ZEME } from './lib.mjs';

export function detailProjektu({ P, devBySlug, obce, articles }, p) {
  const R = '../../';
  const dev = devBySlug.get(p.developer.slug);
  const obec = obce.get(p.obec);
  const foto = p.images;
  const kat = kategorieProjektu(p);
  const poptavka = (text, zprava = '') => `data-poptavka="${esc(p.name)}" data-kontext="${esc(text)}"${zprava ? ` data-zprava="${esc(zprava)}"` : ''}`;

  const okoli = P.filter((x) => x !== p && x.zeme === p.zeme).map((x) => ({ x, km: vzdalenostKm(p, x) })).filter((o) => o.km < 25).sort((a, b) => a.km - b.km).slice(0, 5);
  const podobne = P.filter((x) => x !== p && (x.obec === p.obec || x.tags.some((t) => kat.includes(t)))).sort((a, b) => (b.obec === p.obec) - (a.obec === p.obec) || Math.abs((a.priceFrom || 0) - (p.priceFrom || 0)) - Math.abs((b.priceFrom || 0) - (p.priceFrom || 0))).slice(0, 4);
  const devDalsi = (dev?.projekty || []).filter((x) => x !== p).slice(0, 3);
  const clanekCenik = articles.find((a) => a.slug === 'jak-cist-cenik-novostavby');

  const fakta = [
    ['cena', 'Cena od', p.priceFrom ? kc(p.priceFrom) : 'Na vyžádání'],
    p.priceTo && p.priceTo !== p.priceFrom ? ['cena', 'Nejdražší jednotka', kc(p.priceTo)] : null,
    ['graf', 'Cena za m²', p.priceM2 ? kc(p.priceM2) : 'Na vyžádání'],
    ['dum', 'Dispozice', p.layouts.join(', ') || '–'],
    ['plocha', 'Plochy', p.areas || '–'],
    p.unitsAvailable != null ? ['klic', 'Volné jednotky', String(p.unitsAvailable)] : null,
    p.completion ? ['kalendar', 'Dokončení', p.completion] : null,
    ['budova', 'Stav', p.statusText || '–'],
  ].filter(Boolean);

  const leadbox = `<aside class="u-leadbox" id="poptavka">
<div class="u-leadbox__cena"><span class="u-meta">Cena</span><b>${cenaProjektu(p)}</b>${p.priceM2 ? `<span>${kc(p.priceM2)} za m²</span>` : ''}</div>
<ul class="u-leadbox__fakta">${p.unitsAvailable ? `<li>${ikona('klic')}<b>${p.unitsAvailable}</b> ${plural(p.unitsAvailable, 'volná jednotka', 'volné jednotky', 'volných jednotek')}</li>` : ''}<li>${ikona('budova')}${esc(p.statusText || '')}${p.completion ? ` · dokončení ${esc(p.completion)}` : ''}</li></ul>
<form class="u-leadbox__form" data-formular="leadbox">
<div class="u-segment u-segment--mini" role="radiogroup" aria-label="Co potřebujete"><label><input type="radio" name="typ" value="cenik" checked/><span>Ceník</span></label><label><input type="radio" name="typ" value="prohlidka"/><span>Prohlídka</span></label><label><input type="radio" name="typ" value="dotaz"/><span>Dotaz</span></label></div>
<label class="u-pole"><span>Jméno a příjmení</span><input name="jmeno" autocomplete="name" required/></label>
<label class="u-pole"><span>E-mail</span><input type="email" name="email" autocomplete="email" required/></label>
<label class="u-pole"><span>Telefon</span><input type="tel" name="telefon" autocomplete="tel"/></label>
<button class="u-btn u-btn--primarni u-btn--plne">Poslat poptávku ${ikona('sipka')}</button>
<p class="u-drobne">Zprávu dostane přímo ${esc(p.developer.name)}. Odesláním souhlasíte s předáním údajů.</p>
<div class="u-dialog__hotovo" hidden>${ikona('check', 'u-ico u-ico--velka')}<h3 class="u-h3">Hotovo</h3><p>V tomto náhledu se poptávka nikam neodesílá.</p></div></form>
${p.contact.phone ? `<a class="u-leadbox__tel" href="tel:${p.contact.phone.replace(/\s/g, '')}" data-odhalit-tel="${esc(p.contact.phone)}">${ikona('telefon')}<span>Zobrazit telefon</span></a>` : ''}
</aside>`;

  const galerie = foto.length ? `<div class="u-wrap"><div class="u-mozaika u-mozaika--${Math.min(foto.length, 5)}" data-galerie='${esc(JSON.stringify(foto.map((u) => R + media(u, 1200))))}'>
${foto.slice(0, 5).map((u, i) => `<button type="button" class="u-mozaika__dlazdice" data-index="${i}" aria-label="Zvětšit fotku ${i + 1}"><img src="${R}${media(u, i ? 640 : 1200)}" alt="${i ? '' : esc(p.name)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"/></button>`).join('')}
<div class="u-mozaika__stitky">${stitekStavu(p)}</div>
<button type="button" class="u-btn u-btn--svetle u-btn--s u-mozaika__vse" data-index="0">${ikona('fotky')}Všech ${foto.length} ${plural(foto.length, 'fotka', 'fotky', 'fotek')}</button></div></div>` : '';

  const body = `
<div class="u-wrap u-dhead">
  ${drobecky(R, [['Projekty', R + 'projekty/'], [p.obec, R + `lokalita/${obec.slug}/`], [p.name]])}
  <div class="u-dhead__radek"><div>
    <div class="u-dhead__stitky">${kat.map((k) => `<span class="u-kat" style="--barva:${KATEGORIE[k].barva}">${esc(k)}</span>`).join('')}${p.zeme !== 'CZ' ? `<span class="u-kat">${ikona('svet')}${ZEME[p.zeme]}</span>` : ''}</div>
    <h1 class="u-h1">${esc(p.name)}</h1>
    <p class="u-dhead__meta"><a href="#lokalita">${ikona('pin')}${esc(p.address || p.city)}</a><a href="${R}developer/${p.developer.slug}/">${dev?.logo ? `<img src="${R}${media(dev.logo, 256)}" alt="" class="u-minilogo${dev.logoDark ? ' u-minilogo--tmave' : ''}"/>` : ikona('budova')}${esc(p.developer.name)}</a></p>
  </div><div class="u-dhead__akce">
    <button type="button" class="u-btn u-btn--obrys u-btn--s" data-ulozit="${p.id}" aria-pressed="false">${ikona('srdce')}Uložit</button>
    <button type="button" class="u-btn u-btn--obrys u-btn--s" data-sdilet>${ikona('sdilet')}Sdílet</button>
  </div></div>
  ${p.slogan ? `<p class="u-lead">${esc(p.slogan)}</p>` : ''}
</div>
${galerie}
<nav class="u-taby" aria-label="Sekce projektu" data-taby><div class="u-wrap u-taby__vnitrek">
  <a href="#prehled">Přehled</a>${p.layouts.length ? '<a href="#dispozice">Dispozice a ceny</a>' : ''}${p.amenities.length ? '<a href="#vybaveni">Vybavení</a>' : ''}<a href="#lokalita">Lokalita</a>${p.priceFrom ? '<a href="#financovani">Financování</a>' : ''}<a href="#developer">Developer</a>
  <button type="button" class="u-btn u-btn--primarni u-btn--s u-taby__cta" ${poptavka('Ceník a dostupnost')}>Mám zájem</button>
</div></nav>
<div class="u-wrap u-dgrid">
<div class="u-dmain">
  <section id="prehled" class="u-dsekce">
    <dl class="u-fakta">${fakta.map(([ic, k, v]) => `<div>${ikona(ic)}<dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <h2 class="u-h3">O projektu</h2>
    <div class="u-prose">${p.description.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
    ${lifestyleProjektu(p).length ? `<div class="u-tagy"><span class="u-meta">V okolí</span>${lifestyleProjektu(p).map((t) => `<span class="u-tag">${esc(t)}</span>`).join('')}</div>` : ''}
    ${p.web ? `<a class="u-link" href="https://${esc(p.web)}" target="_blank" rel="noopener nofollow">${ikona('web')}Web projektu ${esc(p.web)}</a>` : ''}
  </section>
  ${p.layouts.length ? `<section id="dispozice" class="u-dsekce">
    ${sekceHlava({ eyebrow: 'Dispozice a ceny', nadpis: 'Vyberte si dispozici', text: `Plochy ${esc(p.areas || '')}. Aktuální ceník a volné jednotky vám pošle developer — vyberte dispozici a poptávka už bude vyplněná.` })}
    <div class="u-dispozice">${p.layouts.map((d) => `<button type="button" class="u-disp" ${poptavka('Dispozice ' + d, `Dobrý den, mám zájem o byt ${d} v projektu ${p.name}. Prosím o ceník a dostupnost.`)}><b>${esc(d)}</b><span>Ceník a dostupnost</span>${ikona('sipka')}</button>`).join('')}</div>
    ${clanekCenik ? `<a class="u-tip" href="${R}magazin/${clanekCenik.slug}/">${ikona('ctení')}<span><b>Tip z magazínu:</b> ${esc(clanekCenik.title)}</span>${ikona('sipka')}</a>` : ''}
  </section>` : ''}
  ${p.amenities.length ? `<section id="vybaveni" class="u-dsekce"><h2 class="u-h3">Vybavení a plusy</h2><ul class="u-vybaveni">${p.amenities.map((a) => `<li>${ikona(ikonaVybaveni(a))}<span>${esc(a)}</span></li>`).join('')}</ul></section>` : ''}
  <section id="lokalita" class="u-dsekce">
    ${sekceHlava({ eyebrow: 'Lokalita', nadpis: esc(p.address || p.city), odkaz: { href: `${R}lokalita/${obec.slug}/`, text: `Novostavby ${esc(p.obec)}` } })}
    ${mapa([{ ...bodProjektu(p, R), hlavni: 1 }, ...okoli.map((o) => bodProjektu(o.x, R))], { vyska: 'detail', zaber: 'body' })}
    ${okoli.length ? `<h3 class="u-h4">Další projekty v okolí</h3><ul class="u-okoli">${okoli.map(({ x, km }) => `<li><a href="${R}projekt/${x.id}/"><img src="${R}${media(x.images[0], 640)}" alt="" loading="lazy"/><span><b>${esc(x.name)}</b><span>${cenaProjektu(x)}</span></span><em>${km < 1 ? Math.round(km * 1000) + ' m' : km.toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' km'}</em></a></li>`).join('')}</ul>` : ''}
  </section>
  ${p.priceFrom ? `<section id="financovani" class="u-dsekce">
    ${sekceHlava({ eyebrow: 'Financování', nadpis: 'Kolik by dělala splátka', text: 'Orientační výpočet anuitní splátky. Sazbu a podmínky si ověřte u banky.' })}
    <form class="u-kalk" data-kalkulacka>
      <label class="u-pole"><span>Cena nemovitosti</span><input inputmode="numeric" name="cena" value="${p.priceFrom}"/></label>
      <label class="u-pole"><span>Vlastní zdroje (%)</span><input type="range" name="vlastni" min="10" max="60" step="5" value="20"/><output data-vystup="vlastni">20 %</output></label>
      <label class="u-pole"><span>Úroková sazba (% p. a.)</span><input inputmode="decimal" name="sazba" value="4,9"/></label>
      <label class="u-pole"><span>Splatnost</span><select name="roky"><option>20</option><option>25</option><option selected>30</option></select></label>
      <div class="u-kalk__vysledek"><span class="u-meta">Měsíční splátka</span><b data-vystup="splatka">–</b><span data-vystup="uver"></span><button type="button" class="u-btn u-btn--tmave u-btn--s" ${poptavka('Financování', `Dobrý den, zajímá mě projekt ${p.name} a možnosti financování.`)}>Probrat financování</button></div>
    </form>
    <p class="u-drobne">Modelová sazba 4,9 % je jen výchozí hodnota pro výpočet, ne nabídka banky.</p>
  </section>` : ''}
  <section id="developer" class="u-dsekce">
    <div class="u-devblok">
      <a class="u-devblok__logo${dev?.logoDark ? ' u-devblok__logo--tmave' : ''}" href="${R}developer/${p.developer.slug}/">${dev?.logo ? `<img src="${R}${media(dev.logo, 256)}" alt="${esc(p.developer.name)}"/>` : ikona('budova', 'u-ico u-ico--velka')}</a>
      <div class="u-devblok__text"><span class="u-eyebrow">Developer</span><h2 class="u-h3">${esc(p.developer.name)}</h2>${dev?.description ? `<p>${esc(dev.description.length > 260 ? dev.description.slice(0, 257) + '…' : dev.description)}</p>` : ''}
        <dl class="u-minifakta">${dev ? `<div><dt>Projektů na Urbanmapu</dt><dd>${dev.projekty.length}</dd></div>` : ''}${dev?.founded ? `<div><dt>Založeno</dt><dd>${dev.founded}</dd></div>` : ''}${p.contact.seat ? `<div><dt>Sídlo</dt><dd>${esc(p.contact.seat)}</dd></div>` : ''}</dl>
        <div class="u-row">${p.contact.email ? `<a class="u-btn u-btn--obrys u-btn--s" href="mailto:${esc(p.contact.email)}">${ikona('mail')}${esc(p.contact.email)}</a>` : ''}<a class="u-btn u-btn--tmave u-btn--s" href="${R}developer/${p.developer.slug}/">Profil developera ${ikona('sipka')}</a></div></div>
    </div>
    ${devDalsi.length ? `<h3 class="u-h4">Další projekty developera</h3><div class="u-pgrid u-pgrid--3">${devDalsi.map((x) => kartaProjektu(x, R)).join('')}</div>` : ''}
  </section>
</div>
${leadbox}
</div>
${podobne.length ? `<section class="u-wrap u-sekce">${sekceHlava({ eyebrow: 'Podobné projekty', nadpis: `Mohlo by vás zajímat`, odkaz: { href: R + 'projekty/', text: 'Všechny projekty' } })}<div class="u-pgrid u-pgrid--4">${podobne.map((x) => kartaProjektu(x, R)).join('')}</div></section>` : ''}
<div class="u-wrap">${pasHlidani({ nadpis: `Hlídat nové projekty v lokalitě ${esc(p.obec)}`, text: `Pošleme vám e-mail, jakmile se v lokalitě ${esc(p.obec)} objeví nový projekt nebo zlevní jednotky.`, kontext: p.obec })}</div>
<div class="u-mobilbar"><div><b>${cenaProjektu(p)}</b>${p.priceM2 ? `<span>${kc(p.priceM2)}/m²</span>` : ''}</div>${p.contact.phone ? `<a class="u-ikbtn u-ikbtn--obrys" href="tel:${p.contact.phone.replace(/\s/g, '')}" aria-label="Zavolat">${ikona('telefon')}</a>` : ''}<button type="button" class="u-btn u-btn--primarni" ${poptavka('Ceník a dostupnost')}>Mám zájem</button></div>`;

  zapis(`projekt/${p.id}/index.html`, stranka({
    R, title: `${p.name} · ${p.city} · Urbanmap`, description: p.slogan || p.description[0] || '', active: 'projekty/', body, mapa: true,
    bodyAttr: 'data-stranka="projekt"', ogImage: foto[0] ? media(foto[0], 1200) : '',
  }));
}
