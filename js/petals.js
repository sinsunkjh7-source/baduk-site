/* ============================================================
   바둑스쿨 홈 - 꽃잎 낙하 모션
   - 캔버스 1장에 꽃잎 24개, 스프라이트 미리 렌더
   - 클릭/스크롤 방해 없음 (pointer-events: none)
   - 앱 화면(사이드바 있음)에서는 자동 정지
   - 탭 숨김 / prefers-reduced-motion 시 정지
   ============================================================ */
(function () {
  var canvas = document.getElementById('bk-petals');
  if (!canvas) return;

  /* 랜딩 래퍼가 position:fixed + z-index:1000 으로 화면 전체를 덮고 있어
     body에 둔 캔버스는 그 아래로 깔린다. 래퍼 안으로 옮겨
     헤더(z 20) 아래, 랜딩 콘텐츠 위에 놓는다. */
  var landing = document.querySelector('.ck-landing-wrapper');
  if (landing && canvas.parentElement !== landing) landing.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var W = 0, H = 0;

  /* 히어로 일러스트의 꽃나무에서 추출한 색 */
  var COLORS = [
    ['#FCB4CC', '#F078A8'],
    ['#FCC0CC', '#E490C0'],
    ['#F090C0', '#F078A8'],
    ['#FCD8E4', '#E490C0']
  ];

  var sprites = (function () {
    var out = [];
    COLORS.forEach(function (pair, i) {
      var s = 64;
      var cv = document.createElement('canvas');
      cv.width = cv.height = s * dpr;
      var g = cv.getContext('2d');
      g.scale(dpr, dpr);
      g.translate(s / 2, s / 2);
      g.rotate((i * Math.PI) / 7);
      var grad = g.createLinearGradient(-14, -8, 14, 10);
      grad.addColorStop(0, pair[0]);
      grad.addColorStop(1, pair[1]);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, -16);
      g.bezierCurveTo(14, -12, 16, 6, 0, 16);
      g.bezierCurveTo(-16, 6, -14, -12, 0, -16);
      g.fill();
      g.globalAlpha = 0.6;
      g.strokeStyle = '#ffffff';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(0, -13);
      g.quadraticCurveTo(4, 0, 0, 13);
      g.stroke();
      out.push(cv);
    });
    return out;
  })();

  function Petal(initial, slot) { this.reset(initial, slot); }
  Petal.prototype.reset = function (initial, slot) {
    /* 초기 배치: 화면을 가로로 COUNT 등분한 칸마다 하나씩 (한쪽에 몰리지 않게)
       이후 재생성은 완전 랜덤 */
    if (initial && slot != null && COUNT > 0) {
      var cell = W / COUNT;
      this.baseX = cell * (slot + 0.5) + (Math.random() - 0.5) * cell * 0.7;
      /* y는 x와 무관하게 완전 랜덤 (같이 늘리면 대각선으로 줄 서서 한쪽만 보임) */
      this.y = Math.random() * H;
    } else {
      /* 재생성도 칸을 돌아가며 배치 → 시간이 지나도 한쪽에 몰리지 않음 */
      var cell2 = W / Math.max(1, COUNT);
      this.baseX = cell2 * ((spawnSlot++ % Math.max(1, COUNT)) + 0.5) + (Math.random() - 0.5) * cell2 * 0.7;
      this.y = initial ? Math.random() * H : -40;
    }
    this.x = this.baseX;
    this.size = 11 + Math.random() * 9;
    this.speed = 12 + Math.random() * 14;
    this.sway = 22 + Math.random() * 30;
    this.swaySpeed = 0.4 + Math.random() * 0.6;
    this.phase = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.9;
    this.angle = Math.random() * Math.PI * 2;
    this.alpha = 0.86 + Math.random() * 0.12;
    this.sprite = sprites[(Math.random() * sprites.length) | 0];
  };
  Petal.prototype.step = function (dt) {
    this.y += this.speed * dt;
    this.phase += this.swaySpeed * dt;
    this.angle += this.spin * dt;
    this.x = this.baseX + Math.sin(this.phase) * this.sway;
    if (this.y > H + 40) this.reset(false);
  };
  Petal.prototype.draw = function () {
    var s = this.size * 2.1;
    /* setTransform 은 DPR 스케일까지 덮어써서 HiDPI 화면에서 좌상단으로 압축됐다.
       save/translate/rotate 로 바꿔 DPR 스케일을 유지한다. */
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(this.sprite, -s / 2, -s / 2, s, s);
    ctx.restore();
  };

  var COUNT = 24;   /* resize()에서 화면 폭에 맞게 재계산 */
  var spawnSlot = 0; /* 재생성 시 칸 순환용 */
  var petals = [];

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    /* 화면 폭에 맞춰 개수 결정 (넓을수록 촘촘히) */
    var want = Math.max(14, Math.min(30, Math.round(W / 56)));
    if (petals.length !== want) {
      COUNT = want;
      petals = [];
      for (var i = 0; i < COUNT; i++) petals.push(new Petal(true, i));
    }
  }
  window.addEventListener('resize', resize);
  resize();

  /* 앱 화면 판별: 화면 중앙에 실제로 보이는 요소가 앱 셸 안에 있으면 앱 모드
     (홈과 앱이 DOM에 동시에 존재하고 앱이 위를 덮는 구조라 존재 여부로는 판별 불가) */
  function inApp() {
    var el = document.elementFromPoint(
      Math.round(window.innerWidth / 2),
      Math.round(window.innerHeight / 2)
    );
    return !!(el && el.closest && el.closest('.ck-app-shell'));
  }

  var last = performance.now();
  var paused = false;
  var tick = 0;
  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
    last = performance.now();
  });

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    /* 30프레임마다 앱 화면인지 확인 → 앱에서는 그리지 않음 */
    if (tick++ % 30 === 0) {
      var hide = inApp() || reduce.matches;
      canvas.style.display = hide ? 'none' : 'block';
    }
    if (!paused && canvas.style.display !== 'none') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < petals.length; i++) {
        petals[i].step(dt);
        petals[i].draw();
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
