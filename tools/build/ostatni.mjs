// /pro-developery/ (B2B landing, obsah a ceník ze živého webu) a /podminky/.
import fs from 'node:fs';
import path from 'node:path';
import { PUB, stranka, kartaProjektu, ikona, esc, zapis, drobecky, sekceHlava, cislo } from './lib.mjs';


// Hero = stejná sekce „Dostaňte projekt na mapu“ jako na HP (panorama s mapou, domy v popředí, padající piny),
// jen s nadpisem jako H1 a CTA vedoucími na registraci a ceník téhle stránky.
function heroZHP(R, { P, devs, obceSerazene }) {
  const hp = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  const z = hp.indexOf('<section class="katalog-module__1b44Qq__panorama"');
  let h = hp.slice(z, hp.indexOf('</section>', z) + 10);
  h = h.replace(/(src=")assets\//g, '$1' + R + 'assets/').replace(/ loading="lazy"/g, '')
    .replace(/<p class="katalog-module__1b44Qq__panoramaClaim">[^<]*<\/p>/, '<p class="katalog-module__1b44Qq__panoramaClaim">Pro developery a kanceláře</p>')
    .replace(/(<div class="katalog-module__1b44Qq__panoramaAkce"><p>)[^<]*(<\/p>)/, `$1Ukažte projekt kupujícím, kteří hledají podle místa: ${P.length} projektů od ${devs.length} developerů v ${obceSerazene.length} lokalitách. Zaregistrujte firmu, projekt si založíte sami a poptávky chodí přímo vám.$2`)
    .replace(/<a class="katalog-module__1b44Qq__ctaTlacitko" href="[^"]*">[^<]*<\/a><a href="[^"]*" class="katalog-module__1b44Qq__panoramaOdkaz">[^<]*<\/a>/, '<a class="katalog-module__1b44Qq__ctaTlacitko" href="#registrace">Zaregistrovat firmu</a><a href="#cenik" class="katalog-module__1b44Qq__panoramaOdkaz">Ceník balíčků</a>')
    .replace(/<h2 class="katalog-module__1b44Qq__panoramaNadpis"([^>]*)>([^<]*)<\/h2>/, '<h1 class="katalog-module__1b44Qq__panoramaNadpis"$1>$2</h1>')
    .replace('class="katalog-module__1b44Qq__panorama"', 'class="katalog-module__1b44Qq__panorama u-propanorama"');
  return h;
}

export function proDevelopery({ data, P, devs, obceSerazene }) {
  const R = '../';
  const hero = heroZHP(R, { P, devs, obceSerazene });
  const kroky = data.proBloky.find((b) => b.title === 'Jak to funguje')?.items || [];
  const topovani = data.proBloky.find((b) => b.title === 'Topování projektu')?.items[0] || '';
  const ukazka = P.find((p) => p.images.length > 2 && p.priceFrom) || P[0];
  const vyhody = [
    ['mapa', 'Projekt na mapě i ve výpisech', 'Kupující hledají podle lokality. Váš projekt uvidí na mapě, ve výpisu i na stránce lokality.'],
    ['mail', 'Poptávky přímo vám', 'Poptávky dostanete e-mailem a vidíte je v účtu. Žádný prostředník mezi vámi a kupujícím.'],
    ['vodovaha', 'Ceník a jednotky z Excelu', 'Jednotky s ceníkem nahrajete i hromadně. Neomezený počet jednotek a fotek.'],
    ['budova', 'Profil developera', 'Všechny vaše projekty na jednom místě, s odkazem na váš web (od balíčku Profi).'],
  ];
  const faq = [
    ['Jak se platí?', 'Kartou, měsíčně. Zrušit jde kdykoli.'],
    ['Co když mám víc projektů, než je v balíčku?', 'Každý projekt navíc se platí zvlášť — podle balíčku 690, 590 nebo 490 Kč měsíčně.'],
    ['Kolik mohu nahrát jednotek a fotek?', 'Neomezeně ve všech balíčcích.'],
    ['Jak funguje topování?', topovani],
  ];

  const body = `
${hero}
<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Proč Urbanmap', nadpis: 'Kupující, kteří hledají podle místa' })}
  <div class="u-vyhody">${vyhody.map(([i, h, t]) => `<div>${ikona(i, 'u-ico u-ico--velka')}<h3 class="u-h4">${h}</h3><p>${t}</p></div>`).join('')}</div>
</section>
<section class="u-wrap u-sekce">
  ${sekceHlava({ eyebrow: 'Jak to funguje', nadpis: 'Ze založení účtu do katalogu za pár minut' })}
  <ol class="u-kroky">${kroky.map((t, i) => `<li><span>${i + 1}</span><p>${esc(t)}</p></li>`).join('')}</ol>
</section>
<section class="u-wrap u-sekce" id="cenik">
  ${sekceHlava({ eyebrow: 'Ceník', nadpis: 'Vyberte balíček podle počtu projektů', text: 'Platí se kartou, měsíčně, zrušit jde kdykoli.' })}
  <div class="u-ceny">${data.plans.map((b) => `<div class="u-cena${b.badge ? ' u-cena--hlavni' : ''}">${b.badge ? `<span class="u-cena__stitek">${esc(b.badge)}</span>` : ''}<h3 class="u-h3">${esc(b.name)}</h3><p class="u-cena__pozn">${esc(b.note)}</p><p class="u-cena__cena">${esc(b.price).replace(/(\d[\d\s]*)\s*Kč/, '<b>$1</b> Kč')}</p><ul>${b.features.map((f) => `<li>${ikona(/navíc/.test(f) ? 'plus' : 'check')}${esc(f)}</li>`).join('')}</ul><a class="u-btn ${b.badge ? 'u-btn--primarni' : 'u-btn--tmave'} u-btn--plne" href="#registrace" data-balicek="${esc(b.name)}">Vybrat ${esc(b.name)}</a></div>`).join('')}</div>
  ${topovani ? `<div class="u-topovani">${ikona('hvezda', 'u-ico u-ico--velka')}<div><h3 class="u-h4">Topování projektu</h3><p>${esc(topovani)}</p></div></div>` : ''}
</section>
<section class="u-wrap u-sekce u-faq-sekce">
  ${sekceHlava({ eyebrow: 'Časté dotazy', nadpis: 'Než začnete' })}
  <div class="u-faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}${ikona('plus')}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</section>
<section class="u-wrap u-sekce" id="registrace"><div class="u-registrace">
  <div><span class="u-eyebrow u-eyebrow--svetle">Registrace</span><h2 class="u-h2">Dostaňte projekt na mapu</h2><p>Nechte nám kontakt a ozveme se s přístupem do účtu. Na Urbanmapu dnes: ${cislo(P.length)} projektů · ${devs.length} developerů.</p></div>
  <form class="u-registrace__form" data-formular="registrace">
    <label class="u-pole u-pole--tmave"><span>Firma</span><input name="firma" autocomplete="organization" required/></label>
    <label class="u-pole u-pole--tmave"><span>Jméno a příjmení</span><input name="jmeno" autocomplete="name" required/></label>
    <label class="u-pole u-pole--tmave"><span>E-mail</span><input type="email" name="email" autocomplete="email" required/></label>
    <label class="u-pole u-pole--tmave"><span>Telefon</span><input type="tel" name="telefon" autocomplete="tel"/></label>
    <label class="u-pole u-pole--tmave"><span>Balíček</span><select name="balicek" data-pole-balicek>${data.plans.map((b) => `<option${b.badge ? ' selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>
    <label class="u-pole u-pole--tmave"><span>Počet projektů</span><input inputmode="numeric" name="pocet" placeholder="např. 3"/></label>
    <button class="u-btn u-btn--primarni u-btn--plne">Zaregistrovat firmu ${ikona('sipka')}</button>
    <div class="u-dialog__hotovo" hidden>${ikona('check', 'u-ico u-ico--velka')}<h3 class="u-h3">Děkujeme</h3><p>V tomto náhledu se registrace nikam neodesílá.</p></div>
  </form></div></section>`;

  zapis('pro-developery/index.html', stranka({ R, title: 'Pro developery · Urbanmap', description: 'Váš projekt na mapě novostaveb. Ceník, dostupnost a poptávky přímo vám. Balíčky od 990 Kč měsíčně.', body, bodyAttr: 'data-stranka="pro-developery"' }));
}

export function podminky({ data }) {
  const R = '../';
  // Text podmínek přebíráme ze živého webu; jen z něj odstraníme vnořené třídy původní aplikace
  const html = data.podminkyHtml.replace(/\sclass="[^"]*"/g, '').replace(/\sdata-[a-z-]+="[^"]*"/g, '').replace(/<a href="\/"[^>]*>[\s\S]*?<\/a>/, '');
  const body = `<section class="u-wrap u-hero-s">${drobecky(R, [['Podmínky a ochrana údajů']])}</section><div class="u-wrap"><div class="u-prose u-prose--uzke">${html}</div></div>`;
  zapis('podminky/index.html', stranka({ R, title: 'Podmínky užití a ochrana osobních údajů · Urbanmap', description: 'Podmínky užití, ochrana osobních údajů a cookies.', body }));
}
