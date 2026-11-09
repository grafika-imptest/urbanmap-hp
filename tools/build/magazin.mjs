// /magazin/ a /magazin/<slug>/ — magazín napojený na katalog: každý článek končí projekty k tématu a hlídáním.
import { stranka, kartaProjektu, ikona, esc, media, zapis, drobecky, sekceHlava, pasHlidani, slugify, KATEGORIE } from './lib.mjs';

// Projekty k tématu článku — výběr z reálných dat podle obsahu článku
const KTEMATU = {
  'predprodej-novostavby-co-to-znamena': { text: 'Projekty v předprodeji', f: (p) => ['predprodej', 'pripravovany'].includes(p.status) },
  'byt-na-pronajem-jak-spocitat-vynos': { text: 'Investiční projekty', f: (p) => p.tags.includes('Investiční') },
  'jak-cist-cenik-novostavby': { text: 'Projekty s cenou za m²', f: (p) => p.status === 'v_prodeji' && p.priceM2 },
  'prohlidka-rozestavene-novostavby': { text: 'Projekty ve výstavbě', f: (p) => ['v_realizaci', 'v_prodeji'].includes(p.status) && p.completion },
};

const karta = (a, R, velka = false) => `<a class="u-magkarta${velka ? ' u-magkarta--velka' : ''}" href="${R}magazin/${a.slug}/" data-kategorie="${slugify(a.category || '')}">
<span class="u-magkarta__foto"><img src="${R}${media(a.image, velka ? 1200 : 640)}" alt="" loading="lazy"/></span>
<span class="u-magkarta__telo"><span class="u-magkarta__meta"><b>${esc(a.category)}</b>${esc(a.date)} · ${esc(a.readTime)}</span><b class="u-magkarta__nazev">${esc(a.title)}</b>${a.perex ? `<span class="u-magkarta__perex">${esc(a.perex)}</span>` : ''}<span class="u-link">Číst článek ${ikona('sipka')}</span></span></a>`;

export function magazin({ articles, obceSerazene, P }) {
  const R = '../';
  const [hlavni, ...dalsi] = articles;
  const kategorie = [...new Set(articles.map((a) => a.category).filter(Boolean))].map((k) => ({ k, n: articles.filter((a) => a.category === k).length }));
  const dispozice = ['1+kk', '2+kk', '3+kk', '4+kk'];
  const kombinace = obceSerazene.slice(0, 3).flatMap((o) => dispozice.filter((d) => o.projekty.some((p) => p.layouts.includes(d))).slice(0, 3).map((d) => ({ t: `Byty ${d} ${o.name}`, h: `${R}projekty/?obec=${encodeURIComponent(o.name)}&disp=${encodeURIComponent(d)}`, n: o.projekty.filter((p) => p.layouts.includes(d)).length })));

  const body = `
<section class="u-wrap u-hero-s">
  ${drobecky(R, [['Magazín']])}
  <div class="u-hero-s__radek"><div><span class="u-eyebrow">Průvodci, trh a lokality</span><h1 class="u-h1">Magazín</h1></div><p class="u-lead">Jak vybrat a koupit novostavbu, co číst v ceníku a jak počítat výnos. Píšeme pro kupující i investory.</p></div>
  <nav class="u-fchips u-fchips--taby" aria-label="Kategorie" data-magfiltr><button type="button" class="u-fchip" data-kategorie="" aria-pressed="true">Vše<span>${articles.length}</span></button>${kategorie.map(({ k, n }) => `<button type="button" class="u-fchip" data-kategorie="${slugify(k)}" aria-pressed="false">${esc(k)}<span>${n}</span></button>`).join('')}</nav>
</section>
<section class="u-wrap u-maghlavni">${karta(hlavni, R, true)}<div class="u-magmrizka" data-magvysledky>${dalsi.map((a) => karta(a, R)).join('')}</div></section>
<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Rovnou do katalogu', nadpis: 'Nejhledanější kombinace' })}
  <div class="u-kombinace">${kombinace.map((x) => `<a href="${x.h}"><b>${esc(x.t)}</b><span>${x.n} ${x.n === 1 ? 'projekt' : x.n < 5 ? 'projekty' : 'projektů'}</span>${ikona('sipka')}</a>`).join('')}</div>
</section>
<section class="u-wrap u-sekce"><div class="u-newsletter">
  <div>${ikona('mail', 'u-ico u-ico--velka')}<h2 class="u-h2">Novinky z trhu novostaveb</h2><p>Jednou za měsíc nové projekty, průvodci a data z katalogu. Žádný spam.</p></div>
  <form class="u-newsletter__form" data-formular="newsletter"><label class="u-pole"><span>E-mail</span><input type="email" name="email" placeholder="vas@email.cz" required/></label><button class="u-btn u-btn--primarni">Odebírat</button><div class="u-dialog__hotovo" hidden>${ikona('check')}<p>V náhledu se nic neukládá.</p></div></form>
</div></section>`;

  zapis('magazin/index.html', stranka({ R, title: 'Magazín · Urbanmap', description: 'Průvodci koupí novostavby, trh a lokality. Pro kupující i investory.', active: 'magazin/', body, bodyAttr: 'data-stranka="magazin"' }));
}

