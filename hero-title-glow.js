/* 히어로 '바둑' 글자 금빛 발광 — 글자 모양 마스크에 금색 레이어를 겹쳐 천천히 빛남 */
(() => {
  'use strict';
  const V = 'gold-20261030';
  const root = (document.currentScript && document.currentScript.src) || location.href;

  async function boot() {
    const im = document.querySelector('.hero-art');
    const hero = im && im.parentElement;
    const home = document.getElementById('home-screen');
    if (!im || !hero) return;

    if (window.BKSTitleGlow && window.BKSTitleGlow.destroy) window.BKSTitleGlow.destroy();

    const el = document.createElement('div');
    el.className = 'bks-title-glow bks-title-gold';
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--gold-src', 'url("' + new URL('hero-title-mask.png?v=' + V, root).href + '")');
    hero.append(el);

    let visible = true, dead = false, timer = 0, t0 = 0, last = 0, clock = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');

    /* 4초 단일 호흡 (6초 → 4초, 1.5배 빠르게) — 색상 유지 */
    function breath(t) {
      const p = t % 4;
      return 0.5 * (0.5 - 0.5 * Math.cos(2 * Math.PI * p / 4));
    }

    function tick() {
      if (dead) return;
      const now = performance.now();
      clock += (now - last) / 1000;
      last = now;
      el.style.opacity = breath(clock).toFixed(3);
      timer = setTimeout(tick, 40);
    }

    function sync() {
      if (dead) return;
      const r = im.getBoundingClientRect();
      el.style.left = im.offsetLeft + r.width * 1000 / 3344 + 'px';
      el.style.top = im.offsetTop + 'px';
      el.style.width = r.width * 400 / 3344 + 'px';
      el.style.height = r.height * 240 / 1320 + 'px';

      const paused = document.hidden || !visible || !!(home && home.hidden) || reduce.matches;
      el.style.visibility = reduce.matches ? 'hidden' : '';

      if (paused) {
        if (timer) { clearTimeout(timer); timer = 0; }
      } else if (!timer) {
        last = performance.now();
        tick();
      }
    }

    const ro = new ResizeObserver(sync);
    ro.observe(im);

    const io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; sync(); }, { threshold: 0 });
    io.observe(im);

    const mo = new MutationObserver(sync);
    if (home) mo.observe(home, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });

    sync();

    window.BKSTitleGlow = {
      destroy: function () {
        dead = true;
        if (timer) { clearTimeout(timer); timer = 0; }
        try { ro.disconnect(); io.disconnect(); mo.disconnect(); } catch (e) {}
        el.remove();
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
