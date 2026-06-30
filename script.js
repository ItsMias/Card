/* ============================================================
   ITSMIAS — portfolio site
   Shared behaviour for index.html (home) and project.html.
   Every feature is guarded by element presence, so this one
   file runs safely on both pages.
   ============================================================ */
(function () {
  function init() {
    /* ---- mobile menu ---- */
    var menu = document.getElementById('mias-mobile-menu');
    var burger = document.querySelector('.mias-hamburger');
    if (burger && menu) {
      burger.addEventListener('click', function () {
        menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
      });
    }
    if (menu) {
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { menu.style.display = 'none'; });
      });
    }

    /* ---- top progress sliver ---- */
    var prog = document.getElementById('mias-progress');
    var updateBar = function () {
      if (!prog) return;
      var docEl = document.documentElement;
      var max = docEl.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      prog.style.width = (p * 100) + '%';
    };
    if (prog) {
      window.addEventListener('scroll', updateBar, { passive: true });
      window.addEventListener('resize', updateBar);
      updateBar();
    }

    /* ---- wordmark reveal (home only — detected by the hero #home) ---- */
    var mark = document.getElementById('nav-wordmark');
    if (mark && document.getElementById('home')) {
      var onScroll = function () {
        var show = window.scrollY > window.innerHeight * 0.6;
        mark.style.opacity = show ? '1' : '0';
        mark.style.pointerEvents = show ? 'auto' : 'none';
        mark.style.transform = show ? 'translateX(0)' : 'translateX(-8px)';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ---- rotating contact word (home only) ---- */
    var rot = document.getElementById('mias-rotator');
    var inner = document.getElementById('mias-rotator-inner');
    if (rot && inner) {
      var words = ['AN EVENT', 'A VIDEO', 'AN EXPERIENCE', 'A STORY'];
      var wi = 0, rotSwap;
      // fixed-height box so font changes never shift layout; only shrink the
      // word when it would exceed the viewport width (i.e. on mobile).
      var fit = function () {
        inner.style.fontSize = '';
        var base = parseFloat(getComputedStyle(inner).fontSize);
        rot.style.height = (base * 0.95) + 'px';
        var avail = document.documentElement.clientWidth * 0.94;
        var w = inner.offsetWidth;
        if (w > avail && w > 0) inner.style.fontSize = (base * (avail / w)) + 'px';
      };
      fit();
      rot.style.transform = 'translateY(0)';
      window.addEventListener('resize', fit);

      setInterval(function () {
        rot.style.opacity = '0';
        rot.style.transform = 'translateY(-16px)';
        clearTimeout(rotSwap);
        rotSwap = setTimeout(function () {
          wi = (wi + 1) % words.length;
          inner.textContent = words[wi];
          fit();
          rot.style.transition = 'none';
          rot.style.transform = 'translateY(16px)';
          void rot.offsetWidth; // force reflow so the entry transition runs
          rot.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1), opacity .55s cubic-bezier(.22,1,.36,1)';
          rot.style.opacity = '1';
          rot.style.transform = 'translateY(0)';
        }, 560);
      }, 2600);
    }

    /* ---- copy email (home only) ---- */
    var copyBtn = document.getElementById('mias-copy-email');
    if (copyBtn) {
      var email = 'me@itsmias.xyz';
      var copyTimer;
      var fallbackCopy = function (text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
      };
      var done = function () {
        copyBtn.textContent = 'Copied to clipboard';
        copyBtn.style.background = '#F5A9B8';
        copyBtn.style.boxShadow = '0 10px 40px rgba(245,169,184,.4)';
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          copyBtn.textContent = 'me@itsmias.xyz';
          copyBtn.style.background = '#57e0dd';
          copyBtn.style.boxShadow = '0 10px 40px rgba(87,224,221,.3)';
        }, 3200);
      };
      copyBtn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(done).catch(function () { fallbackCopy(email); done(); });
        } else {
          fallbackCopy(email); done();
        }
      });
    }

    /* ---- case-study routing (project.html only) ---- */
    if (document.getElementById('proj-horizon')) {
      var order = ['horizon', 'state', 'horizonmines', '6b6t'];
      var show = function (key) {
        if (order.indexOf(key) === -1) key = order[0];
        order.forEach(function (k) {
          var el = document.getElementById('proj-' + k);
          if (el) el.style.display = (k === key) ? 'block' : 'none';
        });
        window.scrollTo(0, 0);
        updateBar();
      };
      var fromHash = function () { show((location.hash || '').replace('#', '') || order[0]); };
      window.addEventListener('hashchange', fromHash);
      fromHash();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
