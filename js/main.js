(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ---- Видео: играет только когда видно ---- */
  var video = document.getElementById('heroVideo');
  function play() {
    if (!video || reduceMotion) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (video && !reduceMotion) {
    play();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) video.pause(); else play();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !document.hidden) play(); else video.pause();
        });
      }, { threshold: 0.1 }).observe(video);
    }
  }

  /* ---- Мобильное меню ---- */
  var burger = document.getElementById('burgerBtn');
  var closeBtn = document.getElementById('closeMenuBtn');
  var menu = document.getElementById('menu');
  var lastFocus = null;

  function focusables() {
    return Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])'));
  }
  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key !== 'Tab') return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    document.documentElement.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }
  function closeMenu() {
    menu.hidden = true;
    document.documentElement.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus) lastFocus.focus();
  }
  if (burger && menu && closeBtn) {
    burger.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    // При переходе на десктопную раскладку меню закрывается само
    window.matchMedia('(min-width: 901px) and (min-aspect-ratio: 23/20)').addEventListener('change', function (e) {
      if (e.matches && !menu.hidden) closeMenu();
    });
  }

  /* ---- Этапы 01–04 меняют кадр ---- */
  var hero = document.getElementById('hero');
  var stageBtns = Array.prototype.slice.call(document.querySelectorAll('[data-stage]'));
  var stageCap = document.getElementById('stageCap');
  var wire = document.getElementById('wire');
  var stageList = document.querySelector('.stages');
  var pinned = 0;   // этап, закреплённый кликом/тапом
  var current = 0;

  // Этап 02: пунктирные блоки вокруг реальных элементов экрана
  var WIRE_PARTS = [
    ['.eyebrow, .title__a', 'Заголовок'],
    ['.title__b', 'Оффер'],
    ['.cta', 'Аргумент и действие'],
    ['.case', 'Кейс'],
    ['.tags', 'Направления']
  ];
  function addBox(l, t, r, b, label, base) {
    var box = document.createElement('div');
    box.className = 'wire__box';
    box.style.left = (l - base.left) + 'px';
    box.style.top = (t - base.top) + 'px';
    box.style.width = (r - l) + 'px';
    box.style.height = (b - t) + 'px';
    var tag = document.createElement('span');
    tag.textContent = label;
    box.appendChild(tag);
    wire.appendChild(box);
  }
  function buildWire() {
    if (!wire || !hero) return;
    wire.textContent = '';
    var base = hero.getBoundingClientRect();
    var pad = 9;
    var topLine = null;   // верх рамки «Заголовок» — по нему выравнивается «Визуал»
    WIRE_PARTS.forEach(function (part) {
      var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      Array.prototype.forEach.call(hero.querySelectorAll(part[0]), function (el) {
        var rc = el.getBoundingClientRect();
        if (!rc.width) return;
        l = Math.min(l, rc.left); t = Math.min(t, rc.top); r = Math.max(r, rc.right); b = Math.max(b, rc.bottom);
      });
      if (l === Infinity) return;
      if (topLine === null) topLine = t - pad;
      addBox(Math.max(l - pad, base.left + 4), t - pad, Math.min(r + pad, base.right - 4), b + pad, part[1], base);
    });
    // Блок «Визуал» — вокруг головы в кадре (видео: cover, прижато к верху)
    if (video) {
      var v = video.getBoundingClientRect();
      var s = Math.max(v.width / 1920, v.height / 1072);
      var dw = 1920 * s, dh = 1072 * s, ox = v.left + (v.width - dw) / 2;
      var desktop = getComputedStyle(hero).display === 'grid';
      addBox(ox + 0.38 * dw, desktop && topLine !== null ? topLine : v.top + 0.135 * dh, ox + 0.63 * dw, v.top + 0.665 * dh, 'Визуал', base);
    }
  }

  // Плашки слоёв стоят в координатах видео и попадают на дробные пиксели — от этого текст мылится.
  // Доводим каждую до целого физического пикселя.
  function snapPanels() {
    var dpr = window.devicePixelRatio || 1;
    Array.prototype.forEach.call(document.querySelectorAll('.specimen, .swatches, .parts, .launch'), function (el) {
      el.style.translate = '';
      var r = el.getBoundingClientRect();
      if (!r.width) return;
      var dx = Math.round(r.left * dpr) / dpr - r.left;
      var dy = Math.round(r.top * dpr) / dpr - r.top;
      el.style.translate = dx + 'px ' + dy + 'px';
    });
  }

  function applyStage(n) {
    if (!hero) return;
    current = n;
    if (n) hero.setAttribute('data-stage', n); else hero.removeAttribute('data-stage');
    stageBtns.forEach(function (btn) {
      var on = Number(btn.getAttribute('data-stage')) === n;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on && stageCap) stageCap.textContent = btn.getAttribute('data-cap');
    });
    if (n === 2) buildWire();
    if (n === 3 || n === 4) snapPanels();
  }

  stageBtns.forEach(function (btn) {
    var n = Number(btn.getAttribute('data-stage'));
    btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') applyStage(n); });
    btn.addEventListener('focus', function () { applyStage(n); });
    btn.addEventListener('blur', function () { applyStage(pinned); });
    btn.addEventListener('click', function () {
      pinned = pinned === n ? 0 : n;
      applyStage(pinned);
    });
  });
  if (stageList) {
    stageList.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') applyStage(pinned); });
  }
  window.addEventListener('resize', function () {
    if (current === 2) buildWire();
    if (current === 3 || current === 4) snapPanels();
  });

  /* ---- Блок «Что входит в работу»: появление при прокрутке ---- */
  var work = document.getElementById('work');
  if (work) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var workObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { work.classList.add('in'); workObserver.disconnect(); }
      }, { threshold: 0.18 });
      workObserver.observe(work);
    } else {
      work.classList.add('in');
    }
  }

  /* ---- Плавный переход к следующему блоку ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-scroll]'), function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    });
  });
})();
