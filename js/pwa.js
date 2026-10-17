/* Nabho Bazaar — PWA runtime
   Registers the service worker, handles the install prompt, and shows a
   light offline chip. Deliberately dependency-free. */

(function () {
  'use strict';

  // ---- Service worker ---------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('sw.js', { scope: './' })
        .then(function (reg) {
          // If a new worker is waiting, activate it on the next load
          reg.addEventListener('updatefound', function () {
            var next = reg.installing;
            if (!next) return;
            next.addEventListener('statechange', function () {
              if (next.state === 'installed' && navigator.serviceWorker.controller) {
                next.postMessage('skip-waiting');
              }
            });
          });
        })
        .catch(function () {
          /* Non-fatal: the site works fine without offline caching. */
        });
    });
  }

  // ---- Install prompt ---------------------------------------------------
  var deferredPrompt = null;
  var banner = document.getElementById('install-banner');
  var accept = document.getElementById('install-accept');
  var dismiss = document.getElementById('install-dismiss');
  var DISMISS_KEY = 'nabho-install-dismissed';

  function dismissed() {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function hideBanner() { if (banner) banner.hidden = true; }

  // Never interrupt the first impression: reveal the install offer only once
  // the visitor has actually engaged (scrolled a little) or after a while.
  var offerReady = false;
  function revealBanner() {
    if (!offerReady || !banner) return;
    if (dismissed() || window.matchMedia('(display-mode: standalone)').matches) return;
    if (!banner.hidden) return;
    banner.hidden = false;
  }
  function engage() {
    if (window.scrollY > 420) {
      revealBanner();
      window.removeEventListener('scroll', engage);
    }
  }
  window.addEventListener('scroll', engage, { passive: true });
  setTimeout(revealBanner, 14000);

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    offerReady = true;
    // Only offer it once, and never inside an installed app
    if (dismissed() || window.matchMedia('(display-mode: standalone)').matches) return;
    // If they have already scrolled past the hero, show it straight away
    if (window.scrollY > 420) banner.hidden = false;
  });

  if (accept) {
    accept.addEventListener('click', async function () {
      if (!deferredPrompt) { hideBanner(); return; }
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) {}
      deferredPrompt = null;
      hideBanner();
    });
  }

  if (dismiss) {
    dismiss.addEventListener('click', function () {
      hideBanner();
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    });
  }

  window.addEventListener('appinstalled', function () {
    hideBanner();
    deferredPrompt = null;
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  });

  // ---- Offline chip -----------------------------------------------------
  var chip = null;
  function showOffline() {
    if (chip) return;
    chip = document.createElement('div');
    chip.className = 'offline-chip';
    chip.textContent = 'OFFLINE · SHOWING SAVED SHELVES';
    document.body.appendChild(chip);
  }
  function hideOffline() {
    if (!chip) return;
    chip.remove();
    chip = null;
  }
  window.addEventListener('offline', showOffline);
  window.addEventListener('online', hideOffline);
  if (!navigator.onLine) showOffline();

  // ---- iOS: no beforeinstallprompt, so teach the Share-sheet gesture ----
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true;
  if (isIOS && !isStandalone && !dismissed() && banner) {
    var copy = banner.querySelector('.install-copy strong');
    var note = banner.querySelector('.install-copy small');
    var btn = document.getElementById('install-accept');
    if (copy) copy.textContent = 'Add Nabho Bazaar to your home screen';
    if (note) note.textContent = 'Tap Share, then “Add to Home Screen”.';
    if (btn) btn.textContent = 'Got it';
    offerReady = true;
    setTimeout(revealBanner, 9000);
    if (btn) {
      btn.addEventListener('click', function () {
        hideBanner();
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
      });
    }
  }
})();
