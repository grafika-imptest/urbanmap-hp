// Urbi reaguje na to, co uživatel dělá (princip z Copilot Mico / OpenAI dots: postavička ukazuje stav,
// ne dekoraci). Říká jen čísla z reálných dat. Bublina jde zavřít a zůstane zavřená (poučení z Clippyho).
(function () {
  'use strict';
  var urbi = document.querySelector('[data-urbi]');
  if (!urbi) return;
  var text = urbi.querySelector('[data-urbi-text]');
  var bublina = text.parentElement;
  var img = urbi.querySelector('[data-urbi-poza]');
  var vychozi = text.innerHTML;
  var zdroje = { ukazuje: img.getAttribute('src'), lupa: img.dataset.lupa };
  new Image().src = zdroje.lupa; // přednačíst, ať výměna pózy neblikne

  var KLIC = 'urbi-bublina-skryta';
  var skryta = false;
  try { skryta = localStorage.getItem(KLIC) === '1'; } catch (e) {}
  if (skryta) urbi.classList.add('je-ticho');

  var bez = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var projekty = JSON.parse(urbi.dataset.urbi).map(bez);
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tvar = function (n) { return n === 1 ? 'projekt' : n >= 2 && n <= 4 ? 'projekty' : 'projektů'; };

  function rekni(html, poza) {
    if (urbi.classList.contains('je-ticho')) return;
    if (text.innerHTML !== html) {
      bublina.classList.remove('je-nova'); void bublina.offsetWidth; bublina.classList.add('je-nova');
      text.innerHTML = html;
    }
    var src = zdroje[poza || 'ukazuje'];
    if (img.getAttribute('src') !== src) {
      img.classList.add('je-vymena');
      setTimeout(function () { img.setAttribute('src', src); img.classList.remove('je-vymena'); urbi.classList.toggle('je-lupa', poza === 'lupa'); }, 140);
    }
  }
  var zpet = function () { rekni(vychozi, 'ukazuje'); };

  // Živé hledání: Urbi vezme lupu a hlásí počet shod
  var pole = document.querySelector('.v3-hledani input');
  var casovac;
  if (pole) {
    pole.addEventListener('input', function () {
      clearTimeout(casovac);
      var q = bez(pole.value.trim());
      if (!q) return zpet();
      rekni('Hledám… <span class="v3-tecky"><i></i><i></i><i></i></span>', 'lupa');
      casovac = setTimeout(function () {
        var n = projekty.filter(function (p) { return p.indexOf(q) !== -1; }).length;
        rekni(n
          ? 'Mám to! Na „<b>' + esc(pole.value.trim()) + '</b>“ sedí <b>' + n + ' ' + tvar(n) + '</b>. Stiskněte Hledat.'
          : 'Na „<b>' + esc(pole.value.trim()) + '</b>“ zatím nic nemám. Zkuste město nebo developera, případně si zapněte hlídání.', 'lupa');
      }, 450);
    });
    pole.addEventListener('blur', function () { if (!pole.value.trim()) zpet(); });
  }

  // Rychlé volby: Urbi řekne počet ještě před kliknutím
  document.querySelectorAll('[data-urbi-rekne]').forEach(function (a) {
    var ukaz = function () { if (a.dataset.urbiRekne) rekni(esc(a.dataset.urbiRekne), 'ukazuje'); };
    a.addEventListener('mouseenter', ukaz);
    a.addEventListener('focus', ukaz);
    a.addEventListener('mouseleave', function () { if (!pole || !pole.value.trim()) zpet(); });
  });

  // --- Oči sledují kurzor + jemné natočení těla ---
  // Zornice se posouvají uvnitř bulvy (eliptická mez), tělo se natočí max. o pár stupňů.
  // Na dotykových zařízeních zůstává výchozí pohled doprava na mapu.
  var oci = [].slice.call(urbi.querySelectorAll('[data-oko]'));
  var svg = urbi.querySelector('.v3-oci');
  var natoceni = urbi.querySelector('[data-urbi-natoceni]');
  var klid = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cil = null, ramec = 0;
  function divej(dx, dy) { // dx, dy v rozsahu -1..1
    oci.forEach(function (o) {
      var z = o.querySelector('[data-zornice]');
      z.setAttribute('transform', 'translate(' + (dx * o.dataset.rx).toFixed(2) + ' ' + (dy * o.dataset.ry).toFixed(2) + ')');
    });
  }
  function prepocitej() {
    ramec = 0;
    if (!cil || !svg) return;
    var b = svg.getBoundingClientRect();
    var sx = b.width / 720, sy = b.height / 676;
    var ox = b.left + 346 * sx, oy = b.top + 249 * sy; // střed mezi očima
    var vx = cil.x - ox, vy = cil.y - oy;
    var d = Math.hypot(vx, vy) || 1;
    var sila = Math.min(1, d / 160); // blízko obličeje se oči hýbou méně
    divej(vx / d * sila, vy / d * sila);
    if (natoceni && !klid) {
      var ry = Math.max(-1, Math.min(1, vx / 700)) * 9, rx = Math.max(-1, Math.min(1, vy / 500)) * -6;
      natoceni.style.setProperty('--urbi-ry', ry.toFixed(2) + 'deg');
      natoceni.style.setProperty('--urbi-rx', rx.toFixed(2) + 'deg');
    }
  }
  divej(.75, -.05); // výchozí: kouká doprava na mapu
  if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) { cil = { x: e.clientX, y: e.clientY }; if (!ramec) ramec = requestAnimationFrame(prepocitej); }, { passive: true });
    window.addEventListener('scroll', function () { if (cil && !ramec) ramec = requestAnimationFrame(prepocitej); }, { passive: true });
    document.addEventListener('mouseleave', function () { cil = null; divej(.75, -.05); if (natoceni) { natoceni.style.setProperty('--urbi-ry', '0deg'); natoceni.style.setProperty('--urbi-rx', '0deg'); } });
  }

  // Zavřít bublinu — Urbi zůstane, jen ztichne; kliknutím na něj se zase ozve
  urbi.querySelector('[data-urbi-zavrit]').addEventListener('click', function () {
    urbi.classList.add('je-ticho');
    try { localStorage.setItem(KLIC, '1'); } catch (e) {}
  });
  img.style.pointerEvents = 'auto';
  img.style.cursor = 'pointer';
  img.title = 'Urbi';
  img.addEventListener('click', function () {
    urbi.classList.remove('je-ticho');
    try { localStorage.removeItem(KLIC); } catch (e) {}
    zpet();
    urbi.classList.remove('je-skok'); void urbi.offsetWidth; urbi.classList.add('je-skok');
  });
})();

