/**
 * coaster3d.js - 실감나는 1인칭 롤러코스터 시뮬레이터 (정립 시야 & 자연스러운 뱅킹)
 * - 상하 반전(거꾸로 뒤집힘) 완전 방지: 항상 위를 향하는 안정된 수평선 유지
 * - 자연스러운 경사각: 완만한 등반 ➔ 시원한 68도 급강하 ➔ 부드러운 뱅킹 턴
 * - 3선식 스틸 레일 + 지면 지지 기둥(서포트 타워) + 조종석 앞머리 카트
 */
(function(window) {
  'use strict';

  class Coaster3D {
    constructor(canvasContainer, options = {}) {
      this.container = canvasContainer;
      this.options = options;

      this.trackProgress = 0.0;
      this.currentSpeed = 0.00035;
      this.targetSpeed = 0.00035;
      this.currentBank = 0.0;

      // 상태 플래그
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.currentGateIndex = -1;

      // 3대 관문 체크포인트 (자연스러운 힐 정상 & 뷰포인트에 배치)
      this.gatePoints = [
        { t: 0.177, solved: false, id: 0, name: "제1관문: 낭떠러지 급강하" },
        { t: 0.525, solved: false, id: 1, name: "제2관문: 에어타임 힐" },
        { t: 0.808, solved: false, id: 2, name: "제3관문: 초고속 은하 워프" }
      ];

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.curve = null;
      this.gateMeshes = [];
      this.speedLines = null;
      this.shakeIntensity = 0.0;

      this.init();
    }

    init() {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      this.scene = new THREE.Scene();
      // 깊이감 있는 사이버 시티 & 오로라 석양 배경색
      this.scene.background = new THREE.Color(0x060919);
      this.scene.fog = new THREE.FogExp2(0x0a0f24, 0.0018);

      this.camera = new THREE.PerspectiveCamera(74, width / height, 0.2, 3000);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'default',
        precision: 'mediump',
        failIfMajorPerformanceCaveat: false
      });
      this.renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.container.appendChild(this.renderer.domElement);

      // 입체적인 조명 설정
      const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
      this.scene.add(ambLight);

      // 석양 황금빛 메인 조명
      const sunLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
      sunLight.position.set(150, 220, 100);
      this.scene.add(sunLight);

      // 사이버 블루 보조광
      const cyanLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
      cyanLight.position.set(-150, 100, -100);
      this.scene.add(cyanLight);

      this.createEnvironment();
      this.createTrack();
      this.createSupportPillars();
      this.createCartHood();
      this.createScenery();
      this.createGates();
      this.createSpeedLines();

      window.addEventListener('resize', () => this.onResize());
      this.animate();
    }

    // 1. 현실감 있는 바닥 지면 & 원경 스카이라인
    createEnvironment() {
      // (1) 지면 그리드 & 호수 평면 (y = 0)
      const groundGeo = new THREE.PlaneGeometry(2400, 2400, 40, 40);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x090d20,
        roughness: 0.8,
        metalness: 0.3
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      this.scene.add(ground);

      // 네온 그리드 라인 오버레이
      const gridHelper = new THREE.GridHelper(2400, 60, 0x0284c7, 0x1e293b);
      gridHelper.position.y = 0.2;
      this.scene.add(gridHelper);

      // (2) 원경 수평선 산맥/네온 빌딩 실루엣
      const cityGroup = new THREE.Group();
      const bldgGeo = new THREE.BoxGeometry(1, 1, 1);
      const bldgMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.9,
        metalness: 0.1
      });

      for (let i = 0; i < 90; i++) {
        const angle = (i / 90) * Math.PI * 2;
        const dist = 550 + Math.random() * 250;
        const w = 25 + Math.random() * 40;
        const h = 40 + Math.random() * 120;
        const d = 25 + Math.random() * 40;

        const bldg = new THREE.Mesh(bldgGeo, bldgMat);
        bldg.scale.set(w, h, d);
        bldg.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
        cityGroup.add(bldg);
      }
      this.scene.add(cityGroup);

      // (3) 밤하늘 별무리
      const starGeo = new THREE.BufferGeometry();
      const starCount = 2000;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 2200;
        starPositions[i * 3 + 1] = 80 + Math.random() * 800; // 지면 위 하늘에만 별 배치
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2200;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 2.8,
        transparent: true,
        opacity: 0.75
      });
      this.scene.add(new THREE.Points(starGeo, starMat));
    }

    // 2. ⭐ 현실적인 하이퍼코스터 트랙 코스 (절대 거꾸로 뒤집히지 않음!) ⭐
    createTrack() {
      // 높이(Y)는 항상 지상 8m ~ 78m 사이로 안전하게 설계
      const points = [
        // [구간 1] 정거장 출발 & 완만한 38도 리프트 등반 (t = 0.0 ~ 0.18)
        new THREE.Vector3(0, 12, 0),
        new THREE.Vector3(0, 16, -45),
        new THREE.Vector3(12, 38, -110),
        new THREE.Vector3(22, 65, -180),
        new THREE.Vector3(25, 78, -235), // 📍 제1관문: 낭떠러지 정상 (t = 0.18, 높이 78m!)

        // [구간 2] 68도 시원한 메인 낭떠러지 급강하 & 바닥 계곡 질주 (t = 0.18 ~ 0.32)
        new THREE.Vector3(25, 48, -280),
        new THREE.Vector3(20, 18, -340),
        new THREE.Vector3(8, 8, -390),   // 바닥 최저점 (8m) - 140km/h 최고속!

        // [구간 3] 거대한 고속 뱅킹 우회전 코너 (t = 0.32 ~ 0.44)
        new THREE.Vector3(-45, 16, -400),
        new THREE.Vector3(-95, 28, -350),
        new THREE.Vector3(-125, 42, -265),

        // [구간 4] 제2의 에어타임 힐 & 제2관문 (t = 0.44 ~ 0.58)
        new THREE.Vector3(-130, 54, -185), // 📍 제2관문: 에어타임 힐 정상 (t = 0.48)
        new THREE.Vector3(-120, 24, -120),
        new THREE.Vector3(-90, 10, -70),

        // [구간 5] 수평 나선 360도 턴 (뒤집히지 않는 부드러운 헬릭스) (t = 0.58 ~ 0.78)
        new THREE.Vector3(-45, 14, -30),
        new THREE.Vector3(-10, 22, 10),
        new THREE.Vector3(35, 28, 55),
        new THREE.Vector3(80, 36, 110), // 📍 제3관문: 은하 워프 진입로 (t = 0.78)

        // [구간 6] 결승 워프 질주 & 정거장 복귀 (t = 0.78 ~ 1.0)
        new THREE.Vector3(85, 20, 165),
        new THREE.Vector3(55, 12, 145),
        new THREE.Vector3(15, 10, 75),
        new THREE.Vector3(0, 12, 0)
      ];

      this.curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.15);

      // 1) 중앙 메인 스파인 튜브 (굵은 메탈 파이프)
      const spineGeo = new THREE.TubeGeometry(this.curve, 700, 0.45, 8, true);
      const spineMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0.85
      });
      this.scene.add(new THREE.Mesh(spineGeo, spineMat));

      // 2) 좌우 듀얼 주행 레일 (실제 롤러코스터 레일)
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.95
      });

      const tieMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.8
      });

      const tieGeo = new THREE.BoxGeometry(2.4, 0.22, 0.55);
      const railPillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 6);

      const sampleCount = 420;
      for (let i = 0; i < sampleCount; i++) {
        const u = i / sampleCount;
        const pt = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();

        const worldUp = new THREE.Vector3(0, 1, 0);
        let side = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();
        if (side.lengthSq() < 0.001) side.set(1, 0, 0);
        const normalUp = new THREE.Vector3().crossVectors(side, tangent).normalize();

        // 침목(타이) 배치
        const tie = new THREE.Mesh(tieGeo, tieMat);
        tie.position.copy(pt);
        tie.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), side);
        this.scene.add(tie);

        // 좌/우 레일 지지대 소형 핀
        [-0.95, 0.95].forEach(offset => {
          const pin = new THREE.Mesh(railPillarGeo, spineMat);
          pin.position.copy(pt).add(side.clone().multiplyScalar(offset)).add(normalUp.clone().multiplyScalar(0.2));
          this.scene.add(pin);
        });
      }
    }

    // 3. 지면에서 트랙까지 솟아오른 튼튼한 메탈 지지 기둥 (높이감 실감)
    createSupportPillars() {
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.7
      });

      const pillarCount = 38;
      for (let i = 0; i < pillarCount; i++) {
        const u = i / pillarCount;
        const pt = this.curve.getPointAt(u);

        // 지면(y = 0)부터 트랙(pt.y)까지의 기둥
        const height = pt.y;
        if (height < 2) continue;

        const pillarGeo = new THREE.CylinderGeometry(0.7, 1.2, height, 8);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(pt.x, height / 2, pt.z);
        this.scene.add(pillar);

        // 기둥 상단 크로스 브레이스
        const capGeo = new THREE.BoxGeometry(2.8, 0.4, 2.8);
        const cap = new THREE.Mesh(capGeo, pillarMat);
        cap.position.set(pt.x, height - 0.2, pt.z);
        this.scene.add(cap);
      }
    }

    // 4. ⭐ 1인칭 탑승감 극대화: 화면 하단 카트 앞머리 (좌우 흔들림 기준점 제공) ⭐
    createCartHood() {
      const cartGroup = new THREE.Group();

      // 카트 전면 보닛 (공기역학적 유선형)
      const hoodGeo = new THREE.BoxGeometry(1.6, 0.35, 1.2);
      const hoodMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.2,
        metalness: 0.9
      });
      const hood = new THREE.Mesh(hoodGeo, hoodMat);
      hood.position.set(0, -0.65, -1.35);
      cartGroup.add(hood);

      // 네온 헤드라이트 림
      const lightRimGeo = new THREE.BoxGeometry(1.5, 0.08, 0.1);
      const lightRimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const lightRim = new THREE.Mesh(lightRimGeo, lightRimMat);
      lightRim.position.set(0, -0.52, -1.95);
      cartGroup.add(lightRim);

      // 전방 스포트라이트
      const headLight = new THREE.SpotLight(0x38bdf8, 2.5, 120, Math.PI / 4, 0.4);
      headLight.position.set(0, -0.4, -1.5);
      headLight.target.position.set(0, -1.2, -25);
      cartGroup.add(headLight);
      cartGroup.add(headLight.target);

      this.camera.add(cartGroup);
      this.scene.add(this.camera);
    }

    // 5. 주변 경관 (지면 나무, 낭떠러지 바위, 회전 구간 게이트 타워)
    createScenery() {
      // 제1관문 낭떠러지 양옆 대형 런처 타워
      const towerGeo = new THREE.BoxGeometry(4, 85, 4);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.2
      });

      const dropPt = this.curve.getPointAt(0.18);
      [-16, 16].forEach(offset => {
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(dropPt.x + offset, 42.5, dropPt.z);
        this.scene.add(tower);
      });

      // 지면 테마 조형물 (네온 큐브 & 크리스털)
      const crystalGeo = new THREE.OctahedronGeometry(6, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      });

      for (let i = 0; i < 24; i++) {
        const u = 0.25 + (i / 24) * 0.7;
        const pt = this.curve.getPointAt(u % 1.0);
        const dist = (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 20);

        const mesh = new THREE.Mesh(crystalGeo, crystalMat);
        mesh.position.set(pt.x + dist, Math.max(3, pt.y - 10 + Math.random() * 15), pt.z + (Math.random() - 0.5) * 20);
        mesh.scale.setScalar(0.8 + Math.random() * 1.4);
        this.scene.add(mesh);
      }
    }

    // 6. 관문 3D 링
    createGates() {
      this.gatePoints.forEach((g) => {
        const pt = this.curve.getPointAt(g.t);
        const tangent = this.curve.getTangentAt(g.t).normalize();

        const ringGeo = new THREE.TorusGeometry(5.5, 0.35, 8, 24);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.8,
          metalness: 0.8,
          roughness: 0.2
        });

        const shieldGeo = new THREE.CircleGeometry(5.2, 24);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.28
        });

        const gateGroup = new THREE.Group();
        gateGroup.add(new THREE.Mesh(ringGeo, ringMat));
        gateGroup.add(new THREE.Mesh(shieldGeo, shieldMat));

        gateGroup.position.copy(pt).add(new THREE.Vector3(0, 1.2, 0));
        gateGroup.lookAt(pt.clone().add(tangent).add(new THREE.Vector3(0, 1.2, 0)));

        this.scene.add(gateGroup);
        this.gateMeshes.push({ group: gateGroup, gate: g });
      });
    }

    createSpeedLines() {
      const count = 350;
      const lineGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 6);

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 36;
        const y = (Math.random() - 0.5) * 36;
        const z = -Math.random() * 60;
        const len = Math.random() * 10 + 8;

        pos[i * 6] = x;
        pos[i * 6 + 1] = y;
        pos[i * 6 + 2] = z;

        pos[i * 6 + 3] = x;
        pos[i * 6 + 4] = y;
        pos[i * 6 + 5] = z - len;
      }

      lineGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0
      });

      this.speedLines = new THREE.LineSegments(lineGeo, lineMat);
      this.camera.add(this.speedLines);
    }

    resumeAfterSolve(isBoost = true) {
      this.isGlidingSlow = false;
      this.targetSpeed = isBoost ? 0.0028 : 0.0016; // 140km/h 부스터 or 85km/h 순항

      if (this.currentGateIndex >= 0 && this.gateMeshes[this.currentGateIndex]) {
        const mesh = this.gateMeshes[this.currentGateIndex].group;
        let scale = 1.0;
        const blast = () => {
          scale += isBoost ? 0.28 : 0.12;
          mesh.scale.set(scale, scale, scale);
          mesh.children.forEach(c => c.material.opacity *= isBoost ? 0.8 : 0.88);
          if (mesh.children[0].material.opacity > 0.05) {
            requestAnimationFrame(blast);
          } else {
            mesh.visible = false;
          }
        };
        blast();
      }

      this.shakeIntensity = isBoost ? 0.35 : 0.12;
    }

    emergencyStop() {
      this.isEmergencyStopped = true;
      this.isGlidingSlow = false;
      this.targetSpeed = 0;
      this.currentSpeed = 0;
      this.shakeIntensity = 0.5;
    }

    triggerWrong() {
      this.shakeIntensity = 0.35;
    }

    resetRide() {
      this.trackProgress = 0.0;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.currentSpeed = 0.00045;
      this.targetSpeed = 0.00045;
      this.currentBank = 0.0;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);
      this.gateMeshes.forEach(m => {
        m.group.visible = true;
        m.group.scale.set(1, 1, 1);
        m.group.children.forEach(c => c.material.opacity = 0.8);
      });
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      // 1. 게이트 접근 시 자연스러운 서행 (10 km/h) 글라이딩 전환
      if (!this.isGlidingSlow && !this.isEmergencyStopped) {
        for (let i = 0; i < this.gatePoints.length; i++) {
          const g = this.gatePoints[i];
          if (!g.solved && Math.abs(this.trackProgress - g.t) < 0.006) {
            this.isGlidingSlow = true;
            this.currentGateIndex = i;
            this.targetSpeed = 0.00018; // 10km/h로 부드럽게 글라이딩!

            if (this.options.onGateReached) {
              this.options.onGateReached(i);
            }
            break;
          }
        }
      }

      // 2. 속도 스무딩 & 지속 전진
      if (!this.isEmergencyStopped) {
        if (this.isGlidingSlow) {
          this.targetSpeed = 0.00018; // 서행 글라이딩 유지
        } else {
          // 메인 낙하 구간(0.177 ~ 0.35) 및 제2 에어타임 낙하(0.525 ~ 0.65)에서 140km/h 초고속
          const isPlunging = (this.trackProgress > 0.177 && this.trackProgress < 0.35) ||
                             (this.trackProgress > 0.525 && this.trackProgress < 0.65) ||
                             (this.trackProgress > 0.808);

          if (isPlunging) {
            this.targetSpeed = 0.0028; // 140km/h 초고속 질주
          } else if (this.trackProgress < 0.177) {
            this.targetSpeed = 0.00095; // 리프트 등반 (쾌적한 45km/h 상승)
          } else {
            this.targetSpeed = 0.0016;  // 일반 순항 (85km/h)
          }
        }

        this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.055;
        this.trackProgress = (this.trackProgress + this.currentSpeed) % 1.0;
      }

      // 3. ⭐ 핵심: 상하 반전 없는 견고한 수평선 & 자연스러운 뱅킹 틸트 ⭐
      if (this.curve) {
        const u = this.trackProgress;
        const camPos = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const lookTarget = this.curve.getPointAt((u + 0.018) % 1.0);

        // 미래 접선 벡터로 회전 곡률 계산
        const futureTangent = this.curve.getTangentAt((u + 0.035) % 1.0).normalize();
        const turnCurvature = (tangent.x * futureTangent.z - tangent.z * futureTangent.x);

        // 현실적인 뱅킹 틸트: 커브 안쪽으로 최대 ±24도(0.42라디안) 부드럽게 기울어짐
        const targetBank = THREE.MathUtils.clamp(-turnCurvature * 18.0, -0.42, 0.42);
        this.currentBank += (targetBank - this.currentBank) * 0.12;

        // 절대 위쪽 방향(World Up)을 기준으로 사이드 및 노멀 벡터 계산
        const worldUp = new THREE.Vector3(0, 1, 0);
        let side = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();
        if (side.lengthSq() < 0.001) side.set(1, 0, 0);

        // 기본 상단 벡터
        const normalUp = new THREE.Vector3().crossVectors(side, tangent).normalize();

        // 뱅킹 각도를 적용한 최종 카메라 상단 벡터 (절대 거꾸로 뒤집히지 않음!)
        const bankedUp = normalUp.clone().applyAxisAngle(tangent, this.currentBank);

        // 카메라 위치: 레일 바로 위 1.5m (라이더의 실제 탑승 눈높이)
        this.camera.position.copy(camPos).add(bankedUp.clone().multiplyScalar(1.4));
        this.camera.up.copy(bankedUp);
        this.camera.lookAt(lookTarget.clone().add(bankedUp.clone().multiplyScalar(1.15)));

        // 다이내믹 FOV (속도감에 따라 72° ➔ 92° 시야 확장)
        const speedRatio = Math.min(this.currentSpeed / 0.0026, 1.0);
        const targetFOV = 72 + speedRatio * 20;
        if (Math.abs(this.camera.fov - targetFOV) > 0.2) {
          this.camera.fov += (targetFOV - this.camera.fov) * 0.08;
          this.camera.updateProjectionMatrix();
        }

        // 스피드라인 & 바람 사운드 동기화
        if (this.speedLines) {
          this.speedLines.material.opacity = Math.max(0, (speedRatio - 0.3) * 1.3);
          if (window.CoasterAudio) {
            CoasterAudio.setWindSpeed(speedRatio);
          }
        }

        // 미세한 롤러코스터 진동 쉐이크
        if (this.shakeIntensity > 0.005) {
          this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
          this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
          this.shakeIntensity *= 0.93;
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    onResize() {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  window.Coaster3D = Coaster3D;
})(window);