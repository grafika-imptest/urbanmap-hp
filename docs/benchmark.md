# Benchmark zahraničních portálů s developerskými projekty (11/2026)

Podklad pro redesign podstránek. [L] = ověřeno na živém webu (text a struktura přes fetch), [S] = sekundární zdroj.
Nedostupné při rešerši (403/404): Zillow, NewHomeSource, Domain, Homes.com, Idealista, DXBinteract, Properstar, Savills, Compass /new-development, Rightmove new homes, Knight Frank.

## Výpis projektů
- Filtry specifické pro novostavby: předání / dokončení, platební plán, stav (Bayut [L], Property Finder [L]); Save Search a hlídání (Bayut [L]); Compare (Property Finder [L]).
- Karta = projekt (ne jednotka): foto karusel, developer + logo, cena od, předání v kvartálech, CTA „Register Interest“ přímo na kartě (Bayut [L]).
- Lokalitní taby s počty, přepínač List/Map, SEO bloky pod výpisem (Bayut [L]).

## Detail projektu
- Pořadí (Property Finder [L]): drobečky → název + stav + předání → galerie + brožura → cena → developer → klíčové informace → platební plán → časová osa → popis, mapa → komunita → vybavení → tabulka jednotek s „Inquire“ u řádku → FAQ.
- Sticky lišta tabů s „Register Interest“, stažení brožury (Bayut [L]); hypoteční kalkulačka (Zoopla [L]); brožura výměnou za e-mail (NewHomeSource [S]); rezervace prohlídky (Zillow [S], Rightmove [S]).
- Konkurence má nekonzistentní data mezi sekcemi [L] — příležitost: jeden zdroj pravdy.

## Lokality
- Area guide: o lokalitě, projekty s předáním, doprava, školy, „Things to consider“, okolní oblasti, FAQ (Bayut [L]); hierarchie země → město (ImmoScout24 [L]); index čtvrtí podle oblastí (CityRealty [L]).

## Developeři
- Loga top developerů + A–Z seznam, pitch „List my developments“ (Zoopla [L]); profil s výpisem projektů a počty (Property Finder [L]); placený tier Premium Projects (Domain [S]).

## Magazín
- Kategorie, perex, datum, délka čtení, newsletter, CTA pro developery (Property Finder blog [L]); FAQ schema (Zoopla [L]); slabina konkurence: články neodkazují na konkrétní projekty.

## Internacionalizace
- Přepínač jazyka / měny / jednotky plochy v hlavičce (Bayut [L]); přepínač zemí (Property Finder [L]).

## Top 10 pro leady
1. Sticky lead box + mobilní spodní lišta na detailu
2. Poptávka konkrétní dispozice / jednotky (předvyplněná)
3. Ceník a brožura výměnou za e-mail
4. Rezervace prohlídky
5. Hlídací pes / uložené hledání (výpis, lokalita, magazín)
6. „Mám zájem“ přímo na kartě
7. Kalkulačka splátky
8. Porovnání projektů + „Poptat vybrané“
9. Trust vrstva: konzistentní data, datum aktualizace, časová osa výstavby
10. Landing „Pro developery“ s reálnými čísly a tiery

## Co z toho je v prototypu a co ne
Použito jen to, co jde postavit na reálných datech z urbanmap.cz. **Není** v něm tabulka jednotek (web ji nemá — místo toho poptávka po dispozicích),
POI v okolí, časová osa výstavby ani odznak „ověřený developer“ — to vyžaduje data, která zatím neexistují.
