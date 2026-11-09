# Urbanmap – kopie webu s redesignem podstránek

Statická kopie https://urbanmap.cz/ jako základ pro další úpravy designu.
Homepage je převzatá 1:1 (stav 12. 10. 2026, s našimi úpravami níže),
podstránky jsou nově navržené a generují se z reálných dat živého webu (stav 9. 11. 2026).

Web: https://grafika-imptest.github.io/urbanmap-hp/

## Stránky

| Cesta | Obsah |
|---|---|
| `index.html` | HP — převzatá z živého webu, odkazy vedou na lokální podstránky |
| `projekty/` | výpis: seznam + mapa vedle sebe, filtry, hlídací pes, porovnání (max. 3), poptávka z karty |
| `projekt/<id>/` | detail (67×): galerie, sticky poptávkový box, taby, dispozice s předvyplněnou poptávkou, vybavení, mapa s okolními projekty, kalkulačka splátky, developer, podobné projekty, mobilní lišta |
| `lokality/` | rozcestník: země (Česko, Španělsko), mapa obcí, žebříček, hlavní lokality, řaditelná datová tabulka |
| `lokalita/<obec>/` | nová stránka (29×): KPI, části obce, projekty + mapa, cena za m² po projektech, typ bydlení, kdo tu staví, okolní lokality |
| `developeri/` | rozcestník: KPI, pás log, filtr podle typu, karty s čísly a fotkami |
| `developer/<slug>/` | profil (24×): KPI podle stavu, mapa realizací, portfolio s filtrem stavu, kontaktní formulář, další developeři |
| `magazin/`, `magazin/<slug>/` | hlavní článek, kategorie, nejhledanější kombinace, newsletter; článek s obsahem, ukazatelem čtení a projekty k tématu |
| `pro-developery/` | B2B landing: čísla, výhody, postup, ceník balíčků, topování, FAQ, registrace |
| `podminky/` | text podmínek ze živého webu |

Rešerše zahraničních portálů, ze které redesign vychází: [docs/benchmark.md](docs/benchmark.md).

## Jak se web staví

```
npm install                 # jen linkedom pro extract
node tools/crawl.mjs        # vykreslí stránky urbanmap.cz přes headless Chrome → _raw/dom/ (mimo git)
node tools/extract.mjs      # vytáhne data → data/site.json
node tools/build.mjs        # vygeneruje podstránky do public/, stáhne obrázky do public/assets/media/
node tools/dev.cjs          # náhled na http://localhost:5191
```

- `tools/build/*.mjs` — šablony stránek (`lib.mjs` = layout, hlavička a patička převzaté z HP, karty, ikony).
- `public/assets/css/site.css` a `public/assets/js/site.js` — styly a interakce podstránek (prefix `u-`), stojí na tokenech HP (`--k-*`).
- Build HP nepřegeneruje, jen v ní převede odkazy z živého webu na lokální stránky.
- Média se stahují přes optimalizaci urbanmap.cz a cachují; nepoužitá build smaže.

## Pravidla dat

- Nic se nevymýšlí: zobrazují se jen údaje, které má živý web. Chybí-li (dokončení, cena), sekce nebo údaj se neukáže.
- Web nemá tabulku jednotek, POI ani časovou osu výstavby, takže je kopie nemá. Místo tabulky jednotek je poptávka po dispozicích.
- Odvozená čísla (průměr Kč/m², volné jednotky za lokalitu, vzdálenosti projektů) se počítají z dat katalogu.
- JSON-LD živého webu uvádí u Altey (Španělsko) zemi CZ; kopie zemi určuje podle souřadnic.

## Co v kopii nefunguje

Kopie nemá backend. Formuláře (poptávka, hlídací pes, registrace) jen ukážou potvrzení, nic neodesílají.
Filtry, řazení a porovnání na podstránkách fungují v prohlížeči nad daty stránky. Na HP jsou filtry jen vizuální.

## Úpravy HP oproti originálu

- **Barva:** žlutá `#ffd400` nahrazena zelenou z loga v2 `#088e45` přímo v původních CSS (`assets/css/[0-9]*.css`), text na zelené je bílý. Text zeleně na tmavém podkladu používá světlejší `#3cc47a` kvůli kontrastu.
- **Logo:** logo v2 (`assets/img/logo/`) v hlavičce, ve velkém nápisu v patičce a jako favicon.
- **Písmo:** Urbanist z Google Fonts místo Geist / Instrument Sans (`assets/css/kopie.css`). Geist Mono zůstává.
- **Špendlíky:** symbol `assets/img/logo/map-pin.svg`, dopadající na mapu v sekci „Dostaňte projekt na mapu“ a jako samostatný projekt na mapách.

`tools/snapshot.mjs` (původní stažení HP) tyto úpravy přepíše — nespouštět bez důvodu.
