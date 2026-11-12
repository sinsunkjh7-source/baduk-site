/**
 * spaceEngine.js - 100% 3D WebGL 1분 은하계 심우주 롤러코스터 엔진
 * 
 * - 총 주행 시간: 약 1분 (60초 분량의 웅장한 무중력 3D 궤도)
 * - 거대 불타는 항성(태양) 초근접 스치기 & 중력 슬링샷
 * - 실시간 회전하는 3D 소행성/운석 군락 근접 슬라롬 (Near-Miss Asteroids)
 * - 토성 얼음 고리 다이브 & 오리온 자색 성운 360도 코르크스크류 헬릭스
 * - 6개 스타게이트 웜홀 링 (10×10 대형 투명 홀로그램 사활 문제 연동)
 * - 하이퍼스페이스 워프 드라이브 스타 스트릭 (180~250 km/h)
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

      // 궤도 및 주행
      this.curve = null;
      this.trackLength = 0;
      this.t = 0.01; // 0.0 ~ 1.0
      this.baseSpeed = 0.00028; // 약 60초(1분) 완주 속도
      this.speedScale = 1.0;
      this.currentSpeedFactor = 1.0;
      this.targetSpeedFactor = 1.0;

      // 주행 플래그
      this.isPlaying = false;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.isWarping = false;
      this.currentGateIndex = -1;
      this.currentSpeedKm = 0;

      // 6개 관문 (t 위치: 0.0 ~ 1.0)
      this.gatePoints = [
        { t: 0.15, solved: false, id: 0, name: "제1관문: 토성 고리 조망 정점 (10×10 실전 사활)" },
        { t: 0.31, solved: false, id: 1, name: "제2관문: 소행성대 운석 슬라롬 (10×10 귀 사활)" },
        { t: 0.48, solved: false, id: 2, name: "제3관문: 불타는 항성 코로나 초근접 (10×10 촉촉수)" },
        { t: 0.65, solved: false, id: 3, name: "제4관문: 오리온 성운 헬릭스 (10×10 환격)" },
        { t: 0.82, solved: false, id: 4, name: "제5관문: 유성우 회피 에어타임 (10×10 장문)" },
        { t: 0.94, solved: false, id: 5, name: "제6관문: 초광속 웜홀 결승 돌파 (10×10 치중 사활)" }
      ];

      // 3D 천체 및 오브젝트 그룹
      this.starPoints = null;
      this.warpLines = null;
      this.portalRings = [];
      this.saturnGroup = null;
      this.blazingStarGroup = null;
      this.asteroidList = [];
      this.activeMeteors = [];
      this.meteorDebris = [];
      this.nebulaGroup = null;
      this.speedStreakGroup = null;

      this.initThree();
    }

    initThree() {
      if (!window.THREE || !this.canvas) return;

      const width = this.canvas.clientWidth || window.innerWidth;
      const height = this.canvas.clientHeight || window.innerHeight;

      // 1. 씬 & 카메라
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x010206); // 깊은 암흑 심우주
      this.scene.fog = new THREE.FogExp2(0x010208, 0.0004);

      this.camera = new THREE.PerspectiveCamera(72, width / height, 0.5, 5000);

      // 2. 렌더러
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: "default",
        precision: "mediump",
        failIfMajorPerformanceCaveat: false
      });
      this.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));

      // 3. 조명 (우주 은하 조명 + 항성 발광 조명)
      const ambientLight = new THREE.AmbientLight(0x223355, 0.7);
      this.scene.add(ambientLight);

      // 태양광 (항성 방향)
      const starLight = new THREE.PointLight(0xff6600, 3.5, 2500);
      starLight.position.set(240, -20, -1780);
      this.scene.add(starLight);

      const cyanLight = new THREE.PointLight(0x00f0ff, 2.0, 1200);
      cyanLight.position.set(-100, 80, -600);
      this.scene.add(cyanLight);

      const purpleLight = new THREE.PointLight(0xa855f7, 2.0, 1200);
      purpleLight.position.set(-120, 100, -2400);
      this.scene.add(purpleLight);

      // 4. 구성 요소 생성
      this.createTrack();
      this.createStarfield();
      this.createWarpLines();
      this.createCelestialBodies();
      this.createAsteroidBelt();
      this.createPortalGates();

      window.addEventListener('resize', () => this.onResize());

      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    onResize() {
      if (!this.canvas || !this.renderer || !this.camera) return;
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
      this.renderer.setSize(w, h);
    }

    /**
     * 1분 분량의 스릴 넘치는 3D 우주 롤러코스터 궤도 생성 (20개 컨트롤 포인트)
     */
    createTrack() {
      const controlPoints = [
        new THREE.Vector3(0, 20, 0),             // 0. 우주 정거장 출발대
        new THREE.Vector3(0, 60, -160),          // 1. 발사 상승 리프트
        new THREE.Vector3(40, 130, -340),        // 2. 우주 정거장 이탈 최고점
        new THREE.Vector3(90, 160, -520),        // 3. 토성 고리 조망 정점 (제1관문, t=0.15)
        new THREE.Vector3(70, 70, -740),         // 4. 토성 얼음 고리 통과 180km/h 급강하
        new THREE.Vector3(-40, 30, -960),        // 5. 저공 우주 유영 & 소행성대 접근
        new THREE.Vector3(-140, 45, -1160),      // 6. 소행성대 협곡 슬라롬 정점 (제2관문, t=0.31)
        new THREE.Vector3(-170, -10, -1360),     // 7. 아슬아슬한 운석 사이를 스치듯 통과하는 뱅킹 턴!
        new THREE.Vector3(-70, -40, -1560),      // 8. 불타는 거대 항성(태양) 중력장으로 급강하 다이브 (240km/h)
        new THREE.Vector3(80, -20, -1740),       // 9. 항성 충돌 직전! 초근접 태양 코로나 스치기 (제3관문, t=0.48)
        new THREE.Vector3(200, 40, -1920),       // 10. 항성 중력 슬링샷 70도 급선회 탈출!
        new THREE.Vector3(140, 130, -2120),      // 11. 오리온 자색 성운 진입 상승
        new THREE.Vector3(-10, 150, -2320),      // 12. 성운 속 360도 나선 헬릭스 정점 (제4관문, t=0.65)
        new THREE.Vector3(-120, 50, -2520),      // 13. 성운 가스 구름 속 360도 코르크스크류 급강하
        new THREE.Vector3(-150, -15, -2720),     // 14. 유성우 지대 저공 질주
        new THREE.Vector3(-60, 40, -2920),       // 15. 거대 유성 충돌 회피 에어타임 언덕 (제5관문, t=0.82)
        new THREE.Vector3(60, 10, -3120),        // 16. 협곡 유성우 통과 고속 S자 뱅킹
        new THREE.Vector3(120, 80, -3320),       // 17. 최종 웜홀 관문 진입로 (제6관문, t=0.94)
        new THREE.Vector3(40, 30, -3540),        // 18. 초광속 워프 점프 폭발
        new THREE.Vector3(0, 15, -3760)          // 19. 우주 기지 무사 귀환 피니시
      ];

      this.curve = new THREE.CatmullRomCurve3(controlPoints);
      this.curve.curveType = 'catmullrom';
      this.curve.tension = 0.52;

      // 듀얼 네온 레일 (좌: 일렉트릭 시안 / 우: 네온 마젠타)
      const railSegments = 700;
      const railPointsLeft = [];
      const railPointsRight = [];
      const railGauge = 2.4;

      for (let i = 0; i <= railSegments; i++) {
        const u = i / railSegments;
        const pos = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(0, 1, 0);
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        railPointsLeft.push(new THREE.Vector3().copy(pos).addScaledVector(binormal, -railGauge / 2));
        railPointsRight.push(new THREE.Vector3().copy(pos).addScaledVector(binormal, railGauge / 2));
      }

      const leftCurve = new THREE.CatmullRomCurve3(railPointsLeft);
      const rightCurve = new THREE.CatmullRomCurve3(railPointsRight);

      const leftGeom = new THREE.TubeGeometry(leftCurve, 700, 0.32, 8, false);
      const leftMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0099cc,
        roughness: 0.15,
        metalness: 0.85
      });
      this.scene.add(new THREE.Mesh(leftGeom, leftMat));

      const rightGeom = new THREE.TubeGeometry(rightCurve, 700, 0.32, 8, false);
      const rightMat = new THREE.MeshStandardMaterial({
        color: 0xff00aa,
        emissive: 0xcc0066,
        roughness: 0.15,
        metalness: 0.85
      });
      this.scene.add(new THREE.Mesh(rightGeom, rightMat));

      // 침목 (Cross Sleepers)
      const sleeperCount = 380;
      const sleeperGeom = new THREE.BoxGeometry(railGauge + 0.6, 0.22, 0.45);
      const sleeperMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0x0f172a,
        roughness: 0.4
      });

      const sleeperMesh = new THREE.InstancedMesh(sleeperGeom, sleeperMat, sleeperCount);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < sleeperCount; i++) {
        const u = i / sleeperCount;
        const pos = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(0, 1, 0);

        dummy.position.copy(pos).addScaledVector(normal, -0.15);
        dummy.matrix.lookAt(pos, new THREE.Vector3().copy(pos).add(tangent), normal);
        dummy.updateMatrix();
        sleeperMesh.setMatrixAt(i, dummy.matrix);
      }
      this.scene.add(sleeperMesh);
    }

    /**
     * 5,000개의 영롱한 우주 별빛 파티클
     */
    createStarfield() {
      const starCount = 5000;
      const starGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);

      const colorPalette = [
        new THREE.Color(0xffffff),
        new THREE.Color(0x38bdf8),
        new THREE.Color(0xfef08a),
        new THREE.Color(0xf472b6),
        new THREE.Color(0xc084fc)
      ];

      for (let i = 0; i < starCount; i++) {
        const radius = 1400 + Math.random() * 2200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi) - 1800;

        const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const starMaterial = new THREE.PointsMaterial({
        size: 3.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.95
      });

      this.starPoints = new THREE.Points(starGeometry, starMaterial);
      this.scene.add(this.starPoints);
    }

    /**
     * 워프 드라이브 스타 스트릭 (Warp Speed Streaks)
     */
    createWarpLines() {
      const streakCount = 500;
      const linePositions = new Float32Array(streakCount * 6);

      for (let i = 0; i < streakCount; i++) {
        const x = (Math.random() - 0.5) * 90;
        const y = (Math.random() - 0.5) * 70;
        const z = -Math.random() * 240;

        linePositions[i * 6] = x;
        linePositions[i * 6 + 1] = y;
        linePositions[i * 6 + 2] = z;

        linePositions[i * 6 + 3] = x;
        linePositions[i * 6 + 4] = y;
        linePositions[i * 6 + 5] = z - 35;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        linewidth: 2.2
      });

      this.warpLines = new THREE.LineSegments(geom, mat);
      this.scene.add(this.warpLines);
    }

    /**
     * 거대 천체들 (토성, 불타는 거대 항성, 오리온 성운)
     */
    createCelestialBodies() {
      // 1. 토성과 얼음 고리 (Saturn with Glowing Rings) - t=0.15 부근
      this.saturnGroup = new THREE.Group();
      this.saturnGroup.position.set(220, 200, -700);
      this.saturnGroup.rotation.z = 0.35;
      this.saturnGroup.rotation.x = 0.25;

      const saturnGeom = new THREE.SphereGeometry(95, 48, 48);
      const saturnMat = new THREE.MeshStandardMaterial({
        color: 0xe2c488,
        roughness: 0.65,
        metalness: 0.1
      });
      const saturnMesh = new THREE.Mesh(saturnGeom, saturnMat);
      this.saturnGroup.add(saturnMesh);

      const ringGeom = new THREE.RingGeometry(125, 230, 64);
      ringGeom.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xcaa769,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      this.saturnGroup.add(new THREE.Mesh(ringGeom, ringMat));
      this.scene.add(this.saturnGroup);

      // 2. ⭐ 불타는 초거대 항성 (The Blazing Supergiant Sun) ⭐ - t=0.48 부근 초근접 통과!
      this.blazingStarGroup = new THREE.Group();
      this.blazingStarGroup.position.set(240, -20, -1780);

      // 항성 본체 (이글거리는 태양 표면)
      const starGeom = new THREE.SphereGeometry(140, 48, 48);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff4400,
        emissiveIntensity: 2.4,
        roughness: 0.2
      });
      const starMesh = new THREE.Mesh(starGeom, starMat);
      this.blazingStarGroup.add(starMesh);

      // 태양 코로나 발광 대기 외피 1
      const coronaGeom1 = new THREE.SphereGeometry(158, 32, 32);
      const coronaMat1 = new THREE.MeshBasicMaterial({
        color: 0xff7700,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      this.coronaMesh1 = new THREE.Mesh(coronaGeom1, coronaMat1);
      this.blazingStarGroup.add(this.coronaMesh1);

      // 태양 코로나 발광 대기 외피 2 (거대한 태양 홍염)
      const coronaGeom2 = new THREE.SphereGeometry(175, 32, 32);
      const coronaMat2 = new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.20,
        blending: THREE.AdditiveBlending
      });
      this.coronaMesh2 = new THREE.Mesh(coronaGeom2, coronaMat2);
      this.blazingStarGroup.add(this.coronaMesh2);

      this.scene.add(this.blazingStarGroup);

      // 3. 신비로운 오리온 자색 성운 (Glowing Orion Nebula) - t=0.65 부근
      this.nebulaGroup = new THREE.Group();
      this.nebulaGroup.position.set(-200, 120, -2400);

      for (let i = 0; i < 35; i++) {
        const cloudGeom = new THREE.SphereGeometry(70 + Math.random() * 60, 16, 16);
        const col = Math.random() > 0.4 ? 0xa855f7 : 0x06b6d4;
        const cloudMat = new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.10,
          blending: THREE.AdditiveBlending
        });
        const cloud = new THREE.Mesh(cloudGeom, cloudMat);
        cloud.position.set(
          (Math.random() - 0.5) * 260,
          (Math.random() - 0.5) * 180,
          (Math.random() - 0.5) * 260
        );
        this.nebulaGroup.add(cloud);
      }
      this.scene.add(this.nebulaGroup);
    }

    /**
     * ⭐ 스칠 듯이 지나가는 3D 실시간 회전 운석/소행성 군락 (Near-Miss Asteroids) ⭐
     */
    createAsteroidBelt() {
      this.asteroidList = [];
      const asteroidGroup = new THREE.Group();

      const asteroidMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.9,
        metalness: 0.25,
        flatShading: true
      });

      // 40개의 다양한 크기의 각진 3D 암석 운석
      const samplePoints = [
        // 소행성대 1: t=0.20 ~ 0.35 구간 (아슬아슬한 슬라롬)
        0.20, 0.22, 0.24, 0.26, 0.28, 0.30, 0.32, 0.34,
        // 항성 근처 운석 파편: t=0.42 ~ 0.46
        0.42, 0.44, 0.46,
        // 유성우 지대: t=0.68 ~ 0.84 구간
        0.68, 0.70, 0.72, 0.74, 0.76, 0.78, 0.80, 0.82, 0.84
      ];

      samplePoints.forEach((u, idx) => {
        const pos = this.curve.getPointAt(u);
        const tan = this.curve.getTangentAt(u).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        const radius = (idx % 3 === 0) ? (3.2 + Math.random() * 2.0) : (4.5 + Math.random() * 5.0);
        // 레일 표면으로부터 안전 마진 4.8m ~ 11m 유지하면서 스칠 듯한 초근접 비행!
        const sign = (idx % 2 === 0 ? 1 : -1);
        const clearance = 4.8 + Math.random() * 6.5;
        const totalDist = radius + clearance;
        const astPos = pos.clone()
          .addScaledVector(norm, sign * totalDist)
          .addScaledVector(up, (Math.random() - 0.5) * 8.0);
        const astGeom = new THREE.DodecahedronGeometry(radius, 1);

        // 지오메트리 버텍스를 불규칙하게 흔들어 리얼한 분화구 암석 생성
        const posAttr = astGeom.attributes.position;
        for (let v = 0; v < posAttr.count; v++) {
          const vx = posAttr.getX(v);
          const vy = posAttr.getY(v);
          const vz = posAttr.getZ(v);
          const scale = 0.85 + Math.random() * 0.3;
          posAttr.setXYZ(v, vx * scale, vy * scale, vz * scale);
        }
        astGeom.computeVertexNormals();

        const asteroid = new THREE.Mesh(astGeom, asteroidMat);
        asteroid.position.copy(astPos);
        asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        // 회전 속도 부여
        const rotSpeed = {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        };

        this.asteroidList.push({ mesh: asteroid, rotSpeed });
        asteroidGroup.add(asteroid);
      });

      this.scene.add(asteroidGroup);
    }

    /**
     * 6개의 스타게이트 웜홀 링 (Gate Portals)
     */
    createPortalGates() {
      this.portalRings = [];

      const gateColors = [
        0x00f0ff, // 1관문: 토성 시안
        0x38bdf8, // 2관문: 소행성 스카이블루
        0xff5500, // 3관문: 항성 블레이징 오렌지
        0xa855f7, // 4관문: 성운 퍼플
        0xec4899, // 5관문: 유성우 핑크
        0x22c55e  // 6관문: 결승 그린
      ];

      this.gatePoints.forEach((gate, idx) => {
        const portalGroup = new THREE.Group();
        const pos = this.curve.getPointAt(gate.t);
        const tangent = this.curve.getTangentAt(gate.t).normalize();

        portalGroup.position.copy(pos);
        portalGroup.lookAt(new THREE.Vector3().copy(pos).add(tangent));

        const col = gateColors[idx] || 0x00f0ff;

        // 외곽 회전 네온 스타게이트 링
        const torusGeom = new THREE.TorusGeometry(11, 0.85, 16, 48);
        const torusMat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 1.5,
          roughness: 0.15
        });
        const ring = new THREE.Mesh(torusGeom, torusMat);
        portalGroup.add(ring);

        // 내부 파동 에너지 평면
        const innerGeom = new THREE.CircleGeometry(10.2, 32);
        const innerMat = new THREE.MeshBasicMaterial({
          color: col,
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
    // 주행 제어 API
    // ==========================================

    setCourse(course) {
      this.currentCourse = course;
      this.speedScale = (course && course.speedScale) ? course.speedScale : 1.0;
      if (course.gates && course.gates.length) {
        this.gatePoints = course.gates.map((g, i) => ({
          ...g,
          t: (g.t !== undefined ? g.t : ([0.15, 0.31, 0.48, 0.65, 0.82, 0.94][i] || (i + 1) * 0.15)),
          solved: false
        }));
      }
      this.resetRide();
    }

    startRide() {
      this.isPlaying = true;
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.isWarping = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);

      this.targetSpeedFactor = 1.35;
      this.currentSpeedFactor = 1.35;
    }

    resetRide() {
      this.isPlaying = false;
      this.t = 0.01;
      this.targetSpeedFactor = 1.0;
      this.currentSpeedFactor = 1.0;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.isWarping = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);
      this.updateCameraPosition(this.t);
    }

    triggerBooster(factor = 2.1) {
      if (this.currentGateIndex >= 0 && this.gatePoints[this.currentGateIndex]) {
        this.gatePoints[this.currentGateIndex].solved = true;
      }
      this.isGlidingSlow = false;
      this.isWarping = true;
      this.targetSpeedFactor = factor;

      if (this.warpLines) {
        this.warpLines.material.opacity = 0.9;
      }

      if (this.options.onShake) {
        this.options.onShake(1.6);
      }

      // 4.5초 후 점진적 일반 순항 복귀
      setTimeout(() => {
        if (!this.isEmergencyStopped) {
          this.targetSpeedFactor = 1.35;
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
      this.targetSpeedFactor = 1.15;
    }

    resumeAfterSolve(isBoost = true) {
      if (isBoost) {
        this.triggerBooster(2.1);
      } else {
        this.triggerTimeoutPass();
      }
    }

    emergencyStop() {
      this.triggerEmergencyStop();
    }

    spawnCollisionMeteor(isFatal = false) {
      if (!this.scene || !this.curve || !this.camera || !window.THREE) {
        if (this.options.onShake) this.options.onShake(isFatal ? 3.0 : 1.8);
        return;
      }
      const aheadT = Math.min(0.995, this.t + 0.055);
      const startPos = this.curve.getPointAt(aheadT).add(
        new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.3) * 10 + 3, (Math.random() - 0.5) * 10)
      );
      const geo = new THREE.IcosahedronGeometry(isFatal ? 2.4 : 1.7, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        emissive: 0xea580c,
        emissiveIntensity: 0.9,
        roughness: 0.7,
        flatShading: true
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(startPos);
      this.scene.add(mesh);
      this.activeMeteors.push({
        mesh,
        startPos,
        progress: 0,
        duration: 0.34,
        isFatal
      });
    }

    spawnImpactDebris(origin, count = 8) {
      if (!this.scene || !window.THREE) return;
      const geo = new THREE.DodecahedronGeometry(0.32, 0);
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfb923c : 0xfacc15, transparent: true, opacity: 1 });
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(origin);
        this.scene.add(m);
        this.meteorDebris.push({
          mesh: m,
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.55, (Math.random() - 0.3) * 0.45, (Math.random() - 0.5) * 0.55),
          life: 1.0
        });
      }
    }

    triggerWrong(isFatal = false) {
      this.spawnCollisionMeteor(isFatal);
      if (this.options.onShake) {
        this.options.onShake(isFatal ? 3.2 : 2.0);
      }
      if (isFatal) {
        this.targetSpeedFactor = 0.0;
      } else {
        const prevTarget = this.targetSpeedFactor;
        this.currentSpeedFactor = Math.min(this.currentSpeedFactor, 0.25);
        this.targetSpeedFactor = 0.45;
        setTimeout(() => {
          if (!this.isEmergencyStopped && !this.isGlidingSlow) {
            this.targetSpeedFactor = Math.max(prevTarget, 1.15);
          }
        }, 650);
      }
    }

    getSpeedKm() {
      return this.currentSpeedKm || 0;
    }

    getSpeedMode() {
      if (this.isEmergencyStopped) return '비상 정차';
      if (this.isGlidingSlow) return '슬로우 모션 (10 km/h)';
      if (this.isWarping) return '⚡ 하이퍼 워프 (250 km/h)';
      return '은하 궤도 질주';
    }

    // ==========================================
    // 렌더 & 물리 갱신 루프
    // ==========================================

    animate() {
      requestAnimationFrame(this.animate);

      // 스타게이트 링 회전
      this.portalRings.forEach(p => {
        if (p.ring) p.ring.rotation.z += 0.025;
      });

      // 토성 자전
      if (this.saturnGroup) {
        this.saturnGroup.rotation.y += 0.0015;
      }

      // 항성 코로나 펄스 효과
      if (this.coronaMesh1 && this.coronaMesh2) {
        const time = Date.now() * 0.002;
        this.coronaMesh1.scale.setScalar(1.0 + Math.sin(time) * 0.03);
        this.coronaMesh2.scale.setScalar(1.0 + Math.cos(time * 0.8) * 0.04);
      }

      // 소행성/운석 3D 회전 애니메이션
      this.asteroidList.forEach(ast => {
        if (ast.mesh && ast.rotSpeed) {
          ast.mesh.rotation.x += ast.rotSpeed.x;
          ast.mesh.rotation.y += ast.rotSpeed.y;
          ast.mesh.rotation.z += ast.rotSpeed.z;
        }
      });

      // 날아오는 운석 충돌 업데이트
      for (let i = this.activeMeteors.length - 1; i >= 0; i--) {
        const m = this.activeMeteors[i];
        m.progress += 0.016 / m.duration;
        m.mesh.rotation.x += 0.14;
        m.mesh.rotation.y += 0.18;
        if (m.progress >= 1.0) {
          const hitPos = this.camera ? this.camera.position.clone() : m.mesh.position.clone();
          this.spawnImpactDebris(hitPos, m.isFatal ? 12 : 7);
          if (this.options.onShake) this.options.onShake(m.isFatal ? 3.5 : 2.3);
          this.scene.remove(m.mesh);
          if (m.mesh.geometry) m.mesh.geometry.dispose();
          if (m.mesh.material) m.mesh.material.dispose();
          this.activeMeteors.splice(i, 1);
        } else if (this.camera) {
          const targetPos = this.camera.position.clone();
          m.mesh.position.lerpVectors(m.startPos, targetPos, m.progress);
        }
      }

      // 충돌 파편 업데이트
      for (let i = this.meteorDebris.length - 1; i >= 0; i--) {
        const d = this.meteorDebris[i];
        d.mesh.position.add(d.vel);
        d.life -= 0.035;
        d.mesh.material.opacity = Math.max(0, d.life);
        if (d.life <= 0) {
          this.scene.remove(d.mesh);
          if (d.mesh.material) d.mesh.material.dispose();
          this.meteorDebris.splice(i, 1);
        }
      }

      if (this.isPlaying && !this.isEmergencyStopped) {
        this.currentSpeedFactor += (this.targetSpeedFactor - this.currentSpeedFactor) * 0.08;

        const delta = this.baseSpeed * this.speedScale * this.currentSpeedFactor;
        this.t += delta;

        if (this.t >= 0.99) {
          this.t = 0.99;
          this.isPlaying = false;
          if (this.options.onFinish) this.options.onFinish();
        }

        this.checkGates();
        this.updateCameraPosition(this.t);
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    checkGates() {
      for (let i = 0; i < this.gatePoints.length; i++) {
        const gate = this.gatePoints[i];
        if (!gate.solved) {
          const distToGate = gate.t - this.t;

          if (distToGate > 0 && distToGate <= 0.016 && !this.isGlidingSlow) {
            this.currentGateIndex = i;
            this.isGlidingSlow = true;
            this.targetSpeedFactor = 0.10;

            if (this.options.onGate) {
              this.options.onGate(gate, i);
            }
            break;
          }
        }
      }

      const speedKm = Math.round(95 * this.currentSpeedFactor);
      this.currentSpeedKm = speedKm;
      if (this.options.onSpeedChange) {
        this.options.onSpeedChange(speedKm, this.isGlidingSlow ? '문제 구간 서행' : (this.isWarping ? '워프 부스터!' : '궤도 순항'));
      }
    }

    updateCameraPosition(t) {
      if (!this.curve || !this.camera) return;

      const clampedT = Math.min(0.999, Math.max(0.001, t));
      const pos = this.curve.getPointAt(clampedT);
      const lookAheadT = Math.min(0.999, clampedT + 0.012);
      const lookAhead = this.curve.getPointAt(lookAheadT);

      const camPos = new THREE.Vector3().copy(pos).add(new THREE.Vector3(0, 1.4, 0));
      this.camera.position.copy(camPos);

      const targetLook = new THREE.Vector3().copy(lookAhead).add(new THREE.Vector3(0, 1.2, 0));
      this.camera.lookAt(targetLook);

      if (this.warpLines) {
        this.warpLines.position.copy(camPos);
        this.warpLines.quaternion.copy(this.camera.quaternion);
      }
    }
  }

  window.SpaceCoasterEngine = SpaceCoasterEngine;
})(window);
