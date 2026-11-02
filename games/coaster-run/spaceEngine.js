/**
 * spaceEngine.js - Three.js 3D 실시간 은하계 우주 롤러코스터 엔진 (3코스)
 * 
 * - 칠흑 같은 암흑 우주 속 4,000개 반짝이는 별빛 (Starfield)
 * - 거대한 고리를 지닌 토성(Saturn)과 신비로운 성운(Nebula) 구름
 * - 사이버 네온 트윈 레일 & 슬리퍼 (Cyberpunk Tron Style)
 * - 관문 앞 초저속 서행 (10 km/h) & 웜홀 포털 진입
 * - 정답 시: 하이퍼스페이스 워프 드라이브 (Warp Drive Star Streaks) 가동! (180~210 km/h)
 * - videoEngine과 100% 동일한 인터페이스로 투명하게 전환
 */
(function(window) {
  'use strict';

  class SpaceCoasterEngine {
    constructor(canvasElement, options = {}) {
      this.canvas = canvasElement;
      this.options = options;

      this.scene = null;
      this.camera = null;
      this.renderer = null;

      // 궤도 및 모션
      this.curve = null;
      this.trackLength = 0;
      this.t = 0.0; // 0.0 ~ 1.0 (궤도 위치)
      this.baseSpeed = 0.00035; // 기본 순항 속도
      this.currentSpeedFactor = 1.0;
      this.targetSpeedFactor = 1.0;

      // 상태 플래그
      this.isPlaying = false;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.isWarping = false;
      this.currentGateIndex = -1;
      this.currentSpeedKm = 0;

      // 관문 지점 (t 기준: 0.0 ~ 1.0)
      this.gatePoints = [
        { t: 0.22, solved: false, id: 0, name: "제1관문: 토성의 고리 웜홀" },
        { t: 0.52, solved: false, id: 1, name: "제2관문: 오리온 성운 코스믹 게이트" },
        { t: 0.82, solved: false, id: 2, name: "제3관문: 블랙홀 탈출 초광속 관문" }
      ];

      // 3D 객체 레퍼런스
      this.starPoints = null;
      this.warpLines = null;
      this.portalRings = [];
      this.saturnGroup = null;
      this.nebulaGroup = null;

      this.initThree();
    }

    initThree() {
      if (!window.THREE || !this.canvas) return;

      const width = this.canvas.clientWidth || window.innerWidth;
      const height = this.canvas.clientHeight || window.innerHeight;

      // 1. 씬 & 카메라
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x020208); // 칠흑 같은 심우주
      this.scene.fog = new THREE.FogExp2(0x02020a, 0.0006);

      this.camera = new THREE.PerspectiveCamera(72, width / height, 0.5, 3500);

      // 2. 렌더러
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // 3. 조명
      const ambientLight = new THREE.AmbientLight(0x223355, 0.8);
      this.scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
      sunLight.position.set(400, 300, 200);
      this.scene.add(sunLight);

      const cyanLight = new THREE.PointLight(0x00ffff, 2, 800);
      cyanLight.position.set(-100, 50, -200);
      this.scene.add(cyanLight);

      const magentaLight = new THREE.PointLight(0xff00aa, 2, 800);
      magentaLight.position.set(100, -50, 400);
      this.scene.add(magentaLight);

      // 4. 구성 요소 생성
      this.createTrack();
      this.createStarfield();
      this.createWarpLines();
      this.createCelestialBodies();
      this.createPortalGates();

      // 리사이즈 핸들러
      window.addEventListener('resize', () => this.onResize());

      // 애니메이션 루프 시작
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    onResize() {
      if (!this.canvas || !this.renderer || !this.camera) return;
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    /**
     * 3D 네온 롤러코스터 궤도 생성 (부드럽고 웅장한 무중력 스플라인)
     */
    createTrack() {
      // 거꾸로 뒤집히지 않고 우주를 유영하는 웅장한 3D 궤적 포인트들
      const controlPoints = [
        new THREE.Vector3(0, 0, 0),          // 0. 발사 기지
        new THREE.Vector3(0, 40, -180),      // 1. 발사 상승
        new THREE.Vector3(50, 90, -360),     // 2. 우주 궤도 진입
        new THREE.Vector3(120, 110, -550),   // 3. 토성 접근 릿지 (제1관문 전)
        new THREE.Vector3(80, 80, -780),     // 4. 토성 고리 통과 급강하
        new THREE.Vector3(-60, 20, -960),    // 5. 저공 우주 유영
        new THREE.Vector3(-180, 40, -1120),  // 6. 에어타임 뱅킹
        new THREE.Vector3(-220, 100, -1350), // 7. 오리온 성운 접근 릿지 (제2관문 전)
        new THREE.Vector3(-150, 30, -1580),  // 8. 성운 가스 급강하
        new THREE.Vector3(0, -30, -1750),    // 9. 심연 밸리
        new THREE.Vector3(160, 20, -1900),   // 10. 대회전 커브
        new THREE.Vector3(220, 90, -2150),   // 11. 블랙홀 관문 접근 (제3관문 전)
        new THREE.Vector3(120, 10, -2400),   // 12. 최종 초광속 다이브
        new THREE.Vector3(-50, -10, -2650),  // 13. 우주 정거장 착륙 진입로
        new THREE.Vector3(-20, 0, -2850)     // 14. 피니시 라인
      ];

      this.curve = new THREE.CatmullRomCurve3(controlPoints);
      this.curve.curveType = 'catmullrom';
      this.curve.tension = 0.5;

      // 트랙 렌더링: 듀얼 네온 레일 (좌/우) & 크로스 슬리퍼
      const railSegments = 400;
      const railPointsLeft = [];
      const railPointsRight = [];
      const railGauge = 2.4; // 궤간 2.4m

      for (let i = 0; i <= railSegments; i++) {
        const u = i / railSegments;
        const pos = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(0, 1, 0); // 상향 벡터
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        const pLeft = new THREE.Vector3().copy(pos).addScaledVector(binormal, -railGauge / 2);
        const pRight = new THREE.Vector3().copy(pos).addScaledVector(binormal, railGauge / 2);

        railPointsLeft.push(pLeft);
        railPointsRight.push(pRight);
      }

      // 좌측 시안 네온 레일
      const leftCurve = new THREE.CatmullRomCurve3(railPointsLeft);
      const leftGeom = new THREE.TubeGeometry(leftCurve, 300, 0.28, 8, false);
      const leftMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0099cc,
        roughness: 0.2,
        metalness: 0.8
      });
      const leftRail = new THREE.Mesh(leftGeom, leftMat);
      this.scene.add(leftRail);

      // 우측 마젠타 네온 레일
      const rightCurve = new THREE.CatmullRomCurve3(railPointsRight);
      const rightGeom = new THREE.TubeGeometry(rightCurve, 300, 0.28, 8, false);
      const rightMat = new THREE.MeshStandardMaterial({
        color: 0xff0088,
        emissive: 0xcc0066,
        roughness: 0.2,
        metalness: 0.8
      });
      const rightRail = new THREE.Mesh(rightGeom, rightMat);
      this.scene.add(rightRail);

      // 크로스 슬리퍼 (침목)들
      const sleeperCount = 200;
      const sleeperGeom = new THREE.BoxGeometry(railGauge + 0.6, 0.2, 0.4);
      const sleeperMat = new THREE.MeshStandardMaterial({
        color: 0x223344,
        emissive: 0x112233,
        roughness: 0.4
      });

      const sleeperInstanced = new THREE.InstancedMesh(sleeperGeom, sleeperMat, sleeperCount);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < sleeperCount; i++) {
        const u = i / sleeperCount;
        const pos = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(0, 1, 0);
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        dummy.position.copy(pos);
        dummy.matrix.lookAt(pos, new THREE.Vector3().copy(pos).add(tangent), normal);
        dummy.position.addScaledVector(normal, -0.15); // 레일 살짝 하단
        dummy.updateMatrix();
        sleeperInstanced.setMatrixAt(i, dummy.matrix);
      }
      this.scene.add(sleeperInstanced);
    }

    /**
     * 4,000개의 반짝이는 별빛 파티클 생성
     */
    createStarfield() {
      const starCount = 4000;
      const starGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);

      const colorPalette = [
        new THREE.Color(0xffffff), // 화이트
        new THREE.Color(0x88ccff), // 쿨 블루
        new THREE.Color(0xffeedd), // 웜 골드
        new THREE.Color(0xdd88ff)  // 바이올렛
      ];

      for (let i = 0; i < starCount; i++) {
        // 반경 1200 ~ 2800 사이의 거대 구체에 분산
        const radius = 1200 + Math.random() * 1600;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi) - 1400; // 코스 중심부

        const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const starMaterial = new THREE.PointsMaterial({
        size: 3.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.95
      });

      this.starPoints = new THREE.Points(starGeometry, starMaterial);
      this.scene.add(this.starPoints);
    }

    /**
     * 하이퍼스페이스 워프 드라이브 스타 스트릭 (Star Streaks)
     */
    createWarpLines() {
      const streakCount = 450;
      const linePositions = new Float32Array(streakCount * 6); // 2 points per line

      for (let i = 0; i < streakCount; i++) {
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 60;
        const z = -Math.random() * 200;

        linePositions[i * 6] = x;
        linePositions[i * 6 + 1] = y;
        linePositions[i * 6 + 2] = z;

        linePositions[i * 6 + 3] = x;
        linePositions[i * 6 + 4] = y;
        linePositions[i * 6 + 5] = z - 30; // 30m 길이 광선
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.0,
        linewidth: 2
      });

      this.warpLines = new THREE.LineSegments(geom, mat);
      this.scene.add(this.warpLines);
    }

    /**
     * 거대 천체들 (토성의 고리, 오리온 성운, 푸른 거대 행성)
     */
    createCelestialBodies() {
      // 1. 거대한 토성 (Saturn with Rings)
      this.saturnGroup = new THREE.Group();
      this.saturnGroup.position.set(280, 220, -750);
      this.saturnGroup.rotation.z = 0.35;
      this.saturnGroup.rotation.x = 0.2;

      // 행성 본체
      const saturnGeom = new THREE.SphereGeometry(90, 48, 48);
      const saturnMat = new THREE.MeshStandardMaterial({
        color: 0xdfba73,
        roughness: 0.7,
        metalness: 0.1
      });
      const saturnSphere = new THREE.Mesh(saturnGeom, saturnMat);
      this.saturnGroup.add(saturnSphere);

      // 토성 이중 링 (Ring)
      const ringGeom = new THREE.RingGeometry(120, 210, 64);
      ringGeom.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xc8a662,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const saturnRing = new THREE.Mesh(ringGeom, ringMat);
      this.saturnGroup.add(saturnRing);

      this.scene.add(this.saturnGroup);

      // 2. 신비로운 오리온 성운 (Nebula Glowing Gas Cloud)
      this.nebulaGroup = new THREE.Group();
      this.nebulaGroup.position.set(-350, 180, -1450);

      const nebulaCloudCount = 30;
      for (let i = 0; i < nebulaCloudCount; i++) {
        const cloudGeom = new THREE.SphereGeometry(60 + Math.random() * 50, 16, 16);
        const col = Math.random() > 0.5 ? 0x9900ff : 0x00aaff;
        const cloudMat = new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.12,
          wireframe: false
        });
        const cloud = new THREE.Mesh(cloudGeom, cloudMat);
        cloud.position.set(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 150,
          (Math.random() - 0.5) * 200
        );
        this.nebulaGroup.add(cloud);
      }
      this.scene.add(this.nebulaGroup);

      // 3. 심연의 푸른 외계 가스 행성 (Azure Giant)
      const giantGeom = new THREE.SphereGeometry(150, 32, 32);
      const giantMat = new THREE.MeshStandardMaterial({
        color: 0x1133aa,
        emissive: 0x051544,
        roughness: 0.6
      });
      const azureGiant = new THREE.Mesh(giantGeom, giantMat);
      azureGiant.position.set(450, -150, -2000);
      this.scene.add(azureGiant);
    }

    /**
     * 3개의 스타게이트 웜홀 링 (Gate Portals)
     */
    createPortalGates() {
      const gateConfigs = [
        { t: 0.22, color: 0x00f0ff, innerColor: 0x0066aa }, // 토성 고리 관문
        { t: 0.52, color: 0xff00aa, innerColor: 0x880055 }, // 오리온 성운 관문
        { t: 0.82, color: 0xffaa00, innerColor: 0xaa4400 }  // 블랙홀 관문
      ];

      gateConfigs.forEach((cfg, idx) => {
        const portalGroup = new THREE.Group();
        const pos = this.curve.getPointAt(cfg.t);
        const tangent = this.curve.getTangentAt(cfg.t).normalize();

        portalGroup.position.copy(pos);
        portalGroup.lookAt(new THREE.Vector3().copy(pos).add(tangent));

        // 외곽 회전 네온 링
        const torusGeom = new THREE.TorusGeometry(10, 0.7, 16, 48);
        const torusMat = new THREE.MeshStandardMaterial({
          color: cfg.color,
          emissive: cfg.color,
          roughness: 0.2
        });
        const ring = new THREE.Mesh(torusGeom, torusMat);
        portalGroup.add(ring);

        // 내부 파동 에너지 평면
        const innerGeom = new THREE.CircleGeometry(9.3, 32);
        const innerMat = new THREE.MeshBasicMaterial({
          color: cfg.innerColor,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide
        });
        const innerDisc = new THREE.Mesh(innerGeom, innerMat);
        portalGroup.add(innerDisc);

        this.scene.add(portalGroup);
        this.portalRings.push({ group: portalGroup, ring: ring, inner: innerDisc });
      });
    }

    // ==========================================
    // 주행 제어 API (videoEngine과 100% 호환)
    // ==========================================

    setCourse(course) {
      this.currentCourse = course;
      this.gatePoints = course.gates.map((g, i) => ({
        ...g,
        t: [0.22, 0.52, 0.82][i] || 0.22,
        solved: false
      }));
      this.resetRide();
    }

    startRide() {
      this.isPlaying = true;
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.isWarping = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);

      // 상승 구간 쾌속 (1.35x)
      this.targetSpeedFactor = 1.35;
      this.currentSpeedFactor = 1.35;
    }

    resetRide() {
      this.isPlaying = false;
      this.t = 0.02; // 발사대 위치
      this.targetSpeedFactor = 1.0;
      this.currentSpeedFactor = 1.0;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.isWarping = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);
      this.updateCameraPosition(this.t);
    }

    /**
     * 문제 정답 시: 하이퍼스페이스 워프 드라이브 가동!
     */
    triggerBooster(factor = 1.85) {
      if (this.currentGateIndex >= 0 && this.gatePoints[this.currentGateIndex]) {
        this.gatePoints[this.currentGateIndex].solved = true;
      }
      this.isGlidingSlow = false;
      this.isWarping = true;
      this.targetSpeedFactor = factor; // 1.85x ~ 2.2x 초고속

      // 워프 라인 활성화
      if (this.warpLines) {
        this.warpLines.material.opacity = 0.85;
      }

      // 화면 진동
      if (this.options.onShake) {
        this.options.onShake(1.5);
      }

      // 4.5초 후 점진적 일반 순항 복귀
      setTimeout(() => {
        if (!this.isEmergencyStopped) {
          this.targetSpeedFactor = 1.3;
          this.isWarping = false;
          if (this.warpLines) {
            this.warpLines.material.opacity = 0.0;
          }
        }
      }, 4500);
    }

    triggerEmergencyStop() {
      this.isEmergencyStopped = true;
      this.targetSpeedFactor = 0.0;
      this.currentSpeedFactor = 0.0;
      this.isWarping = false;
      if (this.warpLines) this.warpLines.material.opacity = 0.0;
    }

    triggerTimeoutPass() {
      this.isGlidingSlow = false;
      this.targetSpeedFactor = 1.0;
    }

    // VideoCoasterEngine과의 호환용 별칭 API
    resumeAfterSolve(isBoost = true) {
      if (isBoost) {
        this.triggerBooster(1.95);
      } else {
        this.triggerTimeoutPass();
      }
    }

    emergencyStop() {
      this.triggerEmergencyStop();
    }

    triggerWrong() {
      // 오답 시 붉은 셰이크
      if (this.options.onShake) {
        this.options.onShake(1.2);
      }
    }

    getSpeedKm() {
      return this.currentSpeedKm || 0;
    }

    getSpeedMode() {
      if (this.isEmergencyStopped) return '비상 정차';
      if (this.isGlidingSlow) return '초저속 서행 (10 km/h)';
      if (this.isWarping) return '⚡ 워프 드라이브 (200 km/h)';
      return '은하 궤도 순항';
    }

    // ==========================================
    // 렌더 & 물리 갱신 루프
    // ==========================================

    animate() {
      requestAnimationFrame(this.animate);

      // 포털 링 자전 회전
      this.portalRings.forEach(p => {
        if (p.ring) p.ring.rotation.z += 0.02;
      });

      // 토성 자전
      if (this.saturnGroup) {
        this.saturnGroup.rotation.y += 0.001;
      }

      if (this.isPlaying && !this.isEmergencyStopped) {
        // 부드러운 가감속 보간
        this.currentSpeedFactor += (this.targetSpeedFactor - this.currentSpeedFactor) * 0.08;

        // 위치 전진
        const delta = this.baseSpeed * this.currentSpeedFactor;
        this.t += delta;

        if (this.t >= 0.99) {
          this.t = 0.99;
          this.isPlaying = false;
          if (this.options.onFinish) this.options.onFinish();
        }

        // 관문 감지 체크
        this.checkGates();

        // 카메라 업데이트
        this.updateCameraPosition(this.t);
      }

      // 렌더
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    checkGates() {
      for (let i = 0; i < this.gatePoints.length; i++) {
        const gate = this.gatePoints[i];
        if (!gate.solved) {
          const distToGate = gate.t - this.t;

          // 게이트 0.015 전방 도달 시 슬로우 모션 (10 km/h) & 문제 출제!
          if (distToGate > 0 && distToGate <= 0.018 && !this.isGlidingSlow) {
            this.currentGateIndex = i;
            this.isGlidingSlow = true;
            this.targetSpeedFactor = 0.12; // 0.12x 초저속 서행 (10 km/h)

            if (this.options.onGate) {
              this.options.onGate(gate, i);
            }
            break;
          }
        }
      }

      // 속도 km/h 계산
      const speedKm = Math.round(90 * this.currentSpeedFactor);
      this.currentSpeedKm = speedKm;
      if (this.options.onSpeedChange) {
        this.options.onSpeedChange(speedKm, this.isGlidingSlow ? '초저속 서행' : (this.isWarping ? '워프 부스터!' : '순항 주행'));
      }
    }

    updateCameraPosition(t) {
      if (!this.curve || !this.camera) return;

      const pos = this.curve.getPointAt(Math.min(0.999, Math.max(0.001, t)));
      const lookAhead = this.curve.getPointAt(Math.min(0.999, t + 0.012));
      const tangent = this.curve.getTangentAt(Math.min(0.999, t)).normalize();

      // 카메라는 트랙보다 1.4m 위에 탑승자 시점
      const camPos = new THREE.Vector3().copy(pos).add(new THREE.Vector3(0, 1.4, 0));
      this.camera.position.copy(camPos);

      // Up 벡터를 Y축 (0,1,0) 기반으로 안정적으로 유지 (뒤집힘 방지!)
      const targetLook = new THREE.Vector3().copy(lookAhead).add(new THREE.Vector3(0, 1.2, 0));
      this.camera.lookAt(targetLook);

      // 워프 라인 위치를 카메라 앞으로 이동
      if (this.warpLines) {
        this.warpLines.position.copy(camPos);
        this.warpLines.quaternion.copy(this.camera.quaternion);
      }
    }
  }

  window.SpaceCoasterEngine = SpaceCoasterEngine;
})(window);
