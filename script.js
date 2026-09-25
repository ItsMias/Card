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
      var label = btn.querySelector('.mias-copy-label');
      var shown = label.textContent; // may differ from what's copied (Discord: no @)
      var copyTimer;
      var done = function () {
        label.textContent = 'Copied!';
        btn.classList.add('is-copied');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          label.textContent = shown;
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
    // WebGL2 cell field: bursts race out from the icon as a ragged Manhattan
    // wavefront, heat cells through a 5-step ink ramp and cool back down.
    // Holding the hover keeps firing stronger pulses; leaving cools it all off.
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
        'uniform float u_fade;\n' +
        // charged surface: deepest at the icon, fading toward both footer edges
        'uniform float u_origin; uniform float u_span; uniform vec4 u_charge0; uniform vec4 u_charge1;\n' +
        // the footer is much wider than the original 24px slider, so reach and speed scale up with it;
        // every pulse gets full reach (~60% of the width) from the first one, only brightness builds
        'uniform float u_scale;\n' +
        // 0 while hovered, eases to 1 on leave: fading bursts push from 60% to 70% of the width
        'uniform float u_drift;\n' +
        'in vec2 v_uv; out vec4 fragColor;\n' +
        'const float CELL_PITCH = 4.0, CELL_SIZE = 3.0, CELL_R = 0.9;\n' +
        'const float SPEED_HI = 36.0, RANGE_HI = 55.0;\n' +
        'const float DENSITY_LO = 0.22, DENSITY_HI = 0.55, JITTER = 0.22;\n' +
        'const float HEAD_GAIN = 1.25, HEAD_DECAY = 5.0, BODY_GAIN = 0.65, BODY_LO = 3.3, BODY_HI = 0.77;\n' +
        'const float AMP_LO = 0.55, MAX_AGE = 5.0, RAMP_POW = 1.4;\n' +
        'const float BREATH_DIP = 0.28, BREATH_BASE = 2.4, BREATH_VARY = 1.4;\n' +
        'const float CHARGE_MAX = 0.85, CHARGE_RAMP = 1.1, INK_FLOOR = 0.08, INK_CEIL = 0.85;\n' +
        // integer hash on the float bits: the sin() hash the original used leaves
        // visible diagonal streaks on a cell grid
        'uint mixBits(uint x){ x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16; return x; }\n' +
        'float hash21(vec2 p){ uvec2 u = floatBitsToUint(p); return float(mixBits(u.x ^ mixBits(u.y + 0x9e3779b9U)) >> 8) / 16777216.0; }\n' +
        'void main(){\n' +
        '  float pitch = u_resolution.y / max(round(u_resolution.y / CELL_PITCH), 1.0);\n' +
        '  float cellScale = pitch / CELL_PITCH;\n' +
        '  vec2 cell = floor(v_uv / pitch);\n' +
        '  vec2 cellCenter = (cell + 0.5) * pitch;\n' +
        '  float cellHalf = CELL_SIZE * 0.5 * cellScale, cellR = CELL_R * cellScale;\n' +
        '  vec2 q = abs(v_uv - cellCenter) - vec2(cellHalf - cellR);\n' +
        '  float distC = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - cellR;\n' +
        '  float aa = min(fwidth(v_uv.x), 1.5);\n' +
        '  float cellMask = 1.0 - smoothstep(-aa, aa, distC);\n' +
        '  if (cellMask <= 0.0) { fragColor = vec4(0.0); return; }\n' +
        '  float jitter = (hash21(cell + 41.7 + u_seed) - 0.5) * 2.0 * JITTER;\n' +
        '  float vary = 0.35 + 0.65 * hash21(cell + 13.7 + u_seed);\n' +
'  float edge = 0.7 + 0.6 * hash21(cell + 91.1 + u_seed);\n' +
'  float chargeRoll = hash21(cell + 61.3 + u_seed);\n' +
'  float chargeCell = chargeRoll > 0.55 ? 0.0 : mix(0.3, 1.0, hash21(cell + 33.9 + u_seed));\n' +
        '  float energy = 0.0, charged = 0.0;\n' +
        '  for (int i = 0; i < MAX_BURSTS; i++) {\n' +
        '    float age = u_time - u_burstTime[i];\n' +
        '    if (age < 0.0 || age > MAX_AGE) continue;\n' +
        '    float k = clamp(u_burstGain[i], 0.0, 1.0);\n' +
        '    vec2 originCell = floor(u_burstCenter[i] / pitch);\n' +
        '    float manh = abs(cell.x - originCell.x) + abs(cell.y - originCell.y);\n' +
        '    float range = RANGE_HI * u_scale * (1.0 + 0.167 * u_drift) * edge;\n' +
        '    float falloff = exp(-manh / (range * 0.85));\n' +
        '    float reach = exp(-max(manh - range, 0.0) * 0.12 / u_scale);\n' +
        '    float speed = SPEED_HI * u_scale;\n' +
        '    float t = age - manh / speed - jitter;\n' +
        '    charged = max(charged, smoothstep(0.0, 0.15, t) * reach);\n' +
        '    if (t < 0.0) continue;\n' +
        '    float rank = hash21(cell + 7.3 + u_seed + u_burstTime[i]);\n' +
        '    if (rank > mix(DENSITY_LO, DENSITY_HI, k)) continue;\n' +
        '    float head = HEAD_GAIN * exp(-t * HEAD_DECAY);\n' +
        '    float body = BODY_GAIN * exp(-t * mix(BODY_LO, BODY_HI, k));\n' +
        '    energy += (head + body) * mix(AMP_LO, 1.0, k) * falloff * reach * vary;\n' +
        '  }\n' +
        '  float lumA = hash21(cell + 8.8 + u_seed), lumB = hash21(cell + 88.8 + u_seed);\n' +
        '  float lumDrift = 0.5 + 0.5 * sin(u_time * 0.35 + lumA * 6.2832);\n' +
        '  float lum = pow(mix(lumA, lumB, lumDrift), 1.9);\n' +
        '  float stream = 0.9 + 0.16 * sin(u_time * 1.3 + hash21(cell + 17.3 + u_seed) * 6.2832);\n' +
        '  float e = clamp(energy, 0.0, 1.0) * u_fade * mix(0.16, 1.0, lum) * stream;\n' +
        '  float g = clamp(1.0 - abs(v_uv.x - u_origin) / max(u_span, 1.0), 0.0, 1.0);\n' +
        '  vec3 chargeColor = mix(u_charge0.rgb, u_charge1.rgb, g);\n' +
        '  float chargeA = CHARGE_MAX * pow(g, CHARGE_RAMP) * charged * chargeCell * u_fade * cellMask * mix(u_charge0.a, u_charge1.a, g);\n' +
        '  float lv = step(0.04, e) + step(0.2, e) + step(0.4, e) + step(0.6, e) + step(0.8, e);\n' +
        '  float alpha = lv <= 0.0 ? 0.0 : mix(INK_FLOOR, INK_CEIL, (lv - 1.0) / 4.0);\n' +
        '  if (lv >= 5.0) {\n' +
        '    float period = BREATH_BASE + BREATH_VARY * hash21(cell + 3.1 + u_seed);\n' +
        '    float phase = hash21(cell + 5.5 + u_seed) * 6.2832;\n' +
        '    alpha *= 1.0 - BREATH_DIP * 0.5 * (1.0 + sin(u_time * 6.2832 / period + phase));\n' +
        '  }\n' +
        '  vec3 ink = mix(u_fg2, u_fg, pow(lv / 5.0, RAMP_POW));\n' +
        '  float eA = alpha * cellMask;\n' +
        '  vec3 col = ink * eA + chargeColor * chargeA * (1.0 - eA);\n' +
        '  float a = eA + chargeA * (1.0 - eA);\n' +
        '  fragColor = a <= 0.0 ? vec4(0.0) : vec4(col, a);\n' +
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
      ['u_time', 'u_resolution', 'u_seed', 'u_fade', 'u_origin', 'u_span', 'u_scale', 'u_drift', 'u_fg', 'u_fg2',
       'u_charge0', 'u_charge1', 'u_burstTime[0]', 'u_burstCenter[0]', 'u_burstGain[0]'].forEach(function (n) {
        U[n] = gl.getUniformLocation(prog, n);
      });
      gl.clearColor(0, 0, 0, 0);
      // sparkles use the site's social-hover blue (#57e0dd); the faint end of the
      // ramp is a paler tint of it so the steps still read
      gl.uniform3f(U.u_fg, 0.341, 0.878, 0.867);  // hot ink
      gl.uniform3f(U.u_fg2, 0.77, 0.96, 0.95);    // cool ink
      // charged glow in the same blue family, deepening toward the icon
      gl.uniform4f(U.u_charge0, 0.36, 0.78, 0.82, 1);
      gl.uniform4f(U.u_charge1, 0.14, 0.42, 0.5, 1);
      gl.uniform1f(U.u_seed, 0);
      gl.uniform1f(U.u_fade, 0);

      var MAX = 8, MAX_PX = 4147200;
      var FADE_IN = 0.7, FADE_OUT = 0.85, drift = 0, RAMP_HOLD = 1.6, BURST_LIFE = 5;
      var bTime = new Float32Array(MAX).fill(-1000), bCenter = new Float32Array(MAX * 2), bGain = new Float32Array(MAX);
      var slot = 0, W = 1, H = 1, ox = 0, oy = 0;
      var clock = 0, lastFrame = -1, envelope = 0, held = 0, pressed = false;
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
        // the field is sized off the footer width: a full-blast wave spans ~60%
        // of it (30% each side of the icon), the charge glow fades out by ~70%
        var span = 0.35 * W;
        gl.viewport(0, 0, cv.width, cv.height);
        gl.uniform2f(U.u_resolution, W, H);
        gl.uniform1f(U.u_origin, ox);
        gl.uniform1f(U.u_span, span);
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
        var dt = lastFrame < 0 ? 0 : Math.max(0, (now - lastFrame) / 1000);
        clock += dt; lastFrame = now;
        envelope = pressed ? Math.min(envelope + dt / FADE_IN, 1) : Math.max(envelope - dt / FADE_OUT, 0);
        held = pressed ? held + dt : 0;
        if (pressed && clock - lastBurst > nextGap) {
          nextGap = 0.3 + Math.random() * 0.45;
          burst(strength(Math.min(held / RAMP_HOLD, 1)) * (0.85 + Math.random() * 0.3),
                (Math.random() - 0.5) * 0.12 * W);
        }
        drift += ((pressed ? 0 : 1) - drift) * Math.min(1, dt * 4);
        gl.uniform1f(U.u_drift, drift);
        gl.uniform1f(U.u_fade, envelope * envelope * (3 - 2 * envelope));
        render();
        raf = (pressed || (alive() && envelope > 0)) && !document.hidden ? requestAnimationFrame(frame) : 0;
      };
      var run = function () { if (!raf) { lastFrame = -1; raf = requestAnimationFrame(frame); } };
      var halt = function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

      var reset = function () {
        pressed = false; envelope = 0; drift = 0; lastBurst = -Infinity;
        bTime.fill(-1000); uploadBursts();
        halt();
        gl.uniform1f(U.u_fade, 0);
        render();
      };

      var start = function () {
        if (pressed || still.matches) return;
        layout();
        // a fresh press (not a re-entry mid cool-down) re-rolls the pattern
        if (performance.now() - lastBurstWall > 5000 && envelope <= 0) {
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
