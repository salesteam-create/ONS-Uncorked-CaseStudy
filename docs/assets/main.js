/* ONS+ UnCorked case study: motion layer.
   Content is fully visible without this file. Everything here uses gsap.from
   or class toggles, and nothing runs when the visitor prefers reduced motion. */
(function () {
  var loader = document.querySelector('.loader');
  function dropLoader() { if (loader) { loader.remove(); loader = null; } }

  if (!window.gsap || !window.ScrollTrigger) { dropLoader(); return; }
  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var seen = document.documentElement.classList.contains('intro-seen');

  /* ---------- Always on: header progress, auto-hide, active nav ---------- */
  var top = $('.top');
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      top.classList.toggle('hide', self.direction === 1 && self.scroll() > 600);
    }
  });
  $$('.top nav a').forEach(function (a) {
    var target = $(a.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target, start: 'top 50%', end: 'bottom 50%',
      onToggle: function (self) { a.classList.toggle('on', self.isActive); }
    });
  });

  var mm = gsap.matchMedia();

  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)',
    desktop: '(min-width: 861px)',
    hover: '(hover: hover) and (pointer: fine)'
  }, function (ctx) {
    var c = ctx.conditions;
    if (c.reduce) { dropLoader(); return; }

    /* ---------- Intro: the uncork ---------- */
    var intro = gsap.timeline({ paused: true });
    var hero = $('.hero');
    var h1Split = hasSplit ? SplitText.create('.hero h1', { type: 'words,chars', mask: 'words' }) : null;

    intro
      .from('.sparkles', { yPercent: -100, duration: 1.1, ease: 'expo.out' }, 0)
      .from('.hero-logo', { y: 40, autoAlpha: 0, scale: .92, duration: .9, ease: 'expo.out' }, .05)
      .from(h1Split ? h1Split.chars : '.hero h1', { yPercent: 110, duration: .9, ease: 'expo.out', stagger: .018 }, .15)
      .from('.hero .lede', { y: 24, autoAlpha: 0, duration: .8, ease: 'power3.out' }, .55)
      .from('.facts div', { y: 30, autoAlpha: 0, duration: .7, ease: 'power3.out', stagger: .06 }, .7);

    function playLoader() {
      if (!loader || seen) { dropLoader(); intro.play(); return; }
      try { sessionStorage.setItem('uc-intro', '1'); } catch (e) {}
      loader.style.animation = 'none';
      var burst = $('.burst', loader);
      for (var i = 0; i < 16; i++) burst.appendChild(document.createElement('i'));
      var tl = gsap.timeline({ onComplete: dropLoader });
      tl.from('.lp-ink img', { scale: .6, autoAlpha: 0, duration: .6, ease: 'back.out(2)' })
        .to('.lp-ink img', { scale: 1.08, duration: .12, ease: 'power2.in' })
        .to('.lp-ink img', { scale: 1, duration: .5, ease: 'elastic.out(1,.4)' })
        .fromTo('.burst i', { x: 0, y: 0, scale: 0, rotation: 0 }, {
          x: function () { return gsap.utils.random(-260, 260); },
          y: function () { return gsap.utils.random(-240, 120); },
          scale: function () { return gsap.utils.random(.5, 1.6); },
          rotation: function () { return gsap.utils.random(-180, 180); },
          duration: .9, ease: 'expo.out', stagger: .008
        }, '<')
        .to('.burst i', { autoAlpha: 0, duration: .3 }, '-=.35')
        .to('.lp-ink', { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '-=.15')
        .to('.lp-lime', { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '-=.68')
        .add(function () { intro.play(); }, '-=.45');
      loader.addEventListener('click', function () { tl.progress(1); intro.play(); }, { once: true });
    }
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(playLoader);

    /* Rising bubbles and sparkles in the hero */
    var bubbles = $('.bubbles');
    for (var b = 0; b < 22; b++) {
      var el = document.createElement('i');
      var size = gsap.utils.random(6, 22);
      if (b % 3 === 0) el.className = 'dot';
      gsap.set(el, { left: gsap.utils.random(0, 100) + '%', width: size, height: size });
      bubbles.appendChild(el);
      gsap.fromTo(el, { y: 0, autoAlpha: 0 }, {
        y: function () { return -(hero.offsetHeight + 80); },
        x: gsap.utils.random(-40, 40),
        rotation: gsap.utils.random(-120, 120),
        keyframes: { autoAlpha: [0, .9, .9, 0] },
        duration: gsap.utils.random(7, 14), delay: gsap.utils.random(0, 10),
        repeat: -1, ease: 'none'
      });
    }
    gsap.to('.sparkles', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero .wrap', { yPercent: 12, autoAlpha: .3, ease: 'none', scrollTrigger: { trigger: hero, start: 'center top', end: 'bottom top', scrub: true } });

    if (c.hover) {
      var lx = gsap.quickTo('.hero-logo', 'x', { duration: .8, ease: 'power3' });
      var ly = gsap.quickTo('.hero-logo', 'y', { duration: .8, ease: 'power3' });
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        lx((e.clientX - r.left - r.width / 2) / r.width * -24);
        ly((e.clientY - r.top - r.height / 2) / r.height * -16);
      });
    }

    /* ---------- Marquee: speed follows scroll velocity ---------- */
    var loops = $$('.marquee').map(function (m, i) {
      var rev = m.classList.contains('rev');
      return gsap.fromTo($('.marquee-track', m), { xPercent: rev ? -50 : 0 }, { xPercent: rev ? 0 : -50, duration: rev ? 34 : 28, ease: 'none', repeat: -1 });
    });
    var speed = { v: 1 }, dir = 1;
    function spin() { loops.forEach(function (l) { l.timeScale(speed.v * dir); }); }
    gsap.ticker.add(spin);
    ScrollTrigger.create({
      trigger: '.marquee-sec', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        dir = self.direction;
        gsap.fromTo(speed, { v: 1 + Math.min(6, Math.abs(self.getVelocity()) / 300) }, { v: 1, duration: .9, ease: 'power2.out', overwrite: true });
      }
    });

    /* ---------- Section reveals ---------- */
    $$('.eyebrow').forEach(function (e) {
      gsap.from(e, { '--ln': 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: e, start: 'top 90%' } });
    });
    $$('.chapter .n').forEach(function (n) {
      gsap.from(n, { scale: 0, rotation: -200, duration: .9, ease: 'back.out(2.2)', scrollTrigger: { trigger: n, start: 'top 88%' } });
    });
    $$('section h2').forEach(function (h) {
      if (!hasSplit) { gsap.from(h, { y: 40, autoAlpha: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }); return; }
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 105, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: h, start: 'top 88%' } });
        }
      });
    });
    ScrollTrigger.batch('.prose > p:not(.closing), .checks li, .card, .structure li', {
      start: 'top 92%', once: true,
      onEnter: function (els) { gsap.from(els, { y: 32, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .08, clearProps: 'transform' }); }
    });
    ScrollTrigger.batch('.asset', {
      start: 'top 92%', once: true,
      onEnter: function (els) { gsap.from(els, { y: 70, autoAlpha: 0, rotation: function (i) { return i % 2 ? 2 : -2; }, duration: 1, ease: 'expo.out', stagger: .1, clearProps: 'transform' }); }
    });

    /* Brand: swatches wipe in, type weight breathes with scroll */
    gsap.from('.swatch', { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'expo.inOut', stagger: .12, clearProps: 'clipPath', scrollTrigger: { trigger: '.palette', start: 'top 85%' } });
    $$('.type .big').forEach(function (a) {
      gsap.fromTo(a, { fontWeight: 200 }, { fontWeight: 800, ease: 'none', scrollTrigger: { trigger: a, start: 'top 95%', end: 'top 45%', scrub: true } });
    });
    gsap.from('#brand .slot', { scale: .92, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#brand .slot', start: 'top 88%' } });

    /* ---------- Website: list drives the browser mock ---------- */
    var screen = $('.screen'), inner = $('.screen-inner');
    var blocks = $$('.w', inner), steps = $$('.structure li');
    if (c.desktop) {
      var go = gsap.quickTo(inner, 'y', { duration: .8, ease: 'power3.inOut' });
      steps.forEach(function (li, i) {
        ScrollTrigger.create({
          trigger: li, start: 'top 60%', end: 'bottom 60%',
          onToggle: function (self) {
            if (!self.isActive) { li.classList.remove('on'); return; }
            steps.forEach(function (s) { s.classList.toggle('on', s === li); });
            blocks.forEach(function (w, j) { w.classList.toggle('on', j === i); });
            var max = inner.scrollHeight - screen.clientHeight;
            go(-Math.min(max, Math.max(0, blocks[i].offsetTop - 14)));
          }
        });
      });
    } else {
      gsap.to(inner, {
        y: function () { return -(inner.scrollHeight - screen.clientHeight); },
        ease: 'none',
        scrollTrigger: { trigger: screen, start: 'top 75%', end: 'bottom 25%', scrub: true, invalidateOnRefresh: true }
      });
    }
    gsap.from('.browser', { y: 80, rotationX: 12, transformPerspective: 1200, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.browser', start: 'top 85%' } });

    /* ---------- On-site: badges swing in on their lanyards ---------- */
    var badges = $$('.badges img');
    gsap.from(badges, {
      y: -120, rotation: function (i) { return i ? 14 : -14; }, autoAlpha: 0, transformOrigin: '50% 0%',
      duration: 1.8, ease: 'elastic.out(1,.45)', stagger: .15,
      scrollTrigger: { trigger: '.badges', start: 'top 85%' }
    });
    if (c.hover) {
      badges.forEach(function (img) {
        var rx = gsap.quickTo(img, 'rotationX', { duration: .5, ease: 'power3' });
        var ry = gsap.quickTo(img, 'rotationY', { duration: .5, ease: 'power3' });
        img.addEventListener('mousemove', function (e) {
          var r = img.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - .5) * 22);
          rx(((e.clientY - r.top) / r.height - .5) * -22);
        });
        img.addEventListener('mouseleave', function () { rx(0); ry(0); });
      });
    }

    /* ---------- LinkedIn: post tiles deal out from a stack ---------- */
    var tiles = $$('#linkedin .assets .slot');
    if (tiles.length) {
      var grid = tiles[0].parentNode;
      gsap.from(tiles, {
        x: function (i, el) { var g = grid.getBoundingClientRect(), r = el.getBoundingClientRect(); return (g.left + g.width / 2) - (r.left + r.width / 2); },
        y: function (i, el) { var g = grid.getBoundingClientRect(), r = el.getBoundingClientRect(); return (g.top + g.height / 2) - (r.top + r.height / 2); },
        rotation: function (i) { return [-10, 6, -4, 9][i % 4]; },
        scale: .85, ease: 'power2.out', stagger: .04,
        scrollTrigger: { trigger: grid, start: 'top 90%', end: 'top 35%', scrub: .6, invalidateOnRefresh: true }
      });
    }

    /* ---------- Video: frame opens up ---------- */
    gsap.from('.video-slot', { clipPath: 'inset(18% 22% 18% 22% round 24px)', ease: 'none', scrollTrigger: { trigger: '.video-slot', start: 'top 95%', end: 'center 55%', scrub: true } });

    /* ---------- Timeline: line draws, stars pop as they are reached ---------- */
    var tl = $('.timeline');
    gsap.fromTo(tl, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 70%', end: 'bottom 70%', scrub: true } });
    $$('li', tl).forEach(function (li) {
      gsap.from(li.children, { x: -24, autoAlpha: 0, duration: .6, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: li, start: 'top 72%' } });
      ScrollTrigger.create({ trigger: li, start: 'top 70%',
        onEnter: function () { li.classList.add('reached'); }, onLeaveBack: function () { li.classList.remove('reached'); } });
    });

    /* ---------- Results: count up ---------- */
    $$('[data-count]').forEach(function (b) {
      var end = +b.dataset.count, pre = b.dataset.prefix || '', o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 88%' },
        onUpdate: function () { b.textContent = pre + Math.round(o.v); } });
    });
    gsap.from('.stat', { y: 30, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

    /* ---------- Quote and closing line read in ---------- */
    if (hasSplit) {
      ['blockquote', '.closing span'].forEach(function (sel) {
        var t = $(sel); if (!t) return;
        SplitText.create(t, { type: 'words', autoSplit: true, onSplit: function (self) {
          return gsap.from(self.words, { opacity: .15, stagger: .05, ease: 'none', scrollTrigger: { trigger: t, start: 'top 85%', end: 'bottom 55%', scrub: true } });
        } });
      });
    }

    /* ---------- Magnetic CTA ---------- */
    var cta = $('.cta');
    gsap.from(cta, { y: 30, autoAlpha: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: cta, start: 'top 95%' } });
    if (c.hover && cta) {
      var cx = gsap.quickTo(cta, 'x', { duration: .4, ease: 'power3' });
      var cy = gsap.quickTo(cta, 'y', { duration: .4, ease: 'power3' });
      cta.addEventListener('mousemove', function (e) {
        var r = cta.getBoundingClientRect();
        cx((e.clientX - r.left - r.width / 2) * .3);
        cy((e.clientY - r.top - r.height / 2) * .4);
      });
      cta.addEventListener('mouseleave', function () { cx(0); cy(0); });
    }

    return function () { gsap.ticker.remove(spin); dropLoader(); };
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
