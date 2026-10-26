/* ============================================================
   바둑스쿨 홈 - 폭포 물 흐름
   히어로 그림 위에 캔버스 1장을 얹고, 물 영역만 마스크로 잘라
   물줄기(띠 + 가는 줄기)를 흘린다.
   - 물 마스크: masks/wf1.png, masks/wf2.png (그림에서 추출)
   - 히어로가 화면에 보일 때만 동작 (IntersectionObserver)
   - 탭 숨김 / prefers-reduced-motion 시 정지
   - pointer-events: none (클릭 방해 없음)
   ============================================================ */
(function () {
  window.__bkWaterVersion = 5;   /* 코드 버전 확인용 */
  var canvas = document.getElementById('bk-water');
  if (!canvas) return;
  var hero = canvas.closest('.bk-hero');
  var img = hero ? hero.querySelector('.bk-hero__img') : null;
  if (!hero || !img) return;

  var ctx = canvas.getContext('2d');
  var SRC_W = 3344, SRC_H = 1320;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* 그림 좌표 박스 + 마스크 */
  var FALLS = [
    { x: 580, y: 360, w: 160, h: 250, mask: 'masks/wf1.png', n: 30 },
    { x: 2370, y: 400, w: 190, h: 220, mask: 'masks/wf2.png', n: 26 },
    { x: 2560, y: 630, w: 240, h: 200, mask: 'masks/wf3.png', n: 46, boost: 1.7,
      start: 0.22, curve: 0.166, straight: true, lenMin: 0.35, lenMax: 0.70, wide: 1.8,
      noBands: true }
  ];

  var W = 0, H = 0, sx = 1, sy = 1;
  var items = [];

  function makeStreaks(fall) {
    var out = { bands: [], fines: [] };
    for (var i = 0; i < 7; i++) {
      out.bands.push({
        u: (i + 0.5) / 7 + (Math.random() - 0.5) * 0.05,
        w: 0.05 + Math.random() * 0.07,
        speed: 0.35 + Math.random() * 0.5,
        phase: Math.random(),
        alpha: 0.20 + Math.random() * 0.18,
        kind: i % 3 === 0 ? 'blue' : 'white'
      });
    }
    var lenMin = fall.lenMin != null ? fall.lenMin : 0.10;
    var lenMax = fall.lenMax != null ? fall.lenMax : 0.36;
    for (var j = 0; j < fall.n; j++) {
      out.fines.push({
        u: Math.random(),
        w: 0.014 + Math.random() * 0.022,
        speed: 0.55 + Math.random() * 0.75,
        y: Math.random(),
        len: lenMin + Math.random() * (lenMax - lenMin),
        alpha: 0.32 + Math.random() * 0.28
      });
    }
    return out;
  }

  items = FALLS.map(function (f) {
    var off = document.createElement('canvas');
    var maskImg = new Image();
    maskImg.src = f.mask;
    return { cfg: f, off: off, octx: off.getContext('2d'), mask: maskImg, st: makeStreaks(f) };
  });

  function resize() {
    var r = img.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    sx = W / SRC_W; sy = H / SRC_H;
    items.forEach(function (it) {
      it.cw = Math.max(2, Math.round(it.cfg.w * sx));
      it.ch = Math.max(2, Math.round(it.cfg.h * sy));
      it.off.width = it.cw * dpr;
      it.off.height = it.ch * dpr;
    });
  }

  var last = performance.now(), t = 0;
  var visible = false, paused = false, hidden = false, tick = 0;

  /* 앱 화면이 히어로 위를 덮고 있으면 그리지 않는다
     (랜딩과 앱이 DOM에 동시에 있고 앱이 위를 덮는 구조라 가시성으로는 판별 불가) */
  function appShowing() {
    var el = document.elementFromPoint(
      Math.round(window.innerWidth / 2),
      Math.round(window.innerHeight / 2)
    );
    return !!(el && el.closest && el.closest('.ck-app-shell'));
  }

  function drawFall(it, T) {
    var o = it.octx, cw = it.cw, ch = it.ch;
    var boost = it.cfg.boost || 1;
    var curve = it.cfg.curve || 0;          /* 상단 기울기(rad) — 아래로 갈수록 수직에 가까워짐 */
    o.setTransform(dpr, 0, 0, dpr, 0, 0);
    o.clearRect(0, 0, cw, ch);

    var H2 = ch * 1.7, yOff = -ch * 0.35;

    /* 1) 부드러운 물결 띠 (noBands면 생략 — 세로로 곧게 보이는 원인) */
    if (!it.cfg.noBands) it.st.bands.forEach(function (b) {
      var y = yOff + ((b.phase + T * b.speed) % 1) * H2;
      var bw = b.w * cw;
      var dxTop = Math.tan(curve) * ch * 0.6;
      var g = o.createLinearGradient(0, y - ch * 0.35, 0, y + ch * 0.35);
      var col = b.kind === 'blue' ? '92,150,196' : '255,255,255';
      g.addColorStop(0, 'rgba(' + col + ',0)');
      g.addColorStop(0.5, 'rgba(' + col + ',' + Math.min(0.75, b.alpha * boost) + ')');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      o.fillStyle = g;
      o.save();
      o.translate(dxTop * 0.3, 0);
      o.fillRect(b.u * cw - bw / 2, y - ch * 0.35, bw, ch * 0.7);
      o.restore();
    });

    /* 2) 가는 줄기 — 모양은 / , 이동도 / 방향(아래로 가며 왼쪽으로) */
    var tanC = Math.tan(curve);
    it.st.fines.forEach(function (s) {
      var vdt = s.speed * 0.016;                 /* 세로 이동량(ch 단위) */
      s.y += vdt;
      s.u -= (tanC * vdt * ch) / Math.max(1, cw); /* 같은 기울기를 따라 왼쪽으로 */
      if (s.y - s.len > 1.35) { s.y = -s.len; s.u = Math.random(); }
      if (s.u < -0.25) s.u += 1.5;
      if (s.u > 1.25) s.u -= 1.5;

      var yy = yOff + s.y * H2;
      var len = s.len * ch;
      var x = s.u * cw;
      var topDx = tanC * len;                    /* 위가 오른쪽, 아래가 왼쪽 = / */
      var gg = o.createLinearGradient(0, yy, 0, yy + len);
      gg.addColorStop(0, 'rgba(255,255,255,0)');
      gg.addColorStop(0.4, 'rgba(255,255,255,' + Math.min(0.9, s.alpha * boost) + ')');
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      o.strokeStyle = gg;
      var wide = it.cfg.wide || 1;
      o.lineWidth = Math.max(1.2 * wide, s.w * cw * wide);
      o.lineCap = 'round';
      o.beginPath();
      o.moveTo(x + topDx, yy);
      o.lineTo(x, yy + len);
      o.stroke();
    });

    /* 3) 왼쪽 굵은 물줄기 — 자체 시작점, 같은 곡선 흐름 */
    if (it.cfg.lead) {
      var L = it.cfg.lead;
      var lx = (L.x != null ? L.x : 0.14) * cw;
      var lw = (L.width || 0.16) * cw;
      var ls = (L.start || 0) * ch;
      var lg = o.createLinearGradient(0, ls, 0, ch);
      lg.addColorStop(0, 'rgba(255,255,255,' + (L.alpha * 0.55) + ')');
      lg.addColorStop(0.3, 'rgba(255,255,255,' + L.alpha + ')');
      lg.addColorStop(1, 'rgba(255,255,255,' + (L.alpha * 0.65) + ')');
      var lBot = Math.tan(curve) * (ch - ls);
      var lTop = it.cfg.straight ? 0 : lBot * 0.45;
      o.strokeStyle = lg;
      o.lineWidth = lw;
      o.lineCap = 'round';
      o.beginPath();
      o.moveTo(lx + lTop, ls);
      o.quadraticCurveTo(lx + lBot * 0.9, ls + (ch - ls) * 0.5, lx + lBot, ch);
      o.stroke();
    }

    /* 4) 시작점 위는 비운다 */
    if (it.cfg.start) o.clearRect(0, 0, cw, it.cfg.start * ch);

    /* 4-b) 스크롤 모드: 그림의 물 텍스처를 흘려보낸다 (인공 선 없이 자연스러움) */
    if (it.cfg.mode === 'scroll') {
      var ang = it.cfg.angle || 0;                  /* +면 윗부분이 오른쪽으로 기움 */
      var spd = it.cfg.scrollSpeed || 24;           /* 그림 px/sec */
      var Hh = it.cfg.h;
      var ph = ((T * spd) / Hh) % 1;
      var cut = ph * Hh;
      var tanA = Math.tan(ang);

      o.save();
      /* 아래로 갈수록 덜 기울도록: 윗부분이 오른쪽으로 tanA*ch 만큼 이동 */
      o.transform(1, 0, -tanA, 1, tanA * ch, 0);
      o.globalAlpha = it.cfg.scrollAlpha != null ? it.cfg.scrollAlpha : 0.5;

      /* 한 주기를 두 조각으로 이어붙여 끊김 없이 반복 */
      var d1 = (Hh - cut) * sy;
      if (d1 > 0.5) o.drawImage(img, it.cfg.x, it.cfg.y + cut, it.cfg.w, Hh - cut, 0, 0, cw, d1);
      if (cut > 0.5) o.drawImage(img, it.cfg.x, it.cfg.y, it.cfg.w, cut, 0, d1, cw, ch - d1);

      o.restore();
      o.globalAlpha = 1;
    }

    /* 5) 물 마스크 */
    o.globalCompositeOperation = 'destination-in';
    o.drawImage(it.mask, 0, 0, cw, ch);
    o.globalCompositeOperation = 'source-over';

    ctx.drawImage(it.off, it.cfg.x * sx, it.cfg.y * sy, cw, ch);
  }

  /* 코드 버전 확인용 */
  window.__bkWaterDebug = function () {
    var it = items[items.length - 1];
    if (!it || !it.st) return null;
    return it.st.fines.slice(0, 4).map(function (s) {
      return { u: +s.u.toFixed(3), y: +s.y.toFixed(3) };
    });
  };

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    if (tick++ % 30 === 0) {
      hidden = appShowing() || reduce.matches;
      canvas.style.display = hidden ? 'none' : 'block';
    }

    if (!hidden) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      items.forEach(function (it) { if (it.mask.complete) drawFall(it, t); });
    }

    if (visible && !paused) requestAnimationFrame(frame);
  }

  function start() {
    last = performance.now();
    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
    if (!paused && visible) start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var was = visible;
        visible = e.isIntersecting;
        if (visible && !was && !paused) start();
      });
    }, { threshold: 0.05 }).observe(hero);
  } else {
    visible = true;
    start();
  }

  if (img.complete && img.naturalWidth) resize();
  else img.addEventListener('load', resize);
  window.addEventListener('resize', resize);
})();
