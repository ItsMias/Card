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

    /* ---- nav underline speed cap ---- */
    // Wide links would otherwise sweep faster than short ones; stretch the
    // duration so the line never moves faster than UL_MAX_SPEED px/s.
    var UL_MAX_SPEED = 150, UL_MIN_DUR = 300;
    var navlinks = document.querySelectorAll('.mias-navlink');
    var updateUnderlineSpeed = function () {
      navlinks.forEach(function (a) {
        var w = a.getBoundingClientRect().width;
        a.style.setProperty('--ul-dur', Math.max(UL_MIN_DUR, w / UL_MAX_SPEED * 1000) + 'ms');
      });
    };
    if (navlinks.length) {
      window.addEventListener('resize', updateUnderlineSpeed);
      window.addEventListener('load', updateUnderlineSpeed);
      updateUnderlineSpeed();
    }

    /* ---- nav underline: always play the full sweep ---- */
    // The line finishes drawing in before it leaves, and finishes leaving
    // before it draws in again, so a quick brush past still plays it all.
    document.documentElement.classList.add('ul-js');
    navlinks.forEach(function (a) {
      var hovered = false, state = 'idle';
      var dur = function () { return parseFloat(a.style.getPropertyValue('--ul-dur')) || UL_MIN_DUR; };
      var step = function () {
        if (state === 'idle' && hovered) {
          a.classList.add('ul-on'); state = 'growing';
        } else if (state === 'shown' && !hovered) {
          a.classList.remove('ul-on'); state = 'leaving';
        } else {
          return;
        }
        setTimeout(function () {
          state = (state === 'growing') ? 'shown' : 'idle';
          step();
        }, dur());
      };
      a.addEventListener('mouseenter', function () { hovered = true; step(); });
      a.addEventListener('mouseleave', function () { hovered = false; step(); });
    });

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

    /* ---- wordmark build pieces (see "wordmark build" in styles.css) ---- */
    // Splits an element's text into per-letter .wm-ch pieces plus a few stray
    // glitch pixels; adding .is-in / .is-out to it then plays the build / exit.
    var LINE_Y = ['18%', '78%', '50%', '30%', '66%', '42%', '84%'];
    var SPREAD_JIT = [-.3, .2, -.25, .15, .3, -.2, .25];
    // fin = { at: index, kind: 't' }: that letter skips the normal
    // left-to-right build and is constructed last from its strokes, like the
    // T at the end of Valorant's logo (crossbar flies in, stem drops and
    // overshoots).
    // Where a T's crossbar ends, as a % of its glyph box from the top: the
    // crossbar and stem copies are clipped at this line so they rejoin
    // exactly. Renders the glyph to a canvas, finds the run of full-width ink
    // rows at the cap top, then maps that onto the DOM box via its baseline.
    var crossbarCut = function (g) {
      try {
        var cs = getComputedStyle(g), fs = parseFloat(cs.fontSize);
        var cv = document.createElement('canvas'), W = Math.ceil(fs * 1.5), H = Math.ceil(fs * 2), base = Math.round(fs * 1.4);
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        ctx.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
        ctx.fillText(g.textContent, 0, base);
        var px = ctx.getImageData(0, 0, W, H).data, rows = [], maxW = 0;
        for (var y = 0; y < H; y++) {
          var n = 0;
          for (var x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 128) n++;
          rows.push(n); if (n > maxW) maxW = n;
        }
        var top = rows.findIndex(function (n) { return n > maxW * 0.6; });
        if (top < 0) return '30%';
        var bottom = top;
        while (bottom + 1 < H && rows[bottom + 1] > maxW * 0.6) bottom++;
        // baseline of the DOM glyph box, via a zero-size inline probe
        var probe = document.createElement('i');
        probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        g.appendChild(probe);
        var box = g.getBoundingClientRect(), baseY = probe.getBoundingClientRect().top - box.top;
        g.removeChild(probe);
        // a hair below the crossbar so the cut never shows as a seam
        var cutY = baseY + (bottom + 1 - base) + fs * 0.02;
        return Math.max(5, Math.min(95, cutY / box.height * 100)).toFixed(2) + '%';
      } catch (e) { return '30%'; }
    };
    var buildWordmark = function (el, pixels, fin) {
      var text = el.textContent.trim();
      el.classList.add('wm-build');
      el.setAttribute('aria-label', text);
      el.textContent = '';
      text.split('').forEach(function (ch, i) {
        var c = document.createElement('span');
        c.className = 'wm-ch';
        c.setAttribute('aria-hidden', 'true');
        c.style.setProperty('--i', i);
        c.style.setProperty('--ly', LINE_Y[i % LINE_Y.length]);
        // exit: uneven spread out from the centre, connectors on some letters
        c.style.setProperty('--d', i - (text.length - 1) / 2 + SPREAD_JIT[i % SPREAD_JIT.length]);
        c.style.setProperty('--cn', i % 2);
        c.innerHTML = '<span class="wm-g"></span><span class="wm-s wm-s1"></span>' +
          '<span class="wm-s wm-s2"></span><span class="wm-ln"></span>';
        c.querySelectorAll('.wm-g, .wm-s').forEach(function (s) { s.textContent = ch; });
        if (fin && fin.at === i) {
          c.classList.add('wm-fin', 'wm-fin-' + fin.kind);
          // starts once the last regular letter is mostly built
          c.style.setProperty('--fd', ((text.length - 1) * 105 + 380) + 'ms');
        }
        el.appendChild(c);
      });
      // most negative exit offset, so a mark can anchor its spread on the left
      var dmin = Math.min.apply(null, text.split('').map(function (_, i) {
        return i - (text.length - 1) / 2 + SPREAD_JIT[i % SPREAD_JIT.length];
      }));
      el.style.setProperty('--wm-dmin', -dmin);
      var finCh = el.querySelector('.wm-fin-t');
      if (finCh) {
        var cut = function () { finCh.style.setProperty('--cut', crossbarCut(finCh.querySelector('.wm-g'))); };
        cut();
        if (document.fonts) document.fonts.ready.then(cut);
      }
      pixels.forEach(function (p) {
        var px = document.createElement('span');
        px.className = 'wm-px';
        px.setAttribute('aria-hidden', 'true');
        px.style.setProperty('--px', p[0]);
        px.style.setProperty('--py', p[1]);
        px.style.setProperty('--pd', p[2]);
        el.appendChild(px);
      });
    };

    /* ---- wordmark reveal (home only — detected by the hero #home) ---- */
    var mark = document.getElementById('nav-wordmark');
    if (mark && document.getElementById('home')) {
      buildWordmark(mark, [['-10px', '2px', '0ms'], ['38%', '-7px', '220ms'], ['71%', '120%', '440ms'], ['104%', '20%', '650ms']],
        { at: mark.textContent.trim().indexOf('T'), kind: 't' });
      // letters are clipped now, so the container itself can stay visible
      mark.style.opacity = '1';
      mark.style.transform = 'none';

      // build only once the hero's last row (the buttons) has slid fully up
      // behind the nav, so the mark never overlaps the hero's own text
      var heroPad = document.querySelector('#home .mias-hero-pad');
      var heroEnd = heroPad && heroPad.lastElementChild;
      var nav = document.querySelector('.mias-nav');
      var shown = null;
      var onScroll = function () {
        var show = heroEnd && nav
          ? heroEnd.getBoundingClientRect().bottom < nav.getBoundingClientRect().bottom
          : window.scrollY > window.innerHeight * 0.6;
        if (show === shown) return;
        // the first check only hides; no exit animation for a mark never seen
        if (shown === null && !show) { shown = false; return; }
        shown = show;
        mark.classList.toggle('is-in', show);
        mark.classList.toggle('is-out', !show);
        mark.style.pointerEvents = show ? 'auto' : 'none';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ---- footer end card: ITSMIAS builds in on arrival ---- */
    // Builds the same way as the nav wordmark (T finale included) once the
    // card is well into view; resets silently once it has fully left the
    // screen, so it plays again on the next visit to the bottom of the page.
    var fEnd = document.querySelector('.mias-footer-end');
    var fMark = fEnd && fEnd.querySelector('.mias-footer-endmark');
    if (fMark) {
      buildWordmark(fMark, [],
        { at: fMark.textContent.trim().indexOf('T'), kind: 't' });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          var e = entries[0];
          if (e.intersectionRatio >= 0.6) fMark.classList.add('is-in');
          else if (!e.isIntersecting) fMark.classList.remove('is-in');
        }, { threshold: [0, 0.6] }).observe(fEnd);
      } else {
        fMark.classList.add('is-in');
      }
    }

    /* ---- hero scroll cue: away while scrolled down, back at the top ---- */
    var cue = document.querySelector('.mias-scrollcue');
    if (cue) {
      var syncCue = function () { cue.classList.toggle('is-gone', window.scrollY > 40); };
      window.addEventListener('scroll', syncCue, { passive: true });
      syncCue(); // opened part-way down: start hidden, no fade-out to see
    }

    /* ---- testimonials link: rest the divider at the viewport bottom ----
       On tall screens the section doesn't fill the viewport, so a plain
       anchor jump already reveals the About text below the divider. Scroll
       only far enough that the divider's bottom edge meets the viewport
       bottom; never past the section top (short screens fall back to the
       normal top alignment). */
    var testi = document.getElementById('testimonials');
    if (testi) {
      var scrollToTestimonials = function (smooth) {
        var aboutText = document.querySelector('#about h2');
        var sectionTop = testi.getBoundingClientRect().top + window.scrollY;
        var target = sectionTop;
        if (aboutText) {
          // stop right before the About heading enters the viewport, so the
          // divider floats above the bottom edge instead of touching it
          var aboutTextTop = aboutText.getBoundingClientRect().top + window.scrollY;
          target = Math.min(sectionTop, aboutTextTop - window.innerHeight);
        }
        window.scrollTo({ top: Math.max(0, target), behavior: smooth ? 'smooth' : 'instant' });
      };
      document.querySelectorAll('a[href="#testimonials"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          scrollToTestimonials(true);
        });
      });
      if (location.hash === '#testimonials') {
        scrollToTestimonials(false);
        // images loading later shift section positions; settle once more
        window.addEventListener('load', function () { scrollToTestimonials(false); });
      }
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

    /* ---- copy email / discord (home only) ---- */
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
    Array.prototype.forEach.call(document.querySelectorAll('.mias-copy'), function (btn) {
      var text = btn.getAttribute('data-copy');
      var copyTimer;
      // "Copied!" is drawn by CSS over the label, so the button never resizes
      var done = function () {
        btn.classList.add('is-copied');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          btn.classList.remove('is-copied');
        }, 3200);
      };
      btn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
        } else {
          fallbackCopy(text); done();
        }
      });
    });

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

      /* cycle top-to-bottom every 7s, restarting the wait after a click so a
         just-picked tab is never yanked away mid-read */
      var cycle = null;
      var stopCycle = function () { if (cycle) { clearInterval(cycle); cycle = null; } };
      var startCycle = function () {
        stopCycle();
        cycle = setInterval(function () { go((cur + 1) % tabs.length); }, 7000);
      };

      tabs.forEach(function (t, k) {
        t.addEventListener('click', function () { stopCycle(); go(k); });
      });
      render();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startCycle();

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

    /* ---- live local time (about, home only) ---- */
    // the visitor's own clock, shown in The Hague's IANA zone so the browser's
    // tz database handles the CET/CEST switch rather than a fixed offset
    var clock = document.getElementById('mias-clock');
    if (clock && window.Intl) {
      var cTime = document.getElementById('mias-clock-time');
      var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      var renderClock = function () {
        cTime.textContent = fmt.format(new Date());
        document.getElementById('mias-clock-now').style.display = 'inline';
      };
      renderClock();
      // re-sync on each minute boundary so the time never lags behind
      setTimeout(function () { renderClock(); setInterval(renderClock, 60000); }, 60000 - Date.now() % 60000);
    }

    /* ---- live Discord presence via Lanyard (about, home only) ---- */
    var presence = document.getElementById('mias-presence');
    if (presence) {
      var USER_ID = '615580983881760787';
      var pAvatar = document.getElementById('mias-presence-avatar');
      var pDeco = document.getElementById('mias-presence-deco');
      var pDot = document.getElementById('mias-presence-dot');
      var pName = document.getElementById('mias-presence-name');
      var pGuild = document.getElementById('mias-presence-guild');
      var pGuildBadge = document.getElementById('mias-presence-guild-badge');
      var pGuildTag = document.getElementById('mias-presence-guild-tag');
      var pBadges = document.getElementById('mias-presence-badges');
      var pStatus = document.getElementById('mias-presence-status');
      var pActivity = document.getElementById('mias-presence-activity');
      var pActivityIcon = document.getElementById('mias-presence-activity-icon');
      var pActivityText = document.getElementById('mias-presence-activity-text');
      var STATUS_COLORS = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' };
      var STATUS_FALLBACK = 'May the odds be ever in your favor'; // shown while offline
      var setActivityIcon = function (url) {
        if (url) { pActivityIcon.src = url; pActivityIcon.style.display = 'block'; }
        else pActivityIcon.style.display = 'none';
      };
      pActivityIcon.addEventListener('error', function () { pActivityIcon.style.display = 'none'; });
      // icon straight from the activity's own artwork; games without rich
      // presence art fall back to their app icon via Discord's public API
      var appIconCache = {};
      var resolveActivityIcon = function (act, cb) {
        var assets = act.assets || {};
        var img = assets.large_image || assets.small_image;
        if (img) {
          if (img.indexOf('mp:external') === 0) return cb('https://media.discordapp.net/' + img.slice(3));
          if (img.indexOf('spotify:') === 0) return cb('https://i.scdn.co/image/' + img.slice(8));
          if (act.application_id) return cb('https://cdn.discordapp.com/app-assets/' + act.application_id + '/' + img + '.png?size=64');
        }
        if (!act.application_id) return cb('');
        if (appIconCache[act.application_id] !== undefined) return cb(appIconCache[act.application_id]);
        fetch('https://discord.com/api/v10/applications/' + act.application_id + '/rpc')
          .then(function (r) { return r.json(); })
          .then(function (app) {
            var url = app.icon ? 'https://cdn.discordapp.com/app-icons/' + act.application_id + '/' + app.icon + '.png?size=64' : '';
            appIconCache[act.application_id] = url;
            cb(url);
          })
          .catch(function () { cb(''); });
      };
      // profile badges aren't in Lanyard's API, so they're declared here (assets
      // live in assets/badges/ because discord.com blocks hotlinking); the nitro
      // and booster badge tiers advance automatically from their start dates
      var NITRO_SINCE = new Date(2026, 3, 10); // 10 April 2026
      var BOOST_SINCE = new Date(2026, 3, 10); // 10 April 2026
      var NITRO_TIERS = [[72, 'opal'], [60, 'ruby'], [36, 'emerald'], [24, 'diamond'], [12, 'platinum'], [6, 'gold'], [3, 'silver'], [1, 'bronze']];
      var BOOST_TIERS = [24, 18, 15, 12, 9, 6, 3, 2, 1];
      var monthsSince = function (d) {
        var now = new Date();
        return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()) - (now.getDate() < d.getDate() ? 1 : 0);
      };
      var nitroMonths = monthsSince(NITRO_SINCE);
      var nitroTier = 'bronze';
      for (var nt = 0; nt < NITRO_TIERS.length; nt++) {
        if (nitroMonths >= NITRO_TIERS[nt][0]) { nitroTier = NITRO_TIERS[nt][1]; break; }
      }
      var boostMonths = monthsSince(BOOST_SINCE);
      var boostTier = 1;
      for (var bt = 0; bt < BOOST_TIERS.length; bt++) {
        if (boostMonths >= BOOST_TIERS[bt]) { boostTier = BOOST_TIERS[bt]; break; }
      }
      var BADGES = [
        { src: 'assets/badges/nitro-' + nitroTier + '.png', title: 'Nitro ' + nitroTier.charAt(0).toUpperCase() + nitroTier.slice(1) },
        { src: 'assets/badges/hypesquad-brilliance.png', title: 'HypeSquad Brilliance' },
        { src: 'assets/badges/boost-' + boostTier + 'm.png', title: 'Server Booster' },
        { src: 'assets/badges/gifting-legend.png', title: 'Gifting Legend' }
      ];
      BADGES.forEach(function (b) {
        var img = document.createElement('img');
        img.src = b.src;
        img.alt = b.title;
        img.title = b.title;
        img.style.cssText = 'width:22px; height:22px; object-fit:contain; display:block;';
        pBadges.appendChild(img);
      });
      var renderPresence = function (d) {
        var u = d.discord_user || {};

        if (u.avatar) {
          var ext = u.avatar.indexOf('a_') === 0 ? 'gif' : 'webp';
          pAvatar.src = 'https://cdn.discordapp.com/avatars/' + USER_ID + '/' + u.avatar + '.' + ext + '?size=128';
        } else {
          pAvatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
        var deco = u.avatar_decoration_data;
        if (deco && deco.asset) {
          pDeco.src = 'https://cdn.discordapp.com/avatar-decoration-presets/' + deco.asset + '.png?size=160&passthrough=true';
          pDeco.style.display = 'block';
        } else {
          pDeco.style.display = 'none';
        }

        pName.textContent = u.global_name || u.display_name || u.username || '';

        var guild = u.primary_guild;
        if (guild && guild.tag && guild.identity_enabled !== false && guild.identity_guild_id && guild.badge) {
          pGuildBadge.src = 'https://cdn.discordapp.com/clan-badges/' + guild.identity_guild_id + '/' + guild.badge + '.png?size=32';
          pGuildTag.textContent = guild.tag;
          pGuild.style.display = 'inline-flex';
        } else {
          pGuild.style.display = 'none';
        }

        var game = null, custom = null;
        (d.activities || []).forEach(function (a) {
          if (a.type === 0 && !game) game = a;
          if (a.type === 4 && !custom) custom = a;
        });

        var isOffline = (d.discord_status || 'offline') === 'offline';

        var statusText = (custom && custom.state) ? custom.state : '';
        if (statusText && custom.emoji && !custom.emoji.id) statusText = custom.emoji.name + ' ' + statusText;
        // Discord stops reporting the custom status while offline; show a fixed
        // line instead (kept in sync by hand -- no visitor-side storage)
        if (!statusText && isOffline) statusText = STATUS_FALLBACK;
        pStatus.textContent = statusText;
        pStatus.style.display = statusText ? 'block' : 'none';

        var actText = '';
        if (game) {
          actText = 'Playing ' + game.name;
          resolveActivityIcon(game, setActivityIcon);
        } else if (d.listening_to_spotify && d.spotify) {
          actText = 'Listening to ' + d.spotify.song;
          setActivityIcon('assets/icons/spotify.svg'); // always the Spotify logo, never album art
        } else if (isOffline) {
          actText = 'Offline...';
          setActivityIcon('');
        } else {
          actText = 'Not doing anything...';
          setActivityIcon('');
        }
        pActivityText.textContent = actText;
        pActivity.style.display = actText ? 'flex' : 'none';

        pDot.style.background = STATUS_COLORS[d.discord_status] || STATUS_COLORS.offline;
        presence.style.display = 'block';
      };
      var pollPresence = function () {
        fetch('https://api.lanyard.rest/v1/users/' + USER_ID)
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.success) renderPresence(j.data); })
          .catch(function () {}); // Lanyard down: the row stays hidden / keeps its last state
      };
      pollPresence();
      setInterval(pollPresence, 60000);
    }

    /* ---- ultracode easter egg: hovering GitHub fills the footer ---- */
    // WebGL2 scan-line field in the wordmark's construction language (see
    // "wordmark build" in styles.css): each burst sends cyan lines and wider
    // offset slices racing sideways from the icon along fixed lanes, and fewer
    // shooting up and down along columns; each draws in white-hot at the head,
    // then wipes off from the back. Stray glitch pixels blink in hard steps. Holding the hover keeps firing
    // stronger pulses; leaving plays the wordmark's exit over the whole field:
    // lines thin to hairlines, smear outward and hard-cut.
    var gh = document.querySelector('.mias-gh');
    var foot = document.querySelector('.mias-contact-foot');
    var gl2 = null, cv = null;
    if (gh && foot && window.WebGL2RenderingContext) {
      cv = document.createElement('canvas');
      cv.className = 'mias-ultra';
      cv.setAttribute('aria-hidden', 'true');
      foot.insertBefore(cv, foot.firstChild);
      gl2 = cv.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false });
      if (!gl2) cv.remove();
    }
    if (gl2) (function (gl) {
      var VS = '#version 300 es\n' +
        'in vec2 a_position; out vec2 v_uv; uniform vec2 u_resolution;\n' +
        'void main(){ v_uv = (a_position * 0.5 + 0.5) * u_resolution; gl_Position = vec4(a_position, 0.0, 1.0); }';
      var FS = '#version 300 es\n' +
        'precision highp float;\n' +
        'uniform vec2 u_resolution; uniform float u_time; uniform vec3 u_fg; uniform vec3 u_fg2; uniform float u_seed;\n' +
        'const int MAX_BURSTS = 8;\n' +
        'uniform float u_burstTime[MAX_BURSTS]; uniform vec2 u_burstCenter[MAX_BURSTS]; uniform float u_burstGain[MAX_BURSTS];\n' +
        // u_fade is a hard 0/1 cut; u_exit runs 0 -> 1 linearly after the hover ends
        'uniform float u_fade; uniform float u_exit;\n' +
        // the footer is much wider than a single line, so speed scales up with it
        'uniform float u_scale;\n' +
        'in vec2 v_uv; out vec4 fragColor;\n' +
        // lanes: one line per LANE px (rows) / COL px (columns); SLICE lanes carry a wider, fainter band
        'const float LANE = 7.0, COL = 9.0, LINE_W = 2.0, SLICE_W = 5.0, HEAD_LEN = 16.0;\n' +
        // REACH / REACH_V: longest row line as a fraction of the footer width, longest
        // column line as a fraction of its height; FALL / FALL_V: how fast lane odds and
        // reach drop off across the burst (fraction of height / width)
        'const float SPEED = 150.0, REACH = 0.32, REACH_V = 0.42, FALL = 0.18, FALL_V = 0.1;\n' +
        'const float DENSITY_LO = 0.14, DENSITY_HI = 0.4, VERT_ODDS = 0.5, SLICE_ODDS = 0.2, GUIDE_A = 0.07;\n' +
        'const float PX_PITCH = 12.0, PX_SIZE = 3.0, PX_ODDS = 0.035;\n' +
        'const float MAX_AGE = 3.5;\n' +
        'uint mixBits(uint x){ x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16; return x; }\n' +
        'float hash21(vec2 p){ uvec2 u = floatBitsToUint(p); return float(mixBits(u.x ^ mixBits(u.y + 0x9e3779b9U)) >> 8) / 16777216.0; }\n' +
        // one lane of one burst, premultiplied. d: signed distance from the burst along
        // the lane, off: distance from the lane's centre line, near: 1 at the burst's own
        // lane, falling off away from it. The line draws in from the burst, white-hot at
        // the head, then its tail chases the head and wipes it off.
        'vec4 streak(vec2 lk, float d, float off, float near, float age, float k, float reachMax, float speed, float odds, float thin, float smear){\n' +
        '  if (hash21(lk + 1.3) >= odds * near) return vec4(0.0);\n' +
        '  float dir = hash21(lk + 2.9) < 0.5 ? -1.0 : 1.0;\n' +
        '  float v = speed * mix(0.7, 1.4, hash21(lk + 4.1));\n' +
        '  float reach = reachMax * mix(0.35, 1.0, hash21(lk + 5.7)) * mix(0.4, 1.0, near);\n' +
        // lanes further from the burst start later, so the field opens as a lens
        '  float t = age - (0.06 + 0.26 * hash21(lk + 7.7)) * (2.0 - near);\n' +
        '  float lag = 0.7 * reach / v + 0.14;\n' +
        '  if (t <= 0.0 || t >= lag + reach / v) return vec4(0.0);\n' +
        '  float head = min(v * t, reach) + smear * reachMax;\n' +
        '  float tail = clamp(v * (t - lag), 0.0, reach) + smear * reachMax * 0.55;\n' +
        '  float s = d * dir;\n' +
        '  bool slice = hash21(lk + 9.2) < SLICE_ODDS;\n' +
        '  if (off < (slice ? SLICE_W : LINE_W) * 0.5 * thin && s >= tail && s <= head) {\n' +
        '    bool hot = head - s < HEAD_LEN && v * t < reach && u_exit <= 0.0;\n' +
        '    float la = hot ? 1.0 : (slice ? 0.45 : 1.0) * mix(0.45, 1.0, (s - tail) / max(head - tail, 1.0)) * mix(0.6, 1.0, k);\n' +
        '    return vec4((hot ? u_fg2 : u_fg) * la, la);\n' +
        '  }\n' +
        // faint construction guide along the lane's full run while it is live
        '  if (off < 0.5 && s >= 0.0 && s <= reach) { float ga = GUIDE_A * (1.0 - u_exit); return vec4(u_fg * ga, ga); }\n' +
        '  return vec4(0.0);\n' +
        '}\n' +
        'void main(){\n' +
        '  float lane = floor(v_uv.y / LANE), laneY = (lane + 0.5) * LANE;\n' +
        '  float col = floor(v_uv.x / COL), colX = (col + 0.5) * COL;\n' +
        '  float offY = abs(v_uv.y - laneY), offX = abs(v_uv.x - colX);\n' +
        // exit, like the wordmark: snap thin first, then the smear accelerates
        '  float thin = mix(1.0, 0.5, min(u_exit / 0.18, 1.0));\n' +
        '  float sm = max(u_exit - 0.18, 0.0) / 0.82;\n' +
        '  float smear = sm * sm * 0.5;\n' +
        '  vec2 pcell = floor(v_uv / PX_PITCH);\n' +
        '  vec2 pin = v_uv - pcell * PX_PITCH;\n' +
        '  float fall = FALL * u_resolution.y, fallV = FALL_V * u_resolution.x, speed = SPEED * u_scale;\n' +
        '  vec4 acc = vec4(0.0);\n' +
        '  for (int i = 0; i < MAX_BURSTS; i++) {\n' +
        '    float age = u_time - u_burstTime[i];\n' +
        '    if (age < 0.0 || age > MAX_AGE) continue;\n' +
        '    float k = clamp(u_burstGain[i], 0.0, 1.0);\n' +
        '    vec2 c = u_burstCenter[i];\n' +
        '    float bs = u_burstTime[i] + u_seed, odds = mix(DENSITY_LO, DENSITY_HI, k);\n' +
        // rows race sideways, columns shoot up and down (fewer of them)
        '    vec4 r = streak(vec2(lane, bs), v_uv.x - c.x, offY, exp(-abs(laneY - c.y) / fall), age, k,\n' +
        '                    REACH * u_resolution.x, speed, odds, thin, smear);\n' +
        '    acc = r + acc * (1.0 - r.a);\n' +
        '    r = streak(vec2(col + 7919.0, bs), v_uv.y - c.y, offX, exp(-abs(colX - c.x) / fallV), age, k,\n' +
        '               REACH_V * u_resolution.y, speed, odds * VERT_ODDS, thin, smear);\n' +
        '    acc = r + acc * (1.0 - r.a);\n' +
        // glitch pixels: blink twice in hard steps as the wave passes them
        '    vec2 pk = pcell + bs;\n' +
        '    vec2 pc = (pcell + 0.5) * PX_PITCH;\n' +
        '    float pdx = abs(pc.x - c.x), pnear = exp(-abs(pc.y - c.y) / fall);\n' +
        '    if (u_exit <= 0.0 && pdx < REACH * u_resolution.x * pnear && hash21(pk + 11.1) < PX_ODDS * mix(0.5, 1.0, k) * pnear) {\n' +
        '      vec2 d = pin - floor(vec2(hash21(pk + 12.7), hash21(pk + 13.3)) * (PX_PITCH - PX_SIZE));\n' +
        '      float tp = age - pdx / speed - 0.16 * hash21(pk + 14.9);\n' +
        '      bool on = (tp >= 0.0 && tp < 0.18) || (tp >= 0.32 && tp < 0.44);\n' +
        '      if (on && d.x >= 0.0 && d.y >= 0.0 && d.x < PX_SIZE && d.y < PX_SIZE) acc = vec4(u_fg, 1.0);\n' +
        '    }\n' +
        '  }\n' +
        '  fragColor = acc * u_fade;\n' +
        '}';

      var compile = function (type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        return s;
      };
      var prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); return; }
      gl.useProgram(prog);

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      var aPos = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      var U = {};
      ['u_time', 'u_resolution', 'u_seed', 'u_fade', 'u_exit', 'u_scale', 'u_fg', 'u_fg2',
       'u_burstTime[0]', 'u_burstCenter[0]', 'u_burstGain[0]'].forEach(function (n) {
        U[n] = gl.getUniformLocation(prog, n);
      });
      gl.clearColor(0, 0, 0, 0);
      // the wordmark's palette: lines in its construction cyan (#57e0dd), heads
      // white-hot in the settled glyph colour (#ece9f5)
      gl.uniform3f(U.u_fg, 0.341, 0.878, 0.867);
      gl.uniform3f(U.u_fg2, 0.925, 0.914, 0.961);
      gl.uniform1f(U.u_seed, 0);
      gl.uniform1f(U.u_fade, 0);
      gl.uniform1f(U.u_exit, 0);

      var MAX = 8, MAX_PX = 4147200;
      // EXIT: length of the leave animation (s); the hard cut lands at CUT of it
      var EXIT = 0.6, CUT = 0.89, RAMP_HOLD = 1.6, BURST_LIFE = 3.5;
      var bTime = new Float32Array(MAX).fill(-1000), bCenter = new Float32Array(MAX * 2), bGain = new Float32Array(MAX);
      var slot = 0, W = 1, H = 1, ox = 0, oy = 0;
      var clock = 0, lastFrame = -1, leave = 1, held = 0, pressed = false;
      var lastBurst = -Infinity, lastBurstWall = -Infinity, nextGap = 0.45, raf = 0;
      var still = window.matchMedia('(prefers-reduced-motion: reduce)');

      var uploadBursts = function () {
        gl.uniform1fv(U['u_burstTime[0]'], bTime);
        gl.uniform2fv(U['u_burstCenter[0]'], bCenter);
        gl.uniform1fv(U['u_burstGain[0]'], bGain);
      };
      uploadBursts();

      var layout = function () {
        var r = foot.getBoundingClientRect();
        var w = Math.max(1, r.width), h = Math.max(1, r.height);
        // keep in-flight bursts anchored when the footer resizes
        for (var i = 0; i < MAX; i++) { bCenter[i * 2] *= w / W; bCenter[i * 2 + 1] *= h / H; }
        W = w; H = h;
        var dpr = window.devicePixelRatio || 1;
        var pw = Math.max(1, Math.round(W * dpr)), ph = Math.max(1, Math.round(H * dpr));
        if (pw * ph > MAX_PX) { var s = Math.sqrt(MAX_PX / (pw * ph)); pw = Math.round(pw * s); ph = Math.round(ph * s); }
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        var g = gh.getBoundingClientRect();
        ox = g.left + g.width / 2 - r.left;
        oy = H - (g.top + g.height / 2 - r.top); // GL y runs bottom-up
        gl.viewport(0, 0, cv.width, cv.height);
        gl.uniform2f(U.u_resolution, W, H);
        gl.uniform1f(U.u_scale, Math.max(0.4, (0.3 * W / 4 + H / 8) / 55));
        uploadBursts();
      };

      var render = function () {
        gl.uniform1f(U.u_time, clock);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };

      // strength grows the longer the hover is held
      var strength = function (heldFrac) { return Math.min(0.85 * (0.45 + 0.55 * heldFrac), 1); };
      var burst = function (gain, jitterX) {
        bTime[slot] = clock;
        bCenter[slot * 2] = ox + jitterX;
        bCenter[slot * 2 + 1] = oy + H * (Math.random() - 0.5) * 0.3;
        bGain[slot] = gain;
        slot = (slot + 1) % MAX;
        uploadBursts();
        lastBurst = clock;
        lastBurstWall = performance.now();
        if (!document.hidden) run();
      };

      var alive = function () { return clock - lastBurst < BURST_LIFE; };
      var frame = function (now) {
        // capped so a stalled frame can't skip the exit straight to the cut
        var dt = lastFrame < 0 ? 0 : Math.min(Math.max(0, (now - lastFrame) / 1000), 0.05);
        clock += dt; lastFrame = now;
        leave = pressed ? 0 : Math.min(leave + dt / EXIT, 1);
        held = pressed ? held + dt : 0;
        if (pressed && clock - lastBurst > nextGap) {
          nextGap = 0.5 + Math.random() * 0.6;
          burst(strength(Math.min(held / RAMP_HOLD, 1)) * (0.85 + Math.random() * 0.3),
                (Math.random() - 0.5) * 0.12 * W);
        }
        // once cut, drop what was in flight so a later hover can't revive it
        if (leave >= 1) { bTime.fill(-1000); uploadBursts(); }
        gl.uniform1f(U.u_exit, leave);
        gl.uniform1f(U.u_fade, leave < CUT ? 1 : 0);
        render();
        raf = (pressed || (alive() && leave < 1)) && !document.hidden ? requestAnimationFrame(frame) : 0;
      };
      var run = function () { if (!raf) { lastFrame = -1; raf = requestAnimationFrame(frame); } };
      var halt = function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

      var reset = function () {
        pressed = false; leave = 1; lastBurst = -Infinity;
        bTime.fill(-1000); uploadBursts();
        halt();
        gl.uniform1f(U.u_fade, 0);
        render();
      };

      var start = function () {
        if (pressed || still.matches) return;
        layout();
        // a fresh press (not a re-entry mid exit) re-rolls the pattern
        if (performance.now() - lastBurstWall > 5000 && leave >= 1) {
          bTime.fill(-1000); uploadBursts();
          gl.uniform1f(U.u_seed, Math.random() * 512);
        }
        pressed = true; held = 0;
        burst(strength(0), 0);
      };
      var stop = function () { if (pressed) { pressed = false; if (!document.hidden) run(); } };

      new ResizeObserver(function () { layout(); render(); }).observe(foot);
      document.addEventListener('visibilitychange', function () { if (document.hidden) reset(); });
      still.addEventListener('change', function () { if (still.matches) reset(); });
      gh.addEventListener('mouseenter', start);
      gh.addEventListener('focus', start);
      gh.addEventListener('mouseleave', stop);
      gh.addEventListener('blur', stop);
    })(gl2);

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