// Čísla v úvodu se při zobrazení napočítají od nuly (jen hodnoty z dat, žádné „+“)
(function () {
  var cisla = document.querySelectorAll('[data-pocitej]');
  if (!cisla.length || !window.IntersectionObserver) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fmt = function (n) { return Math.round(n).toLocaleString('cs-CZ').replace(/\s/g, ' '); };
  var io = new IntersectionObserver(function (zaznamy) {
    zaznamy.forEach(function (z) {
      if (!z.isIntersecting) return;
      io.unobserve(z.target);
      var el = z.target, cil = Number(el.dataset.pocitej), start = performance.now(), delka = 1200;
      (function krok(t) {
        var p = Math.min(1, (t - start) / delka), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(cil * e);
        if (p < 1) requestAnimationFrame(krok);
      })(start);
    });
  }, { threshold: .6 });
  cisla.forEach(function (c) { io.observe(c); });
})();

// Hlavička je tmavá, dokud je pod ní tmavá horní část úvodu
(function () {
  var hlavicka = document.querySelector('.katalog-module__1b44Qq__hlavicka');
  var hero = document.querySelector('.v3-hero');
  if (!hlavicka || !hero) return;
  var cekam = 0;
  function prepni() {
    cekam = 0;
    // tmavá část úvodu končí zhruba v polovině sekce (pak přechází do světla)
    var tmavyKonec = hero.getBoundingClientRect().top + hero.offsetHeight * 0.5;
    hlavicka.classList.toggle('v3-tmava', tmavyKonec > hlavicka.offsetHeight);
    hlavicka.classList.toggle('v3-odrolovano', window.scrollY > 8);
  }
  prepni();
  window.addEventListener('scroll', function () { if (!cekam) cekam = requestAnimationFrame(prepni); }, { passive: true });
  window.addEventListener('resize', prepni);
})();

// Budovy kolem čísel nastoupí, když sekce přijde do záběru
(function () {
  var sc = document.querySelector('.v3-cisla-scena');
  if (!sc) return;
  if (!window.IntersectionObserver) { sc.classList.add('je-videt'); return; }
  var io = new IntersectionObserver(function (z) { if (z[0].isIntersecting) { sc.classList.add('je-videt'); io.disconnect(); } }, { threshold: .25 });
  io.observe(sc);
})();