export function clanek({ articles, P }, a) {
  const R = '../../';
  const toc = [];
  const html = a.html.replace(/<h2>(.*?)<\/h2>/g, (m, t) => { const id = slugify(t.replace(/<[^>]+>/g, '')); toc.push({ id, t }); return `<h2 id="${id}">${t}</h2>`; });
  const tema = KTEMATU[a.slug] || { text: 'Projekty v katalogu', f: () => true };
  const projekty = P.filter(tema.f).slice(0, 3);
  const souvisejici = articles.filter((x) => x !== a).slice(0, 3);
  // Mezi-CTA vložíme za druhý mezititulek, aby článek nepřerušilo hned na začátku
  let n = 0;
  const telo = html.replace(/<h2 /g, (m) => (++n === 3 ? `<aside class="u-inline-cta">${ikona('zvonek')}<div><b>Hledáte novostavbu?</b><span>Nastavte si hlídání a pošleme vám nové projekty.</span></div><button type="button" class="u-btn u-btn--primarni u-btn--s" data-hlidani="magazin">Hlídat</button></aside>${m}` : m));

  const body = `
<div class="u-cteni" aria-hidden="true"><i data-cteni></i></div>
<article class="u-clanek">
<header class="u-wrap u-clanek__hlava">
  ${drobecky(R, [['Magazín', R + 'magazin/'], [a.title]])}
  <span class="u-magkarta__meta"><b>${esc(a.category)}</b>${esc(a.date)} · ${esc(a.readTime)}</span>
  <h1 class="u-h1">${esc(a.title)}</h1>${a.perex ? `<p class="u-lead">${esc(a.perex)}</p>` : ''}
  <div class="u-clanek__autor"><span class="u-avatar">U</span><span><b>${esc(a.author || 'Redakce Urbanmap')}</b><span>${esc(a.date)}</span></span><button type="button" class="u-btn u-btn--obrys u-btn--s" data-sdilet>${ikona('sdilet')}Sdílet</button></div>
</header>
${a.image ? `<div class="u-wrap"><img class="u-clanek__foto" src="${R}${media(a.image, 1920)}" alt="" fetchpriority="high"/></div>` : ''}
<div class="u-wrap u-clanek__mrizka">
  <aside class="u-clanek__toc">${toc.length ? `<span class="u-meta">V článku</span><ol>${toc.map((x) => `<li><a href="#${x.id}">${x.t}</a></li>`).join('')}</ol>` : ''}</aside>
  <div class="u-clanek__text u-prose">${telo}</div>
  <aside class="u-clanek__bok"><div class="u-clanek__bokbox"><span class="u-meta">${esc(tema.text)}</span>${projekty.slice(0, 2).map((p) => `<a class="u-minikarta" href="${R}projekt/${p.id}/"><img src="${R}${media(p.images[0], 640)}" alt="" loading="lazy"/><span><b>${esc(p.name)}</b><span>${esc(p.city)}</span></span></a>`).join('')}<a class="u-link" href="${R}projekty/">Všechny projekty ${ikona('sipka')}</a></div></aside>
</div>
</article>
${projekty.length ? `<section class="u-wrap u-sekce">${sekceHlava({ eyebrow: 'K tématu', nadpis: esc(tema.text), odkaz: { href: R + 'projekty/', text: 'Celý katalog' } })}<div class="u-pgrid u-pgrid--3">${projekty.map((p) => kartaProjektu(p, R)).join('')}</div></section>` : ''}
<div class="u-wrap">${pasHlidani({ kontext: 'magazin' })}</div>
${souvisejici.length ? `<section class="u-wrap u-sekce">${sekceHlava({ eyebrow: 'Magazín', nadpis: 'Mohlo by vás zajímat', odkaz: { href: R + 'magazin/', text: 'Všechny články' } })}<div class="u-magmrizka u-magmrizka--3">${souvisejici.map((x) => karta(x, R)).join('')}</div></section>` : ''}`;

  zapis(`magazin/${a.slug}/index.html`, stranka({ R, title: `${a.title} · Magazín Urbanmap`, description: a.perex || '', active: 'magazin/', body, bodyAttr: 'data-stranka="clanek"', ogImage: a.image ? media(a.image, 1200) : '' }));
}
