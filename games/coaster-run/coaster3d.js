/**
 * coaster3d.js - 실감나는 주변 경관 돌진 & 1인칭 롤러코스터 POV 시뮬레이터 (트랙 꼬임 수정 & 시야 확보)
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
      this.isPausedAtGate = false;
      this.currentGateIndex = -1;

      // 3대 관문 체크포인트
      this.gatePoints = [
        { t: 0.18, solved: false, id: 0 },
        { t: 0.48, solved: false, id: 1 },
        { t: 0.78, solved: false, id: 2 }
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

      // 1. 씬 생성
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x030712);
      this.scene.fog = new THREE.FogExp2(0x030712, 0.0016);

      // 2. 카메라 생성 (시야가 훤히 트인 FOV 75)
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);

      // 3. 렌더러
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(this.renderer.domElement);

      // 4. 조명
      const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.scene.add(ambLight);

      const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
      dirLight.position.set(60, 160, 60);
      this.scene.add(dirLight);

      const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.0);
      dirLight2.position.set(-60, -80, -60);
      this.scene.add(dirLight2);

      // 5. 우주 성운 & 별자리
      this.createStarfield();

      // 6. 매끄럽고 꼬임 없는 3D 롤러코스터 레일
      this.createTrack();

      // 7. 다가오는 주변 경관: 네온 아치 링 & 부유 행성
      this.createTunnelRings();
      this.createSurroundingScenery();

      // 8. 콕핏 노즈 & 헤드라이트 (시야 방해 없는 슬림형)
      this.createSlimCockpit();

      // 9. 게이트 & 스피드 파티클
      this.createGates();
      this.createSpeedLines();

      window.addEventListener('resize', () => this.onResize());
      this.animate();
    }

    createStarfield() {
      const starGeo = new THREE.BufferGeometry();
      const count = 2500;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1800;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1800;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1800;

        const r = Math.random();
        if (r < 0.4) {
          colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
        } else if (r < 0.75) {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.35; colors[i * 3 + 2] = 0.8;
        } else {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.4;
        }
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const starMat = new THREE.PointsMaterial({
        size: 3.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
      });

      this.scene.add(new THREE.Points(starGeo, starMat));
    }

    createTrack() {
      // 롤러코스터 궤적 포인트
      const points = [
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 15, -60),
        // 제1구간: 리프트 상승 ➔ 낭떠러지 정상
        new THREE.Vector3(20, 50, -140),
        new THREE.Vector3(30, 85, -220), // 게이트 1 앞 (t=0.18)

        // 제1구간: 낭떠러지 90도 수직 낙하 (y=85 ➔ y=-35)
        new THREE.Vector3(30, 30, -270),
        new THREE.Vector3(15, -35, -330),

        // 제2구간: 고속 우회전 ➔ 언덕 상승
        new THREE.Vector3(-60, -15, -360),
        new THREE.Vector3(-120, 20, -300),
        new THREE.Vector3(-140, 60, -220), // 게이트 2 앞 (t=0.48)

        // 360도 루프
        new THREE.Vector3(-140, 105, -160),
        new THREE.Vector3(-140, 40, -120),
        new THREE.Vector3(-90, -15, -80),

        // 제3구간: S자 워프 터널 앞
        new THREE.Vector3(-20, -5, -30),
        new THREE.Vector3(55, 20, 35),
        new THREE.Vector3(110, 45, 95), // 게이트 3 앞 (t=0.78)

        // 최종 질주 후 복귀
        new THREE.Vector3(130, 15, 150),
        new THREE.Vector3(75, -5, 120),
        new THREE.Vector3(20, 5, 50),
        new THREE.Vector3(0, 10, 0)
      ];

      this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.2);

      // 중심 척추 네온 튜브 (절대 꼬이지 않는 안정적인 튜브)
      const spineGeo = new THREE.TubeGeometry(this.curve, 600, 0.45, 8, true);
      const spineMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.85
      });
      this.scene.add(new THREE.Mesh(spineGeo, spineMat));

      // 레일 침목 (Cross Ties)
      const tieGeo = new THREE.BoxGeometry(3.0, 0.35, 0.8);
      const tieMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.3
      });

      const tieCount = 340;
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

    // ⭐ 다가오는 네온 링 터널: 카메라가 링 한가운데를 통과하며 극적인 원근감 부여 ⭐
    createTunnelRings() {
      const ringCount = 38;
      const ringGeo = new THREE.TorusGeometry(6.5, 0.25, 8, 30);

      for (let i = 0; i < ringCount; i++) {
        const u = (i / ringCount) % 1.0;
        const pt = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();

        const isDropZone = (u > 0.18 && u < 0.33) || (u > 0.48 && u < 0.63) || (u > 0.78);
        const ringColor = isDropZone ? 0xf59e0b : (i % 2 === 0 ? 0x38bdf8 : 0xec4899);

        const ringMat = new THREE.MeshBasicMaterial({
          color: ringColor,
          wireframe: true
        });

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pt).add(new THREE.Vector3(0, 1.4, 0));
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

        this.scene.add(ring);
      }
    }

    // ⭐ 다가오는 주변 행성 & 크리스탈 모놀리스 (트랙 좌우 18~35 유닛 안전 배치) ⭐
    createSurroundingScenery() {
      const rockGeo = new THREE.DodecahedronGeometry(9, 1);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.85,
        metalness: 0.2
      });

      const crystalGeo = new THREE.ConeGeometry(5, 26, 5);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.8
      });

      for (let i = 0; i < 35; i++) {
        const u = Math.random();
        const pt = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

        const sideDist = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 18);
        const heightOff = (Math.random() - 0.5) * 45;

        const pos = pt.clone().add(side.clone().multiplyScalar(sideDist));
        pos.y += heightOff;

        const isCrystal = Math.random() > 0.5;
        const mesh = new THREE.Mesh(isCrystal ? crystalGeo : rockGeo, isCrystal ? crystalMat : rockMat);
        mesh.position.copy(pos);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const scale = 0.9 + Math.random() * 1.6;
        mesh.scale.set(scale, scale, scale);

        this.scene.add(mesh);
      }

      // 급강하 구간 양옆 웅장한 가이드 타워 기둥
      const towerGeo = new THREE.CylinderGeometry(1.5, 2.5, 130, 8);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.5,
        metalness: 0.9
      });

      const dropPt = this.curve.getPointAt(0.24);
      [-22, 22].forEach(offset => {
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(dropPt.x + offset, 25, dropPt.z);
        this.scene.add(tower);
      });
    }

    // ⭐ 3. 전방 헤드라이트 조명 (시야를 완전히 개방한 1인칭 탑승 POV) ⭐
    createSlimCockpit() {
      const cockpitGroup = new THREE.Group();

      // 전방 레일을 환하게 비추는 듀얼 스포트라이트
      const spotLight = new THREE.SpotLight(0x38bdf8, 3.0, 160, Math.PI / 3.5, 0.45);
      spotLight.position.set(0, 0, -1.0);
      spotLight.target.position.set(0, -1.5, -28);
      cockpitGroup.add(spotLight);
      cockpitGroup.add(spotLight.target);

      this.camera.add(cockpitGroup);
    }

    createGates() {
      this.gatePoints.forEach((g) => {
        const pt = this.curve.getPointAt(g.t);
        const tangent = this.curve.getTangentAt(g.t).normalize();

        const ringGeo = new THREE.RingGeometry(1.5, 9.5, 6);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
          wireframe: true
        });

        const shieldGeo = new THREE.CircleGeometry(8, 6);
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

    createSpeedLines() {
      const count = 450;
      const lineGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 6);

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 44;
        const y = (Math.random() - 0.5) * 44;
        const z = -Math.random() * 70;
        const len = Math.random() * 12 + 10;

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
      this.scene.add(this.camera);
    }

    resumeAfterSolve() {
      this.isPausedAtGate = false;
      this.targetSpeed = 0.0026;

      if (this.currentGateIndex >= 0 && this.gateMeshes[this.currentGateIndex]) {
        const mesh = this.gateMeshes[this.currentGateIndex].group;
        let scale = 1.0;
        const blast = () => {
          scale += 0.28;
          mesh.scale.set(scale, scale, scale);
          mesh.children.forEach(c => c.material.opacity *= 0.8);
          if (mesh.children[0].material.opacity > 0.05) {
            requestAnimationFrame(blast);
          } else {
            mesh.visible = false;
          }
        };
        blast();
      }

      this.shakeIntensity = 0.42;
    }

    triggerWrong() {
      this.shakeIntensity = 0.48;
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      // 1. 게이트 도달 감지
      if (!this.isPausedAtGate) {
        for (let i = 0; i < this.gatePoints.length; i++) {
          const g = this.gatePoints[i];
          if (!g.solved && Math.abs(this.trackProgress - g.t) < 0.0035) {
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

      // 2. 속도 스무딩
      if (!this.isPausedAtGate) {
        const isPlunging = (this.trackProgress > 0.18 && this.trackProgress < 0.35) ||
                           (this.trackProgress > 0.48 && this.trackProgress < 0.65) ||
                           (this.trackProgress > 0.78);

        if (isPlunging) {
          this.targetSpeed = 0.0025; // 쾌속 낙하
        } else {
          this.targetSpeed = 0.00045; // 리프트 서행
        }

        this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.05;
        this.trackProgress = (this.trackProgress + this.currentSpeed) % 1.0;
      }

      // 3. 카메라 모션 & 뱅킹 틸트
      if (this.curve) {
        const u = this.trackProgress;
        const camPos = this.curve.getPointAt(u);
        const lookTarget = this.curve.getPointAt((u + 0.015) % 1.0);
        const tangent = this.curve.getTangentAt(u).normalize();
        const futureTangent = this.curve.getTangentAt((u + 0.02) % 1.0).normalize();

        this.camera.position.set(camPos.x, camPos.y + 1.4, camPos.z);
        this.camera.lookAt(lookTarget.x, lookTarget.y + 1.2, lookTarget.z);

        // 뱅킹 롤 각도 (코너 회전 시 자연스러운 기울임)
        const cross = new THREE.Vector3().crossVectors(tangent, futureTangent);
        this.camera.rotation.z += cross.y * 32;

        // 시야각(FOV) 워프 확대
        const speedRatio = Math.min(this.currentSpeed / 0.0025, 1.0);
        const targetFOV = 72 + speedRatio * 22; // 72° ➔ 94°
        if (Math.abs(this.camera.fov - targetFOV) > 0.2) {
          this.camera.fov += (targetFOV - this.camera.fov) * 0.08;
          this.camera.updateProjectionMatrix();
        }

        // 화면 흔들림
        if (this.shakeIntensity > 0.01) {
          this.camera.rotation.z += (Math.random() - 0.5) * this.shakeIntensity;
          this.camera.rotation.x += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
          this.shakeIntensity *= 0.92;
        }

        if (this.speedLines) {
          this.speedLines.material.opacity = speedRatio * 0.9;
          if (window.CoasterAudio) {
            CoasterAudio.setWindSpeed(speedRatio);
          }
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
