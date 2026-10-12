// Statická kopie homepage urbanmap.cz — náhrada za klientský JS původní Next.js aplikace.
// Obsahuje jen to, co je potřeba, aby stránka žila bez backendu: mapu projektů a cookie lištu.
(function () {
  'use strict';

  // --- Mapa projektů -------------------------------------------------------
  // Body bereme z karet ve výpisu (data-lat / data-lon / data-projekt), stejně jako originál.
  function initMapa() {
    var el = document.querySelector('[class*="__mapaObal"] [class*="__mapa"]');
    if (!el || !window.maplibregl) return;

    var radky = document.querySelectorAll('a[data-lat][data-lon]');
    var features = [];
    radky.forEach(function (a) {
      var lat = parseFloat(a.dataset.lat), lon = parseFloat(a.dataset.lon);
      if (isNaN(lat) || isNaN(lon)) return;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { id: a.dataset.projekt, href: a.getAttribute('href') }
      });
    });

    var nacitani = el.querySelector('[class*="__mapaNacitani"]');
    var shlukTrida = (document.querySelector('[class*="__mapaObal"]').className.match(/(katalog-module__\w+__)/) || [])[1] + 'shluk';

    var map = new maplibregl.Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [15.4, 49.8],
      zoom: 6.2,
      attributionControl: false,
      cooperativeGestures: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    if (window.ResizeObserver) new ResizeObserver(function () { map.resize(); }).observe(el);

    map.on('load', function () {
      if (nacitani) nacitani.remove();
      map.addSource('projekty', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: features },
        cluster: true,
        clusterRadius: 60,
        clusterMaxZoom: 14
      });
      // Neviditelná vrstva — slouží jen k dotazování na shluky, vizuál dělají HTML markery.
      map.addLayer({ id: 'projekty-body', type: 'circle', source: 'projekty', paint: { 'circle-radius': 0, 'circle-opacity': 0 } });

      // Výchozí záběr = Česko (pár projektů je v zahraničí, např. Altea, a roztáhlo by mapu na Evropu).
      map.resize();
      map.fitBounds([[12.09, 48.55], [18.86, 51.06]], { padding: 30, duration: 0 });

      var markery = {};
      function obnov() {
        var nove = {};
        map.querySourceFeatures('projekty').forEach(function (f) {
          var p = f.properties;
          var key = p.cluster ? 'c' + p.cluster_id : 'p' + p.id;
          if (nove[key]) return;
          var m = markery[key];
          if (!m) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = shlukTrida;
            if (p.cluster) {
              btn.textContent = p.point_count_abbreviated;
              btn.setAttribute('aria-label', p.point_count + ' projektů');
              btn.addEventListener('click', function () {
                map.getSource('projekty').getClusterExpansionZoom(p.cluster_id).then(function (z) {
                  map.easeTo({ center: f.geometry.coordinates, zoom: z });
                });
              });
            } else {
              btn.className = 'kopie-mapa-pin';
              btn.setAttribute('aria-label', 'Detail projektu');
              btn.addEventListener('click', function () { window.location.href = p.href; });
            }
            // Špendlík má bod polohy v 69 % výšky (pod ním je stín), proto střed posunutý o 0,19 × 48 px.
            m = markery[key] = p.cluster
              ? new maplibregl.Marker({ element: btn, anchor: 'bottom' })
              : new maplibregl.Marker({ element: btn, anchor: 'center', offset: [0, -9] });
            m.setLngLat(f.geometry.coordinates);
          }
          nove[key] = m;
          m.addTo(map);
        });
        Object.keys(markery).forEach(function (k) { if (!nove[k]) { markery[k].remove(); delete markery[k]; } });
      }
      map.on('moveend', obnov);
      map.on('sourcedata', function (e) { if (e.sourceId === 'projekty' && e.isSourceLoaded) obnov(); });
    });
  }

  // --- Cookie lišta (kopie nic neměří, lišta jen zmizí) --------------------
  function initCookies() {
    var lista = document.querySelector('[class*="__cookieLista"]');
    if (!lista) return;
    try { if (localStorage.getItem('kopie-cookies')) { lista.remove(); return; } } catch (e) {}
    lista.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        try { localStorage.setItem('kopie-cookies', '1'); } catch (e) {}
        lista.remove();
      });
    });
  }

  // --- Špendlíky dopadající na mapu v sekci „Dostaňte projekt na mapu“ ---
  // Přehrají se pokaždé, když sekce přijde do záběru (jako v prototypu). Při odchodu
  // se vrátí do výchozího stavu bez přechodu, jinak by viditelně odlétaly nahoru.
  function initPiny() {
    var vrstva = document.querySelector('.kopie-piny');
    if (!vrstva || !window.IntersectionObserver) return;
    var piny = vrstva.querySelectorAll('.kopie-pin');
    var KROK = 130;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        piny.forEach(function (pin, i) {
          var ikona = pin.firstElementChild;
          if (e.isIntersecting) {
            ikona.style.setProperty('--zpozdeni', (i * KROK) + 'ms');
            pin.classList.add('is-in');
          } else {
            ikona.style.transition = 'none';
            pin.classList.remove('is-in');
            void ikona.offsetWidth; // vynutit přepočet, než se přechod vrátí
            ikona.style.transition = '';
          }
        });
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.2 }).observe(vrstva);
  }

  initMapa();
  initCookies();
  initPiny();
})();
