// Podstránky kopie urbanmap.cz — interakce UI. Nic se neodesílá ani neukládá na server:
// formuláře jen ukážou potvrzení, uložené a porovnávané projekty drží localStorage prohlížeče.
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var plural = function (n, a, b, c) { return n === 1 ? a : n >= 2 && n <= 4 ? b : c; };
  var cz = function (n) { return Math.round(n).toLocaleString('cs-CZ'); };

  // --- Dialogy: poptávka a hlídací pes --------------------------------------------------
  function otevri(id, data) {
    var d = document.getElementById(id);
    if (!d) return;
    var f = $('form', d);
    f.classList.remove('je-odeslano');
    f.reset();
    if (data) Object.keys(data).forEach(function (k) {
      var el = $('[data-pole="' + k + '"]', d);
      if (!el || data[k] == null) return;
      if ('value' in el && el.tagName !== 'SPAN' && el.tagName !== 'H2' && el.tagName !== 'P') el.value = data[k]; else el.textContent = data[k];
    });
    d.showModal();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-poptavka]');
    if (b) {
      e.preventDefault();
      otevri('u-poptavka', { nadpis: b.dataset.poptavka, kontext: b.dataset.kontext || 'Poptávka', zprava: b.dataset.zprava || '' });
      return;
    }
    var h = e.target.closest('[data-hlidani]');
    if (h) {
      var k = h.dataset.hlidani;
      var popis = k === 'aktualni' ? 'Pošleme vám nové projekty, které odpovídají aktuálním filtrům: ' + (popisFiltru() || 'všechny projekty') + '.'
        : k === 'magazin' ? 'Jakmile se objeví nový projekt, dáme vědět e-mailem.'
        : 'Pošleme vám každý nový projekt v lokalitě ' + k + '.';
      otevri('u-hlidani', { nadpis: k === 'aktualni' || k === 'magazin' ? 'Hlídat nové projekty' : 'Hlídat ' + k, popis: popis });
      return;
    }
    if (e.target.closest('[data-zavrit]')) { e.target.closest('dialog').close(); return; }
    if (e.target.tagName === 'DIALOG') e.target.close(); // klik na pozadí
  });
  // Odeslání formulářů = jen potvrzení v UI
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches('[data-hledani], [data-kalkulacka]')) return;
    var sub = e.submitter;
    if (sub && sub.value === 'zavrit') return;
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    f.classList.add('je-odeslano');
  });

  // --- Karusel fotek na kartě -----------------------------------------------------------
  $$('.u-pcard__karusel').forEach(function (k) {
    var tecky = $$('i', k.parentNode.querySelector('.u-pcard__tecky') || document.createElement('div'));
    if (!tecky.length) return;
    k.addEventListener('scroll', function () {
      var i = Math.round(k.scrollLeft / k.clientWidth);
      tecky.forEach(function (t, j) { t.classList.toggle('on', i === j); });
    }, { passive: true });
  });

  // --- Uložit / porovnat --------------------------------------------------------------------
  function prepni(attr, klic, max) {
    var vybrane = store.get(klic);
    $$('[' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', vybrane.indexOf(b.getAttribute(attr)) > -1 ? 'true' : 'false'); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[' + attr + ']');
      if (!b) return;
      var id = b.getAttribute(attr), v = store.get(klic), i = v.indexOf(id);
      if (i > -1) v.splice(i, 1); else { if (max && v.length >= max) v.shift(); v.push(id); }
      store.set(klic, v);
      $$('[' + attr + ']').forEach(function (x) { x.setAttribute('aria-pressed', v.indexOf(x.getAttribute(attr)) > -1 ? 'true' : 'false'); });
      if (attr === 'data-porovnat') vykresliPorovnani();
    });
  }
  prepni('data-ulozit', 'um-ulozene');
  prepni('data-porovnat', 'um-porovnani', 3);

  function kartaDle(id) { return $('.u-pcard[data-id="' + id + '"]'); }
  function vykresliPorovnani() {
    var tray = $('[data-porovnani]');
    if (!tray) return;
    var ids = store.get('um-porovnani').filter(kartaDle);
    tray.hidden = !ids.length;
    $('[data-porovnani-pocet]').textContent = ids.length;
    $('[data-porovnani-nahledy]').innerHTML = ids.map(function (id) { var img = $('img', kartaDle(id)); return img ? '<img src="' + img.getAttribute('src') + '" alt="">' : ''; }).join('');
  }
  vykresliPorovnani();
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-porovnani-zrusit]')) { store.set('um-porovnani', []); $$('[data-porovnat]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); vykresliPorovnani(); }
    if (e.target.closest('[data-poptat-vybrane]')) {
      var nazvy = store.get('um-porovnani').map(kartaDle).filter(Boolean).map(function (c) { return c.dataset.nazev; });
      otevri('u-poptavka', { nadpis: nazvy.length + ' ' + plural(nazvy.length, 'projekt', 'projekty', 'projektů'), kontext: 'Jedna poptávka, víc projektů', zprava: 'Dobrý den, mám zájem o ceník a dostupnost těchto projektů: ' + nazvy.join(', ') + '.' });
    }
    if (e.target.closest('[data-porovnani-otevrit]')) {
      var karty = store.get('um-porovnani').map(kartaDle).filter(Boolean);
      var radky = [
        ['', function (c) { var img = $('img', c); return (img ? '<img src="' + img.getAttribute('src') + '" alt="">' : '') + '<a href="' + $('.u-pcard__telo', c).getAttribute('href') + '"><b>' + c.dataset.nazev + '</b></a>'; }],
        ['Lokalita', function (c) { return c.dataset.obec; }],
        ['Cena od', function (c) { return c.dataset.cena ? cz(c.dataset.cena) + ' Kč' : 'Na vyžádání'; }],
        ['Cena za m²', function (c) { return c.dataset.m2 ? cz(c.dataset.m2) + ' Kč' : '–'; }],
        ['Dispozice', function (c) { return c.dataset.disp || '–'; }],
        ['Volné jednotky', function (c) { return c.dataset.volne || '–'; }],
        ['Stav', function (c) { var s = $('[data-stav]', c); return s ? s.textContent : '–'; }],
        ['', function (c) { return '<button type="button" class="u-btn u-btn--primarni u-btn--s" data-poptavka="' + c.dataset.nazev.replace(/"/g, '&quot;') + '" data-kontext="Z porovnání">Mám zájem</button>'; }]
      ];
      $('[data-porovnani-tabulka]').innerHTML = '<table class="u-tabulka u-tabulka--porovnani"><tbody>' + radky.map(function (r) {
        return '<tr><th scope="row">' + r[0] + '</th>' + karty.map(function (c) { return '<td>' + r[1](c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
      document.getElementById('u-porovnani-dialog').showModal();
    }
  });

  // --- Mapy ---------------------------------------------------------------------------------
  var mapy = [];
  function initMapy() {
    if (!window.maplibregl) return;
    $$('[data-mapa]').forEach(function (el) {
      var body = JSON.parse(el.dataset.mapa);
      var map = new maplibregl.Map({ container: el, style: 'https://tiles.openfreemap.org/styles/positron', center: [15.4, 49.8], zoom: 6.2, attributionControl: false, cooperativeGestures: true });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'OpenFreeMap · OpenStreetMap' }));
      el._map = map; el._body = body; el._markery = {};
      mapy.push(el);
      var popup = new maplibregl.Popup({ closeButton: false, offset: 24, className: 'u-mpopup', maxWidth: '320px' });
      el._popup = popup;
      var ukazPopup = function (b) {
        popup.setLngLat([b.lon, b.lat]).setHTML('<a href="' + b.h + '">' + (b.i ? '<img src="' + b.i + '" alt="">' : '<span></span>') + '<span><b>' + b.n + '</b><span>' + b.c + '</span></span></a>').addTo(map);
      };
      var obce = body.length && body[0].pocet != null;
      var shlukovat = !obce && body.length > 14;

      map.on('load', function () {
        var nac = $('.u-map__nacitani', el); if (nac) nac.remove();
        map.resize();
        if (el.dataset.zaber === 'cz') map.fitBounds([[12.09, 48.55], [18.86, 51.06]], { padding: 30, duration: 0 });
        else if (body.length) {
          var bb = new maplibregl.LngLatBounds();
          body.forEach(function (b) { bb.extend([b.lon, b.lat]); });
          map.fitBounds(bb, { padding: 70, maxZoom: body.length === 1 ? 14 : 13, duration: 0 });
        }
        if (!shlukovat) {
          body.forEach(function (b) {
            var m = document.createElement('button');
            m.type = 'button';
            if (obce) {
              var s = 30 + Math.min(b.pocet, 15) * 3;
              m.className = 'u-mobec'; m.style.width = m.style.height = s + 'px'; m.textContent = b.pocet;
              m.setAttribute('aria-label', b.n + ', ' + b.c);
            } else {
              m.className = 'u-mpin' + (b.hlavni ? ' u-mpin--hlavni' : '');
              m.setAttribute('aria-label', b.n);
            }
            m.addEventListener('mouseenter', function () { ukazPopup(b); });
            m.addEventListener('click', function () { window.location.href = b.h; });
            el._markery[b.id] = new maplibregl.Marker({ element: m, anchor: 'center', offset: obce ? [0, 0] : [0, b.hlavni ? -12 : -8] }).setLngLat([b.lon, b.lat]).addTo(map);
          });
          return;
        }
        // Shluky pro výpis — stejný princip jako mapa na HP
        map.addSource('body', { type: 'geojson', data: geo(body), cluster: true, clusterRadius: 56, clusterMaxZoom: 13 });
        map.addLayer({ id: 'body', type: 'circle', source: 'body', paint: { 'circle-radius': 0, 'circle-opacity': 0 } });
        var obnov = function () {
          var nove = {};
          map.querySourceFeatures('body').forEach(function (f) {
            var p = f.properties, key = p.cluster ? 'c' + p.cluster_id : p.id;
            if (nove[key]) return;
            var m = el._markery[key];
            if (!m) {
              var btn = document.createElement('button');
              btn.type = 'button';
              if (p.cluster) {
                btn.className = 'u-mshluk'; btn.textContent = p.point_count_abbreviated;
                btn.addEventListener('click', function () { map.getSource('body').getClusterExpansionZoom(p.cluster_id).then(function (z) { map.easeTo({ center: f.geometry.coordinates, zoom: z }); }); });
              } else {
                var b = body.filter(function (x) { return x.id === p.id; })[0];
                btn.className = 'u-mpin'; btn.setAttribute('aria-label', b.n);
                btn.addEventListener('mouseenter', function () { ukazPopup(b); zvyrazniKartu(b.id, true); });
                btn.addEventListener('mouseleave', function () { zvyrazniKartu(b.id, false); });
                btn.addEventListener('click', function () { window.location.href = b.h; });
              }
              m = el._markery[key] = new maplibregl.Marker({ element: btn, anchor: 'center', offset: p.cluster ? [0, 0] : [0, -8] }).setLngLat(f.geometry.coordinates);
            }
            nove[key] = m; m.addTo(map);
          });
          Object.keys(el._markery).forEach(function (k) { if (!nove[k]) { el._markery[k].remove(); delete el._markery[k]; } });
        };
        map.on('moveend', obnov);
        map.on('sourcedata', function (e) { if (e.sourceId === 'body' && e.isSourceLoaded) obnov(); });
        map.on('dragend', function () { var b = $('[data-hledat-v-oblasti]'); if (b) b.hidden = false; });
        map.on('zoomend', function (e) { if (e.originalEvent) { var b = $('[data-hledat-v-oblasti]'); if (b) b.hidden = false; } });
      });
      if (window.ResizeObserver) new ResizeObserver(function () { map.resize(); }).observe(el);
    });
  }
  function geo(body) {
    return { type: 'FeatureCollection', features: body.map(function (b) { return { type: 'Feature', geometry: { type: 'Point', coordinates: [b.lon, b.lat] }, properties: { id: b.id } }; }) };
  }
  function zvyrazniKartu(id, on) { var c = kartaDle(id); if (c) c.classList.toggle('je-zvyraznena', on); }
  // Najetí na kartu ukáže projekt na mapě
  document.addEventListener('mouseover', function (e) {
    var c = e.target.closest('.u-pcard');
    if (!c || c._hover) return;
    c._hover = true;
    mapy.forEach(function (el) {
      var m = el._markery[c.dataset.id];
      if (m) { m.getElement().classList.add('je-zvyraznena'); }
      var b = el._body.filter(function (x) { return x.id === c.dataset.id; })[0];
      if (b && el._popup) el._popup.setLngLat([b.lon, b.lat]).setHTML('<a href="' + b.h + '">' + (b.i ? '<img src="' + b.i + '" alt="">' : '') + '<span><b>' + b.n + '</b><span>' + b.c + '</span></span></a>').addTo(el._map);
    });
  });
  document.addEventListener('mouseout', function (e) {
    var c = e.target.closest('.u-pcard');
    if (!c || c.contains(e.relatedTarget)) return;
    c._hover = false;
    mapy.forEach(function (el) { var m = el._markery[c.dataset.id]; if (m) m.getElement().classList.remove('je-zvyraznena'); });
  });
  initMapy();

  // --- Výpis projektů: filtry, řazení, pohled ------------------------------------------------
  // Jeden stav pro dropdowny i konfigurátor: tlačítka se stejným data-filtr/data-hodnota
  // a posuvníky se stejným data-rozsah se po každé změně srovnají podle stavu (synchronizuj()).
  var vypis = $('[data-vysledky]');
  var POLE = ['zeme', 'kraj', 'obec', 'disp', 'stav', 'tagy', 'invest'];
  function novyStav() { return { kat: '', zeme: [], kraj: [], obec: [], disp: [], stav: [], tagy: [], invest: [], volne: false, q: '', oblast: null, cena: null, m2: null }; }
  var stav = novyStav();
  var hlavickaQ = $('.katalog-module__1b44Qq__hlavickaHledani input[name="q"]');
  var milKc = function (n) { return n >= 1e6 ? (n / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' mil.' : Math.round(n / 1000) + ' tis.'; };
  function popisRozsahu(k) {
    var r = stav[k]; if (!r) return '';
    var j = k === 'm2' ? ' Kč/m²' : ' Kč';
    return (r[0] ? 'od ' + milKc(r[0]) : '') + (r[0] && r[1] ? ' ' : '') + (r[1] ? 'do ' + milKc(r[1]) : '') + j;
  }
  function aktivniPolozky() {
    // [popisek, zrušení] pro každý aktivní filtr — pro chipy pod filtry i pro popis hlídání
    var out = [];
    POLE.forEach(function (k) {
      stav[k].forEach(function (v) {
        var b = $('[data-filtr="' + k + '"][data-hodnota="' + CSS.escape(v) + '"]');
        var t = b ? (b.getAttribute('aria-label') || (b.querySelector('b') || b.childNodes[0] || b).textContent).split(' · ')[0].trim() : v;
        out.push([t, function () { stav[k].splice(stav[k].indexOf(v), 1); }]);
      });
    });
    if (stav.kat) { var kb = $('.u-kattile[data-hodnota="' + stav.kat + '"] b'); out.unshift([kb ? kb.textContent : stav.kat, function () { stav.kat = ''; }]); }
    ['cena', 'm2'].forEach(function (k) { if (stav[k]) out.push([(k === 'm2' ? 'Za m² ' : 'Cena ') + popisRozsahu(k), function () { stav[k] = null; }]); });
    if (stav.volne) out.push(['S volnými jednotkami', function () { stav.volne = false; }]);
    if (stav.oblast) out.push(['Výřez mapy', function () { stav.oblast = null; }]);
    return out;
  }
  function popisFiltru() {
    var casti = aktivniPolozky().map(function (x) { return x[0]; });
    if (stav.q) casti.push('„' + stav.q + '“');
    return casti.join(', ');
  }
  function obsahuje(seznam, v) { return (' ' + seznam + ' ').indexOf(' ' + v + ' ') > -1; }
  function vRozsahu(v, r) { if (!r) return true; if (!v) return false; return v >= (r[0] || 0) && (!r[1] || v <= r[1]); }
  function odpovida(c, bez) {
    var d = c.dataset;
    if (bez !== 'kat' && stav.kat && !obsahuje(d.kat, stav.kat)) return false;
    if (stav.zeme.length && stav.zeme.indexOf(d.zeme) < 0) return false;
    if (stav.kraj.length && stav.kraj.indexOf(d.kraj) < 0) return false;
    if (stav.obec.length && stav.obec.indexOf(d.obec) < 0) return false;
    if (stav.stav.length && stav.stav.indexOf(d.stav) < 0) return false;
    if (stav.disp.length && !stav.disp.some(function (x) { return obsahuje(d.disp, x); })) return false;
    if (stav.tagy.length && !stav.tagy.every(function (x) { return obsahuje(d.tagy, x); })) return false;
    if (stav.invest.length && !stav.invest.every(function (x) { return obsahuje(d.invest, x); })) return false;
    if (stav.volne && !(+d.volne > 0)) return false;
    if (!vRozsahu(+d.cena, stav.cena) || !vRozsahu(+d.m2, stav.m2)) return false;
    if (stav.q) { var t = (d.nazev + ' ' + d.obec + ' ' + c.textContent).toLowerCase(); if (t.indexOf(stav.q.toLowerCase()) < 0) return false; }
    if (stav.oblast && !stav.oblast.contains([+d.lon, +d.lat])) return false;
    return true;
  }
  function synchronizuj() {
    $$('[data-filtr]').forEach(function (b) {
      var k = b.dataset.filtr, v = b.dataset.hodnota;
      var on = k === 'kat' ? stav.kat === v : k === 'volne' ? stav.volne : (stav[k] || []).indexOf(v) > -1;
      b.setAttribute('aria-pressed', String(on));
    });
    $$('[data-rozsah]').forEach(function (r) {
      var k = r.dataset.rozsah, max = +r.dataset.max, h = stav[k] || [0, 0];
      var od = h[0] || 0, doo = h[1] || max;
      var a = $('[data-konec="od"]', r), b = $('[data-konec="do"]', r);
      if (document.activeElement !== a) a.value = od;
      if (document.activeElement !== b) b.value = doo;
      r.querySelector('.u-rozsah__draha').style.setProperty('--a', (od / max * 100) + '%');
      r.querySelector('.u-rozsah__draha').style.setProperty('--b', (doo / max * 100) + '%');
      var po = $('[data-pole="od"]', r), pd = $('[data-pole="do"]', r);
      if (document.activeElement !== po) po.value = h[0] ? cz(h[0]) : '';
      if (document.activeElement !== pd) pd.value = h[1] ? cz(h[1]) : '';
      $$('.u-histogram i', r).forEach(function (i) { i.classList.toggle('je-v-rozsahu', +i.dataset.do > od && +i.dataset.od < doo); });
    });
    $$('[data-rychla]').forEach(function (b) {
      var r = stav[b.dataset.rychla];
      b.setAttribute('aria-pressed', String(!!r && (r[0] || 0) === +b.dataset.od && (r[1] || 0) === +b.dataset.do));
    });
    // počet aktivních voleb u každého dropdownu
    $$('.u-fdrop[data-skupina]').forEach(function (d) {
      var s = d.dataset.skupina, n = s === 'lokalita' ? stav.zeme.length + stav.kraj.length + stav.obec.length : s === 'cena' ? (stav.cena ? 1 : 0) + (stav.m2 ? 1 : 0) : (stav[s] || []).length;
      var sum = $('summary', d);
      if (n) sum.setAttribute('data-n', n); else sum.removeAttribute('data-n');
      d.classList.toggle('je-aktivni', n > 0);
    });
  }
  function aplikuj() {
    if (!vypis) return;
    var karty = $$('.u-pcard', vypis), n = 0, vidi = [];
    karty.forEach(function (c) { var ok = odpovida(c); c.hidden = !ok; if (ok) { n++; vidi.push(c.dataset.id); } });
    var aktivni = aktivniPolozky();
    var filtruje = aktivni.length || stav.q;
    $$('.u-promo', vypis).forEach(function (p) { p.hidden = !!filtruje && n < 6; });
    $('[data-pocet]').textContent = n;
    $('[data-pocet-text]').textContent = plural(n, 'projekt', 'projekty', 'projektů');
    $$('[data-pocet-tl]').forEach(function (x) { x.textContent = n; });
    $('[data-prazdne]').hidden = n > 0;
    $$('[data-zrusit-filtry]').forEach(function (x) { if (x.classList.contains('u-zrusit')) x.hidden = !filtruje; });
    var dotaz = $('[data-dotaz]');
    dotaz.hidden = !stav.q;
    if (stav.q) dotaz.innerHTML = '„' + stav.q.replace(/</g, '&lt;') + '“<button type="button" aria-label="Zrušit hledání"><svg class="u-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    var box = $('[data-aktivni-filtry]');
    box.innerHTML = '';
    aktivni.forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'u-aktivni';
      b.innerHTML = x[0].replace(/</g, '&lt;') + ' <svg class="u-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      b.addEventListener('click', function () { x[1](); aplikuj(); });
      box.appendChild(b);
    });
    // počty u dlaždic kategorií podle ostatních filtrů
    $$('.u-kattile').forEach(function (t) {
      var v = t.dataset.hodnota, m = karty.filter(function (c) { return odpovida(c, 'kat') && (!v || obsahuje(c.dataset.kat, v)); }).length;
      $('.u-kattile__text span', t).textContent = m;
    });
    synchronizuj();
    var el = $('#u-mapa-vypis');
    if (el && el._map && el._map.getSource && el._map.getSource('body')) el._map.getSource('body').setData(geo(el._body.filter(function (b) { return vidi.indexOf(b.id) > -1; })));
    var url = new URL(location.href);
    ['kat', 'disp', 'obec', 'stav', 'kraj', 'invest', 'q', 'kategorie', 'dispozice'].forEach(function (k) { url.searchParams.delete(k); });
    if (stav.kat) url.searchParams.set('kat', stav.kat);
    ['disp', 'obec', 'stav', 'kraj', 'invest'].forEach(function (k) { if (stav[k].length) url.searchParams.set(k, stav[k].join(',')); });
    if (stav.q) url.searchParams.set('q', stav.q);
    history.replaceState(null, '', url);
  }
  if (vypis) {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filtr]');
      if (b && !b.disabled && !b.hasAttribute('data-prazdny')) {
        var k = b.dataset.filtr, v = b.dataset.hodnota;
        if (k === 'kat') stav.kat = stav.kat === v && b.classList.contains('u-fchip') ? '' : v;
        else if (k === 'volne') stav.volne = !stav.volne;
        else { var i = stav[k].indexOf(v); if (i > -1) stav[k].splice(i, 1); else stav[k].push(v); }
        aplikuj();
        return;
      }
      var r = e.target.closest('[data-rychla]');
      if (r) {
        var k2 = r.dataset.rychla, nove = [+r.dataset.od, +r.dataset.do];
        stav[k2] = stav[k2] && stav[k2][0] === nove[0] && stav[k2][1] === nove[1] ? null : nove;
        aplikuj();
        return;
      }
      if (e.target.closest('[data-zavrit-filtr]')) { var d = e.target.closest('details'); if (d) d.open = false; }
      if (e.target.closest('[data-dotaz] button')) { stav.q = ''; if (hlavickaQ) hlavickaQ.value = ''; aplikuj(); }
    });
    // Klávesnice pro kraje v SVG mapě
    document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('path[data-filtr]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    // Posuvníky a pole rozsahů
    $$('[data-rozsah]').forEach(function (r) {
      var k = r.dataset.rozsah, max = +r.dataset.max, a = $('[data-konec="od"]', r), b = $('[data-konec="do"]', r);
      var nastav = function (od, doo) { od = Math.max(0, od || 0); doo = doo && doo < max ? doo : 0; if (doo && od > doo) { var t = od; od = doo; doo = t; } stav[k] = od || doo ? [od, doo] : null; aplikuj(); };
      a.addEventListener('input', function () { if (+a.value > +b.value) a.value = b.value; nastav(+a.value, +b.value); });
      b.addEventListener('input', function () { if (+b.value < +a.value) b.value = a.value; nastav(+a.value, +b.value); });
      $$('[data-pole]', r).forEach(function (p) { p.addEventListener('change', function () {
        var c = function (s) { return +String(s).replace(/[^\d]/g, '') || 0; };
        nastav(c($('[data-pole="od"]', r).value), c($('[data-pole="do"]', r).value));
      }); });
    });
    // Hledání textem: jen pole v hlavičce webu, na této stránce filtruje živě
    if (hlavickaQ) {
      hlavickaQ.addEventListener('input', function () { stav.q = hlavickaQ.value.trim(); aplikuj(); });
      hlavickaQ.form.addEventListener('submit', function (e) { e.preventDefault(); stav.q = hlavickaQ.value.trim(); aplikuj(); vypis.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    }
    $$('[data-zrusit-filtry]').forEach(function (b) { b.addEventListener('click', function () {
      stav = novyStav(); if (hlavickaQ) hlavickaQ.value = ''; aplikuj();
    }); });
    var hvo = $('[data-hledat-v-oblasti]');
    if (hvo) hvo.addEventListener('click', function () { var el = $('#u-mapa-vypis'); stav.oblast = el._map.getBounds(); hvo.hidden = true; aplikuj(); });
    $('[data-razeni]').addEventListener('change', function (e) {
      var v = e.target.value, karty = $$('.u-pcard', vypis);
      var klic = { 'cena-asc': ['cena', 1], 'cena-desc': ['cena', -1], 'm2-asc': ['m2', 1], 'volne-desc': ['volne', -1] }[v];
      if (!karty[0]._poradi) karty.forEach(function (c, i) { c._poradi = i + 1; });
      karty.sort(function (a, b) {
        if (!klic) return a._poradi - b._poradi;
        var x = +a.dataset[klic[0]] || (klic[1] > 0 ? Infinity : -Infinity), y = +b.dataset[klic[0]] || (klic[1] > 0 ? Infinity : -Infinity);
        return (x - y) * klic[1] || a._poradi - b._poradi;
      }).forEach(function (c) { vypis.appendChild(c); });
      $$('.u-promo', vypis).forEach(function (p) { p.hidden = v !== 'doporucene'; });
    });
    $$('[data-pohled]').forEach(function (b) { b.addEventListener('click', function () {
      $$('[data-pohled]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var ex = $('.u-explorer');
      ex.dataset.pohledAktivni = b.dataset.pohled === 'split' && innerWidth <= 1024 ? 'mapa' : b.dataset.pohled;
      mapy.forEach(function (el) { setTimeout(function () { el._map.resize(); }, 50); });
    }); });
    // Konfigurátor: kroky
    var konf = document.getElementById('u-konf'), krok = 0;
    var ukazKrok = function (i) {
      krok = Math.max(0, Math.min(3, i));
      $$('[data-krok]', konf).forEach(function (t) { t.setAttribute('aria-selected', String(+t.dataset.krok === krok)); });
      $$('[data-krok-panel]', konf).forEach(function (p) { p.hidden = +p.dataset.krokPanel !== krok; });
      $('[data-krok-posun="-1"]', konf).hidden = krok === 0;
      $('[data-krok-posun="1"]', konf).hidden = krok === 3;
    };
    $$('[data-konfigurator]').forEach(function (b) { b.addEventListener('click', function () { $$('.u-fdrop[open]').forEach(function (d) { d.open = false; }); ukazKrok(0); synchronizuj(); konf.showModal(); }); });
    $$('[data-krok]', konf).forEach(function (t) { t.addEventListener('click', function () { ukazKrok(+t.dataset.krok); }); });
    $$('[data-krok-posun]', konf).forEach(function (t) { t.addEventListener('click', function () { ukazKrok(krok + +t.dataset.krokPosun); }); });
    // Filtry z URL (odkazy z HP, SEO bloků, magazínu a hledání v hlavičce na jiných stránkách)
    var q = new URLSearchParams(location.search);
    stav.kat = q.get('kat') || q.get('kategorie') || '';
    var zUrl = function (k, pole) { (q.get(k) || '').split(',').filter(Boolean).forEach(function (v) { if (stav[pole].indexOf(v) < 0) stav[pole].push(v); }); };
    zUrl('disp', 'disp'); zUrl('dispozice', 'disp'); zUrl('obec', 'obec'); zUrl('stav', 'stav'); zUrl('kraj', 'kraj'); zUrl('invest', 'invest');
    if (q.get('cenaOd') || q.get('cenaDo')) stav.cena = [+q.get('cenaOd') || 0, +q.get('cenaDo') || 0];
    if (q.get('q')) { stav.q = q.get('q'); if (hlavickaQ) hlavickaQ.value = stav.q; }
    // Na úzkém displeji je mapa vedle seznamu skrytá — výchozí pohled je proto mřížka
    if (q.get('pohled') === 'mrizka' || innerWidth <= 1024) { var pm = $('[data-pohled="mrizka"]'); if (pm) pm.click(); }
    aplikuj();
    // zavřít rozbalené filtry klikem mimo
    document.addEventListener('click', function (e) { $$('.u-fdrop[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; }); });
  }

  // --- Jednoduché filtry na dalších stránkách -------------------------------------------------
  function filtrSkupiny(tlacitka, attr, polozky, test) {
    $$(tlacitka).forEach(function (b) { b.addEventListener('click', function () {
      $$(tlacitka).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var v = b.getAttribute(attr);
      $$(polozky).forEach(function (p) { p.hidden = !!v && !test(p, v); });
    }); });
  }
  filtrSkupiny('[data-stavfiltr] [data-stav]', 'data-stav', '[data-stavvysledky] .u-pcard', function (p, v) { return p.dataset.stav === v; });
  filtrSkupiny('[data-magfiltr] [data-kategorie]', 'data-kategorie', '.u-maghlavni .u-magkarta', function (p, v) { return p.dataset.kategorie === v; });
  var devQ = '', devKat = '';
  function devFiltr() {
    var n = 0;
    $$('.u-devkarta').forEach(function (c) {
      var ok = (!devKat || (' ' + c.dataset.kat + ' ').indexOf(' ' + devKat + ' ') > -1) && (!devQ || (c.dataset.nazev + ' ' + c.dataset.obce).toLowerCase().indexOf(devQ) > -1);
      c.hidden = !ok; if (ok) n++;
    });
    var pr = $('[data-devprazdne]'); if (pr) pr.hidden = n > 0;
  }
  var dh = $('[data-devhledat]');
  if (dh) dh.addEventListener('input', function () { devQ = dh.value.trim().toLowerCase(); devFiltr(); });
  $$('[data-devkat]').forEach(function (b) { b.addEventListener('click', function () {
    $$('[data-devkat]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); devKat = b.dataset.devkat; devFiltr();
  }); });

  // Lokality: přepínač zemí filtruje tabulku a posune mapu
  $$('[data-zeme]').forEach(function (b) {
    if (b.tagName !== 'BUTTON') return;
    b.addEventListener('click', function () {
      $$('button[data-zeme]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      $$('.u-tabulka tbody tr[data-zeme]').forEach(function (r) { r.hidden = r.dataset.zeme !== b.dataset.zeme; });
      var el = $('#u-mapa-lokality');
      if (el && el._map) {
        var pts = el._body.filter(function (x) { return $('tr[data-zeme="' + b.dataset.zeme + '"] a[href*="/' + x.id + '/"]'); });
        if (b.dataset.zeme === 'CZ') el._map.fitBounds([[12.09, 48.55], [18.86, 51.06]], { padding: 30 });
        else if (pts.length) el._map.flyTo({ center: [pts[0].lon, pts[0].lat], zoom: 9 });
      }
    });
  });
  var prvniZeme = $('button[data-zeme][aria-selected="true"]');
  if (prvniZeme) $$('.u-tabulka tbody tr[data-zeme]').forEach(function (r) { r.hidden = r.dataset.zeme !== prvniZeme.dataset.zeme; });

  // Řazení tabulek
  $$('[data-razeni-tabulky]').forEach(function (t) {
    $$('thead th[data-typ]', t).forEach(function (th, ci) {
      th.addEventListener('click', function () {
        var asc = th.getAttribute('aria-sort') === 'descending';
        $$('thead th', t).forEach(function (x) { x.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
        var tb = $('tbody', t);
        $$('tr', tb).sort(function (a, b) {
          var x = a.children[ci], y = b.children[ci];
          var r = th.dataset.typ === 'cislo' ? (+x.dataset.hodnota) - (+y.dataset.hodnota) : x.textContent.localeCompare(y.textContent, 'cs');
          return asc ? r : -r;
        }).forEach(function (r) { tb.appendChild(r); });
      });
    });
  });

  // --- Detail: galerie, taby, telefon, kalkulačka, sdílení -------------------------------------
  var gal = $('[data-galerie]');
  if (gal) {
    var fotky = JSON.parse(gal.dataset.galerie), idx = 0, dlg = document.getElementById('u-galerie');
    var ukaz = function (i) { idx = (i + fotky.length) % fotky.length; $('img', dlg).src = fotky[idx]; $('.u-galerie-dialog__pocet', dlg).textContent = (idx + 1) + ' / ' + fotky.length; };
    $$('[data-index]', gal).forEach(function (b) { b.addEventListener('click', function () { ukaz(+b.dataset.index); dlg.showModal(); }); });
    $$('[data-smer]', dlg).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); ukaz(idx + +b.dataset.smer); }); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') ukaz(idx + 1); if (e.key === 'ArrowLeft') ukaz(idx - 1); });
  }
  function scrollspy(odkazy) {
    var cile = odkazy.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    if (!cile.length) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) odkazy.forEach(function (a) { a.classList.toggle('je-aktivni', a.getAttribute('href') === '#' + x.target.id); }); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    cile.forEach(function (c) { io.observe(c); });
  }
  var taby = $('[data-taby]');
  if (taby) {
    scrollspy($$('a', taby));
    var hlid = document.createElement('div'); taby.parentNode.insertBefore(hlid, taby);
    new IntersectionObserver(function (en) { taby.classList.toggle('je-prilepena', !en[0].isIntersecting); }, { rootMargin: '-70px 0px 0px 0px' }).observe(hlid);
  }
  scrollspy($$('.u-clanek__toc a'));
  var cteni = $('[data-cteni]');
  if (cteni) {
    var cl = $('.u-clanek__text');
    addEventListener('scroll', function () {
      var r = cl.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * .6)));
      cteni.style.width = (p * 100) + '%';
    }, { passive: true });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-odhalit-tel]');
    if (t && !t.classList.contains('je-odhaleno')) { e.preventDefault(); t.classList.add('je-odhaleno'); $('span', t).textContent = t.dataset.odhalitTel; }
    var s = e.target.closest('[data-sdilet]');
    if (s) {
      if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { s.lastChild.textContent = 'Odkaz zkopírován'; });
    }
    var bal = e.target.closest('[data-balicek]');
    if (bal) { var sel = $('[data-pole-balicek]'); if (sel) sel.value = bal.dataset.balicek; }
  });
  var kalk = $('[data-kalkulacka]');
  if (kalk) {
    var spocti = function () {
      var cena = +kalk.cena.value.replace(/[^\d]/g, ''), vl = +kalk.vlastni.value / 100, r = parseFloat(kalk.sazba.value.replace(',', '.')) / 100 / 12, n = +kalk.roky.value * 12;
      var uver = cena * (1 - vl);
      var spl = r > 0 ? uver * r / (1 - Math.pow(1 + r, -n)) : uver / n;
      $('[data-vystup="vlastni"]', kalk).textContent = kalk.vlastni.value + ' %';
      $('[data-vystup="splatka"]', kalk).textContent = isFinite(spl) && spl > 0 ? cz(spl) + ' Kč' : '–';
      $('[data-vystup="uver"]', kalk).textContent = isFinite(uver) && uver > 0 ? 'úvěr ' + cz(uver) + ' Kč, vlastní zdroje ' + cz(cena - uver) + ' Kč' : '';
    };
    kalk.addEventListener('input', spocti);
    kalk.addEventListener('submit', function (e) { e.preventDefault(); });
    spocti();
  }
})();
