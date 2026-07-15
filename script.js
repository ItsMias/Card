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

    /* ---- what-i-do feature tabs (home only) ---- */
    var tabsWrap = document.querySelector('.mias-tabs');
    if (tabsWrap) {
      var tabs = [].slice.call(tabsWrap.querySelectorAll('.mias-tab'));
      var panes = [].slice.call(tabsWrap.querySelectorAll('.mias-pane'));
      var fills = tabs.map(function (t) { return t.querySelector('.mias-tab-fill'); });
      var diamond = document.getElementById('mias-panel-diamond');
      var cur = 1; // default: Technical Event Organisation

      var render = function (prev) {
        var down = prev === undefined || cur >= prev;
        tabs.forEach(function (t, k) {
          var on = k === cur;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          var f = fills[k];
          if (f) {
            if (on) {
              // grow from the edge facing the previous tab (down = from top)
              f.style.top = down ? '0' : 'auto';
              f.style.bottom = down ? 'auto' : '0';
              f.style.transition = 'height .4s cubic-bezier(.22,1,.36,1) .1s';
            } else {
              // shrink toward the newly selected tab, quickly
              f.style.top = down ? 'auto' : '0';
              f.style.bottom = down ? '0' : 'auto';
              f.style.transition = 'height .2s cubic-bezier(.5,0,.8,.4)';
            }
            void f.offsetHeight; // apply the anchor before the height change
            f.style.height = on ? '100%' : '0%';
          }
        });
        if (diamond) {
          // slide the diamond along the panel rail: top / middle / bottom,
          // inset 22px from the rail ends so it never feels like falling off
          var frac = tabs.length > 1 ? cur / (tabs.length - 1) : 0;
          diamond.style.top = 'calc(' + (frac * 100) + '% + ' + (22 - frac * (22 * 2 + 9)) + 'px)';
        }
        panes.forEach(function (p, k) {
          var on = k === cur;
          p.style.visibility = on ? 'visible' : 'hidden';
          p.style.opacity = on ? '1' : '0';
          p.style.pointerEvents = on ? 'auto' : 'none';
          if (on) {
            var items = [].slice.call(p.querySelectorAll('.mias-pane-anim'));
            var num = p.querySelector('.mias-pane-num');
            items.forEach(function (el) { el.style.animation = 'none'; });
            if (num) num.style.animation = 'none';
            void p.offsetWidth; // reflow so the animations restart
            items.forEach(function (el, j) {
              el.style.animation = 'paneItemIn .55s cubic-bezier(.22,1,.36,1) ' + (j * 0.09) + 's both';
            });
            if (num) num.style.animation = 'paneNumIn .7s cubic-bezier(.22,1,.36,1) .12s both';
          }
        });
      };

      var go = function (i) { if (i === cur) return; var prev = cur; cur = i; render(prev); };
      tabs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
      render();

      /* keep each panel heading on a single line, scaling it down to fit */
      var panel = tabsWrap.querySelector('.mias-tabpanel');
      var headings = [].slice.call(tabsWrap.querySelectorAll('.mias-pane h3'));
      var fitHeadings = function () {
        if (!panel) return;
        var cs = getComputedStyle(panel);
        // 33px = diamond/rail column (9px) + flex gap (24px)
        var avail = panel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 33;
        if (avail <= 0) return;
        headings.forEach(function (h) {
          var base = 38; // max size
          h.style.fontSize = base + 'px';
          var w = h.scrollWidth;
          if (w > avail) h.style.fontSize = Math.floor(base * (avail / w)) + 'px';
        });
      };
      fitHeadings();
      window.addEventListener('resize', fitHeadings);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeadings);
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
