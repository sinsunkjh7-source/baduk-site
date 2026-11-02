/**
 * coaster3d.js - Three.js 3D 롤러코스터 트랙 & 1인칭 POV 카메라 시뮬레이터
 * 고속 질주, 90도 수직낙하, 360도 루프, 홀로그램 게이트, 스피드 파티클
 */
(function(window) {
  'use strict';

  class Coaster3D {
    constructor(canvasContainer, options = {}) {
      this.container = canvasContainer;
      this.options = options;

      // 트랙 파라미터 (t: 0.0 ~ 1.0)
      this.trackProgress = 0.0;
      this.currentSpeed = 0.00035; // 기본 속도
      this.targetSpeed = 0.00035;
      this.isPausedAtGate = false;
      this.currentGateIndex = -1;

      // 체크포인트 (게이트 위치 t)
      this.gatePoints = [
        { t: 0.18, solved: false, id: 0 }, // 제1관문: 낭떠러지 급강하 앞
        { t: 0.48, solved: false, id: 1 }, // 제2관문: 360도 루프 진입 앞
        { t: 0.78, solved: false, id: 2 }  // 제3관문: 초고속 워프 터널 앞
      ];

      // Three.js 객체들
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.curve = null;
      this.gateMeshes = [];
      this.warpParticles = null;
      this.sparkParticles = [];
      this.shakeIntensity = 0.0;

      this.init();
    }

    init() {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      // 1. 씬 생성
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x060719);
      this.scene.fog = new THREE.FogExp2(0x060719, 0.002);

      // 2. 카메라 생성 (FOV 75의 와이드 1인칭 시야각)
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);

      // 3. 렌더러 생성
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(this.renderer.domElement);

      // 4. 조명
      const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambLight);

      const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
      dirLight.position.set(50, 150, 50);
      this.scene.add(dirLight);

      const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 0.8);
      dirLight2.position.set(-50, -100, -50);
      this.scene.add(dirLight2);

      // 5. 우주 성운 & 별자리 배경
      this.createStarfield();

      // 6. 3D 롤러코스터 스플라인 곡선 & 레일 생성
      this.createTrack();

      // 7. 홀로그램 게이트 & 스피드 파티클 생성
      this.createGates();
      this.createSpeedLines();

      // 8. 리사이즈 핸들러
      window.addEventListener('resize', () => this.onResize());

      // 9. 애니메이션 루프 시작
      this.animate();
    }

    // 1,500개의 반짝이는 우주 별
    createStarfield() {
      const starGeo = new THREE.BufferGeometry();
      const count = 1800;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1600;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1600;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1600;

        // 사이언/마젠타/골드 별빛
        const r = Math.random();
        if (r < 0.33) {
          colors[i * 3] = 0.4; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
        } else if (r < 0.66) {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.4; colors[i * 3 + 2] = 0.8;
        } else {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.5;
        }
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const starMat = new THREE.PointsMaterial({
        size: 3.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.85
      });

      this.scene.add(new THREE.Points(starGeo, starMat));
    }

    // 3D 롤러코스터 레일 트랙 생성
    createTrack() {
      // 롤러코스터 핵심 궤적 포인트들
      const points = [
        // 0. 출발 스테이션
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 15, -60),
        // 1. 제1구간: 급경사 리프트 상승 ➔ 정상 체크포인트 (y=85)
        new THREE.Vector3(20, 50, -140),
        new THREE.Vector3(30, 85, -220), // 낭떠러지 게이트 1 앞 (t=0.18)

        // 2. 수직 낙하 (y=85 -> y=-25, 110m 급강하!)
        new THREE.Vector3(30, 40, -280),
        new THREE.Vector3(15, -25, -340),

        // 3. 고속 뱅킹 우회전 & 언덕 상승
        new THREE.Vector3(-60, -10, -380),
        new THREE.Vector3(-120, 30, -320),
        new THREE.Vector3(-140, 65, -240), // 루프 게이트 2 앞 (t=0.48)

        // 4. 360도 수직 루프 (Inversion loop)
        new THREE.Vector3(-140, 110, -180),
        new THREE.Vector3(-140, 50, -140),
        new THREE.Vector3(-100, -15, -100),

        // 5. S자 급커브 & 워프 터널 진입로 (t=0.78)
        new THREE.Vector3(-20, -5, -40),
        new THREE.Vector3(60, 20, 30),
        new THREE.Vector3(120, 45, 90), // 워프 게이트 3 앞

        // 6. 초고속 나선 하강 & 출발 스테이션으로 복귀
        new THREE.Vector3(140, 10, 150),
        new THREE.Vector3(80, -10, 120),
        new THREE.Vector3(20, 5, 50),
        new THREE.Vector3(0, 10, 0)
      ];

      this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.2);

      // 좌/우 듀얼 네온 레일 튜브 생성
      const railSegments = 700;
      const railRadius = 0.55;
      const railDist = 2.4; // 두 레일 사이 간격

      // 중심선 경로 포인트 샘플링
      const curvePoints = this.curve.getSpacedPoints(railSegments);
      const leftRailPoints = [];
      const rightRailPoints = [];

      for (let i = 0; i <= railSegments; i++) {
        const u = i / railSegments;
        const pt = curvePoints[i];
        const tangent = this.curve.getTangentAt(u).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

        leftRailPoints.push(pt.clone().add(side.clone().multiplyScalar(railDist / 2)));
        rightRailPoints.push(pt.clone().add(side.clone().multiplyScalar(-railDist / 2)));
      }

      const leftCurve = new THREE.CatmullRomCurve3(leftRailPoints, true);
      const rightCurve = new THREE.CatmullRomCurve3(rightRailPoints, true);

      const leftGeo = new THREE.TubeGeometry(leftCurve, railSegments, railRadius, 8, true);
      const rightGeo = new THREE.TubeGeometry(rightCurve, railSegments, railRadius, 8, true);

      // 사이언 & 에메랄드 네온 재질
      const leftMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.8
      });

      const rightMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.8
      });

      this.scene.add(new THREE.Mesh(leftGeo, leftMat));
      this.scene.add(new THREE.Mesh(rightGeo, rightMat));

      // 레일 침목(Cross Ties) 생성
      const tieGeo = new THREE.BoxGeometry(railDist + 0.6, 0.4, 0.9);
      const tieMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.3
      });

      const tieCount = 350;
      for (let i = 0; i < tieCount; i++) {
        const u = i / tieCount;
        const pt = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

        const tie = new THREE.Mesh(tieGeo, tieMat);
        tie.position.copy(pt);
        tie.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), side);
        this.scene.add(tie);
      }
    }

    // 체크포인트 홀로그램 에너지 게이트
    createGates() {
      this.gatePoints.forEach((g) => {
        const pt = this.curve.getPointAt(g.t);
        const tangent = this.curve.getTangentAt(g.t).normalize();

        // 6각형 미래형 에너지 실드 게이트
        const ringGeo = new THREE.RingGeometry(1.5, 9, 6);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
          wireframe: true
        });

        const shieldGeo = new THREE.CircleGeometry(7.5, 6);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35
        });

        const gateGroup = new THREE.Group();
        gateGroup.add(new THREE.Mesh(ringGeo, ringMat));
        gateGroup.add(new THREE.Mesh(shieldGeo, shieldMat));

        gateGroup.position.copy(pt);
        gateGroup.lookAt(pt.clone().add(tangent));

        this.scene.add(gateGroup);
        this.gateMeshes.push({ group: gateGroup, gate: g });
      });
    }

    // 고속 질주 워프 스피드 라인 (속도감 파티클)
    createSpeedLines() {
      const count = 300;
      const lineGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 6); // 각 선분당 2개 점

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 40;
        const y = (Math.random() - 0.5) * 40;
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
        opacity: 0.0 // 기본은 안 보이다가 고속일 때 선명해짐
      });

      this.speedLines = new THREE.LineSegments(lineGeo, lineMat);
      this.camera.add(this.speedLines);
      this.scene.add(this.camera);
    }

    // 게이트 문제 정답 맞혔을 때: 게이트 폭파 & 부스터 발사!
    resumeAfterSolve() {
      this.isPausedAtGate = false;
      this.targetSpeed = 0.0024; // 140km/h 초고속 롤러코스터 부스터!

      // 게이트 파괴 효과
      if (this.currentGateIndex >= 0 && this.gateMeshes[this.currentGateIndex]) {
        const mesh = this.gateMeshes[this.currentGateIndex].group;
        // 게이트 링 확산하며 소멸
        let scale = 1.0;
        const blast = () => {
          scale += 0.25;
          mesh.scale.set(scale, scale, scale);
          mesh.children.forEach(c => c.material.opacity *= 0.82);
          if (mesh.children[0].material.opacity > 0.05) {
            requestAnimationFrame(blast);
          } else {
            mesh.visible = false;
          }
        };
        blast();
      }

      // 화면 진동 임팩트
      this.shakeIntensity = 0.35;
    }

    // 오답 시 덜컹거림
    triggerWrong() {
      this.shakeIntensity = 0.45;
    }

    // 프레임 루프
    animate() {
      requestAnimationFrame(() => this.animate());

      // 1. 게이트 도달 감지
      if (!this.isPausedAtGate) {
        for (let i = 0; i < this.gatePoints.length; i++) {
          const g = this.gatePoints[i];
          if (!g.solved && Math.abs(this.trackProgress - g.t) < 0.0035) {
            // 게이트 앞 정지!
            this.trackProgress = g.t;
            this.isPausedAtGate = true;
            this.currentGateIndex = i;
            this.currentSpeed = 0;
            this.targetSpeed = 0;

            if (this.options.onGateReached) {
              this.options.onGateReached(i);
            }
            break;
          }
        }
      }

      // 2. 속도 스무딩 (부드러운 가속 / 감속)
      if (!this.isPausedAtGate) {
        // 급강하 구간(0.18 ~ 0.32)에서는 최대 속도 유지
        const isPlunging = (this.trackProgress > 0.18 && this.trackProgress < 0.35) ||
                           (this.trackProgress > 0.48 && this.trackProgress < 0.65) ||
                           (this.trackProgress > 0.78);

        if (isPlunging) {
          this.targetSpeed = 0.0022; // 쾌속 낙하
        } else {
          // 리프트 등반 구간 서행
          this.targetSpeed = 0.00045;
        }

        this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.05;
        this.trackProgress = (this.trackProgress + this.currentSpeed) % 1.0;
      }

      // 3. 카메라 위치 및 시선 트래킹
      if (this.curve) {
        const u = this.trackProgress;
        const camPos = this.curve.getPointAt(u);
        const lookTarget = this.curve.getPointAt((u + 0.015) % 1.0);
        const tangent = this.curve.getTangentAt(u).normalize();

        // 카트 좌석 높이(1.4 유닛 위)
        this.camera.position.set(camPos.x, camPos.y + 1.4, camPos.z);

        // 진행 방향 바라보기
        this.camera.lookAt(lookTarget.x, lookTarget.y + 1.2, lookTarget.z);

        // 4. 화면 흔들림 효과 (Screen Shake)
        if (this.shakeIntensity > 0.01) {
          this.camera.rotation.z += (Math.random() - 0.5) * this.shakeIntensity;
          this.camera.rotation.x += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
          this.shakeIntensity *= 0.92;
        }

        // 고속일 때 스피드 라인 투명도 조절
        if (this.speedLines) {
          const speedRatio = Math.min(this.currentSpeed / 0.0022, 1.0);
          this.speedLines.material.opacity = speedRatio * 0.85;

          // 오디오 바람 소리 볼륨 싱크
          if (window.CoasterAudio) {
            CoasterAudio.setWindSpeed(speedRatio);
          }
        }
      }

      // 5. 렌더
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
