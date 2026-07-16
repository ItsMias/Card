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
          actText = 'Currently offline...';
          setActivityIcon('');
        } else {
          actText = 'Currently not doing anything...';
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
