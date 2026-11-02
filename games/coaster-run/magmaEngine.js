/**
 * magmaEngine.js - Three.js 실시간 3D 마그마 화산 런 엔진
 * 
 * - 붉게 타오르는 화산 내부 앰비언트 & 끓어오르는 용암 바다 (Lava Sea)
 * - 공중으로 솟구치는 3,000개 화산재 & 불꽃 파티클 (Ember Spark Particles)
 * - 흑요석 암벽 기둥 & 화산 동굴 아치
 * - 불타는 오렌지 & 마그마 레드 발광 트윈 레일
 * - 다이내믹 뱅킹 카메라 (롤러코스터 경사에 따른 자연스러운 틸트 & 롤)
 * - 5개 관문 (돌 따내기 5문제) & 정답 시 180km/h 플라즈마 부스터 가동
 */
(function(window) {
  'use strict';

  class MagmaCoasterEngine {
    constructor(canvasElement, options = {}) {
      this.canvas = canvasElement;
      this.options = options;

      this.scene = null;
      this.camera = null;
      this.renderer = null;

      // 궤도 및 모션
      this.curve = null;
      this.t = 0.0;
      this.baseSpeed = 0.00030; // 5개 관문을 즐기기 적절한 순항 속도
      this.currentSpeedFactor = 1.0;
      this.targetSpeedFactor = 1.0;

      // 상태 플래그
      this.isPlaying = false;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.isBooster = false;
      this.currentGateIndex = -1;
      this.currentSpeedKm = 0;

      // 5개 관문 체크포인트 (t: 0.0 ~ 1.0)
      this.gatePoints = [
        { t: 0.16, solved: false, id: 0, name: "제1관문: 분화구 정상 용암 다이브" },
        { t: 0.35, solved: false, id: 1, name: "제2관문: 끓어오르는 용암 호수 위" },
        { t: 0.54, solved: false, id: 2, name: "제3관문: 흑요석 동굴 지하 터널" },
        { t: 0.72, solved: false, id: 3, name: "제4관문: 솟구치는 마그마 간헐천" },
        { t: 0.88, solved: false, id: 4, name: "제5관문: 화산 대폭발 탈출로" }
      ];

      // 3D 오브젝트
      this.emberPoints = null;
      this.lavaMesh = null;
      this.rockPillars = [];
      this.gatePortals = [];
      this.speedStreaks = null;

      this.initThree();
    }

    initThree() {
      if (!window.THREE || !this.canvas) return;

      const width = this.canvas.clientWidth || window.innerWidth;
      const height = this.canvas.clientHeight || window.innerHeight;

      // 1. 씬 & 카메라
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x140303); // 칠흑 같은 화산 내부 암흑
      this.scene.fog = new THREE.FogExp2(0x1a0505, 0.0014); // 붉은 화산 안개

      this.camera = new THREE.PerspectiveCamera(74, width / height, 0.5, 3000);

      // 2. 렌더러
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // 3. 조명 (화산 붉은빛 & 오렌지빛)
      const ambientLight = new THREE.AmbientLight(0x441111, 1.2);
      this.scene.add(ambientLight);

      const lavaSun = new THREE.DirectionalLight(0xff4400, 2.0);
      lavaSun.position.set(200, 300, 100);
      this.scene.add(lavaSun);

      // 4. 구성 요소 생성
      this.createDynamicTrack();
      this.createLavaSea();
      this.createEmbers();
      this.createSpeedStreaks();
      this.createVolcanoEnvironment();
      this.createGatePortals();

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
      this.renderer.setSize(w, h);
    }

    /**
     * 다이내믹 롤러코스터 궤도 생성 (급강하 다이브, 에어타임, S자 뱅킹)
     */
    createDynamicTrack() {
      const points = [
        new THREE.Vector3(0, 10, 0),         // 0. 출발역
        new THREE.Vector3(0, 60, -140),      // 1. 화산 리프트 등반
        new THREE.Vector3(20, 110, -280),    // 2. 분화구 정상 정점 (제1관문 전)
        new THREE.Vector3(0, 15, -450),      // 3. 95m 수직 용암 다이브! (바닥으로 급강하)
        new THREE.Vector3(-80, 5, -600),     // 4. 용암 수면 저공 질주
        new THREE.Vector3(-140, 45, -760),   // 5. 솟구치는 에어타임 언덕 (제2관문 전)
        new THREE.Vector3(-60, 10, -920),    // 6. 용암 호수 횡단
        new THREE.Vector3(50, -15, -1080),   // 7. 지하 현무암 동굴 진입로 (제3관문 전)
        new THREE.Vector3(120, -20, -1260),  // 8. 동굴 내부 S자 뱅킹
        new THREE.Vector3(80, 30, -1440),    // 9. 동굴 탈출 솟구침 (제4관문 전)
        new THREE.Vector3(-30, 70, -1620),   // 10. 간헐천 상공 고공 선회
        new THREE.Vector3(-100, 40, -1800),  // 11. 화산벽 나선 하강 (제5관문 전)
        new THREE.Vector3(0, 10, -2000),     // 12. 최종 초고속 탈출 직선로
        new THREE.Vector3(0, 5, -2150)       // 13. 피니시 골인
      ];

      this.curve = new THREE.CatmullRomCurve3(points);
      this.curve.curveType = 'catmullrom';
      this.curve.tension = 0.5;

      // 듀얼 발광 네온 레일 (오렌지 & 마그마 레드)
      const segments = 450;
      const leftPoints = [];
      const rightPoints = [];
      const gauge = 2.4;

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const pos = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(0, 1, 0);
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        leftPoints.push(new THREE.Vector3().copy(pos).addScaledVector(binormal, -gauge / 2));
        rightPoints.push(new THREE.Vector3().copy(pos).addScaledVector(binormal, gauge / 2));
      }

      // 좌측 불꽃 오렌지 레일
      const leftGeom = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftPoints), 320, 0.3, 8, false);
      const leftMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff3300,
        roughness: 0.2,
        metalness: 0.7
      });
      this.scene.add(new THREE.Mesh(leftGeom, leftMat));

      // 우측 마그마 레드 레일
      const rightGeom = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightPoints), 320, 0.3, 8, false);
      const rightMat = new THREE.MeshStandardMaterial({
        color: 0xff1100,
        emissive: 0xcc0000,
        roughness: 0.2,
        metalness: 0.7
      });
      this.scene.add(new THREE.Mesh(rightGeom, rightMat));

      // 침목 (슬리퍼)
      const sleeperCount = 220;
      const sleeperGeom = new THREE.BoxGeometry(gauge + 0.6, 0.25, 0.45);
      const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 0.5 });
      const instancedSleepers = new THREE.InstancedMesh(sleeperGeom, sleeperMat, sleeperCount);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < sleeperCount; i++) {
        const u = i / sleeperCount;
        const pos = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(0, 1, 0);

        dummy.position.copy(pos).addScaledVector(normal, -0.15);
        dummy.matrix.lookAt(pos, new THREE.Vector3().copy(pos).add(tangent), normal);
        dummy.updateMatrix();
        instancedSleepers.setMatrixAt(i, dummy.matrix);
      }
      this.scene.add(instancedSleepers);
    }

    /**
     * 끓어오르는 용암 바다 (Lava Sea)
     */
    createLavaSea() {
      const lavaGeom = new THREE.PlaneGeometry(3000, 3000, 32, 32);
      lavaGeom.rotateX(-Math.PI / 2);
      const lavaMat = new THREE.MeshStandardMaterial({
        color: 0x991100,
        emissive: 0xff3300,
        emissiveIntensity: 0.85,
        roughness: 0.3,
        metalness: 0.1
      });
      this.lavaMesh = new THREE.Mesh(lavaGeom, lavaMat);
      this.lavaMesh.position.set(0, -35, -1000);
      this.scene.add(this.lavaMesh);
    }

    /**
     * 공중으로 솟구치는 3,500개의 화산재 & 불꽃 파티클 (Embers)
     */
    createEmbers() {
      const count = 3500;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      const colorList = [
        new THREE.Color(0xffaa00), // 밝은 주황
        new THREE.Color(0xff3300), // 불타는 빨강
        new THREE.Color(0xffdd66), // 황금 불꽃
        new THREE.Color(0xaa2200)  // 진한 용암
      ];

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 600;
        positions[i * 3 + 1] = -30 + Math.random() * 200;
        positions[i * 3 + 2] = -Math.random() * 2200;

        const c = colorList[Math.floor(Math.random() * colorList.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 3.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
      });

      this.emberPoints = new THREE.Points(geom, mat);
      this.scene.add(this.emberPoints);
    }

    /**
     * 부스터 가속 시 나타나는 초고속 불꽃 스트릭 (Speed Streaks)
     */
    createSpeedStreaks() {
      const streakCount = 350;
      const positions = new Float32Array(streakCount * 6);

      for (let i = 0; i < streakCount; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 45;
        const z = -Math.random() * 160;

        positions[i * 6] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;

        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z - 28;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.0,
        linewidth: 2.2
      });

      this.speedStreaks = new THREE.LineSegments(geom, mat);
      this.scene.add(this.speedStreaks);
    }

    /**
     * 흑요석 암벽 기둥 및 화산 동굴 아치
     */
    createVolcanoEnvironment() {
      const pillarCount = 45;
      const pillarGeom = new THREE.CylinderGeometry(8, 16, 220, 7);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x180f0f,
        roughness: 0.85
      });

      for (let i = 0; i < pillarCount; i++) {
        const pillar = new THREE.Mesh(pillarGeom, pillarMat);
        const u = i / pillarCount;
        const trackPos = this.curve.getPointAt(u);

        const offsetX = (Math.random() > 0.5 ? 1 : -1) * (35 + Math.random() * 60);
        pillar.position.set(trackPos.x + offsetX, trackPos.y - 40, trackPos.z + (Math.random() - 0.5) * 40);
        pillar.rotation.z = (Math.random() - 0.5) * 0.25;
        this.scene.add(pillar);
      }
    }

    /**
     * 5개의 불타는 마그마 스타게이트 관문 링 (Gate Portals)
     */
    createGatePortals() {
      const portalTs = [0.16, 0.35, 0.54, 0.72, 0.88];
      const portalColors = [0xff4400, 0xff7700, 0xff0044, 0xffaa00, 0xff2200];

      portalTs.forEach((tVal, idx) => {
        const group = new THREE.Group();
        const pos = this.curve.getPointAt(tVal);
        const tangent = this.curve.getTangentAt(tVal).normalize();

        group.position.copy(pos);
        group.lookAt(new THREE.Vector3().copy(pos).add(tangent));

        // 외곽 타오르는 링
        const torusGeom = new THREE.TorusGeometry(9.5, 0.8, 16, 40);
        const torusMat = new THREE.MeshStandardMaterial({
          color: portalColors[idx],
          emissive: portalColors[idx],
          roughness: 0.2
        });
        const ringMesh = new THREE.Mesh(torusGeom, torusMat);
        group.add(ringMesh);

        // 내부 용암 포털 평면
        const discGeom = new THREE.CircleGeometry(8.8, 32);
        const discMat = new THREE.MeshBasicMaterial({
          color: 0x551100,
          transparent: true,
          opacity: 0.38,
          side: THREE.DoubleSide
        });
        const discMesh = new THREE.Mesh(discGeom, discMat);
        group.add(discMesh);

        this.scene.add(group);
        this.gatePortals.push({ group, ring: ringMesh, disc: discMesh });
      });
    }

    // ==========================================
    // 주행 제어 API (호환 인터페이스)
    // ==========================================

    setCourse(course) {
      this.currentCourse = course;
      const portalTs = [0.16, 0.35, 0.54, 0.72, 0.88];
      this.gatePoints = course.gates.map((g, i) => ({
        ...g,
        t: portalTs[i] || (0.16 + i * 0.18),
        solved: false
      }));
      this.resetRide();
    }

    startRide() {
      this.isPlaying = true;
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.isBooster = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);

      // 상승 구간 쾌속 (1.35x)
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
      this.isBooster = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);
      this.updateCamera(this.t);
    }

    triggerBooster(factor = 1.95) {
      if (this.currentGateIndex >= 0 && this.gatePoints[this.currentGateIndex]) {
        this.gatePoints[this.currentGateIndex].solved = true;
      }
      this.isGlidingSlow = false;
      this.isBooster = true;
      this.targetSpeedFactor = factor;

      // 스트릭 라인 활성화 & FOV 시네마틱 줌
      if (this.speedStreaks) this.speedStreaks.material.opacity = 0.9;
      if (this.camera) this.camera.fov = 92;

      if (this.options.onShake) this.options.onShake(1.6);

      setTimeout(() => {
        if (!this.isEmergencyStopped) {
          this.targetSpeedFactor = 1.25;
          this.isBooster = false;
          if (this.speedStreaks) this.speedStreaks.material.opacity = 0.0;
          if (this.camera) this.camera.fov = 74;
        }
      }, 4200);
    }

    resumeAfterSolve(isBoost = true) {
      if (isBoost) {
        this.triggerBooster(1.95);
      } else {
        this.triggerTimeoutPass();
      }
    }

    triggerTimeoutPass() {
      this.isGlidingSlow = false;
      this.targetSpeedFactor = 1.05;
      if (this.camera) this.camera.fov = 74;
    }

    emergencyStop() {
      this.isEmergencyStopped = true;
      this.targetSpeedFactor = 0.0;
      this.currentSpeedFactor = 0.0;
      this.isBooster = false;
      if (this.speedStreaks) this.speedStreaks.material.opacity = 0.0;
    }

    triggerWrong() {
      if (this.options.onShake) this.options.onShake(1.3);
    }

    getSpeedKm() {
      return this.currentSpeedKm || 0;
    }

    getSpeedMode() {
      if (this.isEmergencyStopped) return '비상 정차';
      if (this.isGlidingSlow) return '초저속 서행 (10 km/h)';
      if (this.isBooster) return '🔥 마그마 부스터 (180 km/h)';
      return '화산 순항 질주';
    }

    // ==========================================
    // 렌더 & 물리 갱신 루프
    // ==========================================

    animate() {
      requestAnimationFrame(this.animate);

      // 관문 링 회전
      this.gatePortals.forEach(p => {
        if (p.ring) p.ring.rotation.z += 0.025;
      });

      // 불꽃 파티클 상승
      if (this.emberPoints) {
        const positions = this.emberPoints.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += 0.45;
          if (positions[i] > 180) positions[i] = -30;
        }
        this.emberPoints.geometry.attributes.position.needsUpdate = true;
      }

      if (this.isPlaying && !this.isEmergencyStopped) {
        this.currentSpeedFactor += (this.targetSpeedFactor - this.currentSpeedFactor) * 0.08;
        this.t += this.baseSpeed * this.currentSpeedFactor;

        if (this.t >= 0.99) {
          this.t = 0.99;
          this.isPlaying = false;
          if (this.options.onFinish) this.options.onFinish();
        }

        this.checkGates();
        this.updateCamera(this.t);
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    checkGates() {
      for (let i = 0; i < this.gatePoints.length; i++) {
        const gate = this.gatePoints[i];
        if (!gate.solved) {
          const dist = gate.t - this.t;
          if (dist > 0 && dist <= 0.016 && !this.isGlidingSlow) {
            this.currentGateIndex = i;
            this.isGlidingSlow = true;
            this.targetSpeedFactor = 0.12; // 10 km/h 초저속 서행
            if (this.options.onGate) this.options.onGate(gate, i);
            break;
          }
        }
      }

      const km = Math.round(92 * this.currentSpeedFactor);
      this.currentSpeedKm = km;
      if (this.options.onSpeedChange) {
        this.options.onSpeedChange(km, this.isGlidingSlow ? '초저속 서행' : (this.isBooster ? '마그마 부스터!' : '순항 주행'));
      }
    }

    updateCamera(t) {
      if (!this.curve || !this.camera) return;

      const pos = this.curve.getPointAt(Math.min(0.999, Math.max(0.001, t)));
      const lookAhead = this.curve.getPointAt(Math.min(0.999, t + 0.014));
      const tangent = this.curve.getTangentAt(Math.min(0.999, t)).normalize();

      // 카메라는 탑승자 시점 (트랙 위 1.3m)
      const camPos = new THREE.Vector3().copy(pos).add(new THREE.Vector3(0, 1.3, 0));
      this.camera.position.copy(camPos);

      // 다이내믹 뱅킹 (좌우 커브 시 카메라가 자연스럽게 기울어짐)
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const targetLook = new THREE.Vector3().copy(lookAhead).add(new THREE.Vector3(0, 1.1, 0));
      
      this.camera.lookAt(targetLook);
      // 살짝의 자연스러운 뱅킹 (최대 12도)
      this.camera.rotation.z += binormal.x * 0.15;

      if (this.speedStreaks) {
        this.speedStreaks.position.copy(camPos);
        this.speedStreaks.quaternion.copy(this.camera.quaternion);
      }
    }
  }

  window.MagmaCoasterEngine = MagmaCoasterEngine;
})(window);
