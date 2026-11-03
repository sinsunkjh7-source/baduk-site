/* 우주 항해 — three.js 3D 회피 게임
   카메라는 우주선 조종석, 운석이 앞에서 날아온다. */
(function () {
  'use strict';

  var canvas = document.getElementById('gl');
  var stage = document.getElementById('stage');
  var el = {
    speed: document.getElementById('speed'),
    dist: document.getElementById('dist'),
    best: document.getElementById('best'),
    shield: document.getElementById('shieldBox'),
    alert: document.getElementById('alert'),
    flash: document.getElementById('flash'),
    start: document.getElementById('startPanel'),
    over: document.getElementById('overPanel'),
    final: document.getElementById('finalDist'),
    record: document.getElementById('recordText')
  };

  var renderer, scene, camera, clock;
  var stars, starPos, asteroids = [];
  var state = {
    running: false, dead: false, speed: 42, dist: 0, shield: 3,
    targetX: 0, targetY: 0, posX: 0, posY: 0, roll: 0,
    shake: 0, invuln: 0, t: 0, best: 0
  };
  var BOUND_X = 9.5, BOUND_Y = 5.2;

  var keys = Object.create(null);

  try { state.best = +(localStorage.getItem('bks.space.best') || 0); } catch (e) {}
  el.best.textContent = Math.round(state.best);

  /* ---------- 초기화 ---------- */
  function init() {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x04070f, 1);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04070f, 0.0024);

    camera = new THREE.PerspectiveCamera(72, 1, 0.1, 900);
    camera.position.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x93b7d8, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(-4, 6, 3);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x3fa6ff, 0.65);
    rim.position.set(5, -3, -6);
    scene.add(rim);

    buildStars();
    buildAsteroids();
    resize();
    window.addEventListener('resize', resize);
    bindInput();
    clock = new THREE.Clock();
    animate();
  }

  function buildStars() {
    var N = 1400;
    starPos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 320;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 190;
      starPos[i * 3 + 2] = -Math.random() * 700;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    stars = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xdcefff, size: 2.4, sizeAttenuation: true, transparent: true,
      opacity: 0.95, depthWrite: false, map: dotTexture(), alphaTest: 0.06
    }));
    scene.add(stars);
    buildStreaks();
  }

  function dotTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var x = c.getContext('2d');
    var grd = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(220,240,255,.85)');
    grd.addColorStop(1, 'rgba(200,230,255,0)');
    x.fillStyle = grd;
    x.beginPath(); x.arc(16, 16, 16, 0, 6.283); x.fill();
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace || undefined;
    return t;
  }

  var streaks = null, streakData = null;
  function buildStreaks() {
    var N = 90;
    streakData = [];
    var pos = new Float32Array(N * 6);
    for (var i = 0; i < N; i++) {
      var x = (Math.random() - 0.5) * 70, y = (Math.random() - 0.5) * 46, z = -Math.random() * 260;
      streakData.push({ x: x, y: y, z: z, len: 3 + Math.random() * 7 });
      pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x; pos[i * 6 + 4] = y; pos[i * 6 + 5] = z - 4;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    streaks = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: 0x9ed8ff, transparent: true, opacity: 0.5, depthWrite: false
    }));
    scene.add(streaks);
  }

  function buildAsteroids() {
    var geos = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.DodecahedronGeometry(1, 0)
    ];
    var mat = new THREE.MeshStandardMaterial({
      color: 0x8b94a0, roughness: 0.88, metalness: 0.08, flatShading: true
    });
    for (var i = 0; i < 42; i++) {
      var m = new THREE.Mesh(geos[i % geos.length], mat);
      m.visible = false;
      scene.add(m);
      asteroids.push({ mesh: m, active: false, radius: 1, spin: new THREE.Vector3() });
    }
  }

  function spawnAsteroid(a) {
    var r = 1.5 + Math.random() * 3.2;
    a.mesh.scale.setScalar(r);
    a.mesh.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 17,
      -120 - Math.random() * 150
    );
    a.mesh.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    a.spin.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9);
    a.radius = r;
    a.active = true;
    a.mesh.visible = true;
  }

  function resize() {
    if (!renderer) return;
    var w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }

  /* ---------- 입력 ---------- */
  function bindInput() {
    var dragging = false, lastX = 0, lastY = 0;

    function pointerToWorld(cx, cy) {
      var r = stage.getBoundingClientRect();
      var nx = ((cx - r.left) / r.width) * 2 - 1;
      var ny = ((cy - r.top) / r.height) * 2 - 1;
      state.targetX = THREE.MathUtils.clamp(nx * BOUND_X, -BOUND_X, BOUND_X);
      state.targetY = THREE.MathUtils.clamp(-ny * BOUND_Y, -BOUND_Y, BOUND_Y);
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.panel') || e.target.closest('button')) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      pointerToWorld(e.clientX, e.clientY);
      stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (dragging) pointerToWorld(e.clientX, e.clientY);
    });
    stage.addEventListener('pointerup', function () { dragging = false; });
    stage.addEventListener('pointercancel', function () { dragging = false; });

    document.querySelectorAll('.panel').forEach(function (p) {
      p.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    });

    window.addEventListener('keydown', function (e) {
      keys[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(e.key.toLowerCase()) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

    var btnStart = document.getElementById('btnStart');
    var btnRetry = document.getElementById('btnRetry');
    if (btnStart) {
      btnStart.addEventListener('click', start);
      btnStart.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }
    if (btnRetry) {
      btnRetry.addEventListener('click', start);
      btnRetry.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clock && clock.getDelta();
    });
  }

  function readKeys(dt) {
    var kx = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
    var ky = (keys['arrowup'] || keys['w'] ? 1 : 0) - (keys['arrowdown'] || keys['s'] ? 1 : 0);
    if (kx || ky) {
      state.targetX = THREE.MathUtils.clamp(state.targetX + kx * dt * 14, -BOUND_X, BOUND_X);
      state.targetY = THREE.MathUtils.clamp(state.targetY + ky * dt * 9, -BOUND_Y, BOUND_Y);
    }
  }

  /* ---------- 게임 진행 ---------- */
  window.__spaceStart = start;
  function start() {
    state.running = true; state.dead = false;
    state.speed = 42; state.dist = 0; state.shield = 3;
    state.posX = state.targetX = 0; state.posY = state.targetY = 0;
    state.shake = 0; state.invuln = 0; state.t = 0;
    asteroids.forEach(function (a) { a.active = false; a.mesh.visible = false; });
    el.start.hidden = true; el.over.hidden = true;
    updateShield();
  }

  function updateShield() {
    var segs = el.shield.querySelectorAll('.seg');
    for (var i = 0; i < segs.length; i++) {
      segs[i].classList.toggle('on', i < state.shield);
      segs[i].classList.toggle('broken', i >= state.shield);
    }
  }

  function hit(a) {
    if (state.invuln > 0) return;
    state.shield -= 1;
    state.invuln = 1.1;
    state.shake = 1;
    state.speed = Math.max(26, state.speed * 0.72);
    updateShield();
    el.flash.classList.add('hit');
    setTimeout(function () { el.flash.classList.remove('hit'); }, 140);
    a.active = false; a.mesh.visible = false;
    if (state.shield <= 0) gameOver();
  }

  function gameOver() {
    state.running = false; state.dead = true;
    var km = Math.round(state.dist);
    el.final.textContent = km.toLocaleString('ko-KR');
    if (km > state.best) {
      state.best = km;
      try { localStorage.setItem('bks.space.best', String(km)); } catch (e) {}
      el.record.textContent = '신기록!';
    } else {
      el.record.textContent = '최고 기록 ' + Math.round(state.best).toLocaleString('ko-KR') + ' km';
    }
    el.best.textContent = Math.round(state.best).toLocaleString('ko-KR');
    el.over.hidden = false;
  }

  /* ---------- 루프 ---------- */
  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);

    if (state.running) {
      readKeys(dt);
      state.t += dt;
      state.speed = Math.min(110, state.speed + dt * 1.6);
      state.dist += state.speed * dt * 0.55;
      state.invuln = Math.max(0, state.invuln - dt);

      el.speed.textContent = Math.round(state.speed);
      el.dist.textContent = Math.round(state.dist).toLocaleString('ko-KR');
    }

    // 조종(부드럽게 따라가기)
    var ease = 1 - Math.pow(0.0015, dt);
    state.posX += (state.targetX - state.posX) * ease;
    state.posY += (state.targetY - state.posY) * ease;
    state.roll += ((state.targetX - state.posX) * -0.06 - state.roll) * Math.min(1, dt * 6);

    // 흔들림
    state.shake = Math.max(0, state.shake - dt * 2.2);
    var sh = state.shake * state.shake;

    camera.position.x = state.posX * 0.28 + (Math.random() - 0.5) * sh * 1.4;
    camera.position.y = state.posY * 0.26 + (Math.random() - 0.5) * sh * 1.4;
    camera.rotation.z = state.roll + (Math.random() - 0.5) * sh * 0.06;
    camera.rotation.y = -state.posX * 0.012;
    camera.rotation.x = state.posY * 0.008;

    // 별 이동
    if (stars) {
      var sp = state.running ? state.speed : 8;
      var arr = stars.geometry.attributes.position.array;
      for (var i = 2; i < arr.length; i += 3) {
        arr[i] += sp * dt * (1 + (i % 7) * 0.02);
        if (arr[i] > 12) arr[i] -= 720;
      }
      stars.geometry.attributes.position.needsUpdate = true;
    }

    if (streaks) {
      var sa = streaks.geometry.attributes.position.array;
      var spd = state.running ? state.speed : 10;
      for (var si = 0; si < streakData.length; si++) {
        var sd = streakData[si];
        sd.z += spd * dt * 1.5;
        if (sd.z > 10) { sd.z = -260; sd.x = (Math.random() - 0.5) * 70; sd.y = (Math.random() - 0.5) * 46; }
        var L = (0.6 + spd * 0.045) * sd.len;
        sa[si * 6] = sd.x; sa[si * 6 + 1] = sd.y; sa[si * 6 + 2] = sd.z;
        sa[si * 6 + 3] = sd.x; sa[si * 6 + 4] = sd.y; sa[si * 6 + 5] = sd.z - L;
      }
      streaks.geometry.attributes.position.needsUpdate = true;
      streaks.material.opacity = Math.min(0.75, 0.18 + (spd - 30) * 0.01);
    }

    // 운석
    var nearest = 999;
    for (var j = 0; j < asteroids.length; j++) {
      var a = asteroids[j];
      if (!a.active) {
        if (state.running && Math.random() < dt * 3.2) spawnAsteroid(a);
        continue;
      }
      a.mesh.position.z += (state.running ? state.speed : 12) * dt;
      a.mesh.rotation.x += a.spin.x * dt;
      a.mesh.rotation.y += a.spin.y * dt;
      a.mesh.rotation.z += a.spin.z * dt;

      if (a.mesh.position.z > 14) { a.active = false; a.mesh.visible = false; continue; }

      // 충돌: 화면 중심(카메라)과의 거리
      if (state.running && a.mesh.position.z > -6 && a.mesh.position.z < 4) {
        var dx = a.mesh.position.x - state.posX * 0.9;
        var dy = a.mesh.position.y - state.posY * 0.85;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < a.radius * 0.92 + 1.35) hit(a);
        else if (a.mesh.position.z > -60) nearest = Math.min(nearest, d + Math.abs(a.mesh.position.z) * 0.02);
      }
    }

    el.alert.hidden = !(state.running && nearest < 3.4);

    renderer.render(scene, camera);
  }

  /* ---------- 실행 ---------- */
  try {
    if (typeof THREE === 'undefined') throw new Error('THREE missing');
    init();
    document.body.setAttribute('data-space', 'ready');
  } catch (e) {
    document.body.setAttribute('data-space', 'ERR ' + e.message);
    var p = document.getElementById('startPanel');
    if (p) p.innerHTML = '<h2>3D를 시작할 수 없습니다</h2><p>' + e.message + '</p>';
  }

  /* 자체 점검 훅: ?auto=1 → 3초 진행 후 상태 기록 */
  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      start();
      state.targetX = 3.2; state.targetY = -1.4;
      setTimeout(function () {
        document.body.setAttribute('data-space',
          'run=' + state.running + '|dist=' + Math.round(state.dist) +
          '|speed=' + Math.round(state.speed) + '|shield=' + state.shield +
          '|activeAsteroids=' + asteroids.filter(function (a) { return a.active; }).length +
          '|camX=' + camera.position.x.toFixed(2) + '|camY=' + camera.position.y.toFixed(2));
      }, 2600);
    }, 400);
  }
})();
