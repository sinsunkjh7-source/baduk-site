/* 히어로 '바둑' 글자 갸우뚱 — 제자리에서 좌우로 살짝 기울며 위아래로 흔들림
   - 가로 이동 없음(위치 고정), 회전 + 미세 상하 이동만
   - 글자 주변 패치를 겹쳐서 배경을 건드리지 않음
   - 발광 레이어(.bks-title-gold)도 같은 각도로 회전 */
(() => {
  'use strict';
  const V = 'word-tilt-1';
  const root = (document.currentScript && document.currentScript.src) || location.href;

  const SW = 3344, SH = 1320;
  const BOX = { x: 1020, y: 6, w: 352, h: 202 };
  const PERIOD = 2.8;          // 갸우뚱 한 주기
  const TILT_DEG = 2.6;        // 최대 기울기
  const BOB_PX_RATIO = 0.012;  // 패치 높이의 1.2% 상하 흔들림

  async function boot() {
    const im = document.querySelector('.hero-art');
    const hero = im && im.parentElement;
    const home = document.getElementById('home-screen');
    if (!im || !hero) return;

    if (window.BKSWordTilt && window.BKSWordTilt.destroy) window.BKSWordTilt.destroy();

    const el = new Image();
    el.alt = '';
    el.setAttribute('aria-hidden', 'true');
    el.draggable = false;
    el.className = 'bks-word-tilt';
    el.style.cssText = 'position:absolute;pointer-events:none;user-select:none;z-index:2;will-change:transform;transform-origin:50% 50%';
    el.src = new URL('assets/hero-word-tilt.png?v=' + V, root).href;

    await new Promise((res, rej) => { el.onload = res; el.onerror = () => rej(Error('word patch load fail')); });
    if (!im.complete) await new Promise(r => im.addEventListener('load', r, { once: true }));
    hero.append(el);

    let visible = true, disposed = false, raf = 0, clock = 0, last = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');

    function glow() {
      const g = document.querySelector('.bks-title-gold');
      if (g && !g.dataset.tiltOrigin) { g.style.transformOrigin = '49% 45%'; g.dataset.tiltOrigin = '1'; }
      return g;
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      clock += (now - last) / 1000;
      last = now;

      const h = el.getBoundingClientRect().height || 1;
      const phase = Math.sin((clock / PERIOD) * Math.PI * 2);
      const deg = phase * TILT_DEG;
      const dy = phase * h * BOB_PX_RATIO;

      const tf = 'rotate(' + deg.toFixed(2) + 'deg) translateY(' + dy.toFixed(2) + 'px)';
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

    window.BKSWordTilt = {
      version: V,
      status: () => ({ version: V, ready: true, tilt: TILT_DEG, period: PERIOD }),
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
