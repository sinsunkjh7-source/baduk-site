/**
 * magmaEngine.js - 다이내믹 3D 마그마 화산 롤러코스터 엔진 (Three.js WebGL)
 * 
 * 주요 특징:
 * 1. 원형 글로우 불꽃/불티 파티클 (Canvas Radial Gradient)
 * 2. 150m 정상 등반 -> 145m 수직 90도 급강하 -> 45도 급격한 뱅킹 턴 -> 에어타임 언덕
 * 3. 물리 기반 중력 가속도 & 게이트 앞 강력한 에어 브레이크 & 정답 시 210km/h 급발진
 * 4. 속도 연동 FOV 다이내믹 줌아웃 (65 -> 88도) & 화면 진동
 * 5. Web Audio 실시간 레일 마찰음 + 바람 굉음 연동
 */
(function(window) {
  'use strict';

  class MagmaCoasterEngine {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.options = options;

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.curve = null;
      this.trackMesh = null;
      this.emberPoints = null;
      this.lavaMesh = null;
      this.speedStreakGroup = null;
      this.gatePortals = [];
      this.currentTheme = options.theme || 'glacier';
      this.railMatL = null;
      this.railMatR = null;
      this.tieMat = null;
      this.spireMat = null;
      this.icicleMat = null;
      this.archMat = null;
      this.ambientLight = null;
      this.dirLight = null;
      this.snowTexture = null;
      this.fireTexture = null;

      // 주행 상태
      this.isPlaying = false;
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.isBooster = false;
      this.currentGateIndex = -1;

      // 주행 진행도 (t: 0.0 ~ 1.0)
      this.t = 0.0;
      this.baseSpeed = 0.00065; // 고속 베이스
      this.currentSpeedFactor = 1.0;
      this.targetSpeedFactor = 1.0;
      this.currentSpeedKm = 0;
      this.currentFOV = 68;

      // 5개 관문 위치 (t 지점)
      this.gatePoints = [
        { id: 0, t: 0.115, solved: false }, // 제1관문: 155m 분화구 최고 정점 (143m 수직 낙하 직전 칼날 능선!)
        { id: 1, t: 0.370, solved: false }, // 제2관문: 115m 에어타임 카멜백 언덕 정점
        { id: 2, t: 0.540, solved: false }, // 제3관문: 흑요석 동굴 지하 트렌치 평탄 구간
        { id: 3, t: 0.700, solved: false }, // 제4관문: 125m 간헐천 타워 정점
        { id: 4, t: 0.855, solved: false }  // 제5관문: 화산 외벽 마지막 언덕 정점
      ];

      this.initThree();
    }

    initThree() {
      if (!this.canvas || !window.THREE) return;

      const width = this.canvas.clientWidth || window.innerWidth;
      const height = this.canvas.clientHeight || window.innerHeight;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a0302);
      this.scene.fog = new THREE.FogExp2(0x180502, 0.0016);

      this.camera = new THREE.PerspectiveCamera(68, width / height, 0.1, 3500);
      this.camera.position.set(0, 15, 0);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 조명
      this.ambientLight = new THREE.AmbientLight(0xff4411, 0.85);
      this.scene.add(this.ambientLight);

      this.dirLight = new THREE.DirectionalLight(0xffaa33, 1.2);
      this.dirLight.position.set(100, 300, 100);
      this.scene.add(this.dirLight);

      this.createDynamicTrack();
      this.createLavaSea();
      this.createEmbers();
      this.createSpeedStreaks();
      this.createVolcanoEnvironment();
      this.createGatePortals();

      this.setTheme(this.currentTheme);

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
     * 다이내믹 롤러코스터 트랙 설계 (극적인 고저차, 급강하, 45도 뱅킹 턴)
     */
    createDynamicTrack() {
      const points = [
        new THREE.Vector3(0, 15, 0),         // 0. 출발역
        new THREE.Vector3(0, 80, -120),      // 1. 화산 리프트 등반 1차
        new THREE.Vector3(10, 155, -280),    // 2. 분화구 155m 아득한 정상 정점 (제1관문)
        new THREE.Vector3(0, 12, -450),      // 3. 💥 143m 수직 90도 절벽 급강하 다이브! (바닥으로 추락)
        new THREE.Vector3(-150, 6, -640),    // 4. 용암 수면 초저공 질주 & 급격한 좌 45도 뱅킹 턴!
        new THREE.Vector3(-80, 115, -830),   // 5. 솟구치는 에어타임 카멜백 언덕 정점 (제2관문)
        new THREE.Vector3(20, 8, -1010),     // 6. 지하 동굴 입구로 급강하
        new THREE.Vector3(120, -28, -1190),  // 7. 흑요석 지하 동굴 심연 S자 뱅킹 (제3관문)
        new THREE.Vector3(60, 20, -1370),    // 8. 동굴 탈출 상승
        new THREE.Vector3(-30, 125, -1550),  // 9. 간헐천 상공 125m 수직 솟구침 (제4관문)
        new THREE.Vector3(-140, 35, -1740),  // 10. 화산 외벽 360도 나선 급강하 헬릭스
        new THREE.Vector3(-40, 50, -1920),   // 11. 화산 폭발 분화구 입구 (제5관문)
        new THREE.Vector3(0, 15, -2120),     // 12. 최종 초광속 210km/h 탈출 직선로
        new THREE.Vector3(0, 10, -2280)      // 13. 피니시 골인
      ];

      this.curve = new THREE.CatmullRomCurve3(points);
      this.curve.curveType = 'catmullrom';
      this.curve.tension = 0.52;

      // 듀얼 발광 네온 레일 (오렌지 & 마그마 레드)
      const segments = 550;
      const leftPoints = [];
      const rightPoints = [];
      const gauge = 2.6;

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const pos = this.curve.getPointAt(u);
        const tan = this.curve.getTangentAt(u).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

        leftPoints.push(pos.clone().addScaledVector(norm, -gauge / 2));
        rightPoints.push(pos.clone().addScaledVector(norm, gauge / 2));
      }

      const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
      const rightCurve = new THREE.CatmullRomCurve3(rightPoints);

      const railGeomL = new THREE.TubeGeometry(leftCurve, 550, 0.42, 8, false);
      const railGeomR = new THREE.TubeGeometry(rightCurve, 550, 0.42, 8, false);

      this.railMatL = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff2200,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.8
      });

      this.railMatR = new THREE.MeshStandardMaterial({
        color: 0xff7700,
        emissive: 0xff5500,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.8
      });

      this.scene.add(new THREE.Mesh(railGeomL, this.railMatL));
      this.scene.add(new THREE.Mesh(railGeomR, this.railMatR));

      // 레일 침목(Ties)
      const tieGeom = new THREE.BoxGeometry(3.6, 0.25, 0.5);
      this.tieMat = new THREE.MeshStandardMaterial({ color: 0x1a0f0d, roughness: 0.9 });
      const tieGroup = new THREE.Group();

      for (let i = 0; i < 400; i++) {
        const u = i / 400;
        const pos = this.curve.getPointAt(u);
        const tan = this.curve.getTangentAt(u).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

        const tie = new THREE.Mesh(tieGeom, this.tieMat);
        tie.position.copy(pos);
        tie.position.y -= 0.15;
        tie.lookAt(pos.clone().add(tan));
        tieGroup.add(tie);
      }
      this.scene.add(tieGroup);
    }

    /**
     * 끓어오르는 용암 바다
     */
    createLavaSea() {
      const geom = new THREE.PlaneGeometry(2800, 3200, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xcc2200,
        emissive: 0xee3300,
        emissiveIntensity: 0.85,
        roughness: 0.3,
        metalness: 0.1
      });
      this.lavaMesh = new THREE.Mesh(geom, mat);
      this.lavaMesh.rotation.x = -Math.PI / 2;
      this.lavaMesh.position.set(0, -35, -1100);
      this.scene.add(this.lavaMesh);
    }

    /**
     * 원형 글로우 불꽃 파티클 텍스처 생성 (자연스러운 둥근 불티)
     */
    createSparkTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.18, 'rgba(255, 210, 80, 0.95)');
      grad.addColorStop(0.45, 'rgba(255, 80, 10, 0.7)');
      grad.addColorStop(0.75, 'rgba(200, 20, 0, 0.25)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }

    /**
     * 3,500개의 원형 발광 불꽃/불티 파티클 시스템
     */
    createEmbers() {
      const count = 3500;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      const colorList = [
        new THREE.Color(0xffaa00),
        new THREE.Color(0xff3300),
        new THREE.Color(0xffdd66),
        new THREE.Color(0xff6600),
        new THREE.Color(0xff2200)
      ];

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 700;
        positions[i * 3 + 1] = -30 + Math.random() * 240;
        positions[i * 3 + 2] = -Math.random() * 2400;

        const c = colorList[Math.floor(Math.random() * colorList.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const sparkTex = this.createSparkTexture();

      const mat = new THREE.PointsMaterial({
        size: 7.0,
        map: sparkTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      this.emberPoints = new THREE.Points(geom, mat);
      this.scene.add(this.emberPoints);
    }

    /**
     * 초고속 질주 시 주변으로 폭풍처럼 스쳐 지나가는 광선 스트릭
     */
    createSpeedStreaks() {
      this.speedStreakGroup = new THREE.Group();
      const streakCount = 120;
      const streakGeom = new THREE.CylinderGeometry(0.08, 0.08, 32, 4);
      const streakMat = new THREE.MeshBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 0.0
      });

      for (let i = 0; i < streakCount; i++) {
        const m = new THREE.Mesh(streakGeom, streakMat.clone());
        m.position.set(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 35,
          -Math.random() * 120
        );
        m.rotation.x = Math.PI / 2;
        this.speedStreakGroup.add(m);
      }

      this.speedStreakGroup.visible = false;
      this.scene.add(this.speedStreakGroup);
    }

    /**
     * 거대한 현무암 화산 바위 기둥 협곡
     */
    /**
     * 뾰족뾰족한 얼음 협곡과 거대 고드름, 헤드초퍼 아치 환경 구축
     * 아슬아슬하게 그 사이를 통과하는 스릴 넘치는 연출
     */
    createVolcanoEnvironment() {
      const group = new THREE.Group();

      // 머티리얼 정의
      this.icicleMat = new THREE.MeshStandardMaterial({
        color: 0xcffafe,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        roughness: 0.12,
        metalness: 0.85,
        transparent: true,
        opacity: 0.88
      });

      this.spireMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        emissive: 0x082f49,
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.65
      });

      this.archMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0369a1,
        emissiveIntensity: 0.5,
        roughness: 0.15,
        metalness: 0.75
      });

      // 지오메트리 캐시
      const icicleGeomSmall = new THREE.ConeGeometry(0.55, 5.5, 5);
      const icicleGeomMedium = new THREE.ConeGeometry(0.85, 8.5, 5);
      const icicleGeomLarge = new THREE.ConeGeometry(1.3, 13.0, 6);
      const spikeGeom = new THREE.ConeGeometry(2.4, 28.0, 5);
      const giantSpireGeom = new THREE.ConeGeometry(6.5, 75.0, 6);
      const archGeom = new THREE.TorusGeometry(7.5, 0.9, 8, 24, Math.PI);

      const gauge = 2.6;
      const sampleCount = 150;

      for (let i = 0; i < sampleCount; i++) {
        const u = 0.03 + (i / sampleCount) * 0.94;
        const pos = this.curve.getPointAt(u);
        const tan = this.curve.getTangentAt(u).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        // A. 양옆 뾰족뾰족한 얼음 협곡 침봉 (Spikes & Stalagmites) - 아슬아슬하게 통과!
        // 왼쪽 칼날 얼음 바위
        const leftDist = gauge / 2 + 2.3 + (Math.sin(i * 1.7) * 0.8 + 0.8);
        const leftPos = pos.clone().addScaledVector(norm, -leftDist);
        const leftSpike = new THREE.Mesh(spikeGeom, this.icicleMat);
        leftSpike.position.set(leftPos.x, leftPos.y + 7 + (Math.sin(i * 3.1) * 4), leftPos.z);
        leftSpike.rotation.z = -0.15 + (Math.sin(i * 0.9) * 0.12);
        leftSpike.rotation.y = i * 0.7;
        group.add(leftSpike);

        // 오른쪽 칼날 얼음 바위
        const rightDist = gauge / 2 + 2.3 + (Math.cos(i * 1.7) * 0.8 + 0.8);
        const rightPos = pos.clone().addScaledVector(norm, rightDist);
        const rightSpike = new THREE.Mesh(spikeGeom, this.icicleMat);
        rightSpike.position.set(rightPos.x, rightPos.y + 7 + (Math.cos(i * 2.7) * 4), rightPos.z);
        rightSpike.rotation.z = 0.15 - (Math.cos(i * 0.9) * 0.12);
        rightSpike.rotation.y = i * 1.1;
        group.add(rightSpike);

        // B. 외곽 거대 빙산 절벽 기둥 (웅장한 협곡 배경)
        if (i % 3 === 0) {
          const side = (i % 2 === 0 ? 1 : -1);
          const cliffDist = gauge / 2 + 12 + (Math.random() * 18);
          const cliffPos = pos.clone().addScaledVector(norm, side * cliffDist);
          const giantSpire = new THREE.Mesh(giantSpireGeom, this.spireMat);
          giantSpire.position.set(cliffPos.x, cliffPos.y + 25 + Math.random() * 20, cliffPos.z);
          giantSpire.rotation.y = Math.random() * Math.PI;
          group.add(giantSpire);
        }

        // C. ⭐ 머리 위를 아슬아슬하게 스쳐가는 오버헤드 고드름 아치 (Head-Choppers) ⭐
        if (i % 7 === 0) {
          const archCenter = pos.clone().addScaledVector(up, 4.8);
          const archMesh = new THREE.Mesh(archGeom, this.archMat);
          archMesh.position.copy(archCenter);
          
          const rotMatrix = new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            tan,
            up
          );
          archMesh.rotation.setFromRotationMatrix(rotMatrix);
          archMesh.rotation.z = Math.PI;
          group.add(archMesh);

          // 아치 천장에서 트랙 정중앙과 양옆으로 날카롭게 뻗어내린 고드름들!
          const icicleOffsets = [-1.4, -0.6, 0.0, 0.6, 1.4];
          icicleOffsets.forEach((off, idx) => {
            const geom = (idx === 2) ? icicleGeomMedium : icicleGeomSmall;
            const icicle = new THREE.Mesh(geom, this.icicleMat);
            const hangPos = pos.clone()
              .addScaledVector(up, 5.8 - Math.abs(off) * 0.6)
              .addScaledVector(norm, off * 1.3);
            icicle.position.copy(hangPos);
            icicle.rotation.x = Math.PI; // 뾰족한 끝이 정확히 트랙 아래(플레이어 머리 쪽)를 향함
            icicle.rotation.z = (Math.random() - 0.5) * 0.15;
            group.add(icicle);
          });
        }

        // D. ⭐ 제3관문 지하 빙하 크레바스 계곡 (u: 0.46 ~ 0.62) 밀집 고드름 터널 ⭐
        if (u >= 0.46 && u <= 0.62) {
          for (let k = 0; k < 2; k++) {
            const hangIcicle = new THREE.Mesh(icicleGeomLarge, this.icicleMat);
            const lateral = (k === 0 ? -1 : 1) * (1.2 + Math.random() * 2.0);
            const hangPos = pos.clone()
              .addScaledVector(up, 7.5 + Math.random() * 3.0)
              .addScaledVector(norm, lateral);
            hangIcicle.position.copy(hangPos);
            hangIcicle.rotation.x = Math.PI;
            hangIcicle.rotation.z = (Math.random() - 0.5) * 0.2;
            group.add(hangIcicle);
          }
        }
      }

      this.scene.add(group);
      this.environmentGroup = group;
    }

    createGatePortals() {
      this.gatePortals = [];
      const ringGeom = new THREE.TorusGeometry(8.5, 0.7, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        emissive: 0xff6600,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.8
      });

      this.gatePoints.forEach((gp, idx) => {
        const pos = this.curve.getPointAt(gp.t);
        const tan = this.curve.getTangentAt(gp.t).normalize();

        const ring = new THREE.Mesh(ringGeom, ringMat.clone());
        ring.position.copy(pos);
        ring.lookAt(pos.clone().add(tan));

        this.scene.add(ring);
        this.gatePortals.push({ gate: gp, ring, index: idx });
      });
    }

    setCourse(course) {
      if (course && course.gates) {
        this.gatePoints = course.gates.map((g, idx) => ({
          id: g.id || idx,
          t: g.t !== undefined ? g.t : (0.16 + idx * 0.18),
          solved: false
        }));
      }
    }

    
    /**
     * 원형 부드러운 눈송이/얼음 크리스탈 텍스처 생성 (프로즌 글래시어 런용)
     */
    createSnowTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.2, 'rgba(224, 242, 254, 0.95)');
      grad.addColorStop(0.5, 'rgba(125, 211, 252, 0.55)');
      grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.18)');
      grad.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    }

    /**
     * 실시간 테마 스위칭 (글래시어 빙하 ❄️ vs 마그마 화산 🔥)
     */
    setTheme(themeName = 'glacier') {
      this.currentTheme = themeName;
      const isGlacier = (themeName === 'glacier');

      if (!this.scene) return;

      // 1. 배경 & 안개 색상
      if (isGlacier) {
        this.scene.background = new THREE.Color(0x030a16);
        this.scene.fog = new THREE.FogExp2(0x06182c, 0.0015);
      } else {
        this.scene.background = new THREE.Color(0x0a0302);
        this.scene.fog = new THREE.FogExp2(0x180502, 0.0016);
      }

      // 2. 조명 (프로즌 쿨톤 vs 마그마 웜톤)
      if (this.ambientLight) {
        this.ambientLight.color.setHex(isGlacier ? 0xa5f3fc : 0xff4411);
        this.ambientLight.intensity = isGlacier ? 1.0 : 0.85;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(isGlacier ? 0xe0f2fe : 0xffaa33);
        this.dirLight.intensity = isGlacier ? 1.35 : 1.2;
      }

      // 3. 레일 재질 (크리스탈 아이스 vs 불타는 붉은 쇠)
      if (this.railMatL) {
        this.railMatL.color.setHex(isGlacier ? 0x7dd3fc : 0xff3300);
        this.railMatL.emissive.setHex(isGlacier ? 0x0284c7 : 0xff2200);
        this.railMatL.emissiveIntensity = isGlacier ? 1.3 : 0.9;
      }
      if (this.railMatR) {
        this.railMatR.color.setHex(isGlacier ? 0x38bdf8 : 0xff7700);
        this.railMatR.emissive.setHex(isGlacier ? 0x0369a1 : 0xff5500);
        this.railMatR.emissiveIntensity = isGlacier ? 1.3 : 0.9;
      }
      if (this.tieMat) {
        this.tieMat.color.setHex(isGlacier ? 0x0f172a : 0x1e1512);
      }

      // 4. 바닥 (극지방 빙하 해저 vs 펄펄 끓는 용암 바다)
      if (this.lavaMesh && this.lavaMesh.material) {
        this.lavaMesh.material.color.setHex(isGlacier ? 0x0284c7 : 0xcc2200);
        this.lavaMesh.material.emissive.setHex(isGlacier ? 0x0369a1 : 0xee3300);
        this.lavaMesh.material.emissiveIntensity = isGlacier ? 0.75 : 0.85;
        this.lavaMesh.material.roughness = isGlacier ? 0.15 : 0.3;
        this.lavaMesh.material.metalness = isGlacier ? 0.4 : 0.1;
      }

      // 5. 파티클 (흩날리는 원형 눈송이 vs 타오르는 원형 불티)
      if (this.emberPoints && this.emberPoints.material) {
        if (!this.snowTexture) this.snowTexture = this.createSnowTexture();
        if (!this.fireTexture) this.fireTexture = this.createSparkTexture();
        this.emberPoints.material.map = isGlacier ? this.snowTexture : this.fireTexture;
        this.emberPoints.material.color.setHex(isGlacier ? 0xf0f9ff : 0xffaa44);
        this.emberPoints.material.size = isGlacier ? 2.6 : 2.8;
      }

      // 6. 주변 환경 (고드름, 칼날 협곡, 거대 빙산 기둥)
      if (this.icicleMat) {
        this.icicleMat.color.setHex(isGlacier ? 0xcffafe : 0x292524);
        this.icicleMat.emissive.setHex(isGlacier ? 0x0284c7 : 0xea580c);
        this.icicleMat.emissiveIntensity = isGlacier ? 0.45 : 0.65;
        this.icicleMat.roughness = isGlacier ? 0.12 : 0.75;
        this.icicleMat.metalness = isGlacier ? 0.85 : 0.15;
        this.icicleMat.opacity = isGlacier ? 0.88 : 0.98;
      }
      if (this.spireMat) {
        this.spireMat.color.setHex(isGlacier ? 0x0369a1 : 0x140e0c);
        this.spireMat.emissive.setHex(isGlacier ? 0x082f49 : 0x431407);
        this.spireMat.emissiveIntensity = isGlacier ? 0.35 : 0.4;
        this.spireMat.roughness = isGlacier ? 0.25 : 0.95;
        this.spireMat.metalness = isGlacier ? 0.65 : 0.1;
      }
      if (this.archMat) {
        this.archMat.color.setHex(isGlacier ? 0x7dd3fc : 0x441b12);
        this.archMat.emissive.setHex(isGlacier ? 0x0369a1 : 0x7c2d12);
        this.archMat.emissiveIntensity = isGlacier ? 0.5 : 0.4;
      }

      // 7. 관문 게이트 링
      this.gatePortals.forEach(portal => {
        if (portal && portal.material) {
          portal.material.color.setHex(isGlacier ? 0x38bdf8 : 0xffaa00);
          portal.material.emissive.setHex(isGlacier ? 0x0ea5e9 : 0xff6600);
        }
      });
    }

    startRide() {
      this.t = 0.0;
      this.isPlaying = true;
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.isBooster = false;
      this.currentGateIndex = -1;
      this.currentSpeedFactor = 0.8;
      this.targetSpeedFactor = 1.0;

      // 오디오 컨텍스트 깨우기 & 주행 사운드 시작
      if (window.CoasterAudio) {
        window.CoasterAudio.resume();
        window.CoasterAudio.startRideAudio();
        window.CoasterAudio.startLiftHill();
      }

      this.gatePoints.forEach(g => g.solved = false);
    }

    resetRide() {
      this.isPlaying = false;
      this.t = 0.0;
      this.isGlidingSlow = false;
      this.isBooster = false;
      this.currentSpeedFactor = 0.8;
      this.targetSpeedFactor = 1.0;
      if (this.speedStreakGroup) this.speedStreakGroup.visible = false;
      if (window.CoasterAudio) {
        window.CoasterAudio.stopWind();
        window.CoasterAudio.stopLiftHill();
      }
      this.updateCamera(0.001);
    }

    triggerBooster() {
      this.isBooster = true;
      this.isGlidingSlow = false;
      this.targetSpeedFactor = 2.4; // 210km/h 초고속 발진!

      if (this.speedStreakGroup) {
        this.speedStreakGroup.visible = true;
        this.speedStreakGroup.children.forEach(m => {
          m.material.opacity = 0.85;
        });
      }

      if (this.options.onShake) this.options.onShake(1.6);
      if (window.CoasterAudio) {
        window.CoasterAudio.playBoosterLaunch();
      }

      setTimeout(() => {
        if (!this.isGlidingSlow) {
          this.targetSpeedFactor = 1.25; // 135km/h 순항
          if (this.speedStreakGroup) {
            this.speedStreakGroup.children.forEach(m => {
              m.material.opacity = 0.15;
            });
          }
        }
      }, 3500);
    }

    resumeAfterSolve() {
      if (this.currentGateIndex >= 0 && this.gatePoints[this.currentGateIndex]) {
        this.gatePoints[this.currentGateIndex].solved = true;
      }
      this.triggerBooster();
    }

    triggerTimeoutPass() {
      if (this.currentGateIndex >= 0 && this.gatePoints[this.currentGateIndex]) {
        this.gatePoints[this.currentGateIndex].solved = true;
      }
      this.isGlidingSlow = false;
      this.targetSpeedFactor = 1.0;
    }

    emergencyStop() {
      this.isEmergencyStopped = true;
      this.targetSpeedFactor = 0.0;
      this.currentSpeedFactor = 0.0;
      if (window.CoasterAudio) {
        window.CoasterAudio.playBrakeScreech();
        window.CoasterAudio.stopWind();
        window.CoasterAudio.stopLiftHill();
      }
    }

    triggerWrong() {
      if (this.options.onShake) this.options.onShake(1.2);
    }

    getSpeedKm() {
      return this.currentSpeedKm || 0;
    }

    getSpeedMode() {
      if (this.isEmergencyStopped) return '비상 정차';
      if (this.isGlidingSlow) return '관문 제동 서행';
      if (this.isBooster) return '🔥 210km/h 마그마 부스터!';
      if (this.t < 0.12) return '🧗 리프트 정상 등반 중';
      return '⚡ 초고속 급강하 질주';
    }

    animate() {
      requestAnimationFrame(this.animate);

      // 관문 링 회전
      this.gatePortals.forEach(p => {
        if (p.ring) p.ring.rotation.z += 0.03;
      });

      // 원형 불꽃 파티클 상승
      if (this.emberPoints) {
        const positions = this.emberPoints.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += 0.55;
          if (positions[i] > 220) positions[i] = -30;
        }
        this.emberPoints.geometry.attributes.position.needsUpdate = true;
      }

      if (this.isPlaying && !this.isEmergencyStopped) {
        // 물리 기반 경사도 가속도 계산: 내리막길이면 가속, 오르막길이면 감속
        let slopeBoost = 1.0;
        if (this.curve && !this.isGlidingSlow) {
          const p1 = this.curve.getPointAt(this.t);
          const p2 = this.curve.getPointAt(Math.min(0.999, this.t + 0.01));
          const dy = p2.y - p1.y; // 음수면 급강하, 양수면 상승
          if (dy < -0.4) {
            slopeBoost = 1.55; // 💥 급강하 시 폭발적 가속!
          } else if (dy > 0.4) {
            slopeBoost = 0.8; // 급상승 시 묵직한 감속
          }
        }

        // 초기 리프트 힐 구간(t < 0.12)은 체인 등반
        if (this.t < 0.105 && !this.isGlidingSlow && !this.isBooster) {
          this.targetSpeedFactor = 0.55; // 45km/h 등반
        } else if (!this.isGlidingSlow && !this.isBooster) {
          this.targetSpeedFactor = 1.35 * slopeBoost; // 130~175km/h
        }

        this.currentSpeedFactor += (this.targetSpeedFactor - this.currentSpeedFactor) * 0.09;
        this.t += this.baseSpeed * this.currentSpeedFactor;

        if (this.t >= 0.995) {
          this.t = 0.995;
          this.isPlaying = false;
          if (this.options.onFinish) this.options.onFinish();
        }

        this.checkGates();
        this.updateCamera(this.t);

        // 오디오 실시간 속도 연동
        if (window.CoasterAudio) {
          window.CoasterAudio.setRideSpeed(this.currentSpeedKm);
          if (this.t > 0.105) {
            window.CoasterAudio.stopLiftHill();
          }
        }
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
          // 게이트 30m 전 접근 시 강력한 브레이킹 (끼이익-!)
          if (dist > 0 && dist <= 0.014 && !this.isGlidingSlow) {
            this.currentGateIndex = i;
            this.isGlidingSlow = true;
            this.targetSpeedFactor = 0.12; // 15km/h 초저속 서행
            if (this.speedStreakGroup) this.speedStreakGroup.visible = false;

            if (window.CoasterAudio) {
              window.CoasterAudio.playBrakeScreech();
            }

            if (this.options.onGate) this.options.onGate(gate, i);
            break;
          }
        }
      }

      // km/h 속도 계산 (15km/h ~ 210km/h)
      const km = Math.round(105 * this.currentSpeedFactor);
      this.currentSpeedKm = km;
      if (this.options.onSpeedChange) {
        this.options.onSpeedChange(km, this.getSpeedMode());
      }
    }

    /**
     * 실감나는 롤러코스터 카메라 연출:
     * 1. 급강하 시 피치 아래로 급격히 꺾임
     * 2. 곡선 회전 시 최대 35도~45도 과감한 차체 뱅킹 롤링
     * 3. 고속 질주 시 FOV 85도까지 다이내믹 줌아웃 (속도감 왜곡)
     */
    updateCamera(t) {
      if (!this.curve || !this.camera) return;

      const clampedT = Math.min(0.998, Math.max(0.001, t));
      const pos = this.curve.getPointAt(clampedT);
      const lookAheadT = Math.min(0.999, clampedT + 0.016);
      const lookAhead = this.curve.getPointAt(lookAheadT);
      const tan = this.curve.getTangentAt(clampedT).normalize();

      // 카메라를 레일 중앙 바로 위 탑승객 눈높이에 위치 (y + 1.6m)
      this.camera.position.set(pos.x, pos.y + 1.6, pos.z);
      this.camera.lookAt(lookAhead.x, lookAhead.y + 1.3, lookAhead.z);

      // 커브 회전률에 따른 다이내믹 롤링 뱅킹 (최대 35도)
      const binormal = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const tanNext = this.curve.getTangentAt(lookAheadT).normalize();
      const curveDelta = tanNext.x - tan.x; // 좌우 회전량

      // 과감한 뱅킹 기울기 적용!
      const targetRoll = -curveDelta * 2.8;
      this.camera.rotation.z += targetRoll;

      // 속도 연동 FOV 다이내믹 왜곡: 저속 66도 -> 210km/h 시 86도
      const targetFOV = 66 + Math.min(22, this.currentSpeedFactor * 10);
      this.currentFOV += (targetFOV - this.currentFOV) * 0.1;
      this.camera.fov = this.currentFOV;
      this.camera.updateProjectionMatrix();

      // 스피드 스트릭을 카메라 앞에 동기화
      if (this.speedStreakGroup && this.speedStreakGroup.visible) {
        this.speedStreakGroup.position.copy(this.camera.position);
        this.speedStreakGroup.quaternion.copy(this.camera.quaternion);
      }
    }
  }

  window.MagmaCoasterEngine = MagmaCoasterEngine;
})(window);
