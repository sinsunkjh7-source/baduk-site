/**
 * magmaEngine.js - 다이내믹 3D 마그마 화산 롤러코스터 엔진 (Three.js WebGL)
 * 
 * 주요 특징:
 * 1. 콕핏 & 손잡이를 쥔 두 손 3D 렌더링 (직접 탑승한 1인칭 체감 극대화)
 * 2. 155m 최고 정점 절벽 앞 아찔한 시야각 (아래가 안 보이는 블라인드 낭떠러지)
 * 3. 정답 해결 시 절벽 아래로 쿵- 숙여지며 145m 수직 90도 240km/h 급강하 다이브
 * 4. 원형 글로우 불꽃/불티 파티클 (Canvas Radial Gradient)
 * 5. 물리 기반 중력 가속도 & 실시간 레일 마찰음 + 바람 굉음 연동
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
      this.cockpitGroup = null;

      // 주행 상태
      this.isPlaying = false;
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.isBooster = false;
      this.currentGateIndex = -1;

      // 주행 진행도 (t: 0.0 ~ 1.0)
      this.t = 0.0;
      this.baseSpeed = 0.00065;
      this.currentSpeedFactor = 1.0;
      this.targetSpeedFactor = 1.0;
      this.currentSpeedKm = 0;
      this.currentFOV = 68;
      this.tipOverPitch = 0; // 정점 통과 시 절벽 틸트다운 오프셋

      // 5개 관문 위치 (정점 및 급경사 직전)
      this.gatePoints = [
        { id: 0, t: 0.16, solved: false }, // 제1관문: 155m 분화구 최고 정점 절벽 앞
        { id: 1, t: 0.35, solved: false }, // 제2관문: 115m 에어타임 언덕 정점 앞
        { id: 2, t: 0.54, solved: false }, // 제3관문: 흑요석 동굴 S자 뱅킹 진입 직전
        { id: 3, t: 0.72, solved: false }, // 제4관문: 125m 간헐천 수직 솟구침 직전
        { id: 4, t: 0.88, solved: false }  // 제5관문: 화산 360도 나선 급강하 헬릭스 직전
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
      const ambient = new THREE.AmbientLight(0xff4411, 0.85);
      this.scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0xffaa33, 1.2);
      dirLight.position.set(100, 300, 100);
      this.scene.add(dirLight);

      this.createDynamicTrack();
      this.createLavaSea();
      this.createEmbers();
      this.createSpeedStreaks();
      this.createVolcanoEnvironment();
      this.createGatePortals();
      // this.createCockpit();

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
     * 1인칭 카트 콕핏 & 손잡이를 꽉 쥔 두 손 3D 렌더링
     */
    createCockpit() {
      this.cockpitGroup = new THREE.Group();
      this.cockpitGroup.name = 'cockpitGroup';

      // 조명 효과: 코스터 전방 헤드라이트 & 용암 반사광 (트랙을 다이내믹하게 비춤)
      const headLight = new THREE.PointLight(0xfff5ea, 2.4, 5.0);
      headLight.position.set(0, 0.2, -0.3);
      this.cockpitGroup.add(headLight);

      const bounceLight = new THREE.PointLight(0xff5500, 3.0, 4.0);
      bounceLight.position.set(0, -0.6, -0.5);
      this.cockpitGroup.add(bounceLight);

      this.camera.add(this.cockpitGroup);
    } this.scene.add(this.camera);
    }

    /**
     * 다이내믹 롤러코스터 트랙 설계 (극적인 고저차, 정점 블라인드 낭떠러지, 45도 뱅킹)
     */
    createDynamicTrack() {
      const points = [
        new THREE.Vector3(0, 15, 0),         // 0. 출발역
        new THREE.Vector3(0, 85, -120),      // 1. 화산 리프트 등반 1차
        new THREE.Vector3(10, 155, -280),    // 2. ⭐ 분화구 155m 아득한 정상 정점 (제1관문: 아래가 안 보이는 블라인드 절벽)
        new THREE.Vector3(0, 12, -450),      // 3. 💥 143m 수직 90도 절벽 급강하 다이브! (바닥으로 추락)
        new THREE.Vector3(-150, 6, -640),    // 4. 용암 수면 초저공 질주 & 급격한 좌 45도 뱅킹 턴!
        new THREE.Vector3(-80, 115, -830),   // 5. ⭐ 솟구치는 에어타임 카멜백 언덕 정점 (제2관문)
        new THREE.Vector3(20, 8, -1010),     // 6. 지하 동굴 입구로 급강하
        new THREE.Vector3(120, -28, -1190),  // 7. ⭐ 흑요석 지하 동굴 심연 S자 뱅킹 진입로 (제3관문)
        new THREE.Vector3(60, 20, -1370),    // 8. 동굴 탈출 급상승
        new THREE.Vector3(-30, 125, -1550),  // 9. ⭐ 125m 간헐천 수직 솟구침 직전 (제4관문)
        new THREE.Vector3(-140, 35, -1740),  // 10. 화산 외벽 360도 나선 급강하 헬릭스
        new THREE.Vector3(-40, 50, -1920),   // 11. ⭐ 화산 폭발 분화구 입구 (제5관문)
        new THREE.Vector3(0, 15, -2120),     // 12. 최종 초광속 240km/h 탈출 직선로
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

      const railMatL = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff2200,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.8
      });

      const railMatR = new THREE.MeshStandardMaterial({
        color: 0xff7700,
        emissive: 0xff5500,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.8
      });

      this.scene.add(new THREE.Mesh(railGeomL, railMatL));
      this.scene.add(new THREE.Mesh(railGeomR, railMatR));

      // 레일 침목(Ties)
      const tieGeom = new THREE.BoxGeometry(3.6, 0.25, 0.5);
      const tieMat = new THREE.MeshStandardMaterial({ color: 0x1a0f0d, roughness: 0.9 });
      const tieGroup = new THREE.Group();

      for (let i = 0; i < 400; i++) {
        const u = i / 400;
        const pos = this.curve.getPointAt(u);
        const tan = this.curve.getTangentAt(u).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

        const tie = new THREE.Mesh(tieGeom, tieMat);
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
     * 원형 글로우 불꽃 파티클 텍스처 생성
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
     * 광선 스트릭
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
     * 현무암 화산 바위 기둥 협곡
     */
    createVolcanoEnvironment() {
      const pillarGeom = new THREE.CylinderGeometry(14, 22, 280, 6);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x140e0c,
        roughness: 0.95,
        metalness: 0.1
      });

      const group = new THREE.Group();
      for (let i = 0; i < 45; i++) {
        const p = new THREE.Mesh(pillarGeom, pillarMat);
        const z = -100 - i * 50;
        const side = (i % 2 === 0 ? 1 : -1) * (45 + Math.random() * 80);
        p.position.set(side, 30 + Math.random() * 40, z);
        p.rotation.y = Math.random() * Math.PI;
        p.rotation.z = (Math.random() - 0.5) * 0.25;
        group.add(p);
      }
      this.scene.add(group);
    }

    /**
     * 5개 관문 마그마 스타게이트 포털
     */
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

    startRide() {
      this.t = 0.0;
      this.isPlaying = true;
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.isBooster = false;
      this.currentGateIndex = -1;
      this.currentSpeedFactor = 0.8;
      this.targetSpeedFactor = 1.0;
      this.tipOverPitch = 0.0;

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
      this.tipOverPitch = 0.0;
      this.currentSpeedFactor = 0.8;
      this.targetSpeedFactor = 1.0;
      if (this.speedStreakGroup) this.speedStreakGroup.visible = false;
      if (window.CoasterAudio) {
        window.CoasterAudio.stopWind();
        window.CoasterAudio.stopLiftHill();
      }
      this.updateCamera(0.001);
    }

    /**
     * ⭐ 정답 해결 시 절벽 아래 틸트다운 & 240km/h 2단계 폭풍 다이브 연출 ⭐
     */
    triggerBooster() {
      this.isBooster = true;
      this.isGlidingSlow = false;

      // 1단계: 0.35초간 코스터 머리가 낭떠러지 아래로 쿵-! 숙여짐 (아래 절벽이 눈앞에 꽉 참!)
      this.tipOverPitch = -0.45; // 아래로 45도 급격히 시선 숙임
      if (this.options.onShake) this.options.onShake(1.2);

      setTimeout(() => {
        // 2단계: 콰아아앙-!! 마그마 부스터 240km/h 폭발 발진!
        this.tipOverPitch = 0.0;
        this.targetSpeedFactor = 2.6; // 240km/h!

        if (this.speedStreakGroup) {
          this.speedStreakGroup.visible = true;
          this.speedStreakGroup.children.forEach(m => {
            m.material.opacity = 0.88;
          });
        }

        if (this.options.onShake) this.options.onShake(2.0);
        if (window.CoasterAudio) {
          window.CoasterAudio.playBoosterLaunch();
        }

        setTimeout(() => {
          if (!this.isGlidingSlow) {
            this.targetSpeedFactor = 1.35; // 145km/h 순항
            if (this.speedStreakGroup) {
              this.speedStreakGroup.children.forEach(m => {
                m.material.opacity = 0.15;
              });
            }
          }
        }, 3600);
      }, 350);
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
      if (this.options.onShake) this.options.onShake(1.4);
    }

    getSpeedKm() {
      return this.currentSpeedKm || 0;
    }

    getSpeedMode() {
      if (this.isEmergencyStopped) return '비상 정차';
      if (this.isGlidingSlow) return '⚠️ 절벽 정점 서행 중';
      if (this.isBooster) return '🔥 240km/h 마그마 다이브!';
      if (this.t < 0.14) return '🧗 155m 정상 등반 중';
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

      // 콕핏 미세 진동 (속도에 따른 차체 및 손잡이 떨림)
      if (!this.cockpitOverlayEl) {
        this.cockpitOverlayEl = document.getElementById('cockpitOverlay');
      }
      if (this.cockpitOverlayEl) {
        if (this.isPlaying && !this.isEmergencyStopped) {
          const speedNorm = Math.min(1.5, this.currentSpeedKm / 180);
          const shakeX = (Math.random() - 0.5) * (speedNorm * 3.2);
          const shakeY = (Math.random() - 0.5) * (speedNorm * 2.2) + Math.sin(Date.now() * 0.02) * (speedNorm * 2.0);
          this.cockpitOverlayEl.style.transform = `translateX(calc(-50% + ${shakeX.toFixed(1)}px)) translateY(${shakeY.toFixed(1)}px)`;
        } else {
          this.cockpitOverlayEl.style.transform = 'translateX(-50%) translateY(0)';
        }
      }

      if (this.isPlaying && !this.isEmergencyStopped) {
        // 물리 기반 경사도 가속도 계산: 내리막길이면 가속, 오르막길이면 감속
        let slopeBoost = 1.0;
        if (this.curve && !this.isGlidingSlow) {
          const p1 = this.curve.getPointAt(this.t);
          const p2 = this.curve.getPointAt(Math.min(0.999, this.t + 0.01));
          const dy = p2.y - p1.y;
          if (dy < -0.35) {
            slopeBoost = 1.65; // 💥 급강하 시 폭발적 240km/h 가속!
          } else if (dy > 0.35) {
            slopeBoost = 0.75; // 급상승 시 묵직한 감속
          }
        }

        // 초기 리프트 힐 구간(t < 0.14)은 체인 등반
        if (this.t < 0.14 && !this.isGlidingSlow && !this.isBooster) {
          this.targetSpeedFactor = 0.55; // 45km/h 등반
        } else if (!this.isGlidingSlow && !this.isBooster) {
          this.targetSpeedFactor = 1.4 * slopeBoost; // 140~195km/h
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
          if (this.t > 0.14) {
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
          // 정점 직전 접근 시 강력한 브레이킹 (끼이익-!)
          if (dist > 0 && dist <= 0.022 && !this.isGlidingSlow) {
            this.currentGateIndex = i;
            this.isGlidingSlow = true;
            this.targetSpeedFactor = 0.10; // 12km/h 초저속 서행 (정점 절벽에 멈춰 섬)
            if (this.speedStreakGroup) this.speedStreakGroup.visible = false;

            if (window.CoasterAudio) {
              window.CoasterAudio.playBrakeScreech();
            }

            if (this.options.onGate) this.options.onGate(gate, i);
            break;
          }
        }
      }

      // km/h 속도 계산 (12km/h ~ 246km/h)
      const km = Math.round(105 * this.currentSpeedFactor);
      this.currentSpeedKm = km;
      if (this.options.onSpeedChange) {
        this.options.onSpeedChange(km, this.getSpeedMode());
      }
    }

    /**
     * 실감나는 롤러코스터 카메라 연출:
     * 1. 정상 정점 시야각: 수평을 유지해 아래 트랙이 보이지 않고 허공 낭떠러지만 아찔하게 보임!
     * 2. 정답 해결 시: tipOverPitch로 낭떠러지 아래를 향해 푹 꺾이며 145m 수직 다이브
     * 3. 곡선 회전 시: 최대 35도~45도 과감한 차체 뱅킹 롤링
     * 4. 고속 질주 시: FOV 88도까지 다이내믹 줌아웃 (시야 왜곡 스피드감)
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
      const tanNext = this.curve.getTangentAt(lookAheadT).normalize();
      const curveDelta = tanNext.x - tan.x;
      const targetRoll = -curveDelta * 2.8;
      this.camera.rotation.z += targetRoll;

      // 정점 다이브 틸트다운 (절벽 아래 꺾임 연출)
      if (this.tipOverPitch) {
        this.camera.rotation.x += this.tipOverPitch;
      }

      // 속도 연동 FOV 다이내믹 왜곡: 저속 66도 -> 240km/h 시 86도
      const targetFOV = 66 + Math.min(22, this.currentSpeedFactor * 9.5);
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
