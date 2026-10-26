// ==============================================================================
// 🏰 BadukSchool Official 1:1 Application Controller (Pure BadukSchool Replica)
// ==============================================================================

(function (window) {
  'use strict';

  const SECTION_CONFIG = {
    avatar: {
      title: '내 아바타',
      pills: [
        { id: 'me', label: '👦 내 정보', icon: '👦' },
        { id: 'board', label: '♟️ 바둑판·돌', icon: '♟️' },
        { id: 'coaches', label: '👑 코치', icon: '👑' }
      ],
      defaultPill: 'me'
    },
    play: {
      title: '대국',
      pills: [
        { id: 'fast', label: '⚡ 빠른 대국', icon: '⚡' },
        { id: 'slow', label: '⏱️ 느린 대국', icon: '⏱️' },
        { id: 'tournaments', label: '🏆 토너먼트', icon: '🏆' }
      ],
      defaultPill: 'fast'
    },
    puzzles: {
      title: '사활 문제',
      pills: [
        { id: 'puzzles', label: '🧩 오늘의 문제', icon: '🧩' },
        { id: 'duel', label: '⚡ 문제 대결', icon: '⚡' },
        { id: 'rush', label: '🔥 문제 러시', icon: '🔥' }
      ],
      defaultPill: 'puzzles'
    },
    bots: {
      title: 'AI 대국',
      pills: [
        { id: 'beginner', label: '🐣 입문 AI', icon: '🐣' },
        { id: 'intermediate', label: '🦊 중급 AI', icon: '🦊' },
        { id: 'master', label: '👑 상급 AI', icon: '👑' }
      ],
      defaultPill: 'beginner'
    },
    lessons: {
      title: '학습',
      pills: [
        { id: 'lessons', label: '📚 인터랙티브 학습', icon: '📚' },
        { id: 'videos', label: '🎥 영상 강의', icon: '🎥' }
      ],
      defaultPill: 'lessons'
    },
    connect: {
      title: '친구·랭킹',
      pills: [
        { id: 'leaderboard', label: '🏆 랭킹', icon: '🏆' },
        { id: 'clubs', label: '🏰 바둑 동아리', icon: '🏰' },
        { id: 'friends', label: '🤝 친구', icon: '🤝' }
      ],
      defaultPill: 'leaderboard'
    },
    more: {
      title: '더보기',
      pills: [
        { id: 'badges', label: '🎖️ 내 배지', icon: '🎖️' },
        { id: 'settings', label: '⚙️ 설정', icon: '⚙️' }
      ],
      defaultPill: 'badges'
    }
  };

  // Real 사활 문제
    // 실제 바둑 문제 (정통바둑 입문 1 — 활로·따내기·살리기·서로단수·연결)
  const BADUK_PUZZLES = [
    {
      id: 1,
      title: '1. 돌의 활로',
      desc: '1. 돌의 활로 흑은 백의 활로(살아가는 길)를 모두 막아 보세요.',
      question: '1. 돌의 활로 흑은 백의 활로(살아가는 길)를 모두 막아 보세요.',
      hint: '활로는 돌이 살아가는 길을 말합니다. 활로가 전부 막히게 되면 잡히게 됩니다.',
      size: 5,
      stones: [{x:2,y:2,c:2}, {x:3,y:2,c:1}, {x:2,y:1,c:1}, {x:1,y:2,c:1}],
      answer: [2, 3]
    },
    {
      id: 2,
      title: '2. 돌을 따내기',
      desc: '2. 돌을 따내기 흑이 둘 차례입니다. 단수되어 있는 백을 따내어 보세요.',
      question: '2. 돌을 따내기 흑이 둘 차례입니다. 단수되어 있는 백을 따내어 보세요.',
      hint: '활로가 하나밖에 없는 경우 단수라고 합니다. 단수된 상태에서 나머지 활로를 막게되면 그 돌을 잡게 됩니다.',
      size: 5,
      stones: [{x:2,y:2,c:2}, {x:1,y:2,c:1}, {x:2,y:1,c:1}],
      answer: [3, 2]
    },
    {
      id: 3,
      title: '3. 돌을 살리기',
      desc: '3. 돌을 살리기 흑이 둘 차례입니다. 단수되어 있는 흑△를 살리려면 어느 곳에 두어야 할까요?',
      question: '3. 돌을 살리기 흑이 둘 차례입니다. 단수되어 있는 흑△를 살리려면 어느 곳에 두어야 할까요?',
      hint: '활로가 모두 막힌 돌은 상대에게 잡힙니다. 따라서 단수가 되어 있는 돌을 살리려면 활로를 늘려야 합니다.',
      size: 6,
      stones: [{x:1,y:2,c:1}, {x:2,y:3,c:1}, {x:3,y:2,c:1}, {x:3,y:3,c:2}, {x:4,y:2,c:2}, {x:3,y:1,c:2}],
      answer: [2, 2]
    },
    {
      id: 4,
      title: '4. 서로 단수-1',
      desc: '4. 서로 단수 흑△와 백△가 서로 단수 되어 있습니다. 흑은 어디에 두어야 할까요?',
      question: '4. 서로 단수 흑△와 백△가 서로 단수 되어 있습니다. 흑은 어디에 두어야 할까요?',
      hint: '서로 단수는 먼저 두는 쪽이 내돌을 살리면서 동시에 상대방을 잡을 수 있어 유리합니다.',
      size: 6,
      stones: [{x:1,y:2,c:1}, {x:2,y:3,c:1}, {x:3,y:2,c:1}, {x:2,y:2,c:2}, {x:3,y:3,c:2}, {x:4,y:2,c:2}],
      answer: [2, 1]
    },
    {
      id: 5,
      title: '5. 돌의 연결과 끊음-1',
      desc: '5. 돌의 연결 흑이 둘 차례입니다. 흑△와 흑◎를 연결하여 보세요.',
      question: '5. 돌의 연결 흑이 둘 차례입니다. 흑△와 흑◎를 연결하여 보세요.',
      hint: '연결을 하면 활로가 늘어나서 살기 쉬워지고 튼튼한 모양이 됩니다.',
      size: 7,
      stones: [{x:3,y:3,c:1}, {x:3,y:1,c:1}, {x:1,y:3,c:2}, {x:2,y:2,c:2}, {x:4,y:2,c:2}, {x:5,y:3,c:2}],
      answer: [3, 2]
    }
  ];

  class BadukApp {
    constructor() {
      this.currentSection = 'avatar';
      this.currentSubTab = 'me';
      this.currentPuzzleIdx = 0;
      this.board = null;
      this.isSidebarCollapsed = false;

      this.selectedAvatar = {
        id: 'king_kid',
        name: 'King Kid',
        desc: '명랑한 바둑 챔피언! 금관을 썼어요.',
        emoji: '👑'
      };

      this.selectedBoardTheme = 'green';
      this.coachVoice = true;

      window.badukApp = this;
    }

    init() {
      console.log('[바둑스쿨] 🏰 Initializing authentic BadukSchool replica application...');
      this.initNavbarDropdowns();
      this.initSidebar();
      this.initMasterCoach();
      this.initAvatarCustomizer();
      this.initBoard();
      this.initPuzzleNav();

      // Start on In-App Shell (or Landing)
      this.renderPillTabs(this.currentSection, this.currentSubTab);
      this.switchViewPane(this.currentSection, this.currentSubTab);
    }

    // 1. Landing Dropdown Navigation
    initNavbarDropdowns() {
      document.querySelectorAll('.guest-toolbar-popup-menu, .ck-nav-dropdown-wrap').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = btn.classList.contains('open');
          document.querySelectorAll('.guest-toolbar-popup-menu, .ck-nav-dropdown-wrap').forEach(w => w.classList.remove('open'));
          if (!isOpen) btn.classList.add('open');
        });
      });

      window.addEventListener('click', () => {
        document.querySelectorAll('.guest-toolbar-popup-menu, .ck-nav-dropdown-wrap').forEach(w => w.classList.remove('open'));
      });
    }

    // 2. Landing <-> App Shell Transition
    enterApp(targetSection = 'avatar', targetSubTab = null) {
      const landing = document.getElementById('landingPage');
      if (landing) {
        landing.classList.add('hidden');
      }
      this.navigateTo(targetSection, targetSubTab);
    }

    showLanding() {
      const landing = document.getElementById('landingPage');
      if (landing) {
        landing.classList.remove('hidden');
      }
    }

    // 3. Persistent Left Sidebar
    initSidebar() {
      document.querySelectorAll('.ck-nav-group').forEach(group => {
        const header = group.querySelector('.ck-nav-item.has-sub');
        if (header) {
          header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isExp = group.classList.contains('expanded');
            document.querySelectorAll('.ck-nav-group').forEach(g => {
              if (g !== group) g.classList.remove('expanded');
            });
            group.classList.toggle('expanded', !isExp);
            /* 접을 때는 아래 navigateTo 로 넘기지 않는다.
               (넘기면 navigateTo 가 다시 expanded 를 붙여 닫히지 않는다) */
            if (isExp) e.stopImmediatePropagation();
          });
        }
      });

      document.querySelectorAll('.ck-nav-item[data-section], .ck-subnav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const sec = link.dataset.section;
          const sub = link.dataset.subtab || null;
          this.navigateTo(sec, sub);
        });
      });

      const btnToggle = document.getElementById('btnToggleSidebar');
      if (btnToggle) {
        btnToggle.addEventListener('click', () => {
          this.toggleSidebar();
        });
      }
    }

    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      const sb = document.getElementById('badukSidebar');
      if (sb) sb.classList.toggle('collapsed', this.isSidebarCollapsed);
    }

    // 4. Dynamic Pill Tabs Navigation
    navigateTo(section, subTab = null) {
      if (!SECTION_CONFIG[section]) section = 'avatar';
      const config = SECTION_CONFIG[section];
      const targetSub = subTab || config.defaultPill;

      this.currentSection = section;
      this.currentSubTab = targetSub;

      // Sidebar highlight sync
      document.querySelectorAll('.ck-nav-item, .ck-subnav-link').forEach(el => {
        const s = el.dataset.section;
        const sub = el.dataset.subtab;
        const isMatch = sub ? (s === section && sub === targetSub) : (s === section);
        el.classList.toggle('active', isMatch);
        if (isMatch) {
          const parent = el.closest('.ck-nav-group');
          if (parent) parent.classList.add('expanded');
        }
      });

      // Render Pill Tabs
      this.renderPillTabs(section, targetSub);

      // Switch View Pane
      this.switchViewPane(section, targetSub);

      // Play Sound
      if (window.badukAudio && typeof window.badukAudio.playStone === 'function') {
        window.badukAudio.playStone();
      }
    }

    renderPillTabs(section, activeSubId) {
      const container = document.getElementById('ckPillTabs');
      if (!container) return;

      const config = SECTION_CONFIG[section];
      if (!config || !config.pills) {
        container.innerHTML = '';
        return;
      }

      let html = '';
      config.pills.forEach(pill => {
        const isActive = (pill.id === activeSubId) ? 'active' : '';
        html += `
          <button type="button" class="ck-pill-btn ${isActive}" data-section="${section}" data-subtab="${pill.id}">
            <span>${pill.label}</span>
          </button>
        `;
      });
      container.innerHTML = html;

      container.querySelectorAll('.ck-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.navigateTo(btn.dataset.section, btn.dataset.subtab);
        });
      });
    }

    switchViewPane(section, subTab) {
      document.querySelectorAll('.ck-view-pane').forEach(p => p.classList.remove('active'));

      if (section === 'avatar') {
        const p = document.getElementById('viewAvatar');
        if (p) p.classList.add('active');
        this.renderAvatarSubTab(subTab);
      } else if (section === 'play') {
        const p = document.getElementById('viewPlay');
        if (p) p.classList.add('active');
      } else if (section === 'puzzles') {
        const p = document.getElementById('viewPuzzles');
        if (p) p.classList.add('active');
        this.loadPuzzle(0);
      } else if (section === 'bots') {
        const p = document.getElementById('viewBots');
        if (p) p.classList.add('active');
      } else if (section === 'lessons') {
        const p = document.getElementById('viewLessons');
        if (p) p.classList.add('active');
      } else if (section === 'connect') {
        const p = document.getElementById('viewConnect');
        if (p) p.classList.add('active');
      } else if (section === 'more') {
        const p = document.getElementById('viewMore');
        if (p) p.classList.add('active');
      }
    }

    // 5. Avatar Customizer (Image 2 Exact Replica)
    initAvatarCustomizer() {
      document.querySelectorAll('.ck-avatar-chip[data-char]').forEach(chip => {
        chip.addEventListener('click', () => {
          document.querySelectorAll('.ck-avatar-chip[data-char]').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');

          const charId = chip.dataset.char;
          const name = chip.dataset.name;
          const desc = chip.dataset.desc;
          const emoji = chip.dataset.emoji;

          this.selectedAvatar = { id: charId, name, desc, emoji };

          const preview = document.getElementById('avatarHeroPreview');
          const title = document.getElementById('avatarHeroName');
          const d = document.getElementById('avatarHeroDesc');

          if (preview) preview.innerHTML = `<span style="font-size: 5rem;">${emoji}</span>`;
          if (title) title.textContent = name;
          if (d) d.textContent = desc;

          if (window.badukAudio && typeof window.badukAudio.playStone === 'function') {
            window.badukAudio.playStone();
          }
        });
      });

      // Board Themes
      document.querySelectorAll('.ck-skin-btn[data-board-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.ck-skin-btn[data-board-theme]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const theme = btn.dataset.boardTheme;
          this.selectedBoardTheme = theme;
          if (this.board) {
            this.board.setTheme(theme);
          }
        });
      });
    }

    renderAvatarSubTab(subTab) {
      const pMe = document.getElementById('avatarPanelMe');
      const pBoard = document.getElementById('avatarPanelBoard');
      const pCoach = document.getElementById('avatarPanelCoaches');

      if (pMe) pMe.style.display = (subTab === 'me') ? 'flex' : 'none';
      if (pBoard) pBoard.style.display = (subTab === 'board') ? 'flex' : 'none';
      if (pCoach) pCoach.style.display = (subTab === 'coaches') ? 'flex' : 'none';
    }

    saveAvatar() {
      const sbAvatar = document.getElementById('sbUserAvatar');
      const sbName = document.getElementById('sbUserName');

      if (sbAvatar) sbAvatar.innerHTML = `<span style="font-size: 1.6rem;">${this.selectedAvatar.emoji}</span>`;
      if (sbName) sbName.textContent = this.selectedAvatar.name;

      alert(`🎉 Your avatar "${this.selectedAvatar.name}" has been saved!`);
      this.navigateTo('puzzles', 'puzzles');
    }

    // 6. Interactive 바둑판 & Puzzles
    initBoard() {
      this.board = new (window.BadukBoard || window.BadukSchoolBoard)('badukBoardContainer', 19);
      this.board.setTheme(this.selectedBoardTheme);
      this.board.onMoveCallback = (sr, sc, tr, tc, piece, target) => {
        this.checkPuzzleMove(sr, sc, tr, tc);
      };
    }

    initPuzzleNav() {
      document.querySelectorAll('.ck-step-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const n = parseInt(btn.dataset.step, 10);
          if (!isNaN(n)) this.loadPuzzle(n - 1);
        });
      });
    }

    loadPuzzle(idx) {
      this.currentPuzzleIdx = idx;
      this.puzzleSolved = false;
      const p = BADUK_PUZZLES[idx] || BADUK_PUZZLES[0];
      if (!this.board) return;

      this.board.setSize(p.size);
      this.board.setStones(p.stones, 'b');

      const titleEl = document.getElementById('puzzleTitle');
      const descEl = document.getElementById('puzzleDesc');
      if (titleEl) titleEl.textContent = p.title;
      if (descEl) descEl.textContent = p.desc;

      if (this.masterCoach) {
        this.masterCoach.say(`🐣 <b>${p.desc}</b>`, 'thinking');
      }

      document.querySelectorAll('.ck-step-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
        btn.classList.remove('solved');
      });
    }

    checkPuzzleMove(sr, sc, tr, tc) {
      const p = BADUK_PUZZLES[this.currentPuzzleIdx];
      if (!p || !this.board) return;

      // 이미 맞힌 문제에서 더 두면 되돌린다
      if (this.puzzleSolved) { this.board.undo(); return; }

      if (tr === p.answer[0] && tc === p.answer[1]) {
        this.puzzleSolved = true;
        if (this.masterCoach) this.masterCoach.onCorrect();
        const btn = document.querySelector(`.ck-step-btn[data-step="${this.currentPuzzleIdx + 1}"]`);
        if (btn) btn.classList.add('solved');
      } else {
        if (this.masterCoach) this.masterCoach.onWrong();
        setTimeout(() => { if (this.board) this.board.undo(); }, 320);
      }
    }

    showHint() {
      const p = BADUK_PUZZLES[this.currentPuzzleIdx];
      if (p && this.masterCoach) {
        this.masterCoach.onHint(p.hint || '활로와 연결을 살펴보세요.');
      }
    }

    // Play vs specific bot
    startBotGame(botName, botRating) {
      this.navigateTo('puzzles', 'puzzles');
      this.board.reset();
      if (this.masterCoach) {
        this.masterCoach.say(`⚔️ Playing against <b>${botName} (${botRating})</b>! Good luck!`, 'excited');
      }
    }

    // 7. Master Coach (바둑 선생님)
    initMasterCoach() {
      this.masterCoach = {
        say: (text, emotion = 'idle') => {
          const bubble = document.getElementById('coachSpeechBubble');
          const speechText = document.getElementById('coachSpeechText');
          const badge = document.getElementById('coachEmotionBadge');
          const frame = document.getElementById('coachMotionFrame');

          if (speechText) speechText.innerHTML = text;
          if (bubble) {
            bubble.classList.remove('pop');
            void bubble.offsetWidth;
            bubble.classList.add('pop');
          }

          if (badge) {
            const emojis = { 'idle': '👑', 'thinking': '🤔', 'hint': '💡', 'correct': '🎉', 'wrong': '😅', 'excited': '🔥' };
            badge.textContent = emojis[emotion] || '👑';
          }

          if (frame) {
            frame.className = 'ck-coach-motion-frame ' + emotion;
          }
        },

        onCorrect: () => {
          const cheers = [
            '🎉 정답! 아주 멋진 수예요!',
            '⭐ Outstanding tactical vision! 5 Stars for you!',
            '🔥 Wow! What a champion move!'
          ];
          this.masterCoach.say(cheers[Math.floor(Math.random() * cheers.length)], 'correct');
        },

        onWrong: () => {
          const comforts = [
            '🤔 Hmm, watch out for counterattacks! Try again.',
            '😅 Not quite! Look for the most forcing move (checks & captures)!'
          ];
          this.masterCoach.say(comforts[Math.floor(Math.random() * comforts.length)], 'wrong');
        },

        onHint: (hintText) => {
          this.masterCoach.say(`💡 <b>Coach Tip:</b> ${hintText}`, 'hint');
        }
      };

      const frame = document.getElementById('coachMotionFrame');
      if (frame) {
        frame.addEventListener('click', () => {
          const tips = [
            'Control the center of the board with your pawns and knights!',
            'Develop all your pieces before attacking with your Queen!',
            '초반에는 귀를 먼저 차지하세요!',
            'Look at all checks, captures, and threats on every move!'
          ];
          this.masterCoach.say(`👑 <b>바둑 선생님:</b> "${tips[Math.floor(Math.random() * tips.length)]}"`, 'idle');
        });
      }
    }
  }

  window.BadukApp = BadukApp;
  window.badukApp = new BadukApp();

  document.addEventListener('DOMContentLoaded', () => {
    window.badukApp.init();
  });

})(typeof window !== 'undefined' ? window : global);
