// ==============================================================================
// 🏰 체스키드(ChessKid) 완전 복제 통합 어플리케이션 셸 (BadukKid Shell Controller)
// 좌측 고정 사이드바 + 상단 서브 캡슐 탭 + 우측 마스터 코치(도원 대사) 모션그래픽
// ==============================================================================

(function (window) {
  'use strict';

  // 1. 체스키드 구조 서브 메뉴 및 캡슐형 탭 설정 (Information Architecture)
  const SECTION_CONFIG = {
    avatar: {
      title: '내 아바타 & 꾸미기',
      pills: [
        { id: 'me', label: '👦 내 캐릭터', icon: '👦' },
        { id: 'board', label: '🪵 바둑판 & 바둑돌 스킨', icon: '🪵' },
        { id: 'coaches', label: '🧙‍♂️ 마스터 코치 선택', icon: '🧙‍♂️' }
      ],
      defaultPill: 'me'
    },
    puzzles: {
      title: '사활 & 맥 퍼즐 모험',
      pills: [
        { id: '30stage', label: '🗺️ 30단계 보물섬 모험', icon: '🗺️' },
        { id: 'duel', label: '⚡ 1:1 실시간 사활 듀얼', icon: '⚡' },
        { id: 'library', label: '📚 15대 기법 라이브러리', icon: '📚' }
      ],
      defaultPill: '30stage'
    },
    bots: {
      title: '동물 AI 봇 대국',
      pills: [
        { id: 'animal', label: '🐾 6단계 동물 AI 봇', icon: '🐾' },
        { id: 'handicap', label: '⚔️ 2~9점 접바둑 도전', icon: '⚔️' },
        { id: 'master', label: '🦁 도장 챔피언 사자전', icon: '🦁' }
      ],
      defaultPill: 'animal'
    },
    play: {
      title: '대국 & 두뇌 놀이터',
      pills: [
        { id: 'p2p', label: '🌐 친구와 1:1 실시간 대국', icon: '🌐' },
        { id: 'omok', label: '⚪⚫ 15줄 두뇌 오목 대전', icon: '⚪⚫' },
        { id: 'alkkagi', label: '🎯 쫀득한 슬링샷 알까기', icon: '🎯' }
      ],
      defaultPill: 'p2p'
    },
    lessons: {
      title: '바둑 배움터',
      pills: [
        { id: 'lecture', label: '👨‍🏫 전자칠판 전면 강의', icon: '👨‍🏫' },
        { id: 'library', label: '📚 15대 기법 교재 전권', icon: '📚' },
        { id: 'curriculum', label: '📋 30단계 8분야 진도표', icon: '📋' }
      ],
      defaultPill: 'lecture'
    },
    teach: {
      title: '선생님 지도실',
      pills: [
        { id: 'editor', label: '🛠️ 원장님 문제 편집실', icon: '🛠️' },
        { id: 'curriculum', label: '📋 30단계 8분야 진도표', icon: '📋' },
        { id: 'lock', label: '🔒 수업 화면 잠금', icon: '🔒' }
      ],
      defaultPill: 'editor'
    },
    more: {
      title: '더보기 & 설정',
      pills: [
        { id: 'badges', label: '🎖️ 나의 획득 뱃지', icon: '🎖️' },
        { id: 'settings', label: '⚙️ 환경 & 착수음 설정', icon: '⚙️' }
      ],
      defaultPill: 'badges'
    }
  };

  class ChessKidShell {
    constructor() {
      this.currentSection = 'puzzles';
      this.currentSubTab = '30stage';
      this.isSidebarCollapsed = false;
      this.masterCoach = null;
      this.selectedAvatar = {
        id: 'taeo',
        name: '태오 (Taeo)',
        desc: '패기 넘치는 바둑 공격수! 사활 모험의 주인공',
        img: 'images/characters/char_taeo.jpg',
        emoji: '👦'
      };
      this.selectedBoardSkin = 'wood';
      this.selectedStoneStyle = 'classic';
      this.selectedCoach = 'doyuan';

      window.chesskidShell = this;
    }

    init() {
      console.log('[ChessKid Shell] 🏰 체스키드 통합 앱 셸 초기화 시작');
      this.initSidebarEvents();
      this.initMasterCoach();
      this.initAvatarCustomizer();
      this.initTopPortalSync();

      // 초기 뷰 렌더링
      this.renderPillTabs(this.currentSection, this.currentSubTab);
      this.updateActiveNavUI(this.currentSection, this.currentSubTab);

      // 모바일 감지 시 기본 접힘 상태 적용
      if (window.innerWidth <= 900) {
        this.toggleSidebar(true);
      }
    }

    // 1. 좌측 사이드바 이벤트 및 아코디언 제어
    initSidebarEvents() {
      // 아코디언 메뉴 토글 (대국실, 사활퍼즐, AI봇, 배움터 등)
      document.querySelectorAll('.ck-nav-group').forEach(group => {
        const header = group.querySelector('.ck-nav-item.has-sub');
        if (header) {
          header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 다른 그룹 닫고 현재 그룹 열기 (원클릭 아코디언)
            const isExpanded = group.classList.contains('expanded');
            document.querySelectorAll('.ck-nav-group').forEach(g => {
              if (g !== group) g.classList.remove('expanded');
            });
            group.classList.toggle('expanded', !isExpanded);
          });
        }
      });

      // 단독 메뉴 및 서브 메뉴 링크 클릭 시 라우팅
      document.querySelectorAll('.ck-nav-item[data-section], .ck-subnav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const section = link.dataset.section;
          const subTab = link.dataset.subtab || null;
          this.navigateTo(section, subTab);

          // 모바일 화면에서는 메뉴 클릭 후 사이드바 자동 접기
          if (window.innerWidth <= 900) {
            this.toggleSidebar(true);
          }
        });
      });

      // 사이드바 토글 버튼 (햄버거 메뉴)
      const btnToggleSidebar = document.getElementById('btnToggleSidebar');
      if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
          this.toggleSidebar();
        });
      }
    }

    toggleSidebar(forceState = null) {
      const sidebar = document.getElementById('chesskidSidebar');
      const mainStage = document.getElementById('chesskidMainStage');
      
      this.isSidebarCollapsed = (forceState !== null) ? forceState : !this.isSidebarCollapsed;

      if (sidebar) sidebar.classList.toggle('collapsed', this.isSidebarCollapsed);
      if (mainStage) mainStage.classList.toggle('expanded', this.isSidebarCollapsed);

      // 바둑판 캔버스 리사이즈 갱신
      const game = window.badukApp || window.gameApp || window.badukGame;
      if (game && typeof game.initCanvasSize === 'function') {
        setTimeout(() => game.initCanvasSize(), 250);
      }
    }

    // 2. 포털(대문) 상단 네비게이션과 앱 셸 연결 동기화
    initTopPortalSync() {
      window.enterAppFromPortal = (targetSection = 'puzzles', targetSubTab = null) => {
        const portal = document.getElementById('mainPortalOverlay');
        if (portal) {
          portal.classList.add('portal-hidden');
        }
        this.navigateTo(targetSection, targetSubTab);
      };

      window.openAvatarStudio = () => {
        const portal = document.getElementById('mainPortalOverlay');
        if (portal) {
          portal.classList.add('portal-hidden');
        }
        this.navigateTo('avatar', 'me');
      };
    }

    // 3. 글로벌 화면 전환 라우터 (어느 메뉴를 눌러도 통일된 앱 셸 내에서 전환)
    navigateTo(section, subTab = null) {
      if (!SECTION_CONFIG[section]) section = 'puzzles';
      const config = SECTION_CONFIG[section];
      const targetSub = subTab || config.defaultPill;

      this.currentSection = section;
      this.currentSubTab = targetSub;

      // 사이드바 및 아코디언 UI 활성 상태 동기화
      this.updateActiveNavUI(section, targetSub);

      // 상단 캡슐형 탭 렌더링
      this.renderPillTabs(section, targetSub);

      // 게임 엔진 모드 및 화면 전환
      this.dispatchSectionMode(section, targetSub);

      // 착수/전환 음향 효과
      if (window.badukAudio && typeof window.badukAudio.playStone === 'function') {
        window.badukAudio.playStone();
      }
    }

    updateActiveNavUI(section, subTab) {
      document.querySelectorAll('.ck-nav-item, .ck-subnav-link').forEach(el => {
        const s = el.dataset.section;
        const sub = el.dataset.subtab;
        let isMatch = false;
        if (sub) {
          isMatch = (s === section && sub === subTab);
        } else {
          isMatch = (s === section);
        }
        el.classList.toggle('active', isMatch);

        // 상위 그룹이 있으면 자동 펼치기
        if (isMatch) {
          const parentGroup = el.closest('.ck-nav-group');
          if (parentGroup) {
            parentGroup.classList.add('expanded');
          }
        }
      });
    }

    // 상단 중앙 캡슐형 서브 탭 동적 렌더링
    renderPillTabs(section, activePillId) {
      const pillContainer = document.getElementById('ckPillTabs');
      if (!pillContainer) return;

      const config = SECTION_CONFIG[section];
      if (!config || !config.pills) {
        pillContainer.innerHTML = '';
        return;
      }

      let html = '';
      config.pills.forEach(pill => {
        const isActive = (pill.id === activePillId) ? 'active' : '';
        html += `
          <button type="button" class="ck-pill-btn ${isActive}" data-section="${section}" data-subtab="${pill.id}">
            <span>${pill.label}</span>
          </button>
        `;
      });

      pillContainer.innerHTML = html;

      // 캡슐 탭 클릭 이벤트 바인딩
      pillContainer.querySelectorAll('.ck-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = btn.dataset.section;
          const sub = btn.dataset.subtab;
          this.navigateTo(s, sub);
        });
      });
    }

    // 각 섹션 및 서브탭에 따른 화면 제어
    dispatchSectionMode(section, subTab) {
      const game = window.badukApp || window.gameApp || window.badukGame;
      const avatarView = document.getElementById('viewAvatarCustomizer');
      const mainContent = document.querySelector('.main-content');
      const masterCoach = document.getElementById('masterCoachArea');

      // 1. 아바타 커스터마이저 전용 뷰 제어 (체스키드 Image 2)
      if (section === 'avatar') {
        if (avatarView) avatarView.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        this.renderAvatarSubTab(subTab);
        return;
      } else {
        if (avatarView) avatarView.style.display = 'none';
        if (mainContent) mainContent.style.display = 'flex';
      }

      // 2. 바둑판 우측 마스터 코치 제어 (퍼즐 및 강의 모드에서 활성화)
      if (masterCoach) {
        masterCoach.style.display = (section === 'puzzles' || section === 'lessons') ? 'flex' : 'none';
      }

      // 3. 각 메뉴별 게임 모드 동기화
      if (!game) return;

      if (section === 'puzzles') {
        if (subTab === 'duel') {
          game.switchMode('missions');
          if (this.masterCoach) this.masterCoach.say('⚡ 1:1 실시간 사활 듀얼에 도전해보자! 먼저 푸는 사람이 승리야!', 'excited');
        } else if (subTab === 'library') {
          if (game.bookSelector) game.bookSelector.show(0);
          if (this.masterCoach) this.masterCoach.say('📚 15대 핵심 기법 라이브러리야! 배우고 싶은 기법을 골라보렴.', 'idle');
        } else {
          game.switchMode('missions');
          if (this.masterCoach) this.masterCoach.say('🗺️ 30단계 보물섬 사활 모험! 흑돌을 살리는 멋진 수를 찾아봐!', 'thinking');
        }
      } else if (section === 'bots') {
        const modal = document.getElementById('onlineModal');
        if (modal) {
          modal.classList.add('show');
          if (window.switchMatchModalTab) window.switchMatchModalTab('ai');
        }
      } else if (section === 'play') {
        if (subTab === 'omok') {
          game.switchMode('omok');
        } else if (subTab === 'alkkagi') {
          game.switchMode('alkkagi');
        } else {
          // p2p 친구 대국
          const modal = document.getElementById('onlineModal');
          if (modal) {
            modal.classList.add('show');
            if (window.switchMatchModalTab) window.switchMatchModalTab('p2p');
          }
        }
      } else if (section === 'lessons') {
        if (subTab === 'lecture') {
          game.switchMode('lecture');
          if (this.masterCoach) this.masterCoach.say('👨‍🏫 선생님 전자칠판 모드란다. 자유롭게 돌을 놓으며 연구해보렴!', 'idle');
        } else if (subTab === 'library') {
          if (game.bookSelector) game.bookSelector.show(0);
        } else if (subTab === 'curriculum') {
          window.open('딥시크/커리큘럼.html', '_blank');
        }
      } else if (section === 'teach') {
        if (subTab === 'editor') {
          window.location.href = 'editor.html';
        } else if (subTab === 'curriculum') {
          window.open('딥시크/커리큘럼.html', '_blank');
        } else if (subTab === 'lock') {
          if (confirm('수업 사이트를 잠그시겠습니까?')) {
            if (window.lockSiteSession) window.lockSiteSession();
          }
        }
      } else if (section === 'more') {
        if (subTab === 'settings') {
          const sideSettings = document.getElementById('sideSettingsPanel');
          if (sideSettings) sideSettings.style.display = 'flex';
        } else {
          alert('🏆 매일 문제를 꾸준히 푼 어린이에게 수여되는 명예의 전당 뱃지입니다!');
        }
      }
    }

    // 아바타 서브 탭 전환
    renderAvatarSubTab(subTab) {
      const tabMe = document.getElementById('avatarSubTabMe');
      const tabBoard = document.getElementById('avatarSubTabBoard');
      const tabCoaches = document.getElementById('avatarSubTabCoaches');

      if (tabMe) tabMe.style.display = (subTab === 'me') ? 'block' : 'none';
      if (tabBoard) tabBoard.style.display = (subTab === 'board') ? 'block' : 'none';
      if (tabCoaches) tabCoaches.style.display = (subTab === 'coaches') ? 'block' : 'none';
    }

    // 아바타 커스터마이저 초기화 및 이벤트 연결
    initAvatarCustomizer() {
      // 1. 캐릭터 선택 칩 클릭
      document.querySelectorAll('.ck-option-chip[data-char]').forEach(chip => {
        chip.addEventListener('click', () => {
          document.querySelectorAll('.ck-option-chip[data-char]').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');

          const charId = chip.dataset.char;
          const name = chip.dataset.name;
          const desc = chip.dataset.desc;
          const emoji = chip.dataset.emoji;
          const img = chip.querySelector('img') ? chip.querySelector('img').src : '';

          this.selectedAvatar = { id: charId, name, desc, emoji, img };

          // 프리뷰 카드 갱신
          const preview = document.getElementById('heroAvatarPreview');
          const heroName = document.getElementById('heroAvatarName');
          const heroDesc = document.getElementById('heroAvatarDesc');

          if (preview) {
            if (img) {
              preview.innerHTML = `<img src="${img}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 30px;">`;
            } else {
              preview.textContent = emoji;
            }
          }
          if (heroName) heroName.textContent = name;
          if (heroDesc) heroDesc.textContent = desc;

          if (window.badukAudio && typeof window.badukAudio.playStone === 'function') {
            window.badukAudio.playStone();
          }
        });
      });

      // 2. 바둑판 스킨 선택
      document.querySelectorAll('.ck-skin-btn[data-board-skin]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.ck-skin-btn[data-board-skin]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const skin = btn.dataset.boardSkin;
          this.selectedBoardSkin = skin;

          const game = window.badukApp || window.gameApp || window.badukGame;
          if (game && typeof game.setBoardSkin === 'function') {
            game.setBoardSkin(skin);
          }
        });
      });

      // 3. 바둑돌 스타일 선택
      document.querySelectorAll('.ck-stone-btn[data-stone-style]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.ck-stone-btn[data-stone-style]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const style = btn.dataset.stoneStyle;
          this.selectedStoneStyle = style;

          const game = window.badukApp || window.gameApp || window.badukGame;
          if (game && typeof game.setStoneStyle === 'function') {
            game.setStoneStyle(style);
          }
        });
      });
    }

    saveAvatarSelection() {
      // 사이드바 프로필 갱신
      const ckAvatarWrap = document.getElementById('ckUserAvatarWrap');
      const ckUserName = document.getElementById('ckUserName');

      if (ckAvatarWrap && this.selectedAvatar.img) {
        ckAvatarWrap.innerHTML = `<img src="${this.selectedAvatar.img}" alt="${this.selectedAvatar.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
      }
      if (ckUserName) {
        ckUserName.textContent = this.selectedAvatar.name.split(' ')[0];
      }

      // 사활 모험으로 복귀
      alert(`🎉 ${this.selectedAvatar.name} 캐릭터가 성공적으로 적용되었습니다!`);
      this.navigateTo('puzzles', '30stage');
    }

    // 4. 바둑판 우측 마스터 코치(도원 대사님) 모션 그래픽 존
    initMasterCoach() {
      this.masterCoach = {
        say: (text, emotion = 'idle', duration = 0) => {
          const bubble = document.getElementById('masterSpeechBubble');
          const speechText = document.getElementById('masterSpeechText');
          const avatarImg = document.getElementById('masterCoachAvatarImg');
          const badge = document.getElementById('masterEmotionBadge');

          if (speechText) {
            speechText.innerHTML = text;
          } else if (bubble) {
            bubble.innerHTML = text;
          }

          if (bubble) {
            bubble.classList.remove('pop');
            void bubble.offsetWidth; // trigger reflow
            bubble.classList.add('pop');
          }

          if (badge) {
            const emojis = {
              'idle': '✨',
              'thinking': '🤔',
              'hint': '💡',
              'correct': '🎉',
              'wrong': '😅',
              'excited': '🔥'
            };
            badge.textContent = emojis[emotion] || '✨';
          }

          if (avatarImg) {
            avatarImg.className = 'master-coach-img ' + emotion;
          }

          if (duration > 0) {
            setTimeout(() => {
              this.masterCoach.say('돌의 활로를 잘 세어보고 다음 수를 찾아보자!', 'idle');
            }, duration);
          }
        },

        // 문제 출제 시
        onProblemStart: (title, desc) => {
          const prompt = desc || title || '흑돌을 살리는 멋진 수를 찾아보렴!';
          this.masterCoach.say(`🎯 <b>${prompt}</b>`, 'thinking');
        },

        // 힌트 요청 시
        onHint: (hintText) => {
          const t = hintText || '상대 돌의 활로가 가장 적은 곳을 찾아보렴!';
          this.masterCoach.say(`💡 <b>힌트:</b> ${t}`, 'hint');
        },

        // 정답 착수 시
        onCorrect: () => {
          const cheers = [
            '🎉 정답이야! 아주 날카로운 수였어!',
            '👏 완벽한 급소야! 정말 대단한데?',
            '⭐ 환상적인 수읽기야! 다음 문제도 가보자!',
            '🔥 멋져! 상대의 약점을 완벽하게 찔렀어!'
          ];
          const cheer = cheers[Math.floor(Math.random() * cheers.length)];
          this.masterCoach.say(cheer, 'correct');
        },

        // 오답 착수 시
        onWrong: () => {
          const comforts = [
            '🤔 음, 활로가 부족해! 다시 차근차근 세어보렴.',
            '😅 아쉽다! 상대 돌에 먼저 잡히지 않는 자리를 찾아봐.',
            '💪 괜찮아! 실수에서 배우는 거란다. 다시 두어보자!'
          ];
          const c = comforts[Math.floor(Math.random() * comforts.length)];
          this.masterCoach.say(c, 'wrong');
        }
      };

      // 마스터 코치 클릭 시 대화 말풍선 반응
      const masterFigure = document.getElementById('masterCoachFigure');
      if (masterFigure) {
        masterFigure.style.cursor = 'pointer';
        masterFigure.addEventListener('click', () => {
          const tips = [
            '바둑의 첫걸음은 활로(숨구멍)를 잘 살피는 것이란다!',
            '상대방이 둔 마지막 수의 의도를 먼저 파악해보렴.',
            '급할수록 천천히, 두 번 생각하고 착수해보자!',
            '잡으려 하기보다 내 돌을 먼저 튼튼하게 연결해보렴!'
          ];
          const tip = tips[Math.floor(Math.random() * tips.length)];
          this.masterCoach.say(`🧙‍♂️ ${tip}`, 'excited');
        });
      }

      window.masterCoach = this.masterCoach;
    }
  }

  // 전역 인스턴스 등록
  window.ChessKidShell = ChessKidShell;
  window.chesskidShell = new ChessKidShell();

})(typeof window !== 'undefined' ? window : global);
