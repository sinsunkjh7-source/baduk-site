/**
 * videoEngine.js - 실사 4K 롤러코스터 POV 하이브리드 엔진 (1안)
 * - 100% 실사 영상 기반 초고화질 (Mako B&M Hypercoaster 1080p)
 * - 부드러운 가변 재생 속도 제어: 리프트 쾌속 ➔ 게이트 앞 0.12x 슬로우 서행 ➔ 부스터 1.6x 폭풍 급강하
 */
(function(window) {
  'use strict';

  class VideoCoasterEngine {
    constructor(videoElement, options = {}) {
      this.video = videoElement;
      this.options = options;

      // 게이트 체크포인트 (영상 실제 타임스탬프 기준)
      // 1관문: 36.2초 (높이 61m 정상 정점, 73도 수직 낙하 직전!)
      // 2관문: 56.4초 (제2 에어타임 힐 정상)
      // 3관문: 78.5초 (호수 위 고속 뱅킹 턴 진입로)
      this.gatePoints = [
        { time: 36.2, solved: false, id: 0, name: "제1관문: 낭떠러지 급강하" },
        { time: 56.4, solved: false, id: 1, name: "제2관문: 에어타임 힐" },
        { time: 78.5, solved: false, id: 2, name: "제3관문: 초고속 은하 워프" }
      ];

      this.currentGateIndex = -1;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.currentSpeedKm = 0;
      this.targetPlaybackRate = 1.0;
      this.shakeIntensity = 0;

      this.init();
    }

    init() {
      if (!this.video) return;

      // 비디오 기본 설정
      this.video.playbackRate = 1.0;
      this.video.playsInline = true;

      // 타임업데이트 루프
      this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
      this.video.addEventListener('ended', () => {
        if (this.options.onFinish) this.options.onFinish();
      });

      // 스무스 재생 속도 보간 루프
      this.updateLoop();
    }

    setCourse(course) {
      if (!course) return;
      this.currentCourse = course;
      this.gatePoints = course.gates.map(g => ({ ...g, solved: false }));
      
      const currentSrc = this.video.currentSrc || this.video.src || '';
      if (!currentSrc.includes(course.videoSrc)) {
        this.video.src = course.videoSrc;
        this.video.load();
      }
      this.resetRide();
    }

    startRide() {
      this.isEmergencyStopped = false;
      this.isGlidingSlow = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);

      // 리프트 등반은 쾌속(1.4x)으로 진행
      this.targetPlaybackRate = 1.35;
      this.video.playbackRate = 1.35;

      // 영상 재생 시작 (버퍼링 없이 즉시 재생)
      const playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('비디오 재생 대기:', err);
          // 브라우저 정책으로 소리 포함 재생이 차단된 경우 음소거로 즉시 재생 보장
          this.video.muted = true;
          this.video.play().catch(e => console.error('비디오 강제 재생 실패:', e));
        });
      }
    }

    resetRide() {
      this.video.pause();
      this.video.currentTime = 5.0;
      this.video.playbackRate = 1.0;
      this.targetPlaybackRate = 1.0;
      this.isGlidingSlow = false;
      this.isEmergencyStopped = false;
      this.currentGateIndex = -1;
      this.gatePoints.forEach(g => g.solved = false);
    }

    onTimeUpdate() {
      if (this.isEmergencyStopped) return;

      const curTime = this.video.currentTime;

      // 1. 게이트 접근 감지: 정차하지 않고 0.12x (약 10km/h)로 부드럽게 슬로우 서행!
      if (!this.isGlidingSlow) {
        for (let i = 0; i < this.gatePoints.length; i++) {
          const g = this.gatePoints[i];
          if (!g.solved && curTime >= (g.time - 0.7) && curTime <= g.time) {
            this.isGlidingSlow = true;
            this.currentGateIndex = i;
            this.targetPlaybackRate = 0.12; // 10km/h 슬로우 모션 서행!

            if (this.options.onGateReached) {
              this.options.onGateReached(i);
            }
            break;
          }
        }
      }

      // 2. 게이트 통과 후 완주 체크
      const finishTime = (this.currentCourse && this.currentCourse.id === 'fury') ? 85.0 : 105.0;
      if (curTime >= finishTime && this.gatePoints.every(g => g.solved)) {
        if (this.options.onFinish) {
          this.options.onFinish();
        }
      }
    }

    // 정답 또는 시간초과 후 재가속 (1안 핵심!)
    resumeAfterSolve(isBoost = true) {
      this.isGlidingSlow = false;

      // 정답 시 1.7x (약 140km/h 폭풍 가속) / 시간초과 시 1.05x (일반 순항 85km/h)
      this.targetPlaybackRate = isBoost ? 1.75 : 1.05;

      if (this.currentGateIndex >= 0 && this.gatePoints[this.currentGateIndex]) {
        this.gatePoints[this.currentGateIndex].solved = true;
      }

      if (isBoost) {
        this.shakeIntensity = 18; // 부스터 화면 진동
        this.triggerBoosterFlash();
      }
    }

    // 탈락 시 비상 정차
    emergencyStop() {
      this.isEmergencyStopped = true;
      this.isGlidingSlow = false;
      this.targetPlaybackRate = 0;
      this.video.pause();
      this.currentSpeedKm = 0;
      this.shakeIntensity = 24;
    }

    triggerWrong() {
      this.shakeIntensity = 14;
    }

    triggerBoosterFlash() {
      const el = document.getElementById('speedMotionBlur');
      if (el) {
        el.style.opacity = '0.7';
        setTimeout(() => el.style.opacity = '0.0', 700);
      }
    }

    updateLoop() {
      requestAnimationFrame(() => this.updateLoop());

      if (this.isEmergencyStopped) {
        this.currentSpeedKm = 0;
        return;
      }

      // 부드러운 재생 속도 보간
      const diff = this.targetPlaybackRate - this.video.playbackRate;
      if (Math.abs(diff) > 0.02) {
        this.video.playbackRate = Math.max(0.08, this.video.playbackRate + diff * 0.1);
      }

      // 실시간 km/h 환산
      const curTime = this.video.currentTime;
      const rate = this.video.playbackRate;

      if (this.isGlidingSlow) {
        this.currentSpeedKm = Math.round(rate * 85); // 서행 약 10~12 km/h
      } else if (rate >= 1.5) {
        this.currentSpeedKm = Math.min(142, Math.round(rate * 80)); // 140 km/h 폭풍 급강하
      } else if (curTime < 34.0) {
        this.currentSpeedKm = Math.round(rate * 35); // 리프트 등반 (35~45 km/h)
      } else {
        this.currentSpeedKm = Math.round(rate * 82); // 일반 질주 (80~95 km/h)
      }

      // 화면 진동 쉐이크 감쇠
      if (this.shakeIntensity > 0.5) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        this.video.style.transform = `scale(1.05) translate(${sx}px, ${sy}px)`;
        this.shakeIntensity *= 0.88;
      } else {
        this.video.style.transform = 'scale(1.0)';
      }
    }
  }

  window.VideoCoasterEngine = VideoCoasterEngine;
})(window);