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
      setTimeout(function () { img.setAttribute('src', src); img.classList.remove('je-vymena'); }, 140);
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
