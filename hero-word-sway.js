/* 히어로 '바둑' 글자 좌우 흔들림
   - 배경을 건드리지 않고, 글자 주변 패치를 그대로 겹쳐 좌우로만 이동
   - 발광 레이어(.bks-title-gold)도 같은 값으로 이동해 어긋나지 않게 함 */
(() => {
  'use strict';
  const V = 'word-sway-2';
  const root = (document.currentScript && document.currentScript.src) || location.href;

  const SW = 3344, SH = 1320;
  const BOX = { x: 1020, y: 6, w: 352, h: 202 };
  const PERIOD = 3.6;          // 한 번 왕복 3.6초
  const AMP_RATIO = 0.038;      // 패치 폭의 3.8% (화면에서 ±4~5px)

  async function boot() {
    const im = document.querySelector('.hero-art');
    const hero = im && im.parentElement;
    const home = document.getElementById('home-screen');
    if (!im || !hero) return;

    if (window.BKSWordSway && window.BKSWordSway.destroy) window.BKSWordSway.destroy();

    const el = new Image();
    el.alt = '';
    el.setAttribute('aria-hidden', 'true');
    el.draggable = false;
    el.className = 'bks-word-sway';
    el.style.cssText = 'position:absolute;pointer-events:none;user-select:none;z-index:2;will-change:transform';
    el.src = new URL('assets/hero-word-sway.png?v=' + V, root).href;

    await new Promise((res, rej) => { el.onload = res; el.onerror = () => rej(Error('word patch load fail')); });
    if (!im.complete) await new Promise(r => im.addEventListener('load', r, { once: true }));
    hero.append(el);

    let visible = true, disposed = false, raf = 0, clock = 0, last = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');

    function glow() { return document.querySelector('.bks-title-gold'); }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      clock += (now - last) / 1000;
      last = now;

      const w = el.getBoundingClientRect().width || 1;
      const amp = w * AMP_RATIO;
      const dx = Math.sin((clock / PERIOD) * Math.PI * 2) * amp;
      const tf = 'translate3d(' + dx.toFixed(2) + 'px,0,0)';

      el.style.transform = tf;
      const g = glow();
      if (g) g.style.transform = tf;

      raf = setTimeout(tick, 33);
    }

    function sync() {
      if (disposed) return;
      const r = im.getBoundingClientRect();
      el.style.left = im.offsetLeft + r.width * BOX.x / SW + 'px';
      el.style.top = im.offsetTop + r.height * BOX.y / SH + 'px';
      el.style.width = r.width * BOX.w / SW + 'px';
      el.style.height = r.height * BOX.h / SH + 'px';

      const paused = document.hidden || !visible || !!(home && home.hidden) || reduce.matches;
      if (paused) {
        if (raf) { clearTimeout(raf); raf = 0; }
        el.style.transform = 'none';
        const g = glow();
        if (g) g.style.transform = 'none';
      } else if (!raf) {
        last = performance.now();
        tick();
      }
    }

    const ro = new ResizeObserver(sync);
    ro.observe(im);
    const io = new IntersectionObserver(e => { visible = e[0].isIntersecting; sync(); }, { threshold: 0 });
    io.observe(im);
    const mo = new MutationObserver(sync);
    if (home) mo.observe(home, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });

    sync();

    window.BKSWordSway = {
      version: V,
      status: () => ({ version: V, ready: true, amp: el.getBoundingClientRect().width * AMP_RATIO, period: PERIOD }),
      destroy: () => {
        disposed = true;
        if (raf) clearTimeout(raf);
        try { ro.disconnect(); io.disconnect(); mo.disconnect(); } catch (e) {}
        el.remove();
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
