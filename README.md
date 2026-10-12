# Urbanmap – kopie homepage

Statická kopie homepage https://urbanmap.cz/ (stav k 12. 10. 2026) jako základ pro další úpravy designu.

- `public/` – publikovaný web (GitHub Pages). Upravuje se tady.
  - `index.html` – vyrenderované HTML z původní Next.js aplikace, bez jejího JS runtime.
  - `assets/css/*.css` – původní CSS (názvy tříd `katalog-module__…`).
  - `assets/css/kopie.css` – **místo pro vlastní úpravy** nad původním CSS.
  - `assets/js/kopie.js` – náhrada klientského JS: mapa projektů (MapLibre + OpenFreeMap) a cookie lišta.
- `tools/snapshot.mjs` – skript, kterým kopie vznikla (`node tools/snapshot.mjs`, potřebuje `_raw/index.html` stažený z urbanmap.cz). Znovu spuštění přepíše `public/index.html` i ruční úpravy v něm.
- `tools/dev.js` – lokální náhled na http://localhost:5191.

## Co v kopii nefunguje

Kopie nemá backend. Filtry, vyhledávání, řazení a přepínače jsou jen vizuální; odkazy (projekty, lokality, filtry) vedou na živý urbanmap.cz.
