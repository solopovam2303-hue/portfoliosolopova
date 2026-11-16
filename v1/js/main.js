(function () {
  'use strict';
  var video = document.getElementById('heroVideo');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tryPlay() {
    if (prefersReducedMotion) return;
    var playPromise = video.play();
    if (playPromise && playPromise.catch) { playPromise.catch(function () {}); }
  }
  if (video && !prefersReducedMotion) {
    tryPlay();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { video.pause(); } else { tryPlay(); }
    });
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { if (!document.hidden) tryPlay(); } else { video.pause(); }
        });
      }, { threshold: 0.1 });
      observer.observe(video);
    }
  }
  var burgerBtn = document.getElementById('burgerBtn');
  var closeMenuBtn = document.getElementById('closeMenuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  var lastFocusedElement = null;
  function getFocusableElements(container) {
    return Array.prototype.slice.call(container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  }
  function openMenu() {
    lastFocusedElement = document.activeElement;
    mobileMenu.hidden = false;
    document.documentElement.classList.add('menu-open');
    document.body.classList.add('menu-open');
    burgerBtn.setAttribute('aria-expanded', 'true');
    var focusables = getFocusableElements(mobileMenu);
    if (focusables.length) focusables[0].focus();
    document.addEventListener('keydown', handleMenuKeydown);
  }
  function closeMenu() {
    mobileMenu.hidden = true;
    document.documentElement.classList.remove('menu-open');
    document.body.classList.remove('menu-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleMenuKeydown);
    if (lastFocusedElement) lastFocusedElement.focus();
  }
  function handleMenuKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {
      var focusables = getFocusableElements(mobileMenu);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  if (burgerBtn && mobileMenu) { burgerBtn.addEventListener('click', openMenu); }
  if (closeMenuBtn) { closeMenuBtn.addEventListener('click', closeMenu); }
  var casesLink = document.getElementById('casesLink');
  if (casesLink) {
    casesLink.addEventListener('click', function (e) {
      var target = document.getElementById('next');
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    });
  }
})();
