// ===================================================
// 바둑 어드벤처 - 전문 강의·놓아보기 & 미션 통합 컨트롤러
// ===================================================

const MISSIONS = [
  {
    id: 1,
    title: "돌의 활로(숨구멍)를 찾아라!",
    desc: "바둑판 한가운데 놓인 돌은 상·하·좌·우 4개의 숨구멍을 가지고 있습니다. 직선 길 중 하나를 클릭해 돌을 놓아보세요!",
    speech: "동서남북 사방으로 이어지는 활로를 찾아보세요.",
    initBoard: (size) => {
      const center = Math.floor(size / 2);
      return [{ x: center, y: center, color: 1 }];
    },
    targetPlayer: 1,
    checkSuccess: (engine, size) => {
      const center = Math.floor(size / 2);
      const { stones } = engine.getGroupAndLiberties(center, center);
      return stones.length >= 2;
    },
    successMessage: "멋져요! 돌이 연결되어 숨구멍이 더욱 넓어졌습니다! 🎉"
  },
  {
    id: 2,
    title: "위기 탈출! 단수(Atari)에서 벗어나기",
    desc: "백돌이 흑돌을 에워싸 숨구멍이 딱 1곳만 남았습니다! 잡히기 전에 마지막 숨구멍을 찾아 탈출하세요!",
    speech: "숨구멍이 하나 남았습니다. 빈 곳으로 탈출하세요.",
    initBoard: (size) => {
      const c = Math.floor(size / 2);
      return [
        { x: c, y: c, color: 1 },     // 중앙 흑돌
        { x: c, y: c - 1, color: 2 }, // 위 백돌
        { x: c, y: c + 1, color: 2 }, // 아래 백돌
        { x: c - 1, y: c, color: 2 }  // 왼쪽 백돌 (오른쪽 c+1, c만 비어있음)
      ];
    },
    targetPlayer: 1,
    checkSuccess: (engine, size) => {
      const c = Math.floor(size / 2);
      return engine.board[c][c + 1] === 1;
    },
    successMessage: "휴~ 살았습니다! 마지막 숨구멍으로 도망쳐 흑돌을 구출했습니다! 👏"
  },
  {
    id: 3,
    title: "상대 돌을 따내라! (포획 작전)",
    desc: "백돌이 단수에 걸려 있습니다! 마지막 남은 숨구멍을 메워 백돌을 따내 보세요!",
    speech: "상대 돌의 마지막 숨구멍을 메우면 따낼 수 있습니다.",
    initBoard: (size) => {
      const c = Math.floor(size / 2);
      return [
        { x: c, y: c, color: 2 },     // 중앙 백돌
        { x: c, y: c - 1, color: 1 }, // 위 흑돌
        { x: c, y: c + 1, color: 1 }, // 아래 흑돌
        { x: c - 1, y: c, color: 1 }  // 왼쪽 흑돌 (오른쪽 c+1, c만 비어있음)
      ];
    },
    targetPlayer: 1,
    checkSuccess: (engine) => {
      return engine.blackCaptures >= 1;
    },
    successMessage: "백돌을 성공적으로 따냈습니다! 🏆"
  }
];

const AVATARS = {
  fairy_black: { id: 'fairy_black', icon: '👦', name: '흑돌 요정', desc: '흑돌의 수호자' },
  fairy_white: { id: 'fairy_white', icon: '👧', name: '백돌 천사', desc: '백옥의 수호자' },
  tiger: { id: 'tiger', icon: '🐯', name: '호랑이 관장', desc: '용맹한 수읽기' },
  owl: { id: 'owl', icon: '🦉', name: '지혜 부엉이', desc: '침착한 사활 박사' },
  cat: { id: 'cat', icon: '🐱', name: '총명 냐옹이', desc: '발빠른 집짓기' },
  pup: { id: 'pup', icon: '🐶', name: '충직 바둑이', desc: '끈기의 수비왕' },
  knight: { id: 'knight', icon: '👑', name: '꼬마 기사단', desc: '정정당당 소년기사' },
  grandmaster: { id: 'grandmaster', icon: '🥋', name: '백발 사범님', desc: '전설의 9단 고수' }
};

const QUICK_CHAT_DATA = {
  greeting: [
    "반갑습니다! 좋은 대국 부탁드립니다. 🤝",
    "안녕하세요! 한 수 지도 부탁드립니다. 😊",
    "오늘도 즐겁게 바둑 두어요! ✨"
  ],
  praise: [
    "멋진 한 수네요! 👏",
    "생각이 참 깊으시네요! 💡",
    "정말 날카롭고 예리합니다! ⚡",
    "대단한 묘수입니다! 🎯"
  ],
  think: [
    "잠시 생각 중입니다. 기다려 주세요. ⏳",
    "어려운 장면이네요! 🤔",
    "수읽기를 깊게 해볼게요. 💭"
  ],
  ending: [
    "잘 배웠습니다! 감사합니다. 🙇",
    "좋은 승부였습니다! 👍",
    "다음에 또 한 판 부탁드려요! 👋"
  ],
  emoticon: [
    "👍 최고예요!",
    "💪 파이팅 힘내요!",
    "😮 와우 깜짝이야!",
    "🙏 정말 감사합니다!"
  ]
};

// 🌟 정답 성공 시 다채롭게 회전하는 확정1~확정79 칭찬 배지 (총 79종 고화질 3D 캐릭터 단일 대형 박스) 🌟
const CORRECT_SPEECHES = [
  "정답입니다! 반상의 급소를 정확하게 짚어낸 완벽한 한 수예요! 👏",
  "놀라운 통찰력입니다! 깊고 날카로운 안목이 돋보이네요! 👑",
  "와우! 눈 깜짝할 사이에 정답의 맥점을 시원하게 찾아냈군요! ⚡",
  "대단해요! 빈틈없는 수읽기로 문제를 멋지게 해결했습니다! 🏆",
  "감탄이 절로 나오는 착점이에요! 이보다 더 좋은 수는 없습니다! ✨",
  "반상의 변화를 한눈에 꿰뚫어 보았네요! 생각이 참 깊고 밝습니다! 💡",
  "차분하고 흔들림 없는 고수의 호흡이 느껴집니다! 정말 훌륭해요! 🥋",
  "문제를 풀 때마다 바둑 실력이 한 걸음씩 쑥쑥 자라나고 있어요! 🌱",
  "축하합니다! 고민 끝에 찾아낸 값진 승리의 한 수입니다! 🎉",
  "거침없는 기세로 완벽하게 돌파했습니다! 다음 문제도 자신 있게 가봅시다! 🚀"
];

const CORRECT_FEEDBACK_ITEMS = Array.from({ length: 79 }, (_, i) => {
  const num = i + 1;
  return {
    charImg: `images/characters/확정${num}.webp`,
    speech: CORRECT_SPEECHES[(num - 1) % CORRECT_SPEECHES.length]
  };
});

// 🌟 오답 시 다채롭게 회전하는 10가지 오답 배지 (오답1~오답10 고화질 단일 대형 박스) 🌟
const WRONG_SPEECHES = [
  "음~ 거기가 아니에요! 침착하게 전체 모양을 한 번 더 살펴볼까요? 🤔",
  "아깝네요! 좋은 생각이었지만 더 결정적인 급소가 숨어있어요! 💦",
  "한곳에만 얽매이지 말고, 주변 돌들과의 연결을 넓게 둘러보세요! 👀",
  "괜찮아요! 실패는 성공의 어머니! 씩씩하게 다시 도전해 봐요! 💪",
  "상대방이 어떻게 응수할지 한 수 앞을 조금만 더 깊이 상상해 보세요! 💭",
  "급할수록 돌아가라! 심호흡을 크게 한 번 하고 천천히 다시 찾아보세요. ⏳",
  "돌들의 약점이 어디인지 돋보기로 살피듯 꼼꼼하게 짚어보세요! 🔍",
  "누구나 실수할 수 있어요! 바둑은 포기하지 않는 사람이 이기는 법입니다! 🦁",
  "마음을 가다듬고 판을 바라보면 보이지 않던 묘수가 눈에 들어올 거예요! 🧘",
  "놓아보기를 이용해 먼저 수순을 연구해 보고 다시 두어보세요! 🔄"
];

const WRONG_FEEDBACK_ITEMS = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  return {
    charImg: `images/characters/오답${num}.webp`,
    speech: WRONG_SPEECHES[i % WRONG_SPEECHES.length]
  };
});

class BadukGameApp {
  constructor() {
    this.canvas = document.getElementById('badukCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.size = 9; // 기본 9줄

    this.engine = new BadukEngine(this.size);
    // 📚 학습 미션 문제 목록 (🌟 원장님 엄선 완성본 [제1단원: 돌의 활로 1] 최우선 연동)
    const CURATED_UNIT_1_VER = '20261013_hwalro_74_candidates_v2';
    let curatedProblems = null;
    if (typeof localStorage !== 'undefined') {
      const savedVer = localStorage.getItem('jh_curated_unit_1_ver');
      if (savedVer !== CURATED_UNIT_1_VER) {
        localStorage.removeItem('jh_curated_unit_1_confirmed');
        localStorage.removeItem('jh_curated_unit_1');
        localStorage.removeItem('jh_curated_unit_1_draft');
        localStorage.setItem('jh_curated_unit_1_ver', CURATED_UNIT_1_VER);
      }
      const confStr = localStorage.getItem('jh_curated_unit_1_confirmed');
      if (confStr) {
        try {
          const parsedConf = JSON.parse(confStr);
          if (Array.isArray(parsedConf) && parsedConf.length > 0) {
            curatedProblems = parsedConf;
          }
        } catch (e) {}
      }
      if (!curatedProblems && localStorage.getItem('jh_curated_unit_1')) {
        try {
          const parsed = JSON.parse(localStorage.getItem('jh_curated_unit_1'));
          if (parsed && Array.isArray(parsed.problems)) curatedProblems = parsed.problems;
        } catch (e) {}
      }
    }
    let targetChapterCode = 't1_ch01';
    if (typeof window !== 'undefined' && window.location.search) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const chParam = urlParams.get('chapter');
        if (chParam) targetChapterCode = chParam;
      } catch (e) {}
    }

    const introBook = (typeof window !== 'undefined' && (window.BOOK_DATA_stage1_morning_star || window.BOOK_DATA_tier1_intro || window.__BOOK_tier1_intro)) ? (window.BOOK_DATA_stage1_morning_star || window.BOOK_DATA_tier1_intro || window.__BOOK_tier1_intro) : null;
    let foundChapter = null;
    if (introBook && Array.isArray(introBook.chapters)) {
      foundChapter = introBook.chapters.find(c => c.chapterCode === targetChapterCode) || introBook.chapters[0];
    }

    if (foundChapter && Array.isArray(foundChapter.problems) && typeof BadukProblemAdapter !== 'undefined') {
      const pCount = foundChapter.problems.length;
      this.missions = foundChapter.problems.map((p, idx) => BadukProblemAdapter.adaptProblem(p, idx + 1, pCount, foundChapter.chapter, introBook.book, 'none'));
      this.currentBookInfo = {
        series: introBook.series || 'JH 바둑스쿨 코스',
        book: introBook.book || 'JH 바둑스쿨 1단계',
        chapter: foundChapter.chapter,
        bookCode: 'tier1_intro',
        chapterCode: foundChapter.chapterCode,
        mutation: 'none'
      };
    } else {
      this.missions = (typeof THINKTANK_CH1_PROBLEMS !== 'undefined') ? THINKTANK_CH1_PROBLEMS : MISSIONS;
    }
    if (Array.isArray(this.missions)) {
      this.missions.forEach(m => {
        if (!m.getQuadrant) {
          m.getQuadrant = () => (m.initialStones19 && m.initialStones19.some(s => s.x >= 10 || s.y >= 10)) ? 'BR' : 'NATIVE9';
        }
        if (!m.getStarPoints) {
          m.getStarPoints = (size) => {
            const q = m.getQuadrant();
            if (q === 'BR') return [{ x: size - 4, y: size - 4 }];
            if (q === 'BL') return [{ x: 3, y: size - 4 }];
            if (q === 'TL') return [{ x: 3, y: 3 }];
            if (q === 'TR') return [{ x: size - 4, y: 3 }];
            return [{ x: 4, y: 4 }];
          };
        }
      });
    }
    this.currentMissionIndex = 0;
    this.solvedMissions = new Set();
    this.isLectureMode = false;
    
    // 돌 모양 스타일 ('classic', 'adventurer', 'knight', 'cat', 'smile', 'galaxy')
    this.stoneStyle = localStorage.getItem('baduk_stone_style') || 'cat';
    
    // 바둑판 스킨 ('wood': 정통 비자목, 'green': 소프트 그린판)
    this.boardSkin = localStorage.getItem('baduk_board_skin') || 'wood';
    
    // 🎨 프리미엄 바둑돌 고화질 스프라이트 프리로딩
    this.stoneSprites = {};
    const spriteUrls = {
      cat_black: 'images/stone_cat_b.png?v=20261011_1040',
      cat_white: 'images/stone_cat_w.png?v=20261011_1040',
      smile_black: 'images/stone_smile_b.png?v=20261011_1040',
      smile_white: 'images/stone_smile_w.png?v=20261011_1040',
      galaxy_black: 'images/stone_galaxy_b.png?v=20261011_1040',
      galaxy_white: 'images/stone_galaxy_w.png?v=20261011_1040',
      robot_black: 'images/stone_robot_b.png?v=20261011_1040',
      robot_white: 'images/stone_robot_w.png?v=20261011_1040',
      crystal_black: 'images/stone_crystal_b.png?v=20261011_1040',
      crystal_white: 'images/stone_crystal_w.png?v=20261011_1040'
    };
    for (const [key, url] of Object.entries(spriteUrls)) {
      const img = new Image();
      img.src = url;
      img.onload = () => { if (this.canvas) this.render(); };
      this.stoneSprites[key] = img;
    }

    // 좌표 표시 모드 ('left-top', 'right-bottom', 'all-four', 'none')
    this.coordMode = 'left-top';

    // 보조 표시 토글 상태 (학습 문제 기본 셋팅: 활로 끄기, 단수 링 끄기, 땀방울 끄기)
    this.showStepNumbers = false;
    this.showLiberties = false;
    this.libertyDisplayMode = 'none'; // 'all' | 'black' | 'white' | 'none'
    this.showAtari = false;  // 🚨 단수 링 표시 (기본 OFF)
    this.showSweat = false;  // 💦 단수 땀방울 표시 (기본 OFF)

    // 온라인 대국 상태 관리
    this.isOnlineMatch = false;
    this.myOnlineColor = null; // 1: 흑, 2: 백

    this.isMissionActive = false;
    this.isTrialMode = false;
    this.autoAdvanceTimer = null;
    this.answerHighlight = null;
    this.correctFeedbackIndex = 0;
    this.wrongFeedbackIndex = 0;
    this.placementMode = 'alternate';
    this.nextTurn = 1;

    // ⚪⚫ 오목 대전 상태 관리
    this.isOmokMode = false;
    this.omokGameMode = 'ai'; // 'ai' | 'pvp'
    this.omokDifficulty = 'hard'; // 'easy' | 'normal' | 'hard' | 'master'
    this.omokPlayerColor = 1; // 1: 흑돌(선공), 2: 백돌(후공)
    this.omokAllowUndo = true; // 한 수 무르기 옵션
    this.omokTurn = 1; // 1: 흑, 2: 백
    this.omokBoard = []; // 2D array [y][x]
    this.omokHistory = []; // [{x, y, color, step}]
    this.omokGameOver = false;
    this.omokWinLine = null;
    this.omokBanDoubleThree = true; // 🚫 흑돌 3·3 금수 규칙 기본 ON
    this.omokAi = (typeof GomokuAI !== 'undefined') ? new GomokuAI(15) : null;
    this.isOmokAiThinking = false;

    // 🥏 알까기 배틀 상태 관리
    this.isAlkkagiMode = false;
    this.alkkagiEngine = (typeof AlkkagiEngine !== 'undefined') ? new AlkkagiEngine(this) : null;

    // 🎭 대국자 캐릭터 아바타 상태
    this.myAvatar = 'fairy_black';
    this.blackAvatar = 'fairy_black';
    this.whiteAvatar = 'fairy_white';

    // 💬 매너 퀵채팅 상태
    this.activeChatTab = 'greeting';

    // ⏱️ 대국 시간 및 계시기 상태
    this.timeRule = 'none';
    this.timeConfig = { main: 0, byo: 0, count: 0 };
    this.blackClock = { main: 0, byo: 0, count: 0, inByo: false };
    this.whiteClock = { main: 0, byo: 0, count: 0, inByo: false };
    this.clockInterval = null;

    this.initCanvasSize();
    this.bindEvents();

    // 🌟 9줄, 13줄, 19줄 모든 바둑판은 불필요한 돌 없이 100% 깨끗한 빈 바둑판으로 시작!
    this.engine.reset();
    this.updateStatus();
    this.render();

    // 온라인 매니저 기동
    this.onlineManager = new OnlineBadukManager(this);

    // 📚 5만 문제 교재 선택기 및 라이브러리 매니저 가동
    if (typeof BadukBookSelector !== 'undefined') {
      this.bookSelector = new BadukBookSelector(this);
    }

    // 기본 모드: URL에 ?mode=missions 또는 ?chapter 가 있으면 미션 모드로 시작, 아니면 강의 모드
    let startMode = 'lecture';
    if (typeof window !== 'undefined' && window.location.search) {
      try {
        const uParams = new URLSearchParams(window.location.search);
        if (uParams.get('mode') === 'missions' || uParams.get('chapter')) {
          startMode = 'missions';
        }
      } catch (e) {}
    }
    this.switchMode(startMode);

    // 🚀 피드백 이미지 사전 로드 시작 (초기 10종 즉시 + 나머지 백그라운드 프리로드)
    this.preloadInitialFeedbacks();
  }

  // 🚀 정답/오답 고화질 피드백 이미지 사전 백그라운드 캐싱 (딜레이 0초 즉시 렌더링)
  preloadInitialFeedbacks() {
    // 1. 오답 이미지 10종 전체 즉시 사전 캐싱
    WRONG_FEEDBACK_ITEMS.forEach(item => {
      if (item && item.charImg) {
        const img = new Image();
        img.src = item.charImg;
      }
    });

    // 2. 가장 자주 나오는 정답 이미지 초반 15종 즉시 캐싱
    for (let i = 0; i < Math.min(15, CORRECT_FEEDBACK_ITEMS.length); i++) {
      const src = CORRECT_FEEDBACK_ITEMS[i]?.charImg;
      if (src) {
        const img = new Image();
        img.src = src;
      }
    }

    // 3. 브라우저 유휴 시간(requestIdleCallback)에 나머지 정답 이미지들을 부드럽게 캐싱
    const preloadRest = () => {
      let idx = 15;
      const step = () => {
        const end = Math.min(idx + 10, CORRECT_FEEDBACK_ITEMS.length);
        for (let i = idx; i < end; i++) {
          const src = CORRECT_FEEDBACK_ITEMS[i]?.charImg;
          if (src) {
            const img = new Image();
            img.src = src;
          }
        }
        idx = end;
        if (idx < CORRECT_FEEDBACK_ITEMS.length) {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(step, { timeout: 2000 });
          } else {
            setTimeout(step, 100);
          }
        }
      };
      if ('requestIdleCallback' in window) {
        requestIdleCallback(step, { timeout: 2000 });
      } else {
        setTimeout(step, 200);
      }
    };
    preloadRest();
  }

  preloadUpcomingFeedbacks() {
    // 다음 문제 풀 때 나올 5장 미리 확보
    for (let i = 0; i < 5; i++) {
      const cSrc = CORRECT_FEEDBACK_ITEMS[(this.correctFeedbackIndex + i) % CORRECT_FEEDBACK_ITEMS.length]?.charImg;
      const wSrc = WRONG_FEEDBACK_ITEMS[(this.wrongFeedbackIndex + i) % WRONG_FEEDBACK_ITEMS.length]?.charImg;
      if (cSrc) { const img = new Image(); img.src = cSrc; }
      if (wSrc) { const img = new Image(); img.src = wSrc; }
    }
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const size = rect.width || 600;

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);
    this.displaySize = size;
    this.cellSize = size / (this.size + 1);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });

    // 키보드 단축키 (좌/우 방향키로 수순 탐색)
    window.addEventListener('keydown', (e) => {
      if (this.isOnlineMatch) return;
      if (e.key === 'ArrowLeft') {
        if (e.shiftKey) this.navFirst();
        else this.navPrev();
      } else if (e.key === 'ArrowRight') {
        if (e.shiftKey) this.navLast();
        else this.navNext();
      }
    });

    // 터치/클릭 중복 입력 방지 타임스탬프
    this.lastInputTime = 0;

    // 마우스 / 터치 입력
    const getAlkkagiPoint = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.displaySize / rect.width;
      const scaleY = this.displaySize / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.isAlkkagiMode && this.alkkagiEngine) {
        const pt = getAlkkagiPoint(e.clientX, e.clientY);
        this.alkkagiEngine.handlePointerDown(pt.x, pt.y);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isAlkkagiMode && this.alkkagiEngine) {
        const pt = getAlkkagiPoint(e.clientX, e.clientY);
        this.alkkagiEngine.handlePointerMove(pt.x, pt.y);
      } else {
        this.handleMouseMove(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isAlkkagiMode && this.alkkagiEngine) {
        this.alkkagiEngine.handlePointerUp();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isAlkkagiMode && this.alkkagiEngine) {
        // 바둑판 밖으로 마우스가 잠시 나가도 취소/발사하지 않고 윈도우 마우스업까지 여유롭게 조준 유지
      } else {
        this.hoverPos = null;
        this.render();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.isAlkkagiMode) return;
      const now = Date.now();
      if (now - this.lastInputTime < 300) return; // 터치 직후 클릭 중복 차단
      this.lastInputTime = now;
      this.handleClick(e);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      this.lastInputTime = Date.now();
      if (this.isAlkkagiMode && this.alkkagiEngine) {
        e.preventDefault();
        const touch = e.touches[0];
        const pt = getAlkkagiPoint(touch.clientX, touch.clientY);
        this.alkkagiEngine.handlePointerDown(pt.x, pt.y);
      } else {
        this.handleTouch(e);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isAlkkagiMode && this.alkkagiEngine) {
        e.preventDefault();
        const touch = e.touches[0];
        const pt = getAlkkagiPoint(touch.clientX, touch.clientY);
        this.alkkagiEngine.handlePointerMove(pt.x, pt.y);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      if (this.isAlkkagiMode && this.alkkagiEngine) {
        e.preventDefault();
        this.alkkagiEngine.handlePointerUp();
      }
    }, { passive: false });

    // 보드 규격 선택기 (9 / 13 / 19)
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const newSize = parseInt(e.target.dataset.size, 10);
        this.changeBoardSize(newSize);
      });
    });

    // 🌟 바둑판 스킨 선택기 (wood: 정통 나무판 / green: 소프트 그린판) 🌟
    this.applyBoardSkin(this.boardSkin);

    document.querySelectorAll('.board-skin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const skin = e.currentTarget.dataset.skin;
        this.applyBoardSkin(skin);
        localStorage.setItem('baduk_board_skin', skin);
      });
    });

    // 바둑돌 스타일 선택기 (1: 정통 명품돌, 2: 모험가돌, 3: 꼬마 기사단, 4: 냥이돌, 5: 스마일돌, 6: 은하수돌)
    document.querySelectorAll('.stone-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.style === this.stoneStyle);
    });

    document.querySelectorAll('.stone-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.stone-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.stoneStyle = e.currentTarget.dataset.style;
        localStorage.setItem('baduk_stone_style', this.stoneStyle);
        this.render();
      });
    });

    // 🌟 바탕화면 테마 선택기 ('theme1'~'theme5') 🌟
    const savedTheme = localStorage.getItem('baduk_bg_theme') || 'theme6';
    this.applyBackgroundTheme(savedTheme);
    this.initStarfieldMotion();
    this.initAutumnCloudsMotion();

    document.querySelectorAll('.bg-theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme;
        this.applyBackgroundTheme(theme);
        localStorage.setItem('baduk_bg_theme', theme);
      });
    });

    // 좌표 모드 순환 전환 (좌·상 -> 우·하 -> 사방 전체 -> 숨김)
    const btnCoord = document.getElementById('btnCoordMode');
    const coordSub = document.getElementById('coordStatusSub');
    if (btnCoord) {
      btnCoord.addEventListener('click', () => {
        const modes = ['left-top', 'right-bottom', 'all-four', 'none'];
        const labels = {
          'left-top': '좌·상',
          'right-bottom': '우·하',
          'all-four': '전체',
          'none': '숨김'
        };

        const nextIdx = (modes.indexOf(this.coordMode) + 1) % modes.length;
        this.coordMode = modes[nextIdx];
        if (coordSub) coordSub.textContent = labels[this.coordMode];
        btnCoord.classList.toggle('active', this.coordMode !== 'none');
        this.render();
      });
    }

    // 착수 소리 프리셋 선택기 (1: 명품 바둑돌, 2: 묵직한 통나무, 3: 경쾌한 딱!, 4: 귀여운 퐁퐁)
    const currentSoundType = window.badukAudio.soundType || 'classic';
    document.querySelectorAll('.sound-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sound === currentSoundType);
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.sound-type-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        window.badukAudio.setSoundType(e.currentTarget.dataset.sound);
        window.badukAudio.playStone(); // 미리듣기 테스트음
      });
    });

    // 🌟 볼륨 조절 슬라이더 및 마지막 볼륨 상태 복원 🌟
    const volSlider = document.getElementById('volumeSlider');
    if (volSlider) {
      // 저장된 볼륨 값 복원 (0~150%)
      const restoredVol = Math.round(window.badukAudio.volume * 100);
      volSlider.value = restoredVol;

      volSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        window.badukAudio.setVolume(val);
      });
      volSlider.addEventListener('change', () => {
        window.badukAudio.playStone(); // 볼륨 조절 완료 시 테스트음
      });
    }

    // 소리 켜기/끄기 아이콘 초기 동기화
    const soundIcon = document.getElementById('soundIcon');
    if (soundIcon) {
      soundIcon.textContent = window.badukAudio.enabled ? '🔊' : '🔇';
    }

    const btnLecture = document.getElementById('btnModeLecture');
    if (btnLecture) btnLecture.addEventListener('click', () => this.switchMode('lecture'));

    const btnMissions = document.getElementById('btnModeMissions');
    if (btnMissions) btnMissions.addEventListener('click', () => this.switchMode('missions'));

    const btnOnline = document.getElementById('btnModeOnline');
    if (btnOnline) btnOnline.addEventListener('click', () => this.switchMode('online'));

    const btnOmok = document.getElementById('btnModeOmok');
    if (btnOmok) btnOmok.addEventListener('click', () => this.switchMode('omok'));

    const btnAlkkagi = document.getElementById('btnModeAlkkagi');
    if (btnAlkkagi) btnAlkkagi.addEventListener('click', () => this.switchMode('alkkagi'));

    const btnCloseOnline = document.getElementById('btnCloseOnlineModal');
    if (btnCloseOnline) {
      btnCloseOnline.addEventListener('click', () => {
        if (!this.isOnlineMatch) {
          if (this.isMissionActive) this.switchMode('missions');
          else if (this.isOmokMode) this.switchMode('omok');
          else if (this.isAlkkagiMode) this.switchMode('alkkagi');
          else this.switchMode('lecture');
        }
      });
    }

    // ⚪⚫ 오목 컨트롤 버튼 리스너
    const btnOmokAi = document.getElementById('btnOmokModeAi');
    const btnOmokPvp = document.getElementById('btnOmokModePvp');
    const diffRow = document.getElementById('omokDiffRow');
    const colorBox = document.getElementById('omokColorBox');

    if (btnOmokAi) {
      btnOmokAi.addEventListener('click', () => {
        btnOmokAi.classList.add('active');
        if (btnOmokPvp) btnOmokPvp.classList.remove('active');
        if (diffRow) diffRow.style.display = 'flex';
        if (colorBox) colorBox.style.display = 'flex';
        this.omokGameMode = 'ai';
        this.restartOmok();
      });
    }
    if (btnOmokPvp) {
      btnOmokPvp.addEventListener('click', () => {
        btnOmokPvp.classList.add('active');
        if (btnOmokAi) btnOmokAi.classList.remove('active');
        if (diffRow) diffRow.style.display = 'none';
        if (colorBox) colorBox.style.display = 'none';
        this.omokGameMode = 'pvp';
        this.restartOmok();
      });
    }

    // ⚡ 난이도 버튼 클릭 이벤트 바인딩 (초급/중급/고급/👑 마스터)
    const diffBtns = document.querySelectorAll('.omok-diff-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.omokDifficulty = btn.dataset.diff || 'hard';
      });
    });

    // ⚔️ 내 돌 선택 버튼 클릭 이벤트 바인딩 (흑돌 / 백돌)
    const colorBtns = document.querySelectorAll('.omok-color-btn');
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.omokPlayerColor = parseInt(btn.dataset.color, 10) || 1;
        this.restartOmok();
      });
    });

    // ↩️ 한 수 무르기 옵션 체크박스
    const chkAllowUndo = document.getElementById('chkOmokAllowUndo');
    const btnOmokUndo = document.getElementById('btnOmokUndo');
    if (chkAllowUndo) {
      chkAllowUndo.addEventListener('change', (e) => {
        this.omokAllowUndo = Boolean(e.target.checked);
        if (btnOmokUndo) {
          btnOmokUndo.style.display = this.omokAllowUndo ? '' : 'none';
        }
      });
    }

    const chkBanDoubleThree = document.getElementById('chkOmokBanDoubleThree');
    if (chkBanDoubleThree) {
      chkBanDoubleThree.addEventListener('change', (e) => {
        this.omokBanDoubleThree = Boolean(e.target.checked);
      });
    }

    if (btnOmokUndo) btnOmokUndo.addEventListener('click', () => this.undoOmok());
    const btnOmokRestart = document.getElementById('btnOmokRestart');
    if (btnOmokRestart) btnOmokRestart.addEventListener('click', () => this.restartOmok());

    // 🥏 알까기 사이드 패널 컨트롤러 리스너 바인딩
    const btnAlkkagiAi = document.getElementById('btnAlkkagiModeAi');
    const btnAlkkagiPvp = document.getElementById('btnAlkkagiModePvp');
    const alkkagiDiffRow = document.getElementById('alkkagiDiffRow');
    const alkkagiColorBox = document.getElementById('alkkagiColorBox');

    if (btnAlkkagiAi) {
      btnAlkkagiAi.addEventListener('click', () => {
        btnAlkkagiAi.classList.add('active');
        if (btnAlkkagiPvp) btnAlkkagiPvp.classList.remove('active');
        if (alkkagiDiffRow) alkkagiDiffRow.style.display = 'flex';
        if (alkkagiColorBox) alkkagiColorBox.style.display = 'flex';
        if (this.alkkagiEngine) {
          this.alkkagiEngine.mode = 'ai';
          this.alkkagiEngine.initGame();
        }
      });
    }

    if (btnAlkkagiPvp) {
      btnAlkkagiPvp.addEventListener('click', () => {
        btnAlkkagiPvp.classList.add('active');
        if (btnAlkkagiAi) btnAlkkagiAi.classList.remove('active');
        if (alkkagiDiffRow) alkkagiDiffRow.style.display = 'none';
        if (alkkagiColorBox) alkkagiColorBox.style.display = 'none';
        if (this.alkkagiEngine) {
          this.alkkagiEngine.mode = 'pvp';
          this.alkkagiEngine.initGame();
        }
      });
    }

    // AI 난이도
    document.querySelectorAll('[data-alkkagi-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-alkkagi-diff]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.alkkagiEngine) {
          this.alkkagiEngine.difficulty = btn.dataset.alkkagiDiff || 'normal';
        }
      });
    });

    // 흑백 선택
    document.querySelectorAll('[data-alkkagi-color]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-alkkagi-color]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.alkkagiEngine) {
          this.alkkagiEngine.playerColor = parseInt(btn.dataset.alkkagiColor, 10) || 1;
          this.alkkagiEngine.initGame();
        }
      });
    });

    // 진형 배치
    document.querySelectorAll('[data-formation]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-formation]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.alkkagiEngine) {
          this.alkkagiEngine.formation = btn.dataset.formation || 'line5';
          this.alkkagiEngine.initGame();
        }
      });
    });

    // 새로고침/재시작
    const btnAlkkagiRestart = document.getElementById('btnAlkkagiRestart');
    if (btnAlkkagiRestart) {
      btnAlkkagiRestart.addEventListener('click', () => {
        if (this.alkkagiEngine) this.alkkagiEngine.initGame();
      });
    }

    document.getElementById('btnSound').addEventListener('click', () => this.toggleSound());

    // 미션 버튼
    document.getElementById('btnPrevMission').addEventListener('click', () => this.prevMission());
    document.getElementById('btnNextMission').addEventListener('click', () => this.nextMission());
    document.getElementById('btnResetMission').addEventListener('click', () => this.resetCurrentMission());

    // 📚 교재 선택 모달 열기 버튼
    const btnBookSelect = document.getElementById('btnOpenBookSelect');
    if (btnBookSelect) {
      btnBookSelect.addEventListener('click', () => {
        if (this.bookSelector) this.bookSelector.show();
      });
    }

    // 🌟 놓아보기 & 정답보기 버튼 🌟
    const btnTrial = document.getElementById('btnTrialMode');
    if (btnTrial) btnTrial.addEventListener('click', () => this.toggleTrialMode());

    const btnShowAns = document.getElementById('btnShowAnswer');
    if (btnShowAns) btnShowAns.addEventListener('click', () => this.showAnswer());

    // 🌟 키보드 방향키 수순 네비게이션 (←: 뒤로, →: 앞으로, Shift+←: 처음, Shift+→: 끝으로) 🌟
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) this.navFirst();
        else this.navPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) this.navLast();
        else this.navNext();
      }
    });

    // 🌟 놓아보기 착수 모드 선택 버튼들 (e.currentTarget으로 자식 요소 클릭 시에도 100% 안정적 동작) 🌟
    document.querySelectorAll('.placement-mode-group .tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        document.querySelectorAll('.placement-mode-group .tool-btn').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        const prevMode = this.placementMode;
        this.placementMode = targetBtn.dataset.placeMode || 'alternate';

        if (this.placementMode === 'blackOnly') {
          this.nextTurn = 1;
        } else if (this.placementMode === 'whiteOnly') {
          this.nextTurn = 2;
        } else if (this.placementMode === 'alternate') {
          // 🌟 마지막 착수 돌 색상의 반대부터 교차 착수 시작 🌟
          if (this.engine.currentStep > 0 && this.engine.moves.length > 0) {
            const lastMove = this.engine.moves[this.engine.currentStep - 1];
            if (lastMove && lastMove.color) {
              this.nextTurn = (lastMove.color === 1) ? 2 : 1;
            } else {
              this.nextTurn = 1;
            }
          } else {
            this.nextTurn = 1;
          }
        }
        this.updateStatus();
        this.render();
      });
    });

    // 🌟 놓아보기 수순 네비게이션 버튼들 🌟
    document.getElementById('btnNavFirst').addEventListener('click', () => this.navFirst());
    document.getElementById('btnNavPrev').addEventListener('click', () => this.navPrev());
    document.getElementById('btnNavNext').addEventListener('click', () => this.navNext());
    document.getElementById('btnNavLast').addEventListener('click', () => this.navLast());
    document.getElementById('btnClearBoard').addEventListener('click', () => this.clearBoard());

    // 🌟 상단 툴바 우측 로테이션 / 토글 버튼군 🌟
    // 1. 수순 번호 토글 (ON/OFF)
    const btnNumbers = document.getElementById('btnToggleNumbers');
    if (btnNumbers) {
      btnNumbers.addEventListener('click', () => {
        this.showStepNumbers = !this.showStepNumbers;
        btnNumbers.classList.toggle('active', this.showStepNumbers);
        this.render();
      });
    }

    // 2. 활로 표시 로테이션 토글 (끄기 ➔ ⚫⚪전부 ➔ ⚫흑만 ➔ ⚪백만)
    const btnLiberty = document.getElementById('btnToggleLiberty');
    const libSub = document.getElementById('libertyStatusSub');
    if (btnLiberty) {
      btnLiberty.addEventListener('click', () => {
        const modes = ['none', 'all', 'black', 'white'];
        const subLabels = {
          'none': '끄기',
          'all': '⚫⚪',
          'black': '⚫',
          'white': '⚪'
        };
        const nextIdx = (modes.indexOf(this.libertyDisplayMode || 'none') + 1) % modes.length;
        const nextMode = modes[nextIdx];
        this.setLibertyMode(nextMode);
        if (libSub) libSub.textContent = subLabels[nextMode];
        btnLiberty.classList.toggle('active', nextMode !== 'none');
      });
    }

    // 3. 단수 링 토글 (ON/OFF)
    const btnAtari = document.getElementById('btnToggleAtari');
    if (btnAtari) {
      btnAtari.addEventListener('click', () => {
        this.showAtari = !this.showAtari;
        btnAtari.classList.toggle('active', this.showAtari);
        this.render();
      });
    }

    // 4. 땀방울 토글 (ON/OFF)
    const btnSweat = document.getElementById('btnToggleSweat');
    if (btnSweat) {
      btnSweat.addEventListener('click', () => {
        this.showSweat = !this.showSweat;
        btnSweat.classList.toggle('active', this.showSweat);
        this.render();
      });
    }

    // 🌟 대국실 전용 액션 버튼 연결 🌟
    const btnUndo = document.getElementById('btnMatchUndo');
    if (btnUndo) btnUndo.addEventListener('click', () => this.onlineManager.requestUndo());

    const btnResign = document.getElementById('btnMatchResign');
    if (btnResign) btnResign.addEventListener('click', () => this.onlineManager.resign());

    const btnLeave = document.getElementById('btnMatchLeave');
    if (btnLeave) btnLeave.addEventListener('click', () => this.onlineManager.leaveRoom());

    // 대국 결과 모달 버튼
    const btnReview = document.getElementById('btnReviewGame');
    if (btnReview) btnReview.addEventListener('click', () => this.startReviewMode());

    const btnExit = document.getElementById('btnExitMatch');
    if (btnExit) btnExit.addEventListener('click', () => this.exitOnlineMatch());

    // 🎭 캐릭터 아바타 변경 클릭 연결
    const btnAvatarB = document.getElementById('avatarBtnBlack');
    if (btnAvatarB) {
      btnAvatarB.addEventListener('click', () => {
        if (!this.isOnlineMatch || this.myOnlineColor === 1) this.openAvatarModal();
      });
    }
    const btnAvatarW = document.getElementById('avatarBtnWhite');
    if (btnAvatarW) {
      btnAvatarW.addEventListener('click', () => {
        if (!this.isOnlineMatch || this.myOnlineColor === 2) this.openAvatarModal();
      });
    }

    // 아바타 모달 카드 클릭
    document.querySelectorAll('#avatarGrid .avatar-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.avatarId;
        this.selectMyAvatar(id);
      });
    });

    const avatarModal = document.getElementById('avatarSelectModal');
    if (avatarModal) {
      avatarModal.addEventListener('click', (e) => {
        if (e.target === avatarModal) avatarModal.classList.remove('show');
      });
    }

    // 💬 퀵채팅 탭 버튼
    document.querySelectorAll('.chat-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chat-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderQuickChatPhrases(btn.dataset.tab);
      });
    });

    // 모달 액션
    document.getElementById('modalBtnRestart').addEventListener('click', () => {
      document.getElementById('wisdomModal').classList.remove('show');
      this.loadMission(0);
    });
    document.getElementById('modalBtnNextChapter').addEventListener('click', async () => {
      document.getElementById('wisdomModal').classList.remove('show');
      
      // 다음 단원이 있으면 자동 전환, 없으면 교재 선택창 호출
      if (this.bookSelector && this.currentBookInfo && this.currentBookInfo.bookCode) {
        try {
          const bookData = await this.bookSelector.fetchBookData(this.currentBookInfo.bookCode);
          const currentIdx = bookData.chapters.findIndex(c => String(c.chapterCode) === String(this.currentBookInfo.chapterCode));
          if (currentIdx !== -1 && currentIdx + 1 < bookData.chapters.length) {
            const nextCh = bookData.chapters[currentIdx + 1];
            await this.bookSelector.startChapterDirectly(this.currentBookInfo.series, this.currentBookInfo.bookCode, nextCh.chapterCode);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      // 다음 단어가 없거나 책의 마지막이면 교재 선택창 열기
      if (this.bookSelector) {
        this.bookSelector.show();
      } else {
        this.loadMission(0);
      }
    });
  }

  prepareOnlineBoard() {
    this.engine.reset();
    this.render();
    this.updateStatus();
  }

  changeBoardSize(newSize) {
    this.size = newSize;
    this.engine.setSize(newSize);

    const container = document.querySelector('.app-container');
    container.classList.remove('size-9', 'size-11', 'size-13', 'size-19');
    container.classList.add(`size-${newSize}`);

    this.initCanvasSize();
    if (this.isMissionActive && !this.isLectureMode) {
      this.loadMission(this.currentMissionIndex || 0);
    } else {
      this.isMissionActive = false;
      this.currentMission = null;
      this.nextTurn = 1;
      this.engine.reset();
    }
    const toolbar = document.getElementById('lectureToolbar');
    if (toolbar) toolbar.style.display = (!this.isOnlineMatch) ? 'flex' : 'none';
    this.updateStatus();
    this.render();

    setTimeout(() => {
      this.initCanvasSize();
      this.render();
    }, 40);
  }

  // 🌟 바탕화면 테마 적용 ('theme1', 'theme2', 'theme3', 'theme4', 'theme5') 🌟
  applyBackgroundTheme(theme) {
    const aliasMap = {
      'clean': 'theme1',
      'sky': 'theme2',
      'wood': 'theme3',
      'night': 'theme4',
      'meadow': 'theme5',
      'starry': 'theme6',
      'autumn': 'theme7',
      'clouds': 'theme7',
      '1': 'theme1',
      '2': 'theme2',
      '3': 'theme3',
      '4': 'theme4',
      '5': 'theme5',
      '6': 'theme6',
      '7': 'theme7'
    };
    const targetTheme = aliasMap[theme] || theme || 'theme6';
    const validThemes = ['theme1', 'theme2', 'theme3', 'theme4', 'theme5', 'theme6', 'theme7'];
    const activeTheme = validThemes.includes(targetTheme) ? targetTheme : 'theme6';
    this.currentBgTheme = activeTheme;

    // 기존 및 신규 body 테마 클래스 모두 초기화 후 추가
    ['theme1', 'theme2', 'theme3', 'theme4', 'theme5', 'theme6', 'theme7', 'clean', 'sky', 'wood', 'night', 'meadow', 'starry', 'autumn', 'clouds'].forEach(t => {
      document.body.classList.remove(`bg-theme-${t}`);
    });
    document.body.classList.add(`bg-theme-${activeTheme}`);

    // 헤더 버튼 active 클래스 갱신
    document.querySelectorAll('.bg-theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === activeTheme);
    });

    const starCanvas = document.getElementById('starfieldCanvas');
    if (starCanvas) {
      starCanvas.style.display = (activeTheme === 'theme6' || activeTheme === 'starry') ? 'block' : 'none';
    }
    const cloudCanvas = document.getElementById('cloudsCanvas');
    if (cloudCanvas) {
      cloudCanvas.style.display = (activeTheme === 'theme7' || activeTheme === 'autumn' || activeTheme === 'clouds') ? 'block' : 'none';
    }
  }

  // 🌌 신비한 별빛 밤하늘과 서서히 흐르는 별무리 & 유성 모션그래픽
  initStarfieldMotion() {
    const canvas = document.getElementById('starfieldCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // 🌟 제일 작은 별 100개 추가 증량 (총 770개) 및 별들의 이동 속도 10% 추가 가속 (* 1.21)
    const cols = 35;
    const rows = 22; // 35 * 22 = 770개 (작은 별을 약 700개로 100개 추가 증량)
    const stars = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isSmall = Math.random() < 0.90; // 약 700개는 제일 자그마한 반짝이 별
        stars.push({
          x: ((c + Math.random()) / cols) * width,
          y: ((r + Math.random()) / rows) * height,
          radius: isSmall ? (0.65 + Math.random() * 0.85) : (1.6 + Math.random() * 1.3),
          baseAlpha: isSmall ? (0.42 + Math.random() * 0.58) : (0.45 + Math.random() * 0.55),
          twinkleSpeed: isSmall ? (0.02 + Math.random() * 0.045) : (0.016 + Math.random() * 0.035),
          twinklePhase: Math.random() * Math.PI * 2,
          // 별들의 이동 속도 10% 추가 가속 (1.331 * 1.1 = 1.4641)
          vx: ((Math.random() - 0.5) * 0.09 - 0.05) * 1.4641,
          vy: ((Math.random() - 0.5) * 0.07 - 0.03) * 1.4641,
          color: Math.random() < 0.25 ? '#bae6fd' : (Math.random() < 0.45 ? '#fef08a' : '#ffffff')
        });
      }
    }

    const meteors = [];

    // 좌우 균형을 위한 토글 (한쪽으로만 쏠리지 않고 화면 전체에 좌우 골고루 출현)
    let nextSideLeft = Math.random() < 0.5;

    const spawnMeteor = () => {
      // 절대 동시에 2개 이상 떨어지지 않도록 보장 (화면에 유성이 있으면 건너뜀)
      if (meteors.length > 0) return;

      // 좌측 반쪽과 우측 반쪽에서 골고루 번갈아(약간의 불규칙성 포함) 출현
      const useLeftHalf = Math.random() < 0.75 ? nextSideLeft : !nextSideLeft;
      nextSideLeft = !useLeftHalf;

      let startX, angle;
      if (useLeftHalf) {
        // 화면 좌측 영역 (화면 밖으로 바로 사라지지 않도록 시작점에 맞춰 낙하 각도 조절)
        startX = width * (0.04 + Math.random() * 0.35);
        angle = (startX < width * 0.18)
          ? (Math.PI * 0.28 + (Math.random() - 0.5) * 0.16)  // 우하향
          : (Math.PI * 0.68 + (Math.random() - 0.5) * 0.16); // 좌하향 (좌측 여백 쪽으로 흐름)
      } else {
        // 화면 우측 영역
        startX = width * (0.61 + Math.random() * 0.35);
        angle = (startX > width * 0.82)
          ? (Math.PI * 0.68 + (Math.random() - 0.5) * 0.16)  // 좌하향
          : (Math.PI * 0.28 + (Math.random() - 0.5) * 0.16); // 우하향 (우측 여백 쪽으로 흐름)
      }

      const startY = Math.random() * (height * 0.32);
      const length = 140 + Math.random() * 80;
      const speed = 13 + Math.random() * 5;

      meteors.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: length,
        life: 0,
        maxLife: 50,
        thickness: 2.1
      });
    };

    // 첫 유성 2.5초 후 1개 출현
    setTimeout(() => spawnMeteor(), 2500);

    // 화면 전체 단일 스케줄러: 한 번에 오직 1개씩만, 5~9초의 여유로운 간격으로 좌우 골고루 출현
    const scheduleMeteor = () => {
      const delay = 5000 + Math.random() * 4000;
      setTimeout(() => {
        if (this.currentBgTheme === 'theme6' || this.currentBgTheme === 'starry') {
          spawnMeteor();
        }
        scheduleMeteor();
      }, delay);
    };
    scheduleMeteor();

    const loop = () => {
      if (this.currentBgTheme === 'theme6' || this.currentBgTheme === 'starry') {
        const bgGrad = ctx.createRadialGradient(width * 0.5, height, 50, width * 0.5, height * 0.5, Math.max(width, height) * 0.9);
        bgGrad.addColorStop(0, '#1a2244');
        bgGrad.addColorStop(0.5, '#0b0f22');
        bgGrad.addColorStop(1, '#04060d');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 1. 별 그리기
        for (const s of stars) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < 0) s.x = width;
          if (s.x > width) s.x = 0;
          if (s.y < 0) s.y = height;
          if (s.y > height) s.y = 0;

          s.twinklePhase += s.twinkleSpeed;
          const currentAlpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.twinklePhase));

          ctx.save();
          ctx.globalAlpha = Math.max(0.12, Math.min(1, currentAlpha));
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();

          if (s.radius > 1.8) {
            ctx.globalAlpha = currentAlpha * 0.4;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius * 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 2. 유성 그리기
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.dx;
          m.y += m.dy;
          m.life++;

          const progress = m.life / m.maxLife;
          const fade = progress < 0.25 ? (progress / 0.25) : (1 - (progress - 0.25) / 0.75);

          if (fade > 0) {
            const dist = Math.hypot(m.dx, m.dy);
            const tailX = m.x - (m.dx / dist) * m.length;
            const tailY = m.y - (m.dy / dist) * m.length;

            const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.5, `rgba(147, 197, 253, ${0.45 * fade})`);
            grad.addColorStop(0.88, `rgba(254, 240, 138, ${0.9 * fade})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${fade})`);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = m.thickness;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.thickness * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          if (m.life >= m.maxLife) {
            meteors.splice(i, 1);
          }
        }
      }
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }


  // ☁️ 청명한 가을 하늘과 서서히 흐르는 깔끔한 모션그래픽 2D 벡터 뭉게구름
  initAutumnCloudsMotion() {
    const canvas = document.getElementById('cloudsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // 보조 함수: arc 호출 시 이전 패스와의 불필요한 연결선(가로선 아티팩트)이 생기지 않도록 moveTo 후 arc 생성
    const addCircle = (cx, cy, r) => {
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    };

    // 0. 클래식 5봉우리 뭉게구름 (균형 잡힌 대표 뭉게구름)
    const drawPath0 = () => {
      ctx.beginPath();
      const w = 210, h = 50, r = 25;
      if (ctx.roundRect) ctx.roundRect(-w/2, -h, w, h, [r, r, r, r]);
      else ctx.rect(-w/2, -h, w, h);
      addCircle(-45, -42, 40);
      addCircle(18, -58, 50);
      addCircle(72, -38, 34);
      addCircle(-88, -30, 26);
    };

    // 1. 바람결에 기운 비대칭 뭉게구름
    const drawPath1 = () => {
      ctx.beginPath();
      const w = 260, h = 48, r = 24;
      if (ctx.roundRect) ctx.roundRect(-w/2, -h, w, h, [r, r, r, r]);
      else ctx.rect(-w/2, -h, w, h);
      addCircle(-70, -54, 48);
      addCircle(-10, -46, 42);
      addCircle(55, -36, 35);
      addCircle(105, -26, 25);
      addCircle(-112, -30, 26);
    };

    // 2. 수평으로 길쭉하고 평온한 층적운
    const drawPath2 = () => {
      ctx.beginPath();
      const w = 320, h = 42, r = 21;
      if (ctx.roundRect) ctx.roundRect(-w/2, -h, w, h, [r, r, r, r]);
      else ctx.rect(-w/2, -h, w, h);
      addCircle(-100, -32, 30);
      addCircle(-40, -42, 38);
      addCircle(35, -45, 40);
      addCircle(95, -35, 32);
      addCircle(135, -25, 22);
    };

    // 3. 아기자기한 3봉우리 작은 솜사탕 구름
    const drawPath3 = () => {
      ctx.beginPath();
      const w = 140, h = 40, r = 20;
      if (ctx.roundRect) ctx.roundRect(-w/2, -h, w, h, [r, r, r, r]);
      else ctx.rect(-w/2, -h, w, h);
      addCircle(-26, -35, 32);
      addCircle(24, -42, 38);
      addCircle(58, -26, 22);
    };

    // 4. 중앙이 웅장하게 솟아오른 거대 적운
    const drawPath4 = () => {
      ctx.beginPath();
      const w = 240, h = 54, r = 27;
      if (ctx.roundRect) ctx.roundRect(-w/2, -h, w, h, [r, r, r, r]);
      else ctx.rect(-w/2, -h, w, h);
      addCircle(-60, -48, 44);
      addCircle(0, -72, 62);
      addCircle(60, -48, 44);
      addCircle(-100, -32, 28);
      addCircle(100, -32, 28);
    };

    // 5. 포근한 쌍봉우리 뭉게구름
    const drawPath5 = () => {
      ctx.beginPath();
      const w = 180, h = 44, r = 22;
      if (ctx.roundRect) ctx.roundRect(-w/2, -h, w, h, [r, r, r, r]);
      else ctx.rect(-w/2, -h, w, h);
      addCircle(-35, -48, 42);
      addCircle(35, -50, 44);
      addCircle(-75, -28, 24);
      addCircle(75, -28, 24);
    };

    const pathFns = [drawPath0, drawPath1, drawPath2, drawPath3, drawPath4, drawPath5];

    // 두 겹 외곽선 및 연결선 아티팩트가 전혀 없는 순백의 깔끔한 2D 모션그래픽 뭉게구름
    const drawVectorCloud = (type, x, y, scale, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#ffffff';
      const fn = pathFns[type] || pathFns[0];
      fn();
      ctx.fill();

      ctx.restore();
    };

    // 크기와 형태가 다양하고 고요하게 서서히 흘러가는 9개의 뭉게구름 인스턴스
    const clouds = [
      // 상공 원경 구름 (작고 아기자기하며 아주 천천히 흐름: 속도 0.08 ~ 0.11)
      { type: 3, x: width * 0.08, y: height * 0.07, scale: 0.55, speed: 0.08, alpha: 0.70 },
      { type: 2, x: width * 0.48, y: height * 0.05, scale: 0.65, speed: 0.10, alpha: 0.72 },
      { type: 3, x: width * 0.86, y: height * 0.09, scale: 0.50, speed: 0.09, alpha: 0.68 },

      // 중경 구름 (다채로운 형태의 중간 크기 구름: 속도 0.14 ~ 0.19)
      { type: 0, x: width * 0.18, y: height * 0.22, scale: 1.05, speed: 0.16, alpha: 0.88 },
      { type: 5, x: width * 0.62, y: height * 0.28, scale: 0.95, speed: 0.18, alpha: 0.85 },
      { type: 2, x: width * 0.96, y: height * 0.18, scale: 0.90, speed: 0.15, alpha: 0.82 },

      // 근경 구름 (크고 웅장하며 시원한 대형 뭉게구름: 속도 0.22 ~ 0.28)
      { type: 1, x: -width * 0.04, y: height * 0.42, scale: 1.45, speed: 0.24, alpha: 0.96 },
      { type: 4, x: width * 0.36, y: height * 0.36, scale: 1.35, speed: 0.22, alpha: 0.95 },
      { type: 0, x: width * 0.76, y: height * 0.46, scale: 1.55, speed: 0.27, alpha: 0.94 }
    ];

    // 가을 하늘을 V자로 여유롭게 가로지르는 철새/기러기 5마리 (속도: 0.18)
    const birds = [];
    for (let b = 0; b < 5; b++) {
      const offsetX = -b * 22;
      const offsetY = (b % 2 === 1 ? (b * 12) : (-b * 12));
      birds.push({ relX: offsetX, relY: offsetY, wingPhase: b * 0.6 });
    }
    let birdsBaseX = width * 0.25;
    let birdsBaseY = height * 0.15;

    const loop = () => {
      if (this.currentBgTheme === 'theme7' || this.currentBgTheme === 'autumn' || this.currentBgTheme === 'clouds') {
        // 1. 청명하고 투명한 한국의 가을 하늘 그라데이션 (얼룩이나 누런 빛/이상한 색상 없이 맑고 깨끗한 하늘)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#0284c7');    // 상단: 맑고 깊은 코발트 블루
        skyGrad.addColorStop(0.35, '#38bdf8'); // 중상단: 청량하게 시원한 가을하늘
        skyGrad.addColorStop(0.72, '#7dd3fc'); // 하단: 포근한 스카이 블루
        skyGrad.addColorStop(1, '#bae6fd');    // 지평선: 은은하고 맑은 라이트 블루
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. 외곽선 중첩 및 선 튐 없이 순수하고 다채로운 2D 뭉게구름 드리프트 (은은한 속도 유지)
        for (const c of clouds) {
          c.x += c.speed;
          const boundW = 320 * c.scale;
          if (c.x > width + boundW * 0.6) {
            c.x = -boundW * 0.8;
            c.y = height * (0.04 + Math.random() * 0.46);
          }
          drawVectorCloud(c.type, c.x, c.y, c.scale, c.alpha);
        }

        // 3. 가을 하늘을 유유히 날아가는 기러기 V자 편대 (속도 0.18)
        birdsBaseX += 0.18;
        birdsBaseY += 0.02;
        if (birdsBaseX > width + 150) {
          birdsBaseX = -120;
          birdsBaseY = height * (0.12 + Math.random() * 0.22);
        }
        for (const b of birds) {
          b.wingPhase += 0.035;
          const wingSpan = 7;
          const wingFlap = Math.sin(b.wingPhase) * 3;
          const bx = birdsBaseX + b.relX;
          const by = birdsBaseY + b.relY;

          ctx.save();
          ctx.strokeStyle = 'rgba(30, 58, 138, 0.52)';
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bx - wingSpan, by - wingFlap);
          ctx.quadraticCurveTo(bx - wingSpan * 0.4, by + 1, bx, by);
          ctx.quadraticCurveTo(bx + wingSpan * 0.4, by + 1, bx + wingSpan, by - wingFlap);
          ctx.stroke();
          ctx.restore();
        }
      }
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // 🌟 바둑판 스킨 적용 ('wood': 정통 비자목 나무판, 'green': 소프트 그린판 + 흰선) 🌟
  applyBoardSkin(skin) {
    this.boardSkin = (skin === 'green' || skin === 'sky') ? skin : 'wood';
    const wrapper = document.getElementById('boardWrapper');
    if (wrapper) {
      wrapper.classList.toggle('skin-green', this.boardSkin === 'green');
      wrapper.classList.toggle('skin-sky', this.boardSkin === 'sky');
    }
    document.querySelectorAll('.board-skin-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.skin === this.boardSkin);
    });
    this.render();
  }

  getBoardCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    // 실제 화면에 렌더링된 캔버스 픽셀과 논리 좌표의 정확한 스케일 계산
    const scaleX = this.displaySize / rect.width;
    const scaleY = this.displaySize / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.round(x / this.cellSize) - 1;
    const row = Math.round(y / this.cellSize) - 1;

    if (col >= 0 && col < this.size && row >= 0 && row < this.size) {
      return { x: col, y: row };
    }
    return null;
  }

  handleMouseMove(e) {
    const coords = this.getBoardCoords(e.clientX, e.clientY);
    if (!coords) {
      this.canvas.style.cursor = 'default';
      this.hoverPos = null;
      this.render();
      return;
    }

    if (this.isOmokMode) {
      const isOccupied = this.omokBoard[coords.y] && this.omokBoard[coords.y][coords.x] !== 0;
      if (isOccupied || this.omokGameOver) {
        this.canvas.style.cursor = 'default';
        this.hoverPos = null;
      } else if (this.isOmokAiThinking || (this.omokGameMode === 'ai' && this.omokTurn !== this.omokPlayerColor)) {
        this.canvas.style.cursor = 'not-allowed';
        this.hoverPos = null;
      } else {
        this.canvas.style.cursor = 'pointer';
        this.hoverPos = coords;
      }
      this.render();
      return;
    }

    if (coords && this.engine.board[coords.y][coords.x] === 0) {
      if (this.isOnlineMatch) {
        const currentTurn = (this.engine.currentStep % 2 === 0) ? 1 : 2;
        if (currentTurn !== this.myOnlineColor) {
          this.hoverPos = null;
          this.canvas.style.cursor = 'not-allowed';
          this.render();
          return;
        }
      }
      this.canvas.style.cursor = 'pointer';
      this.hoverPos = coords;
    } else {
      this.canvas.style.cursor = 'default';
      this.hoverPos = null;
    }
    this.render();
  }

  handleClick(e) {
    const coords = this.getBoardCoords(e.clientX, e.clientY);
    if (coords) {
      this.onCellClick(coords.x, coords.y);
    }
  }

  handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const coords = this.getBoardCoords(touch.clientX, touch.clientY);
    if (coords) {
      this.onCellClick(coords.x, coords.y);
    }
  }

  // 착수 로직 (오목 / 온라인 대국 / 미션 / 강의 모드 분기)
  onCellClick(x, y) {
    // 0. ⚪⚫ 오목 대전 모드 🌟
    if (this.isOmokMode) {
      this.handleOmokClick(x, y);
      return;
    }

    // 1. 🌟 온라인 1:1 대국 모드 🌟
    if (this.isOnlineMatch) {
      // 차례 검사 (흑돌은 홀수 번째 수, 백돌은 짝수 번째 수)
      const currentTurn = (this.engine.currentStep % 2 === 0) ? 1 : 2;
      if (currentTurn !== this.myOnlineColor) {
        this.showBoardToast("⏳ 상대방의 차례입니다! 잠시 기다려 주세요.", "⏳");
        return;
      }

      const res = this.engine.playMove(x, y, this.myOnlineColor);
      if (!res.success) {
        if (res.reason === 'SUICIDE') {
          this.showBoardToast("그곳은 '착수금지'입니다", "🚫");
        }
        return;
      }

      // 내 착수 소리
      if (res.captures.length > 0) window.badukAudio.playCapture();
      else window.badukAudio.playStone();

      // 상대방에게 내 착수 실시간 전송!
      this.onlineManager.notifyMyMove(x, y, this.myOnlineColor);

      // ⏱️ 초읽기 중 착수 시 해당 대국자의 초읽기 제한 시간 리셋
      if (this.myOnlineColor === 1 && this.blackClock && this.blackClock.inByo) {
        this.blackClock.byoLeft = this.timeConfig.byo;
      } else if (this.myOnlineColor === 2 && this.whiteClock && this.whiteClock.inByo) {
        this.whiteClock.byoLeft = this.timeConfig.byo;
      }
      this.updateClockUI();

      this.hoverPos = null;
      this.render();
      this.updateStatus();
      return;
    }

    // 상대방(컴퓨터) 응수 중에는 사용자 추가 착수 방지
    if (this.isOpponentResponding) return;

    // 문제 풀이 모드(놓아보기 제외)에서는 오직 사용자의 차례일 때만 착수 허용
    if (this.isMissionActive && !this.isTrialMode) {
      const expectedUserColor = this.targetPlayer || (this.missions[this.currentMissionIndex]?.targetPlayer) || 1;
      if (this.nextTurn !== expectedUserColor) return;
    }

    // 2. 강의 모드 및 학습 문제 모드 (선생님의 착수 모드 자유 선택: 교차 / 흑만 / 백만)
    let playColor = this.nextTurn;
    if (this.placementMode === 'blackOnly') playColor = 1;
    else if (this.placementMode === 'whiteOnly') playColor = 2;

    const res = this.engine.playMove(x, y, playColor);
    if (!res.success) {
      if (res.reason === 'SUICIDE') {
        this.showBoardToast("그곳은 '착수금지'입니다", "🚫");
      }
      return;
    }

    if (res.captures.length > 0) window.badukAudio.playCapture();
    else window.badukAudio.playStone();

    if (this.placementMode === 'alternate') {
      this.nextTurn = this.nextTurn === 1 ? 2 : 1;
    } else {
      this.nextTurn = playColor === 1 ? 2 : 1;
    }

    this.hoverPos = null;
    this.render();
    this.updateStatus();

    // 학습 문제 풀이 중인 경우 성공 조건 자동 체크
    if (this.isMissionActive) {
      if (this.isTrialMode) {
        // ✍️ 놓아보기 모드에서는 정답 판정이나 자동 넘김 없이 자유롭게 착수 및 수순 연구!
        return;
      }

      const currentMission = this.missions[this.currentMissionIndex];
      if (currentMission) {
        const targetColor = this.targetPlayer || currentMission.targetPlayer || 1;
        const opponentColor = this.opponentPlayer || currentMission.opponentPlayer || (targetColor === 1 ? 2 : 1);
        const myName = targetColor === 1 ? '흑' : '백';
        const oppName = opponentColor === 1 ? '흑' : '백';

        // 🌟 1. 순수 O/X 퀴즈인 경우: 바둑판 착수가 아니라 하단 버튼 선택을 유도 (단, 바둑판 착수 수순이 없는 경우에 한함)
        if (currentMission.isChoiceProblem && this.isPureOX(currentMission) && (!currentMission.branches19 || currentMission.branches19.length === 0)) {
          this.showBoardToast("하단의 O / X 버튼을 눌러 정답을 선택해 주세요! 😊", "💡");
          this.resetCurrentMission();
          return;
        }

        // 🌟 2. 객관식(A, B 또는 1, 2 또는 가, 나 등) 보기 문제인 경우
        if (currentMission.isChoiceProblem) {
          const currentLabels = currentMission.getLabels ? currentMission.getLabels(this.size) : [];
          const clickedLabel = currentLabels.find(l => l.x === x && l.y === y);

          if (clickedLabel) {
            const optIndex = this.getOptionIndexForLabel(clickedLabel.text, currentMission.choiceOptions);
            if (optIndex !== -1) {
              const optText = currentMission.choiceOptions[optIndex - 1];
              const isCorrect = this.isChoiceCorrect(optIndex, optText, currentMission);
              this.handleChoiceSelect(optIndex, optText, currentMission);
              if (!isCorrect) {
                setTimeout(() => {
                  this.resetCurrentMission();
                }, 900);
              }
              return;
            }
          }
        }

        // 🌟 3. 수순 문제 (단일 수순 또는 멀티 분기 변화도) 판정
        const userStep = this.engine.currentStep - 1;

        if (!this.activeBranches || this.activeBranches.length === 0) {
          const branches = currentMission.getBranches ? currentMission.getBranches(this.size) : [currentMission.getAnswers(this.size)];
          this.activeBranches = branches.filter(b => b && b.length > 0);
        }

        // 사용자가 둔 (x, y, targetColor)와 일치하는 정답 분기 필터링
        // 🌟 [원장님 원칙] 활로 막기 등 정답이 여러 개인 경우 순서 무관(Order-Independent) 판정 지원!
        const matchingBranches = [];
        this.activeBranches.forEach(branch => {
          const isAllTargetColor = branch.every(m => m.color === targetColor);
          if (isAllTargetColor) {
            // 상대방 응수 없는 다중 활로 착점: 남은 활로 중 어느 것을 먼저 두어도 정답 인정!
            const playedCoords = (this.engine.moves || []).slice(0, userStep).map(m => `${m.x},${m.y}`);
            const unplayedMoves = branch.filter(m => !playedCoords.includes(`${m.x},${m.y}`));
            const matchedIndex = unplayedMoves.findIndex(m => m.x === x && m.y === y && m.color === targetColor);
            if (matchedIndex !== -1) {
              const matchedMove = unplayedMoves[matchedIndex];
              const remaining = unplayedMoves.filter((_, i) => i !== matchedIndex);
              const reordered = [
                ...branch.filter(m => playedCoords.includes(`${m.x},${m.y}`)),
                matchedMove,
                ...remaining
              ];
              matchingBranches.push(reordered);
            }
          } else {
            // 정통 수순 문제 (상대방 자동 응수가 섞인 변화도)
            const expectedStepMove = branch[userStep];
            if (expectedStepMove && expectedStepMove.x === x && expectedStepMove.y === y && expectedStepMove.color === targetColor) {
              matchingBranches.push(branch);
            }
          }
        });

        if (matchingBranches.length === 0) {
          // ❌ 오답: 수순에 맞지 않는 곳에 둔 경우
          window.badukAudio.playDdang();
          this.showFeedbackBadge('wrong');

          const speech = document.getElementById('charSpeechText');
          if (speech) {
            if (currentMission.isChoiceProblem) {
              speech.textContent = "보기에 표시된 위치(A, B 등)에 돌을 놓거나 하단 버튼을 선택해 보세요! 🤔";
            } else {
              speech.textContent = "아쉬워요! 올바른 수순이 아닙니다. 다시 한번 생각해 보세요! 🤔";
            }
          }

          // 틀린 착수는 0.9초 후 문제 원래 상태로 복구하여 학생이 곧바로 다시 도전할 수 있게 처리
          setTimeout(() => {
            this.resetCurrentMission();
          }, 900);
          return;
        }

        // 일치하는 분기들로 좁히기
        this.activeBranches = matchingBranches;
        const currentBranch = this.activeBranches[0];

        // 🌟 유효한 정답 착점인 경우: 해당 분기가 끝났거나 checkSuccess 만족 시 문제 완료!
        const isBranchFinished = (this.engine.currentStep >= currentBranch.length);
        const isMissionSuccess = isBranchFinished || (currentMission.checkSuccess && currentMission.checkSuccess(this.engine, this.size));

        if (isMissionSuccess) {
          this.triggerMissionSuccess();
        } else {
          // 🤖 상대방(컴퓨터)의 자동 응수(Auto Response) 확인
          const opponentStep = this.engine.currentStep;
          const nextOpponentMove = currentBranch[opponentStep];

          if (nextOpponentMove && nextOpponentMove.color === opponentColor) {
            this.isOpponentResponding = true;
            this.nextTurn = opponentColor;
            this.updateStatus();

            const speech = document.getElementById('charSpeechText');
            if (speech) speech.textContent = `좋은 수입니다! 상대방(${oppName})의 응수를 확인해 보세요. 🤔`;

            // 0.5초 후 상대방 자동 응수 착수
            setTimeout(() => {
              const oppRes = this.engine.playMove(nextOpponentMove.x, nextOpponentMove.y, opponentColor);
              this.isOpponentResponding = false;

              if (oppRes.success) {
                if (oppRes.captures.length > 0) window.badukAudio.playCapture();
                else window.badukAudio.playStone();

                this.nextTurn = targetColor; // 다시 사용자 차례로 반환
                this.updateStatus();
                this.render();

                // 🌟 중요: 상대방의 자동 착수가 문제의 마지막 수순이어서 문제 해결이 완료된 경우!
                const isAfterOppFinished = (this.engine.currentStep >= currentBranch.length);
                const isAfterOppSuccess = isAfterOppFinished || (currentMission.checkSuccess && currentMission.checkSuccess(this.engine, this.size));

                if (isAfterOppSuccess) {
                  this.triggerMissionSuccess();
                } else {
                  if (speech) speech.textContent = `${oppName}이(가) 응수했습니다! 다음 결정타를 두어보세요! 🎯 (${myName} 차례)`;
                }
              }
            }, 550);
          } else {
            // 연속 착수 유형
            this.nextTurn = targetColor;
            this.updateStatus();
            const speech = document.getElementById('charSpeechText');
            if (speech) {
              speech.textContent = `좋아요! 👏 다음 정답 착점도 마저 놓아보세요! 🎯 (${myName} 차례)`;
            }
          }
        }
      }
    }
  }

  // 🌟 미션 정답 성공 시 공통 처리 (실로폰 소리 + 칭찬 배지 + 번호판 + 자동 넘김)
  triggerMissionSuccess() {
    window.badukAudio.playDingDongDang();
    this.showFeedbackBadge('correct');

    const btnNext = document.getElementById('btnNextMission');
    if (btnNext && this.currentMissionIndex < this.missions.length - 1) {
      btnNext.disabled = false;
    }

    this.solvedMissions.add(this.currentMissionIndex);
    this.renderProblemNumberGrid();

    // 🌟 모든 문제를 하나도 남김없이 다 풀었는지 철저하게 검사 🌟
    const isAllProblemsSolved = (this.solvedMissions.size >= this.missions.length);

    if (isAllProblemsSolved) {
      // 🏆 전체 단원 모든 문제를 완료했을 때만 단원 마스터 완료 모달 표시!
      setTimeout(() => {
        const wModal = document.getElementById('wisdomModal');
        if (wModal) {
          // 단원 이름 동적 반영
          const badge = wModal.querySelector('.modal-badge');
          if (badge && this.currentBookInfo) {
            badge.textContent = `🎉 ${this.currentBookInfo.chapter || '단원'} 마스터 완료!`;
          }
          wModal.classList.add('show');
        }
      }, 1400);
    } else {
      // 🚀 아직 풀지 않은 문제가 남아있는 경우:
      // 현재 문제가 마지막 번호이거나 일반 문제일 때, 아직 풀지 않은 다음 미완료 문제로 자동 이동!
      let nextUnsolvedIndex = -1;
      for (let i = this.currentMissionIndex + 1; i < this.missions.length; i++) {
        if (!this.solvedMissions.has(i)) {
          nextUnsolvedIndex = i;
          break;
        }
      }
      if (nextUnsolvedIndex === -1) {
        // 뒤쪽에 안 푼 문제가 없으면 앞에서부터 첫 번째 안 푼 문제 탐색
        for (let i = 0; i < this.missions.length; i++) {
          if (!this.solvedMissions.has(i)) {
            nextUnsolvedIndex = i;
            break;
          }
        }
      }

      if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = setTimeout(() => {
        if (nextUnsolvedIndex !== -1) {
          this.loadMission(nextUnsolvedIndex);
        } else if (this.currentMissionIndex < this.missions.length - 1) {
          this.nextMission();
        }
      }, 1400);
    }
  }

  // 🌟 온라인 대국 시작 🌟
  startOnlineMatch(myColor, roomId, isNigiri = false, timeRule = 'none') {
    this.isOnlineMatch = true;
    this.myOnlineColor = myColor;
    this.isLectureMode = false;
    this.timeRule = timeRule || 'none';

    this.engine.reset();

    // 🌟 대국실 UI 전환: 미션 패널 숨기고 전용 대국 패널 활성화!
    const missionPanel = document.getElementById('missionStoryPanel');
    const onlinePanel = document.getElementById('onlineMatchPanel');
    const lectureToolbar = document.getElementById('lectureToolbar');
    const choiceBar = document.getElementById('choiceOptionsBar');

    if (missionPanel) missionPanel.style.display = 'none';
    if (onlinePanel) onlinePanel.style.display = 'flex';
    if (lectureToolbar) lectureToolbar.style.display = 'none'; // 대국 중에는 복기/강의 툴바 완전 숨김!
    if (choiceBar) {
      choiceBar.style.display = 'none';
      choiceBar.innerHTML = '';
    }

    // 대국실 정보 카드 세팅
    const roomTitle = document.getElementById('matchRoomTitle');
    const sizeBadge = document.getElementById('matchBoardSizeBadge');
    const nigiriBadge = document.getElementById('matchNigiriBadge');
    const timeBadge = document.getElementById('matchTimeBadge');

    if (roomTitle) roomTitle.textContent = `대국 방 번호: ${roomId}`;
    if (sizeBadge) sizeBadge.textContent = `${this.size}줄 바둑판`;
    if (nigiriBadge) nigiriBadge.textContent = isNigiri ? '🎲 돌 가리기' : (myColor === 1 ? '⚫ 흑돌 배정' : '⚪ 백돌 배정');

    if (timeBadge) {
      const timeLabels = {
        'none': '⏱️ 무제한',
        '5m': '⚡ 5분 (30초 1회)',
        '10m': '⏳ 10분 (30초 3회)',
        '15m': '🏆 15분 (40초 3회)'
      };
      timeBadge.textContent = timeLabels[this.timeRule] || '⏱️ 무제한';
    }

    const badgeBlack = document.getElementById('badgeBlackRole');
    const badgeWhite = document.getElementById('badgeWhiteRole');
    if (myColor === 1) {
      if (badgeBlack) { badgeBlack.textContent = '나'; badgeBlack.className = 'player-role-badge me'; }
      if (badgeWhite) { badgeWhite.textContent = '상대방'; badgeWhite.className = 'player-role-badge'; }
    } else {
      if (badgeBlack) { badgeBlack.textContent = '상대방'; badgeBlack.className = 'player-role-badge'; }
      if (badgeWhite) { badgeWhite.textContent = '나'; badgeWhite.className = 'player-role-badge me'; }
    }

    // 아바타 수정 힌트 아이콘 (자기 돌만 변경 가능)
    const editB = document.getElementById('avatarEditBlack');
    const editW = document.getElementById('avatarEditWhite');
    if (editB) editB.style.display = (myColor === 1) ? 'inline-block' : 'none';
    if (editW) editW.style.display = (myColor === 2) ? 'inline-block' : 'none';

    // 기본 아바타 설정
    if (myColor === 1 && !this.myAvatar) this.myAvatar = 'fairy_black';
    if (myColor === 2 && !this.myAvatar) this.myAvatar = 'fairy_white';

    const titleElem = document.getElementById('mainHeaderTitle');
    const colorTxt = myColor === 1 ? '⚫ 흑돌(선공)' : '⚪ 백돌(후공)';
    if (titleElem) titleElem.textContent = `🌐 1:1 온라인 대국실 [방 ${roomId}] - 내 돌: ${colorTxt}`;

    if (isNigiri) {
      this.showNigiriToast(myColor);
    }

    // 🌟 상단 3대 모드 버튼 상태 동기화
    const btnLecture = document.getElementById('btnModeLecture');
    const btnMissions = document.getElementById('btnModeMissions');
    const btnOnline = document.getElementById('btnModeOnline');
    if (btnLecture) btnLecture.classList.remove('active');
    if (btnMissions) btnMissions.classList.remove('active');
    if (btnOnline) btnOnline.classList.add('active');

    // 🎭 아바타, 💬 퀵채팅, ⏱️ 디지털 계시기 세팅
    this.updateAvatarUI();
    this.renderQuickChatPhrases('greeting');
    this.initMatchClocks(this.timeRule);

    window.badukAudio.playSuccess();
    this.render();
    this.updateStatus();
  }

  // 🌟 범용 상단 알림 토스트 (돌 가리기, 무르기, 기권, 안내 등) 🌟
  showToast(msg, icon = 'ℹ️') {
    const toast = document.getElementById('nigiriToast');
    const toastText = document.getElementById('nigiriToastText');
    if (!toast) return;

    if (toastText) {
      toastText.innerHTML = msg;
    }
    const iconSpan = toast.querySelector('span:first-child');
    if (iconSpan) {
      iconSpan.textContent = icon;
    }

    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // 🎲 돌 가리기 결과 토스트 알림
  showNigiriToast(myColor) {
    const colorBadge = myColor === 1 ? '⚫ 흑돌(선공)' : '⚪ 백돌(후공)';
    this.showToast(`돌 가리기 완료! 당신은 <strong>${colorBadge}</strong>입니다!`, '🎲');
  }

  // 🌟 상대방 착수 수신 적용 🌟
  applyOpponentMove(x, y, color) {
    const res = this.engine.playMove(x, y, color);
    if (res.success) {
      if (res.captures.length > 0) window.badukAudio.playCapture();
      else window.badukAudio.playStone();

      // ⏱️ 초읽기 중 착수 시 해당 대국자의 초읽기 제한 시간 리셋
      if (color === 1 && this.blackClock && this.blackClock.inByo) {
        this.blackClock.byoLeft = this.timeConfig.byo;
      } else if (color === 2 && this.whiteClock && this.whiteClock.inByo) {
        this.whiteClock.byoLeft = this.timeConfig.byo;
      }
      this.updateClockUI();

      this.render();
      this.updateStatus();
    }
  }

  // 🌟 대국 결과 처리 (기권 / 불계승 / 시간승 등) 🌟
  handleMatchResult(winnerColor, reason, isMeResigned = false) {
    this.stopClockTimer();

    const modal = document.getElementById('matchResultModal');
    const title = document.getElementById('resultModalTitle');
    const desc = document.getElementById('resultModalDesc');
    const icon = document.getElementById('resultModalIcon');

    const winnerTxt = winnerColor === 1 ? '⚫ 흑돌' : '⚪ 백돌';
    const isIWon = (winnerColor === this.myOnlineColor);

    if (reason === 'RESIGN') {
      if (title) title.textContent = `${winnerTxt} 불계승!`;
      if (icon) icon.textContent = isIWon ? '🏆' : '👏';
      if (isIWon) {
        if (desc) desc.textContent = `상대방이 기권하여 당신(${winnerTxt})이 승리하였습니다! 멋진 승부였습니다.`;
      } else {
        if (desc) desc.textContent = `기권하였습니다. 상대방(${winnerTxt})이 불계승하였습니다.`;
      }
    } else if (reason === 'TIMEOUT') {
      if (title) title.textContent = `${winnerTxt} 시간승!`;
      if (icon) icon.textContent = isIWon ? '🏆' : '⏱️';
      if (isIWon) {
        if (desc) desc.textContent = `상대방의 제한 시간(초읽기)이 초과되어 당신(${winnerTxt})이 시간승하였습니다!`;
      } else {
        if (desc) desc.textContent = `제한 시간(초읽기)을 초과하여 시간패하였습니다. 다음 대국에서 더욱 멋진 승부를 기대합니다.`;
      }
    } else {
      if (title) title.textContent = `${winnerTxt} 승리!`;
      if (icon) icon.textContent = isIWon ? '🏆' : '👏';
      if (desc) desc.textContent = `대국이 종료되었습니다.`;
    }

    if (modal) modal.classList.add('show');
    window.badukAudio.playSuccess();
  }

  // 🌟 한 수 무르기 반영 🌟
  applyUndo() {
    if (this.engine.currentStep > 0) {
      this.engine.goToStep(this.engine.currentStep - 1);
      // 온라인 대국에서는 무르기가 확정되었으므로 취소된 수 이후의 수순을 확실하게 잘라냄
      if (this.isOnlineMatch) {
        this.engine.moves = this.engine.moves.slice(0, this.engine.currentStep);
      }
      this.hoverPos = null;
      window.badukAudio.playStone();
      this.render();
      this.updateStatus();
    }
  }

  // 🌟 대국 복기 모드 진입 (대국 종료 후 툴바 열고 수순 탐색) 🌟
  startReviewMode() {
    this.stopClockTimer();
    this.isOnlineMatch = false;
    this.isAiGoMatch = false;
    this.isAiGoThinking = false;
    this.isLectureMode = true;

    const resModal = document.getElementById('matchResultModal');
    if (resModal) resModal.classList.remove('show');

    // 상단 3대 모드 버튼 동기화 (강의 모드 활성화)
    const btnLecture = document.getElementById('btnModeLecture');
    const btnMissions = document.getElementById('btnModeMissions');
    const btnOnline = document.getElementById('btnModeOnline');
    if (btnLecture) btnLecture.classList.add('active');
    if (btnMissions) btnMissions.classList.remove('active');
    if (btnOnline) btnOnline.classList.remove('active');

    // 대국실 패널 숨기고 복기 툴바 열기!
    const onlinePanel = document.getElementById('onlineMatchPanel');
    const missionPanel = document.getElementById('missionStoryPanel');
    const lectureToolbar = document.getElementById('lectureToolbar');
    const headerTitle = document.getElementById('mainHeaderTitle');
    const missionActionArea = document.getElementById('missionActionArea');

    if (onlinePanel) onlinePanel.style.display = 'none';
    if (missionPanel) missionPanel.style.display = 'block';
    if (lectureToolbar) lectureToolbar.style.display = 'flex';
    if (missionActionArea) missionActionArea.style.display = 'none';
    if (headerTitle) headerTitle.textContent = `대국 복기·연구 (${this.size}줄) - 총 ${this.engine.moves.length}수`;

    document.getElementById('missionTitle').textContent = `대국 복기 및 수순 연구`;
    document.getElementById('missionDesc').textContent = `방금 둔 대국을 키보드 방향키(←, →)와 아래 네비게이션 버튼을 이용해 첫 수부터 다시 분석해 보세요.`;
    document.getElementById('charSpeechText').textContent = `대국 후 복기는 실력 향상의 지름길입니다! 한 수씩 되짚어보세요.`;

    this.updateTurnAfterNav();
    this.render();
    this.updateStatus();
  }

  // 🌟 대국실 퇴장 및 메인 화면 복귀 🌟
  exitOnlineMatch() {
    this.stopClockTimer();
    this.isAiGoMatch = false;
    this.isAiGoThinking = false;
    const resModal = document.getElementById('matchResultModal');
    if (resModal) resModal.classList.remove('show');
    this.switchMode('lecture');
  }

  // 🎭 대국자 아바타 UI 동기화
  updateAvatarUI() {
    const bData = AVATARS[this.blackAvatar] || AVATARS.fairy_black;
    const wData = AVATARS[this.whiteAvatar] || AVATARS.fairy_white;

    const iconB = document.getElementById('avatarIconBlack');
    const nameB = document.getElementById('avatarNameBlack');
    const iconW = document.getElementById('avatarIconWhite');
    const nameW = document.getElementById('avatarNameWhite');

    if (iconB) iconB.textContent = bData.icon;
    if (nameB) nameB.textContent = bData.name;
    if (iconW) iconW.textContent = wData.icon;
    if (nameW) nameW.textContent = wData.name;

    // 모달 내부 활성 카드 하이라이트
    const currentMyAvatarId = (this.myOnlineColor === 2) ? this.whiteAvatar : this.blackAvatar;
    document.querySelectorAll('#avatarGrid .avatar-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.avatarId === currentMyAvatarId);
    });
  }

  // 아바타 모달 열기
  openAvatarModal() {
    const modal = document.getElementById('avatarSelectModal');
    if (modal) {
      this.updateAvatarUI();
      modal.classList.add('show');
    }
  }

  // 내 아바타 선택
  selectMyAvatar(avatarId) {
    this.myAvatar = avatarId;
    if (this.myOnlineColor === 1) {
      this.blackAvatar = avatarId;
    } else if (this.myOnlineColor === 2) {
      this.whiteAvatar = avatarId;
    } else {
      this.blackAvatar = avatarId;
    }
    this.updateAvatarUI();

    if (this.isOnlineMatch && this.onlineManager) {
      this.onlineManager.notifyAvatarChange(avatarId);
    }
    const modal = document.getElementById('avatarSelectModal');
    if (modal) modal.classList.remove('show');
    if (window.badukAudio) window.badukAudio.playStone();
  }

  // 상대방 아바타 동기화 수신
  applyAvatarUpdate(color, avatarId) {
    if (color === 1) this.blackAvatar = avatarId;
    else if (color === 2) this.whiteAvatar = avatarId;
    this.updateAvatarUI();
  }

  // 💬 매너 퀵 대화 문구 목록 렌더링
  renderQuickChatPhrases(tabName) {
    this.activeChatTab = tabName;
    const container = document.getElementById('quickChatPhrases');
    if (!container) return;
    container.innerHTML = '';

    const phrases = QUICK_CHAT_DATA[tabName] || [];
    phrases.forEach(phrase => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'phrase-btn';
      btn.textContent = phrase;
      btn.addEventListener('click', () => {
        if (this.isOnlineMatch && this.onlineManager) {
          this.onlineManager.sendQuickChat(phrase);
        } else {
          this.showSpeechBubble(this.nextTurn || 1, phrase);
        }
      });
      container.appendChild(btn);
    });
  }

  // 💬 말풍선 표시 애니메이션
  showSpeechBubble(color, text) {
    const bubble = (color === 1) ? document.getElementById('speechBubbleBlack') : document.getElementById('speechBubbleWhite');
    if (!bubble) return;

    bubble.textContent = text;
    bubble.classList.add('show');
    if (window.badukAudio) window.badukAudio.playChatChime();

    clearTimeout(bubble._timer);
    bubble._timer = setTimeout(() => {
      bubble.classList.remove('show');
    }, 3800);
  }

  // 🌟 사석(따낸 돌) 실시간 시각적 보관함 렌더링 🌟
  renderStoneTrays() {
    const blackTray = document.getElementById('blackStoneTray');
    const whiteTray = document.getElementById('whiteStoneTray');

    // 흑 플레이어 사석함 -> 흑이 따낸 백돌(White mini-stones)
    if (blackTray) {
      blackTray.innerHTML = '';
      const count = this.engine.blackCaptures;
      const displayCount = Math.min(count, 10);
      for (let i = 0; i < displayCount; i++) {
        const stone = document.createElement('span');
        stone.className = 'mini-stone white';
        blackTray.appendChild(stone);
      }
      if (count > 10) {
        const badge = document.createElement('span');
        badge.className = 'stone-tray-count-badge';
        badge.textContent = `+${count - 10}`;
        blackTray.appendChild(badge);
      }
    }

    // 백 플레이어 사석함 -> 백이 따낸 흑돌(Black mini-stones)
    if (whiteTray) {
      whiteTray.innerHTML = '';
      const count = this.engine.whiteCaptures;
      const displayCount = Math.min(count, 10);
      for (let i = 0; i < displayCount; i++) {
        const stone = document.createElement('span');
        stone.className = 'mini-stone black';
        whiteTray.appendChild(stone);
      }
      if (count > 10) {
        const badge = document.createElement('span');
        badge.className = 'stone-tray-count-badge';
        badge.textContent = `+${count - 10}`;
        whiteTray.appendChild(badge);
      }
    }
  }

  // ⏱️ 대국 계시기 및 초읽기 초기화
  initMatchClocks(timeRule) {
    this.stopClockTimer();
    this.timeRule = timeRule || 'none';

    const rowB = document.getElementById('clockRowBlack');
    const rowW = document.getElementById('clockRowWhite');

    if (this.timeRule === 'none') {
      if (rowB) rowB.style.display = 'none';
      if (rowW) rowW.style.display = 'none';
      return;
    }

    if (rowB) rowB.style.display = 'flex';
    if (rowW) rowW.style.display = 'flex';

    const rules = {
      '5m': { main: 5 * 60, byo: 30, count: 1 },
      '10m': { main: 10 * 60, byo: 30, count: 3 },
      '15m': { main: 15 * 60, byo: 40, count: 3 }
    };
    const config = rules[this.timeRule] || rules['10m'];
    this.timeConfig = { ...config };

    this.blackClock = { main: config.main, byoLeft: config.byo, count: config.count, inByo: false };
    this.whiteClock = { main: config.main, byoLeft: config.byo, count: config.count, inByo: false };

    this.updateClockUI();
    this.startClockTimer();
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // 디지털 계시기 UI 갱신
  updateClockUI() {
    if (this.timeRule === 'none') return;

    const timeB = document.getElementById('clockTimeBlack');
    const byoB = document.getElementById('byoyomiBlack');
    const timeW = document.getElementById('clockTimeWhite');
    const byoW = document.getElementById('byoyomiWhite');

    // 흑 계시기
    if (this.blackClock) {
      if (!this.blackClock.inByo) {
        if (timeB) timeB.textContent = this.formatTime(this.blackClock.main);
        if (byoB) byoB.textContent = `${this.timeConfig.byo}초 ${this.blackClock.count}회`;
      } else {
        if (timeB) timeB.textContent = `00:${this.blackClock.byoLeft.toString().padStart(2, '0')}`;
        if (byoB) byoB.textContent = `초읽기 ${this.blackClock.count}회`;
      }
    }

    // 백 계시기
    if (this.whiteClock) {
      if (!this.whiteClock.inByo) {
        if (timeW) timeW.textContent = this.formatTime(this.whiteClock.main);
        if (byoW) byoW.textContent = `${this.timeConfig.byo}초 ${this.whiteClock.count}회`;
      } else {
        if (timeW) timeW.textContent = `00:${this.whiteClock.byoLeft.toString().padStart(2, '0')}`;
        if (byoW) byoW.textContent = `초읽기 ${this.whiteClock.count}회`;
      }
    }

    // 현재 턴 계시기 시각적 강조
    const activeTurn = (this.engine.currentStep % 2 === 0) ? 1 : 2;
    const rowB = document.getElementById('clockRowBlack');
    const rowW = document.getElementById('clockRowWhite');
    if (rowB) rowB.classList.toggle('active', activeTurn === 1);
    if (rowW) rowW.classList.toggle('active', activeTurn === 2);
  }

  // 계시기 타이머 시작 (1초마다 카운트다운)
  startClockTimer() {
    this.stopClockTimer();
    this.clockInterval = setInterval(() => {
      if (!this.isOnlineMatch || this.timeRule === 'none') return;

      const activeTurn = (this.engine.currentStep % 2 === 0) ? 1 : 2;
      const clock = (activeTurn === 1) ? this.blackClock : this.whiteClock;

      if (clock.main > 0) {
        clock.main--;
        if (clock.main === 0) {
          clock.inByo = true;
          clock.byoLeft = this.timeConfig.byo;
          if (activeTurn === this.myOnlineColor && window.badukAudio) {
            window.badukAudio.playBeep(true);
          }
        }
      } else if (clock.inByo) {
        clock.byoLeft--;
        if (clock.byoLeft <= 5 && clock.byoLeft > 0) {
          if (activeTurn === this.myOnlineColor && window.badukAudio) {
            window.badukAudio.playBeep(false);
          }
        }
        if (clock.byoLeft <= 0) {
          clock.count--;
          if (clock.count > 0) {
            clock.byoLeft = this.timeConfig.byo;
            if (activeTurn === this.myOnlineColor && window.badukAudio) {
              window.badukAudio.playBeep(true);
            }
          } else {
            // 초읽기 완전 소진 -> 시간패 처리!
            this.stopClockTimer();
            if (activeTurn === this.myOnlineColor) {
              this.onlineManager.notifyTimeout(activeTurn);
            }
            return;
          }
        }
      }

      this.updateClockUI();
    }, 1000);
  }

  // 계시기 타이머 정지
  stopClockTimer() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  // 🌟 수순 네비게이션 구현 🌟
  navFirst() {
    if (this.isOnlineMatch || this.engine.currentStep === 0) return;
    this.engine.goToStep(0);
    this.updateTurnAfterNav();
    window.badukAudio.playStone();
    this.render();
    this.updateStatus();
  }

  navPrev() {
    if (this.isOnlineMatch || this.engine.currentStep === 0) return;
    this.engine.goToStep(this.engine.currentStep - 1);
    this.updateTurnAfterNav();
    window.badukAudio.playStone();
    this.render();
    this.updateStatus();
  }

  navNext() {
    if (this.isOnlineMatch || this.engine.currentStep >= this.engine.moves.length) return;
    this.engine.goToStep(this.engine.currentStep + 1);
    this.updateTurnAfterNav();
    window.badukAudio.playStone();
    this.render();
    this.updateStatus();
  }

  navLast() {
    if (this.isOnlineMatch || this.engine.currentStep >= this.engine.moves.length) return;
    this.engine.goToStep(this.engine.moves.length);
    this.updateTurnAfterNav();
    window.badukAudio.playStone();
    this.render();
    this.updateStatus();
  }

  clearBoard() {
    if (this.isMissionActive) {
      // 문제 풀이 및 놓아보기 중에는 현재 문제 상태로 초기화 복원
      this.loadMission(this.currentMissionIndex, this.isTrialMode);
      return;
    }
    this.engine.setInitialStones([]);
    this.answerHighlight = null;
    this.answerHighlights = [];
    this.nextTurn = 1;
    this.render();
    this.updateStatus();
  }

  updateTurnAfterNav() {
    if (this.placementMode === 'alternate') {
      if (this.engine.currentStep === 0) {
        this.nextTurn = 1;
      } else {
        const lastMove = this.engine.moves[this.engine.currentStep - 1];
        this.nextTurn = lastMove.color === 1 ? 2 : 1;
      }
    }
  }

  loadMission(index, keepTrialMode = false) {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this._badgeTimer) {
      clearTimeout(this._badgeTimer);
      this._badgeTimer = null;
    }
    if (this._boardToastTimer) {
      clearTimeout(this._boardToastTimer);
      this._boardToastTimer = null;
    }
    const overlay = document.getElementById('boardFeedbackOverlay');
    if (overlay) overlay.classList.remove('show');
    const bToast = document.getElementById('boardToastNotice');
    if (bToast) bToast.classList.remove('show');

    this.isMissionActive = true;
    if (!keepTrialMode) {
      this.isTrialMode = false;
      const btnTrial = document.getElementById('btnTrialMode');
      if (btnTrial) {
        btnTrial.classList.remove('active');
        btnTrial.innerHTML = '✍️ 놓아보기';
      }
      const btnClear = document.getElementById('btnClearBoard');
      if (btnClear) {
        btnClear.innerHTML = '<span class="clear-icon">🗑️</span><span class="clear-text">판 지우기</span>';
        btnClear.title = '판 지우기';
      }
    }
    this.answerHighlight = null;
    this.answerHighlights = [];
    this.currentMissionIndex = index;
    const mission = this.missions[index];
    this.currentMission = mission;
    if (!mission) return;

    // 🌟 문제 크기 맞춤형 스마트 바둑판 자동 확장 (Auto-Fit) 🌟
    // 해당 문제의 돌 배치 영역이 9줄을 넘어서면 13줄 또는 19줄로 자동 확장!
    const targetSize = mission.recommendedSize || 9;
    if (this.size !== targetSize) {
      this.size = targetSize;
      this.engine.setSize(targetSize);

      const container = document.querySelector('.app-container');
      if (container) {
        container.classList.remove('size-9', 'size-11', 'size-13', 'size-19');
        container.classList.add(`size-${targetSize}`);
      }

      // 상단 바둑판 규격 버튼 UI 활성화 동기화
      document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === targetSize);
      });

      this.initCanvasSize();
      setTimeout(() => {
        this.initCanvasSize();
        this.render();
      }, 50);
      setTimeout(() => {
        this.initCanvasSize();
        this.render();
      }, 320);
    }

    const initialStones = mission.initBoard(this.size);
    this.engine.setInitialStones(initialStones);

    this.targetPlayer = mission.targetPlayer || 1;
    this.opponentPlayer = mission.opponentPlayer || (this.targetPlayer === 1 ? 2 : 1);
    this.nextTurn = this.targetPlayer;
    this.placementMode = 'alternate';
    this.isOpponentResponding = false;

    // 🌟 분기 수순 목록 초기화 (변화도 지원)
    this.currentMissionBranches = mission.getBranches ? mission.getBranches(this.size) : [mission.getAnswers(this.size)];
    this.activeBranches = this.currentMissionBranches.filter(b => b && b.length > 0);

    const stepText = document.getElementById('missionStepText');
    const badgeText = document.getElementById('missionBadge');
    const mTitle = document.getElementById('missionTitle');
    const mDesc = document.getElementById('missionDesc');
    const mSpeech = document.getElementById('charSpeechText');
    const mHint = document.getElementById('missionHintText');

    const chapName = (mission.chapterTitle || (this.currentBookInfo && this.currentBookInfo.chapter) || '학습 단원');
    const bookName = (mission.bookTitle || (this.currentBookInfo && this.currentBookInfo.book) || '씽크탱크 1권');

    const numDisplay = mission.displayNumStr || (index + 1);
    if (stepText) {
      stepText.textContent = `${chapName} (${numDisplay} / 전체 ${this.missions.length})`;
    }
    if (badgeText) {
      badgeText.textContent = bookName;
    }
    if (mTitle) {
      mTitle.textContent = mission.title || `${chapName} (${numDisplay})`;
    }
    if (mDesc) mDesc.textContent = mission.desc || '';
    if (mSpeech) {
      if (this.isTrialMode) {
        mSpeech.textContent = "✍️ [놓아보기 모드 ON] 흑·백돌을 마음껏 놓아보며 수순과 변화도를 연구해 보세요!";
      } else {
        const turnBadge = this.targetPlayer === 2 ? "⚪ [백선 - 백이 둘 차례]" : "⚫ [흑선 - 흑이 둘 차례]";
        const baseSpeech = (mission.speech && mission.speech.trim()) ? ` ${mission.speech.trim()}` : '';
        mSpeech.textContent = `${turnBadge}${baseSpeech}`;
      }
    }
    const mHintBox = document.getElementById('missionHintBox');
    if (mission.hint && mission.hint.trim()) {
      if (mHint) mHint.textContent = mission.hint.trim();
      if (mHintBox) mHintBox.style.display = 'flex';
    } else {
      if (mHint) mHint.textContent = '';
      if (mHintBox) mHintBox.style.display = 'none';
    }

    const btnPrev = document.getElementById('btnPrevMission');
    const btnNext = document.getElementById('btnNextMission');
    if (btnPrev) btnPrev.disabled = (index === 0);
    if (btnNext) btnNext.disabled = (index >= this.missions.length - 1);

    this.renderChoiceOptions(mission);
    this.renderProblemNumberGrid();
    this.updateStatus();
    this.render();
  }

  // 🌟 O/X 및 객관식 선택지 렌더링 (하단 긴 메뉴 박스 중앙에 배치) 🌟
  renderChoiceOptions(mission) {
    const choiceBar = document.getElementById('choiceOptionsBar');
    const lectureToolbar = document.getElementById('lectureToolbar');
    if (!choiceBar) return;

    // 하단 긴 메뉴 박스는 문제 풀이/놓아보기 상태에서 항상 유지
    if (lectureToolbar && !this.isOnlineMatch) {
      lectureToolbar.style.display = 'flex';
    }

    // 객관식/OX 문제가 아닌 경우: 선택지 클러스터만 숨김
    if (!mission || !mission.isChoiceProblem || !mission.choiceOptions || mission.choiceOptions.length === 0) {
      choiceBar.style.display = 'none';
      choiceBar.innerHTML = '';
      return;
    }

    // 선택지 문제인 경우: 메뉴 박스 중앙에 O / X 버튼 표시
    choiceBar.style.display = 'flex';
    choiceBar.innerHTML = '';

    mission.choiceOptions.forEach((optText, idx) => {
      const optIndex = idx + 1; // 1-based index
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';

      const trimmed = optText.trim();
      const isO = /^[○oO]$/i.test(trimmed);
      const isX = /^[×xXΧ]$/i.test(trimmed);

      if (isO) {
        btn.classList.add('choice-o');
        btn.textContent = 'O'; // 중복 이모지 없이 깔끔한 흰색 O
      } else if (isX) {
        btn.classList.add('choice-x');
        btn.textContent = 'X'; // 중복 이모지 없이 깔끔한 흰색 X
      } else {
        btn.classList.add('choice-text');
        btn.textContent = trimmed;
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleChoiceSelect(optIndex, trimmed, mission);
      });

      choiceBar.appendChild(btn);
    });
  }

  // 🌟 O/X 및 객관식 선택 정답 여부 판정 🌟
  isChoiceCorrect(selectedIndex, selectedText, mission) {
    if (!mission) return false;
    const rawAns = String(mission.choiceAnswer || '').trim();
    // 1. 인덱스(1, 2, ...)와 일치하는지 비교
    if (String(selectedIndex) === rawAns) return true;
    // 2. 텍스트 자체(예: "○", "×", "가", "1집")와 일치하는지 비교
    if (selectedText && selectedText.trim() === rawAns) return true;
    // 3. 대소문자 무시 비교 (A, B)
    if (selectedText && selectedText.trim().toLowerCase() === rawAns.toLowerCase()) return true;
    // 4. OX 기호 간 상호 정규화 비교
    if (/^[○oO0]$/i.test(rawAns) && /^[○oO0]$/i.test(selectedText)) return true;
    if (/^[×xXΧ]$/i.test(rawAns) && /^[×xXΧ]$/i.test(selectedText)) return true;
    return false;
  }

  // 🌟 바둑판 라벨 텍스트와 선택지 목록 간 매핑 인덱스(1-based) 도출 🌟
  getOptionIndexForLabel(labelText, choiceOptions) {
    if (!labelText || !choiceOptions || choiceOptions.length === 0) return -1;
    const lt = labelText.trim().toLowerCase();

    // 1. 정확한 텍스트 또는 포함 관계 비교
    for (let i = 0; i < choiceOptions.length; i++) {
      const ot = choiceOptions[i].trim().toLowerCase();
      if (lt === ot || ot.startsWith(lt) || (lt.length > 1 && ot.includes(lt))) {
        return i + 1; // 1-based index
      }
    }

    // 2. 정형화된 기호 인덱스 매핑 (A/B, 가/나, 1/2 등)
    const canonicalGroups = [
      ['a', 'b', 'c', 'd', 'e', 'f'],
      ['가', '나', '다', '라', '마', '바'],
      ['1', '2', '3', '4', '5', '6'],
      ['①', '②', '③', '④', '⑤', '⑥']
    ];

    for (const group of canonicalGroups) {
      const idx = group.indexOf(lt);
      if (idx !== -1 && idx < choiceOptions.length) {
        return idx + 1; // 1-based index
      }
    }

    return -1;
  }

  // 🌟 순수 O/X 문제 여부 판별 🌟
  isPureOX(mission) {
    if (!mission || !mission.choiceOptions || mission.choiceOptions.length === 0) return false;
    const oxSymbols = ['o', 'x', '○', '×', 'χ', '0'];
    return mission.choiceOptions.every(opt => oxSymbols.includes(opt.trim().toLowerCase()));
  }

  // 🌟 O/X 및 객관식 선택 답안 판정 및 동기화 처리 🌟
  handleChoiceSelect(selectedIndex, selectedText, mission) {
    if (!this.isMissionActive) return;
    if (this.isTrialMode) return;

    const isCorrect = this.isChoiceCorrect(selectedIndex, selectedText, mission);

    // 하단 선택지 버튼 UI 하이라이트 효과
    const choiceButtons = document.querySelectorAll('#choiceOptionsBar .choice-btn');
    if (choiceButtons && choiceButtons.length >= selectedIndex) {
      const targetBtn = choiceButtons[selectedIndex - 1];
      if (targetBtn) {
        if (isCorrect) {
          targetBtn.classList.add('correct-choice-btn');
        } else {
          targetBtn.classList.add('wrong-choice-btn');
          setTimeout(() => targetBtn.classList.remove('wrong-choice-btn'), 900);
        }
      }
    }

    if (isCorrect) {
      // 바둑판에 해당 정답 착점이 존재하고 아직 돌이 놓이지 않은 경우(하단 버튼을 누른 경우),
      // 정답 돌을 놓아주어 시각적 완성도 제공
      const ans = mission.getAnswer ? mission.getAnswer(this.size) : null;
      if (ans && this.engine && this.engine.board[ans.y][ans.x] === 0) {
        this.engine.playMove(ans.x, ans.y, mission.targetPlayer || 1);
        if (window.badukAudio) window.badukAudio.playStone();
        this.render();
      }
      this.triggerMissionSuccess();
    } else {
      if (window.badukAudio) window.badukAudio.playDdang();
      this.showFeedbackBadge('wrong');
      const speech = document.getElementById('charSpeechText');
      if (speech) {
        speech.textContent = "아쉬워요! 다시 한번 신중하게 생각해 보세요. 🤔";
      }
    }
  }

  renderProblemNumberGrid() {
    const grid = document.getElementById('problemNumberGrid');
    if (!grid) return;
    grid.innerHTML = '';
    this.missions.forEach((m, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prob-num-btn';
      if (idx === this.currentMissionIndex) btn.classList.add('active');
      if (this.solvedMissions.has(idx)) btn.classList.add('solved');
      btn.textContent = m.displayNumStr || (idx + 1);
      btn.title = m.title;
      btn.addEventListener('click', () => {
        this.loadMission(idx);
      });
      grid.appendChild(btn);
    });
  }

  resetCurrentMission() {
    this.loadMission(this.currentMissionIndex, this.isTrialMode);
  }

  prevMission() {
    if (this.currentMissionIndex > 0) this.loadMission(this.currentMissionIndex - 1);
  }

  nextMission() {
    if (this.currentMissionIndex < this.missions.length - 1) {
      this.loadMission(this.currentMissionIndex + 1);
    }
  }

  // 🌟 [놓아보기] 모드 토글 (학습 문제에서 자유로운 수순 연구 지원) 🌟
  toggleTrialMode() {
    if (!this.isMissionActive) return;
    this.isTrialMode = !this.isTrialMode;
    this.answerHighlight = null;

    const btn = document.getElementById('btnTrialMode');
    const speech = document.getElementById('charSpeechText');
    const btnClear = document.getElementById('btnClearBoard');

    if (btn) btn.classList.toggle('active', this.isTrialMode);

    if (this.isTrialMode) {
      if (btn) btn.innerHTML = '✍️ 놓아보기 중 (해제)';
      if (speech) speech.textContent = "✍️ [놓아보기 모드 ON] 흑·백돌을 마음껏 놓아보며 수순과 변화도를 연구해 보세요! (정답 판정 일시 중지)";
      if (btnClear) {
        btnClear.innerHTML = '<span class="clear-icon">🔄</span><span class="clear-text">문제 복원</span>';
        btnClear.title = '놓아본 돌들을 지우고 처음 문제 상태로 복원합니다';
      }
      if (window.badukAudio) window.badukAudio.playStone();
    } else {
      if (btn) btn.innerHTML = '✍️ 놓아보기';
      if (speech) speech.textContent = "✍️ [놓아보기 모드 OFF] 실전 문제 풀이 모드로 돌아왔습니다. 정답을 맞춰보세요!";
      if (btnClear) {
        btnClear.innerHTML = '<span class="clear-icon">🗑️</span><span class="clear-text">판 지우기</span>';
        btnClear.title = '판 지우기';
      }
      // 실전 모드로 복귀 시 처음 문제 상태로 깨끗하게 복구
      this.loadMission(this.currentMissionIndex, false);
    }
    this.updateStatus();
    this.render();
  }

  // 🌟 [정답보기] 정답 위치 표시 및 안내 🌟
  showAnswer() {
    if (!this.isMissionActive) return;
    const mission = this.missions[this.currentMissionIndex];
    if (!mission) return;

    const speech = document.getElementById('charSpeechText');

    // 🌟 1. O/X 및 객관식 선택지 문제인 경우
    if (mission.isChoiceProblem && mission.choiceOptions && mission.choiceOptions.length > 0) {
      const rawAns = String(mission.choiceAnswer || '').trim();
      let ansText = rawAns;
      const numIdx = parseInt(rawAns, 10);
      if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= mission.choiceOptions.length) {
        ansText = mission.choiceOptions[numIdx - 1];
      }
      if (/^[○oO]$/i.test(ansText)) ansText = '⭕ O';
      else if (/^[×xXΧ]$/i.test(ansText)) ansText = '❌ X';

      if (speech) {
        speech.textContent = `💡 [정답 안내]: 정답은 【 ${ansText} 】 입니다!`;
      }
      if (window.badukAudio) window.badukAudio.playBeep(false);

      // 선택지 버튼에 펄스 효과
      const choiceBar = document.getElementById('choiceOptionsBar');
      if (choiceBar) {
        const btns = choiceBar.querySelectorAll('.choice-btn');
        btns.forEach((btn, idx) => {
          if (String(idx + 1) === rawAns || btn.textContent.trim().includes(ansText.replace(/[⭕❌\s]/g, ''))) {
            btn.style.boxShadow = '0 0 16px #38bdf8, inset 0 0 8px #ffffff';
            setTimeout(() => {
              btn.style.boxShadow = '';
            }, 2500);
          }
        });
      }
      return;
    }

    // 🌟 2. 일반 바둑판 착수 문제인 경우
    const currentBranch = (this.activeBranches && this.activeBranches.length > 0)
      ? this.activeBranches[0]
      : (mission.getAnswers ? mission.getAnswers(this.size) : []);
    if (!currentBranch || currentBranch.length === 0) return;

    this.answerHighlights = currentBranch.map((a, idx) => ({
      x: a.x,
      y: a.y,
      color: a.color || (idx % 2 === 0 ? (this.targetPlayer || 1) : (this.opponentPlayer || 2)),
      order: idx + 1
    }));
    this.answerHighlight = this.answerHighlights[this.engine.currentStep] || this.answerHighlights[0];

    const colLabels = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];
    if (speech) {
      if (currentBranch.length === 1) {
        const p0 = currentBranch[0];
        const colorName = p0.color === 2 ? '백' : '흑';
        speech.textContent = `💡 [정답 안내]: ${colorName}(${colLabels[p0.x]}${this.size - p0.y}) 자리에 착수하면 성공합니다!`;
      } else {
        // 수순별 안내: ①백(J9) ➔ ②흑(K9) ➔ ③백(J10)...
        const seqText = currentBranch.map((a, idx) => {
          const colorName = a.color === 2 ? '백' : '흑';
          return `${idx + 1}.${colorName}(${colLabels[a.x]}${this.size - a.y})`;
        }).join(' ➔ ');
        speech.textContent = `💡 [수순 안내]: ${seqText} 순서로 진행해 보세요!`;
      }
    }
    if (window.badukAudio) window.badukAudio.playBeep(false);
    this.render();
  }

  // 🌟 바둑판에서 돌이 없는 빈자리(사분면)를 계산하여 피드백이 문제를 가리지 않게 하는 알고리즘 🌟
  calculateEmptyFeedbackPosition() {
    const size = this.size || 19;
    const mid = size / 2;
    let tlCount = 0; // Top-Left: x < mid, y < mid
    let trCount = 0; // Top-Right: x >= mid, y < mid
    let blCount = 0; // Bottom-Left: x < mid, y >= mid
    let brCount = 0; // Bottom-Right: x >= mid, y >= mid

    if (this.engine && this.engine.board) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (this.engine.board[y] && this.engine.board[y][x] !== 0) {
            if (y < mid) {
              if (x < mid) tlCount++;
              else trCount++;
            } else {
              if (x < mid) blCount++;
              else brCount++;
            }
          }
        }
      }
    }

    const counts = [
      { pos: 'pos-top-left', count: tlCount },
      { pos: 'pos-top-right', count: trCount },
      { pos: 'pos-bottom-left', count: blCount },
      { pos: 'pos-bottom-right', count: brCount }
    ];

    counts.sort((a, b) => a.count - b.count);
    return counts[0].pos; // 가장 돌이 없거나 한적한 빈자리
  }

  // 🌟 영롱한 보석 바둑알 렌더링 🌟
  drawGemstoneStone(x, y, r, color, style) {
    const ctx = this.ctx;
    // 일치된 단일 광원 중심 (-0.28, -0.28)
    let grad = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, r * 0.08, x, y, r);

    if (style === 'gem-sapphire') {
      // 💎 로열 사파이어 (흑) & 사랑스러운 베이비 핑크 (백 - 잡점 없는 맑은 로즈 쿼츠)
      if (color === 1) {
        grad.addColorStop(0, '#dbeafe');
        grad.addColorStop(0.18, '#60a5fa');
        grad.addColorStop(0.48, '#2563eb');
        grad.addColorStop(0.8, '#1e40af');
        grad.addColorStop(1, '#0f172a');
      } else {
        grad.addColorStop(0, '#ffffff');      // 화이트 스파클
        grad.addColorStop(0.2, '#fdf2f8');   // 맑고 연한 크림 핑크
        grad.addColorStop(0.45, '#fbcfe8');  // 사랑스러운 딸기우유 베이비 핑크
        grad.addColorStop(0.78, '#f472b6');  // 화사한 로즈 핑크 광채
        grad.addColorStop(1, '#be185d');     // 단정한 로즈 림
      }
    } else if (style === 'gem-ruby') {
      // 💎 피죤 블러드 루비 (흑) & 임페리얼 에메랄드 (백)
      if (color === 1) {
        grad.addColorStop(0, '#ffe4e6');
        grad.addColorStop(0.18, '#fb7185');
        grad.addColorStop(0.45, '#e11d48');
        grad.addColorStop(0.78, '#9f1239');
        grad.addColorStop(1, '#4c0519');
      } else {
        grad.addColorStop(0, '#d1fae5');
        grad.addColorStop(0.18, '#34d399');
        grad.addColorStop(0.45, '#059669');
        grad.addColorStop(0.78, '#047857');
        grad.addColorStop(1, '#022c22');
      }
    } else if (style === 'gem-amethyst') {
      // 💎 신비한 자수정 바이올렛 (흑) & 황금빛 앰버 토파즈 (백)
      if (color === 1) {
        grad.addColorStop(0, '#fae8ff');
        grad.addColorStop(0.2, '#c084fc');
        grad.addColorStop(0.5, '#9333ea');
        grad.addColorStop(0.8, '#6b21a8');
        grad.addColorStop(1, '#3b0764');
      } else {
        grad.addColorStop(0, '#fef9c3');
        grad.addColorStop(0.22, '#facc15');
        grad.addColorStop(0.55, '#ca8a04');
        grad.addColorStop(0.82, '#854d0e');
        grad.addColorStop(1, '#451a03');
      }
    } else if (style === 'gem-cyan-pink') {
      // 💎 청량한 아쿠아마린 (흑) & 사랑스러운 로즈쿼츠 핑크 (백)
      if (color === 1) {
        grad.addColorStop(0, '#cffafe');
        grad.addColorStop(0.2, '#22d3ee');
        grad.addColorStop(0.5, '#0891b2');
        grad.addColorStop(0.8, '#0e7490');
        grad.addColorStop(1, '#083344');
      } else {
        grad.addColorStop(0, '#fdf2f8');
        grad.addColorStop(0.22, '#f472b6');
        grad.addColorStop(0.52, '#db2777');
        grad.addColorStop(0.8, '#9d174d');
        grad.addColorStop(1, '#500724');
      }
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // 1. 단일 매끄러운 3D 곡면 하이라이트 (잡점·원형 얼룩 없는 순수 크리스탈 반사광)
    const hlGrad = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, 0, x - r * 0.28, y - r * 0.28, r * 0.45);
    hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
    hlGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.38)');
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.28, y - r * 0.28, r * 0.38, r * 0.22, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 2. 하단 앰비언트 림라이트 (바닥 반사광 - 구체 입체감 극대화)
    const rimGrad = ctx.createRadialGradient(x, y + r * 0.55, r * 0.1, x, y, r);
    rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.94, 0, Math.PI * 2);
    ctx.fill();
  }

  // 🌟 바둑판 피드백 배지 회전 표시 (정답 시 단일 대형 박스 & 문제 가리지 않는 스마트 자동 위치) 🌟
  showFeedbackBadge(type) {
    const overlay = document.getElementById('boardFeedbackOverlay');
    const dynamicCard = document.getElementById('feedbackCardContent');
    const badgeCard = document.getElementById('feedbackBadgeCard');
    if (!overlay || !dynamicCard || !badgeCard) return;

    if (this._badgeTimer) {
      clearTimeout(this._badgeTimer);
      this._badgeTimer = null;
    }

    if (type === 'correct') {
      const idx = this.correctFeedbackIndex % CORRECT_FEEDBACK_ITEMS.length;
      this.correctFeedbackIndex++;
      const item = CORRECT_FEEDBACK_ITEMS[idx];

      // 1. 단일 대형 정사각형 박스 (기존 대비 30% 확대된 정사각형 박스 안에 이미지가 꽉 차게 표시)
      dynamicCard.removeAttribute('style');
      dynamicCard.className = 'feedback-dynamic-card single-large-card';
      dynamicCard.innerHTML = `<img src="${item.charImg}" class="feedback-large-img" alt="정답">`;

      // 2. 문제가 가려지지 않는 바둑판 안의 빈자리(빈 사분면)로 스마트 자동 배치
      const emptyPos = this.calculateEmptyFeedbackPosition();
      overlay.classList.remove('pos-center', 'pos-top', 'pos-bottom', 'pos-top-left', 'pos-top-right', 'pos-bottom-left', 'pos-bottom-right');
      overlay.classList.add(emptyPos);

      // 캐릭터 말풍선 대사 갱신
      const speech = document.getElementById('charSpeechText');
      if (speech && item.speech) {
        speech.textContent = item.speech;
      }
    } else {
      // 오답 격려 배지 (오답1~오답10 로테이션, 정답과 동일한 대형 정사각형 박스 및 정중앙 배치)
      const idx = this.wrongFeedbackIndex % WRONG_FEEDBACK_ITEMS.length;
      this.wrongFeedbackIndex++;
      const item = WRONG_FEEDBACK_ITEMS[idx];

      dynamicCard.removeAttribute('style');
      dynamicCard.className = 'feedback-dynamic-card single-large-card';
      dynamicCard.innerHTML = `<img src="${item.charImg}" class="feedback-large-img" alt="오답">`;

      overlay.classList.remove('pos-top', 'pos-bottom');
      overlay.classList.add('pos-center');

      const speech = document.getElementById('charSpeechText');
      if (speech && item.speech) {
        speech.textContent = item.speech;
      }
    }

    overlay.classList.add('show');

    // 바운스 애니메이션 재실행
    badgeCard.style.animation = 'none';
    badgeCard.offsetHeight; // reflow
    badgeCard.style.animation = '';

    // 다음 피드백 이미지들도 미리 백그라운드 사전 다운로드(캐싱)
    this.preloadUpcomingFeedbacks();

    // 🌟 이미지가 브라우저에 완전히 로드된 직후부터 1.8초 타이머 시작 (렌더링 전 닫힘 완전 방지)
    const imgEl = dynamicCard.querySelector('.feedback-large-img');
    const startCloseTimer = () => {
      if (this._badgeTimer) clearTimeout(this._badgeTimer);
      this._badgeTimer = setTimeout(() => {
        overlay.classList.remove('show');
      }, 1800);
    };

    if (imgEl) {
      if (imgEl.complete && imgEl.naturalWidth > 0) {
        startCloseTimer();
      } else {
        imgEl.onload = () => {
          startCloseTimer();
        };
        // 네트워크 지연 대비 최대 4초 안전 폴백
        this._badgeTimer = setTimeout(() => {
          overlay.classList.remove('show');
        }, 4000);
      }
    } else {
      this._badgeTimer = setTimeout(() => {
        overlay.classList.remove('show');
      }, 1800);
    }
  }

  // 🌟 바둑판 내부 세련된 3D 알림 팝업 (착수 금지 등 안내 메시지) 🌟
  showBoardToast(message, icon = '🚫') {
    const toast = document.getElementById('boardToastNotice');
    const msgEl = document.getElementById('boardToastMsg');
    const iconEl = document.getElementById('boardToastIcon');
    if (!toast || !msgEl) return;

    if (this._boardToastTimer) {
      clearTimeout(this._boardToastTimer);
      this._boardToastTimer = null;
    }

    msgEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;

    // 안내 효과음
    if (window.badukAudio) {
      window.badukAudio.playDdang();
    }

    // 캐릭터 말풍선 연동
    const speech = document.getElementById('charSpeechText');
    if (speech) {
      speech.textContent = `${icon} ${message}`;
    }

    toast.classList.add('show');

    this._boardToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  switchMode(mode) {
    if (this.isOnlineMatch && mode !== 'online') {
      const confirmLeave = confirm("진행 중인 온라인 대국을 종료하고 모드를 변경하시겠습니까?");
      if (!confirmLeave) return;
      this.onlineManager.leaveRoom();
    }

    const btnLecture = document.getElementById('btnModeLecture');
    const btnMissions = document.getElementById('btnModeMissions');
    const btnOnline = document.getElementById('btnModeOnline');
    const btnOmok = document.getElementById('btnModeOmok');
    const btnAlkkagi = document.getElementById('btnModeAlkkagi');

    if (btnLecture) btnLecture.classList.toggle('active', mode === 'lecture');
    if (btnMissions) btnMissions.classList.toggle('active', mode === 'missions');
    if (btnOnline) btnOnline.classList.toggle('active', mode === 'online');
    if (btnOmok) btnOmok.classList.toggle('active', mode === 'omok');
    if (btnAlkkagi) btnAlkkagi.classList.toggle('active', mode === 'alkkagi');

    if (mode !== 'omok') {
      this.isOmokMode = false;
      const omokPanel = document.getElementById('omokSidePanel');
      if (omokPanel) omokPanel.style.display = 'none';
    }

    if (mode !== 'alkkagi') {
      this.isAlkkagiMode = false;
      const alkkagiPanel = document.getElementById('alkkagiSidePanel');
      if (alkkagiPanel) alkkagiPanel.style.display = 'none';
    }

    const toolbar = document.getElementById('lectureToolbar');
    const missionPanel = document.getElementById('missionStoryPanel');
    const onlinePanel = document.getElementById('onlineMatchPanel');
    const headerTitle = document.getElementById('mainHeaderTitle');
    const missionActionArea = document.getElementById('missionActionArea');

    this.currentMode = mode;

    if (mode === 'lecture') {
      this.isLectureMode = true;
      this.isMissionActive = false;
      this.isOnlineMatch = false;
      this.isTrialMode = false;
      this.currentMission = null; // 🌟 강의 모드에서는 미션 참조를 완전히 해제하여 순수 정규 바둑판으로 시작

      if (this.size === 15) {
        this.changeBoardSize(19);
      }

      // 🌟 문제 자동 넘김 및 타이머, 피드백 오버레이 완전 해제 🌟
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer);
        this.autoAdvanceTimer = null;
      }
      if (this._badgeTimer) {
        clearTimeout(this._badgeTimer);
        this._badgeTimer = null;
      }
      if (this._boardToastTimer) {
        clearTimeout(this._boardToastTimer);
        this._boardToastTimer = null;
      }
      const overlay = document.getElementById('boardFeedbackOverlay');
      if (overlay) overlay.classList.remove('show');
      const bToast = document.getElementById('boardToastNotice');
      if (bToast) bToast.classList.remove('show');

      // 🌟 강의 모드에서는 이전 학습 문제의 초기 배치 돌과 정답 하이라이트를 완전 제거하여 순수 빈 바둑판으로 시작 🌟
      this.engine.setInitialStones([]);
      this.answerHighlight = null;
      this.answerHighlights = [];

      // 🌟 착수 모드를 교차 착수로 리셋 🌟
      this.placementMode = 'alternate';
      document.querySelectorAll('.placement-mode-group .tool-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.placeMode === 'alternate');
      });

      // 🌟 강의 모드: 문제 카드와 문제 조작 버튼만 숨기고, 좌측 설정 패널(바둑판/바둑돌/바탕/착수소리)은 유지 🌟
      const missionCard = document.querySelector('.mission-card');
      const sideSettings = document.getElementById('sideSettingsPanel');
      const choiceBar = document.getElementById('choiceOptionsBar');
      if (choiceBar) {
        choiceBar.style.display = 'none';
        choiceBar.innerHTML = '';
      }
      if (onlinePanel) onlinePanel.style.display = 'none';
      if (missionPanel) missionPanel.style.display = 'flex';
      if (missionCard) missionCard.style.display = 'none';
      if (missionActionArea) missionActionArea.style.display = 'none';
      if (sideSettings) sideSettings.style.display = 'flex';
      if (toolbar) toolbar.style.display = 'flex';

      // 🌟 바둑판 위 흑돌 차례, 사석 표시 제거 (상태바 완전 숨김) 🌟
      const boardStatus = document.querySelector('.board-status');
      if (boardStatus) boardStatus.style.display = 'none';

      const pGrid = document.getElementById('problemNumberGrid');
      const pHint = document.getElementById('missionHintBox');
      if (pGrid) pGrid.style.display = 'none';
      if (pHint) pHint.style.display = 'none';

      if (headerTitle) headerTitle.textContent = "바둑 어드벤처 - 자유 강의 & 놓아보기";
      this.nextTurn = 1;
      this.updateStatus();
      this.render();

    } else if (mode === 'missions') {
      this.isLectureMode = false;
      this.isMissionActive = true;
      this.isOnlineMatch = false;

      const currentBookName = (this.currentBookInfo && this.currentBookInfo.book) || '입문 마스터';
      if (headerTitle) headerTitle.textContent = `바둑 어드벤처 - 학습 문제 (${currentBookName})`;
      const missionCard = document.querySelector('.mission-card');
      const sideSettings = document.getElementById('sideSettingsPanel');
      if (onlinePanel) onlinePanel.style.display = 'none';
      if (missionPanel) missionPanel.style.display = 'flex';
      if (missionCard) missionCard.style.display = 'block';
      if (toolbar) toolbar.style.display = 'flex'; // 🌟 학습 문제 모드에서도 강의 모드와 동일한 툴바 제공
      if (missionActionArea) missionActionArea.style.display = 'flex';
      if (sideSettings) sideSettings.style.display = 'flex';

      // 🌟 문제 풀이 화면에서는 상단 불필요한 차례/사석 상태바 숨김 -> 바둑판을 위로 최대한 밀착 확장!
      const boardStatus = document.querySelector('.board-status');
      if (boardStatus) boardStatus.style.display = 'none';

      const pGrid = document.getElementById('problemNumberGrid');
      const pHint = document.getElementById('missionHintBox');
      if (pGrid) pGrid.style.display = 'grid';
      if (pHint) pHint.style.display = 'flex';

      this.loadMission(this.currentMissionIndex || 0);
    } else if (mode === 'online') {
      const onlineModal = document.getElementById('onlineModal');
      if (onlineModal) onlineModal.classList.add('show');
    } else if (mode === 'omok') {
      this.isLectureMode = false;
      this.isMissionActive = false;
      this.isOnlineMatch = false;
      this.isOmokMode = true;
      this.isAlkkagiMode = false;

      // 15줄 오목 표준 규격으로 자동 전환
      this.changeBoardSize(15);

      if (missionPanel) missionPanel.style.display = 'none';
      if (onlinePanel) onlinePanel.style.display = 'none';
      const alkkagiPanel = document.getElementById('alkkagiSidePanel');
      if (alkkagiPanel) alkkagiPanel.style.display = 'none';

      const omokPanel = document.getElementById('omokSidePanel');
      if (omokPanel) omokPanel.style.display = 'flex';
      if (toolbar) toolbar.style.display = 'none';
      const boardStatus = document.querySelector('.board-status');
      if (boardStatus) boardStatus.style.display = 'none';

      this.restartOmok();
    } else if (mode === 'alkkagi') {
      this.isLectureMode = false;
      this.isMissionActive = false;
      this.isOnlineMatch = false;
      this.isOmokMode = false;
      this.isAlkkagiMode = true;

      // 정통 19줄 바둑판 규격으로 자동 전환
      this.changeBoardSize(19);

      if (missionPanel) missionPanel.style.display = 'none';
      if (onlinePanel) onlinePanel.style.display = 'none';
      const omokPanel = document.getElementById('omokSidePanel');
      if (omokPanel) omokPanel.style.display = 'none';

      const alkkagiPanel = document.getElementById('alkkagiSidePanel');
      if (alkkagiPanel) alkkagiPanel.style.display = 'flex';
      if (toolbar) toolbar.style.display = 'none';
      const boardStatus = document.querySelector('.board-status');
      if (boardStatus) boardStatus.style.display = 'none';

      if (!this.alkkagiEngine) {
        this.alkkagiEngine = new AlkkagiEngine(this);
      }
      this.alkkagiEngine.initGame();
    }
  }

  toggleSound() {
    const enabled = window.badukAudio.toggle();
    document.getElementById('soundIcon').textContent = enabled ? '🔊' : '🔇';
  }

  updateStatus() {
    document.getElementById('blackCaptures').textContent = this.engine.blackCaptures;
    document.getElementById('whiteCaptures').textContent = this.engine.whiteCaptures;
    this.renderStoneTrays();

    const turnText = document.getElementById('turnIndicator');
    const stepIndicator = document.getElementById('stepIndicator');

    // 🌟 온라인 대국 모드 & AI 바둑 대국 모드 상태 표시 & 전용 패널 동기화 🌟
    if (this.isOnlineMatch) {
      const activeColor = (this.engine.currentStep % 2 === 0) ? 1 : 2;
      const isMyTurn = (activeColor === this.myOnlineColor);

      if (isMyTurn) {
        turnText.textContent = `🟢 [내 차례] 착수하세요! (${this.myOnlineColor === 1 ? '흑돌' : '백돌'})`;
        turnText.style.color = '#38bdf8';
      } else {
        turnText.textContent = `⏳ 상대방 수읽기 중... (${activeColor === 1 ? '흑돌' : '백돌'})`;
        turnText.style.color = '#94a3b8';
      }
      stepIndicator.textContent = `${this.engine.currentStep}수`;

      // 대국실 좌측 패널 정보 실시간 갱신
      const blackBox = document.getElementById('playerBlackBox');
      const whiteBox = document.getElementById('playerWhiteBox');
      if (blackBox) blackBox.classList.toggle('turn-active', activeColor === 1);
      if (whiteBox) whiteBox.classList.toggle('turn-active', activeColor === 2);

      const blackCap = document.getElementById('blackCaptureCount');
      const whiteCap = document.getElementById('whiteCaptureCount');
      if (blackCap) blackCap.textContent = this.engine.blackCaptures;
      if (whiteCap) whiteCap.textContent = this.engine.whiteCaptures;

      const stepCount = document.getElementById('matchStepCounter');
      if (stepCount) stepCount.textContent = `${this.engine.currentStep}수`;

      const turnDot = document.getElementById('matchTurnDot');
      const turnDesc = document.getElementById('matchTurnText');
      if (turnDot) turnDot.classList.toggle('waiting', !isMyTurn);
      if (turnDesc) {
        turnDesc.textContent = isMyTurn
          ? `🟢 내 차례입니다! 착수하세요. (${activeColor === 1 ? '흑' : '백'})`
          : `⏳ 상대방이 수읽기 중입니다... (${activeColor === 1 ? '흑' : '백'})`;
      }
      return;
    }

    const modeNames = {
      alternate: this.nextTurn === 1 ? '흑돌 차례 (교차)' : '백돌 차례 (교차)',
      blackOnly: '흑돌만 연속 착수',
      whiteOnly: '백돌만 연속 착수'
    };
    turnText.textContent = modeNames[this.placementMode] || '흑돌 차례';
    stepIndicator.textContent = `${this.engine.currentStep}수 / ${this.engine.moves.length}수`;

    // 네비게이션 버튼 활성화/비활성화 (강의 및 학습 문제 모드 공통 지원)
    const btnFirst = document.getElementById('btnNavFirst');
    const btnPrev = document.getElementById('btnNavPrev');
    const btnNext = document.getElementById('btnNavNext');
    const btnLast = document.getElementById('btnNavLast');
    if (btnFirst) btnFirst.disabled = (this.engine.currentStep === 0);
    if (btnPrev) btnPrev.disabled = (this.engine.currentStep === 0);
    if (btnNext) btnNext.disabled = (this.engine.currentStep >= this.engine.moves.length);
    if (btnLast) btnLast.disabled = (this.engine.currentStep >= this.engine.moves.length);
  }

  // 바둑판 바탕 및 격자선 전용 렌더링 (알까기 등에서 재활용)
  renderBoardGridOnly() {
    const ctx = this.ctx;
    const size = this.displaySize;
    const cellSize = this.cellSize;

    const isGreen = this.boardSkin === 'green';
    const isSky = this.boardSkin === 'sky';

    if (isSky) {
      // ☁️ [연한 하늘색과 아주 연한 구름 바둑판]
      // 1. 연한 하늘빛 그라데이션 (상단 맑은 블루 -> 하단 포근한 구름 하늘빛)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, size);
      skyGrad.addColorStop(0, '#bae6fd');
      skyGrad.addColorStop(0.5, '#e0f2fe');
      skyGrad.addColorStop(1, '#f0f9ff');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. 아주 연하고 몽환적인 솜사탕 구름 (바둑선 시인성을 전혀 해치지 않는 은은한 반투명 구름)
      ctx.save();
      const drawCloudPuff = (cx, cy, baseR, alpha) => {
        const puffGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR);
        puffGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        puffGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.65})`);
        puffGrad.addColorStop(0.85, `rgba(255, 255, 255, ${alpha * 0.18})`);
        puffGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx.fill();
      };

      const drawCloudCluster = (x, y, scale, alpha = 0.42) => {
        drawCloudPuff(x, y, 75 * scale, alpha);
        drawCloudPuff(x - 45 * scale, y + 10 * scale, 55 * scale, alpha * 0.85);
        drawCloudPuff(x + 45 * scale, y + 8 * scale, 60 * scale, alpha * 0.9);
        drawCloudPuff(x - 20 * scale, y - 25 * scale, 50 * scale, alpha * 0.95);
        drawCloudPuff(x + 25 * scale, y - 20 * scale, 52 * scale, alpha * 0.9);
      };

      const s = size / 600;
      drawCloudCluster(110 * s, 90 * s, 1.2 * s, 0.42);
      drawCloudCluster(490 * s, 130 * s, 0.95 * s, 0.32);
      drawCloudCluster(310 * s, 310 * s, 1.3 * s, 0.20);
      drawCloudCluster(140 * s, 500 * s, 1.1 * s, 0.35);
      drawCloudCluster(480 * s, 480 * s, 1.25 * s, 0.42);
      ctx.restore();

      // 3. 외곽 은은한 하늘빛 비네팅 테두리
      ctx.save();
      const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.38, size / 2, size / 2, size * 0.72);
      vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vignette.addColorStop(1, 'rgba(56, 189, 248, 0.14)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    } else if (isGreen) {
      // 🍀 [판 전체에 자연스럽고 연하게 스며든 천연 잔디 & 클로버 스킨]
      // 1. 연하고 눈이 편안한 파스텔 초원 그라데이션
      const baseGrad = ctx.createLinearGradient(0, 0, size, size);
      baseGrad.addColorStop(0, '#c7f9cc');    // 따사로운 아침 햇살 연두빛
      baseGrad.addColorStop(0.35, '#dcfce7'); // 화사하고 맑은 파스텔 스프링 그린
      baseGrad.addColorStop(0.7, '#bbf7d0');  // 싱그럽고 부드러운 천연 초원
      baseGrad.addColorStop(1, '#a7f3d0');    // 차분하고 포근한 에메랄드 잔디
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, size, size);

      ctx.save();

      // 2. 판 전체에 은은하게 퍼지는 햇살 얼룩 & 음영 (자연스러운 들판 채광)
      const sunPuffs = [
        { x: size * 0.25, y: size * 0.2, r: size * 0.35, a: 0.14 },
        { x: size * 0.75, y: size * 0.35, r: size * 0.3, a: 0.1 },
        { x: size * 0.35, y: size * 0.75, r: size * 0.32, a: 0.12 },
        { x: size * 0.8, y: size * 0.8, r: size * 0.28, a: 0.08 }
      ];
      sunPuffs.forEach(p => {
        const puff = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        puff.addColorStop(0, `rgba(255, 255, 255, ${p.a})`);
        puff.addColorStop(0.6, `rgba(255, 255, 255, ${p.a * 0.4})`);
        puff.addColorStop(1, 'transparent');
        ctx.fillStyle = puff;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. 판 전체에 골고루 스며든 아기 풀잎과 클로버 (눈금과 돌에 방해 없는 10~20% 은은한 수채화 워터마크)
      const drawGentleClover = (cx, cy, scale, angle = 0, alpha = 0.15, isFour = false) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.fillStyle = `rgba(22, 163, 74, ${alpha})`;
        const count = isFour ? 4 : 3;
        const r = 5.5 * scale;
        const dist = 6.2 * scale;
        for (let i = 0; i < count; i++) {
          const a = (i * Math.PI * 2) / count - Math.PI / 2;
          const lx = Math.cos(a) * dist;
          const ly = Math.sin(a) * dist;
          ctx.beginPath();
          ctx.ellipse(lx, ly, r, r * 0.85, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = `rgba(21, 128, 61, ${alpha * 0.75})`;
        ctx.lineWidth = 1.1 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-2 * scale, 9 * scale, 4 * scale, 13 * scale);
        ctx.stroke();
        ctx.restore();
      };

      const drawGentleGrass = (cx, cy, scale, angle = 0, alpha = 0.16) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.strokeStyle = `rgba(22, 163, 74, ${alpha})`;
        ctx.lineWidth = 1.5 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6 * scale, -11 * scale, -9 * scale, -13 * scale); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0, -14 * scale, 2 * scale, -16 * scale); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6 * scale, -10 * scale, 10 * scale, -12 * scale); ctx.stroke();
        ctx.restore();
      };

      // 시드 기반 고정 랜덤으로 전체 8x8 구역에 자연스럽게 분포
      const gridCount = 8;
      const cell = size / gridCount;
      let seed = 42;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

      for (let gy = 0; gy < gridCount; gy++) {
        for (let gx = 0; gx < gridCount; gx++) {
          const rx = gx * cell + cell * (0.15 + rnd() * 0.7);
          const ry = gy * cell + cell * (0.15 + rnd() * 0.7);
          const s = (size / 600) * (0.85 + rnd() * 0.45);
          const ang = (rnd() - 0.5) * 0.8;
          const a = 0.12 + rnd() * 0.08;
          if (rnd() < 0.48) {
            drawGentleClover(rx, ry, s, ang, a, rnd() < 0.12);
          } else {
            drawGentleGrass(rx, ry, s, ang, a);
          }
        }
      }

      // 4. 외곽 테두리 숲 비네팅 (가장자리를 차분하게 감싸는 깊이감)
      const borderVignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.38, size / 2, size / 2, size * 0.72);
      borderVignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
      borderVignette.addColorStop(1, 'rgba(22, 101, 52, 0.14)');
      ctx.fillStyle = borderVignette;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    } else {
      // 1. 좌상쪽 맑고 화사한 황금 비자목 단일 색상 통일 (#f2d69f) & 세로 방향 은은한 원목 결
      ctx.fillStyle = '#f2d69f';
      ctx.fillRect(0, 0, size, size);

      // 🌟 세로 방향 은은한 전통 원목 나뭇결 렌더링 🌟
      ctx.save();
      for (let x = 0; x < size; x += 3.5) {
        const alpha = 0.015 + ((x % 7 === 0) ? 0.02 : 0.008);
        ctx.fillStyle = `rgba(120, 80, 30, ${alpha})`;
        ctx.fillRect(x, 0, 1.2, size);
      }
      for (let x = 1.8; x < size; x += 7) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.fillRect(x, 0, 1, size);
      }
      ctx.restore();
    }

    // 2. [원장님 핵심 지침] 강의 모드, 대국 모드에서는 언제나 사방이 온전히 닫힌 정상적인 정규 바둑판!
    // 교재식 '선 중간 끊김' 열린 부분도는 오직 학습 미션 모드에서만 적용!
    const quad = (this.currentMission && typeof this.currentMission.getQuadrant === 'function') 
      ? this.currentMission.getQuadrant() 
      : (this.size === 19 ? 'FULL19' : 'NATIVE9');

    const isCrop = this.isMissionActive && !this.isLectureMode && (this.size < 19 && quad !== 'NATIVE9' && quad !== 'FULL19');

    // 3. 선명하고 또렷한 격자선 렌더링
    const gridColor = isSky ? 'rgba(30, 58, 138, 0.78)' : (isGreen ? 'rgba(20, 83, 45, 0.78)' : '#2d1d0c');
    const border1LineColor = isSky ? 'rgba(30, 58, 138, 0.92)' : (isGreen ? 'rgba(20, 83, 45, 0.92)' : '#2d1808');
    const fullBorderColor = isSky ? 'rgba(30, 58, 138, 0.92)' : (isGreen ? 'rgba(20, 83, 45, 0.92)' : '#3d2510');

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = this.size === 19 ? 1.1 : 1.5;

    const overhang = cellSize * 0.45; // 교재처럼 교차점 너머로 삐죽 나온 뒤 중간에서 툭 끊기는 길이

    if (isCrop) {
      const left = cellSize;
      const right = cellSize * this.size;
      const top = cellSize;
      const bottom = cellSize * this.size;

      if (quad === 'BR') {
        // 🌟 우하귀: 우변(오른쪽)과 하변(아래쪽)은 1선 모서리, 상변(위)과 좌변(왼쪽)은 중앙으로 툭 끊긴 열린 선!
        for (let i = 0; i < this.size; i++) {
          const x = cellSize * (i + 1);
          ctx.beginPath();
          ctx.moveTo(x, top - overhang);
          ctx.lineTo(x, bottom);
          ctx.stroke();
        }
        for (let j = 0; j < this.size; j++) {
          const y = cellSize * (j + 1);
          ctx.beginPath();
          ctx.moveTo(left - overhang, y);
          ctx.lineTo(right, y);
          ctx.stroke();
        }

        // 1선 외곽 테두리: 오직 오른쪽(우변)과 아래쪽(하변) 1선만 굵고 진한 바둑판 모서리로 닫음
        ctx.strokeStyle = border1LineColor;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(right, top - overhang);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left - overhang, bottom);
        ctx.stroke();
      } else if (quad === 'BL') {
        // 🌟 좌하귀: 좌변(왼쪽)과 하변(아래쪽)은 1선 모서리, 상변과 우변은 중앙으로 툭 끊긴 열린 선!
        for (let i = 0; i < this.size; i++) {
          const x = cellSize * (i + 1);
          ctx.beginPath();
          ctx.moveTo(x, top - overhang);
          ctx.lineTo(x, bottom);
          ctx.stroke();
        }
        for (let j = 0; j < this.size; j++) {
          const y = cellSize * (j + 1);
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(right + overhang, y);
          ctx.stroke();
        }
        ctx.strokeStyle = border1LineColor;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(left, top - overhang);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right + overhang, bottom);
        ctx.stroke();
      } else if (quad === 'TL') {
        // 🌟 좌상귀: 좌변(왼쪽)과 상변(위쪽)은 1선 모서리, 하변과 우변은 중앙으로 툭 끊긴 열린 선!
        for (let i = 0; i < this.size; i++) {
          const x = cellSize * (i + 1);
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom + overhang);
          ctx.stroke();
        }
        for (let j = 0; j < this.size; j++) {
          const y = cellSize * (j + 1);
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(right + overhang, y);
          ctx.stroke();
        }
        ctx.strokeStyle = border1LineColor;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(left, bottom + overhang);
        ctx.lineTo(left, top);
        ctx.lineTo(right + overhang, top);
        ctx.stroke();
      } else if (quad === 'TR') {
        // 🌟 우상귀: 상변(위쪽)과 우변(오른쪽)은 1선 모서리, 하변과 좌변은 중앙으로 툭 끊긴 열린 선!
        for (let i = 0; i < this.size; i++) {
          const x = cellSize * (i + 1);
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom + overhang);
          ctx.stroke();
        }
        for (let j = 0; j < this.size; j++) {
          const y = cellSize * (j + 1);
          ctx.beginPath();
          ctx.moveTo(left - overhang, y);
          ctx.lineTo(right, y);
          ctx.stroke();
        }
        ctx.strokeStyle = border1LineColor;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(left - overhang, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom + overhang);
        ctx.stroke();
      }
    } else {
      // 19줄 전판 및 9줄 순수 입문판: 4면 정통 테두리 및 격자
      for (let i = 0; i < this.size; i++) {
        const pos = cellSize * (i + 1);
        ctx.beginPath();
        ctx.moveTo(cellSize, pos);
        ctx.lineTo(cellSize * this.size, pos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos, cellSize);
        ctx.lineTo(pos, cellSize * this.size);
        ctx.stroke();
      }
      ctx.strokeStyle = fullBorderColor;
      ctx.lineWidth = this.size === 19 ? 2.5 : 3;
      ctx.strokeRect(cellSize, cellSize, cellSize * (this.size - 1), cellSize * (this.size - 1));
    }


    // 4. 화점 (Star Points)
    const starCoords = this.getStarPoints();
    ctx.fillStyle = isSky ? '#1e3a8a' : (isGreen ? '#14532d' : '#5a3d1c');
    const starRadius = Math.max(2.5, cellSize * 0.1);

    for (const p of starCoords) {
      const px = cellSize * (p.x + 1);
      const py = cellSize * (p.y + 1);
      ctx.beginPath();
      ctx.arc(px, py, starRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. 좌표 표시
    if (this.coordMode !== 'none' && !isCrop) {
      ctx.fillStyle = isSky ? '#1e3a8a' : (isGreen ? '#14532d' : 'rgba(70, 45, 20, 0.85)');
      ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.35))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const colLabels = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];

      for (let i = 0; i < this.size; i++) {
        const p = cellSize * (i + 1);
        const colTxt = colLabels[i];
        const rowTxt = this.size - i;

        if (this.coordMode === 'left-top' || this.coordMode === 'all-four') {
          ctx.fillText(colTxt, p, cellSize * 0.45);
        }
        if (this.coordMode === 'right-bottom' || this.coordMode === 'all-four') {
          ctx.fillText(colTxt, p, size - cellSize * 0.45);
        }
        if (this.coordMode === 'left-top' || this.coordMode === 'all-four') {
          ctx.fillText(rowTxt, cellSize * 0.45, p);
        }
        if (this.coordMode === 'right-bottom' || this.coordMode === 'all-four') {
          ctx.fillText(rowTxt, size - cellSize * 0.45, p);
        }
      }
    }
  }

  // ================= 캔버스 렌더링 =================
  render() {
    // 🥏 알까기 모드일 경우 알까기 전용 렌더링 위임
    if (this.isAlkkagiMode && this.alkkagiEngine) {
      this.alkkagiEngine.render();
      return;
    }

    const ctx = this.ctx;
    const size = this.displaySize;
    const cellSize = this.cellSize;

    // 바탕 및 격자 렌더링
    this.renderBoardGridOnly();

    // 6. 활로(숨구멍) 표시
    if (this.showLiberties) {
      this.drawLibertyIndicators();
    }

    // 7. 마우스 호버 가이드
    if (this.hoverPos) {
      const hx = cellSize * (this.hoverPos.x + 1);
      const hy = cellSize * (this.hoverPos.y + 1);
      ctx.save();
      ctx.globalAlpha = 0.45;
      
      let hoverColor = 1;
      if (this.isOmokMode) {
        hoverColor = (this.omokGameMode === 'ai') ? (this.omokPlayerColor || 1) : this.omokTurn;
      } else if (this.isOnlineMatch) {
        hoverColor = this.myOnlineColor || 1;
      } else {
        if (this.placementMode === 'blackOnly') hoverColor = 1;
        else if (this.placementMode === 'whiteOnly') hoverColor = 2;
        else hoverColor = this.nextTurn;
      }
      this.drawCharacterStone(hx, hy, cellSize * 0.42, hoverColor, false, null);
      ctx.restore();
    }

    // 8. 놓인 돌 및 수순 번호 렌더링
    const stoneRadius = cellSize * 0.43;

    if (this.isOmokMode) {
      // ⚪⚫ 오목 모드 전용 바둑돌 렌더링
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          const color = (this.omokBoard[y] && this.omokBoard[y][x]) || 0;
          if (color !== 0) {
            const sx = cellSize * (x + 1);
            const sy = cellSize * (y + 1);
            const histItem = this.omokHistory.find(h => h.x === x && h.y === y);
            const stepNum = this.showStepNumbers && histItem ? histItem.step : null;
            this.drawCharacterStone(sx, sy, stoneRadius, color, false, stepNum);
          }
        }
      }

      // 오목 마지막 착수 위치 마커
      if (this.omokHistory.length > 0) {
        const last = this.omokHistory[this.omokHistory.length - 1];
        const lx = cellSize * (last.x + 1);
        const ly = cellSize * (last.y + 1);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lx, ly, stoneRadius * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 오목 5목 완성 승리 연결선 강조
      if (this.omokWinLine && this.omokWinLine.length >= 2) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        const p0 = this.omokWinLine[0];
        ctx.moveTo(cellSize * (p0.x + 1), cellSize * (p0.y + 1));
        for (let i = 1; i < this.omokWinLine.length; i++) {
          const pi = this.omokWinLine[i];
          ctx.lineTo(cellSize * (pi.x + 1), cellSize * (pi.y + 1));
        }
        ctx.stroke();
        ctx.restore();
      }

    } else {
      // 바둑 엔진 돌 렌더링
      const ataris = this.engine.getAtariGroups();
      const atariStoneKeys = new Set();
      ataris.forEach(a => a.stones.forEach(s => atariStoneKeys.add(`${s.x},${s.y}`)));

      const stepMap = {};
      for (let i = 0; i < this.engine.currentStep; i++) {
        const m = this.engine.moves[i];
        stepMap[`${m.x},${m.y}`] = m.step;
      }

      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          const color = this.engine.board[y][x];
          if (color !== 0) {
            const sx = cellSize * (x + 1);
            const sy = cellSize * (y + 1);
            const isAtari = atariStoneKeys.has(`${x},${y}`);
            const stepNum = stepMap[`${x},${y}`] || null;

            if (isAtari && this.showAtari) {
              ctx.save();
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(sx, sy, stoneRadius + 3, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }

            this.drawCharacterStone(sx, sy, stoneRadius, color, isAtari, stepNum);
          }
        }
      }

      // 9. 마지막 착수 위치 링 마커 (놓아보기 시 최신 수 하이라이트)
      if (this.engine.currentStep > 0) {
        const lastMove = this.engine.moves[this.engine.currentStep - 1];
        if (this.engine.board[lastMove.y][lastMove.x] !== 0) {
          const lx = cellSize * (lastMove.x + 1);
          const ly = cellSize * (lastMove.y + 1);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(lx, ly, stoneRadius * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 10. [정답보기] 하이라이트 마커 (골드 점선 링 & 흑/백 수순 번호 ①, ②, ③, ④...)
    const hlList = this.answerHighlights && this.answerHighlights.length > 0
      ? this.answerHighlights
      : (this.answerHighlight ? [this.answerHighlight] : []);

    const numSymbols = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮'];

    for (const hl of hlList) {
      if (this.engine.board[hl.y][hl.x] === 0) {
        const ax = cellSize * (hl.x + 1);
        const ay = cellSize * (hl.y + 1);
        ctx.save();

        // 링 테두리 (흑돌 정답: 골드빛 황금링, 백돌 응수: 산뜻한 하늘빛 링)
        const isBlackMove = (hl.color === 1);
        ctx.strokeStyle = isBlackMove ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(ax, ay, stoneRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        // 수순 원형 배지 배경 (반투명 미니 원)
        ctx.setLineDash([]);
        ctx.fillStyle = isBlackMove ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(ax, ay, stoneRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 수순 번호 텍스트
        ctx.fillStyle = isBlackMove ? '#fbbf24' : '#0369a1';
        ctx.font = `bold ${Math.floor(cellSize * 0.42)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const symbol = hlList.length > 1
          ? (numSymbols[hl.order - 1] || hl.order.toString())
          : '⭐';

        ctx.fillText(symbol, ax, ay);
        ctx.restore();
      }
    }

    // 11. 🌟 문제 특수 마커 (세모 △, 동그라미 ○/◎, 네모 ■, 엑스 ×, 보기 라벨) 표시 🌟
    if (this.isMissionActive && this.missions && this.missions[this.currentMissionIndex]) {
      const curMission = this.missions[this.currentMissionIndex];
      const labels = curMission.getLabels ? curMission.getLabels(this.size) : [];

      for (const lb of labels) {
        if (lb.x < 0 || lb.x >= this.size || lb.y < 0 || lb.y >= this.size) continue;
        const lx = cellSize * (lb.x + 1);
        const ly = cellSize * (lb.y + 1);
        const stoneColor = this.engine.board[lb.y][lb.x]; // 0: 빈곳, 1: 흑돌, 2: 백돌

        // 🌟 1. 초기 바둑돌 여부 확인 캐싱
        if (lb._checkedInitial === undefined) {
          const initStones = curMission.initBoard ? curMission.initBoard(this.size) : (curMission.initialStones19 || []);
          const initStone = initStones.find(s => s.x === lb.x && s.y === lb.y);
          lb._wasInitialStone = !!initStone;
          lb._initialColor = initStone ? initStone.color : 0;
          lb._checkedInitial = true;
        }

        // 🌟 2. [원장님 핵심 지침] 빈 교점에 있던 착수점/보기 문자('가', '나', '다', 1, 2 등):
        // 그 자리에 돌이 놓이면 돌 밑에 덮여서 문자가 자연스럽게 가려지고(지워지고),
        // 돌이 없어지면(수 무르기/따냄/문제 리셋 등) 다시 문자가 나타남!
        if (!lb._wasInitialStone && stoneColor !== 0) {
          continue; // 돌이 놓였으므로 문자는 자연스럽게 덮여서 보이지 않음!
        }

        // 🌟 3. 원래 바둑돌 위에 있던 문제 마커(세모 △, 동그라미 ○ 등)인데 돌이 따먹혀서 사라진 경우:
        // 빈 교점에 마커가 둥둥 떠다니는 시각적 오류 방지
        if (lb._wasInitialStone && stoneColor === 0) {
          continue;
        }

        ctx.save();

        if (stoneColor !== 0) {
          // ==========================================
          // A. 바둑돌 위에 그려지는 문제 마커 (△, ○, ◎, ×, ■)
          // ==========================================
          const isBlack = (stoneColor === 1);
          // 흑돌 위: 선명한 순백색(#ffffff) + 어두운 그림자
          // 백돌 위: 선명한 흑색(#0f172a 또는 #dc2626) + 밝은 그림자
          const markColor = isBlack ? '#ffffff' : '#0f172a';
          const strokeColor = isBlack ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';

          if (lb.type === 'triangle' || lb.text === '△') {
            // 세모(△) 마커 - 선명한 정삼각형 벡터
            const tr = stoneRadius * 0.48;
            ctx.lineWidth = Math.max(2.5, cellSize * 0.06);
            ctx.strokeStyle = markColor;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 3;
            ctx.beginPath();
            ctx.moveTo(lx, ly - tr * 1.05);
            ctx.lineTo(lx - tr * 0.95, ly + tr * 0.7);
            ctx.lineTo(lx + tr * 0.95, ly + tr * 0.7);
            ctx.closePath();
            ctx.stroke();
          } else if (lb.type === 'circle' || lb.text === '○' || lb.text === '◎') {
            // 동그라미(○) 마커 - 깔끔하고 선명한 단일 원형 링
            ctx.strokeStyle = markColor;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 3;
            ctx.lineWidth = Math.max(2.5, cellSize * 0.06);
            ctx.beginPath();
            ctx.arc(lx, ly, stoneRadius * 0.48, 0, Math.PI * 2);
            ctx.stroke();
          } else if (lb.type === 'square' || lb.text === '■' || lb.text === '□') {
            // 네모(□) 마커
            const sq = stoneRadius * 0.45;
            ctx.lineWidth = Math.max(2.5, cellSize * 0.06);
            ctx.strokeStyle = markColor;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 3;
            ctx.strokeRect(lx - sq, ly - sq, sq * 2, sq * 2);
          } else if (lb.type === 'cross' || lb.text === '×') {
            // 엑스(×) 마커
            const cr = stoneRadius * 0.42;
            ctx.lineWidth = Math.max(2.5, cellSize * 0.06);
            ctx.strokeStyle = markColor;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 3;
            ctx.beginPath();
            ctx.moveTo(lx - cr, ly - cr);
            ctx.lineTo(lx + cr, ly + cr);
            ctx.moveTo(lx + cr, ly - cr);
            ctx.lineTo(lx - cr, ly + cr);
            ctx.stroke();
          } else {
            // 일반 텍스트 라벨 (1, 2, A, B 등)
            ctx.fillStyle = markColor;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 3;
            ctx.font = `900 ${Math.floor(cellSize * 0.44)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(lb.text, lx, ly);
          }
        } else {
          // ==========================================
          // B. 빈 교점에 표시되는 선택지/타겟 마커
          // ==========================================
          if (lb.type === 'square' || lb.text === '■') {
            // 빈 교점의 사각형 타겟 마커
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            const sqSize = stoneRadius * 0.7;
            ctx.fillRect(lx - sqSize / 2, ly - sqSize / 2, sqSize, sqSize);
          } else if (lb.type === 'triangle' || lb.text === '△') {
            // 빈 교점의 세모 마커
            const tr = stoneRadius * 0.55;
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(lx, ly - tr * 1.05);
            ctx.lineTo(lx - tr * 0.95, ly + tr * 0.7);
            ctx.lineTo(lx + tr * 0.95, ly + tr * 0.7);
            ctx.closePath();
            ctx.stroke();
          } else if (lb.type === 'circle' || lb.text === '○' || lb.text === '◎') {
            // 빈 교점의 동그라미 마커
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(lx, ly, stoneRadius * 0.55, 0, Math.PI * 2);
            ctx.stroke();
          } else if (lb.type === 'cross' || lb.text === '×') {
            // 빈 교점의 엑스 마커 (공배 등)
            const cr = stoneRadius * 0.45;
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(lx - cr, ly - cr);
            ctx.lineTo(lx + cr, ly + cr);
            ctx.moveTo(lx + cr, ly - cr);
            ctx.lineTo(lx - cr, ly + cr);
            ctx.stroke();
          } else {
            // '가', '나', '다', '1', '2' 등 보기 라벨 (원형 배지 제거하고 자연스러운 단독 글자 렌더링)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `600 ${Math.floor(cellSize * 0.48)}px -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", sans-serif`;

            // 뒤의 바둑판 격자선과 겹쳐도 부드럽고 또렷하게 읽히도록 은은한 소프트 화이트 외곽선
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.lineWidth = 3.2;
            ctx.lineJoin = 'round';
            ctx.strokeText(lb.text, lx, ly);

            // 너무 굵지 않고 단정하며 자연스러운 폰트 본체
            ctx.fillStyle = '#1e293b';
            ctx.fillText(lb.text, lx, ly);
          }
        }

        ctx.restore();
      }
    }
  }

  getStarPoints() {
    // 🌟 [원장님 핵심 지침] 강의 모드, 대국 모드에서는 언제나 해당 바둑판 규격의 정통 정규 화점 표시!
    if (this.isLectureMode || !this.isMissionActive) {
      if (this.size === 9) {
        // 🌟 9줄 바둑판은 정중앙 천원 1개만 표시
        return [{ x: 4, y: 4 }];
      } else if (this.size === 13) {
        // 13줄 정규 화점: 4귀 4선 4개 + 중앙 천원 1개 (총 5개 화점)
        return [
          { x: 3, y: 3 }, { x: 9, y: 3 },
          { x: 6, y: 6 },
          { x: 3, y: 9 }, { x: 9, y: 9 }
        ];
      } else if (this.size === 19) {
        // 19줄 정규 화점: 9개 정규 화점 (4선, 10선, 16선)
        return [
          { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
          { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
          { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
        ];
      } else if (this.size === 11) {
        return [{ x: 5, y: 5 }];
      }
    }

    if (this.currentMission && typeof this.currentMission.getStarPoints === 'function') {
      const customStars = this.currentMission.getStarPoints(this.size);
      if (customStars && customStars.length > 0) return customStars;
    }
    const quad = (this.currentMission && typeof this.currentMission.getQuadrant === 'function')
      ? this.currentMission.getQuadrant()
      : null;

    if (quad === 'BR') {
      return [{ x: this.size - 4, y: this.size - 4 }];
    } else if (quad === 'BL') {
      return [{ x: 3, y: this.size - 4 }];
    } else if (quad === 'TL') {
      return [{ x: 3, y: 3 }];
    } else if (quad === 'TR') {
      return [{ x: this.size - 4, y: 3 }];
    }

    if (this.size === 9) {
      // 🌟 9줄 바둑판은 정중앙 천원 1개만 표시
      return [{ x: 4, y: 4 }];
    } else if (this.size === 11) {
      return [{ x: 5, y: 5 }];
    } else if (this.size === 13) {
      return [
        { x: 3, y: 3 }, { x: 9, y: 3 },
        { x: 6, y: 6 },
        { x: 3, y: 9 }, { x: 9, y: 9 }
      ];
    } else if (this.size === 19) {
      return [
        { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
        { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
      ];
    }
    return [];
  }

  setLibertyMode(mode) {
    this.libertyDisplayMode = mode;
    this.showLiberties = (mode !== 'none');
    
    // 툴바 로테이션 버튼 UI 동기화
    const btnLib = document.getElementById('btnToggleLiberty');
    const libSub = document.getElementById('libertyStatusSub');
    const subLabels = {
      'none': '끄기',
      'all': '⚫⚪',
      'black': '⚫',
      'white': '⚪'
    };
    if (btnLib) btnLib.classList.toggle('active', mode !== 'none');
    if (libSub) libSub.textContent = subLabels[mode] || '끄기';

    this.render();
  }

  drawLibertyIndicators() {
    if (this.libertyDisplayMode === 'none' || !this.showLiberties) return;

    const ctx = this.ctx;
    const cellSize = this.cellSize;
    const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
    const activeLiberties = new Set();

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const color = this.engine.board[y][x];
        if (color !== 0 && !visited[y][x]) {
          const { stones, liberties } = this.engine.getGroupAndLiberties(x, y);
          stones.forEach(s => visited[s.y][s.x] = true);

          // 옵션 필터링: 흑만 표시 / 백만 표시 / 전부 표시
          if (this.libertyDisplayMode === 'black' && color !== 1) continue;
          if (this.libertyDisplayMode === 'white' && color !== 2) continue;

          liberties.forEach(libStr => activeLiberties.add(libStr));
        }
      }
    }

    activeLiberties.forEach(libStr => {
      const [lx, ly] = libStr.split(',').map(Number);
      const px = cellSize * (lx + 1);
      const py = cellSize * (ly + 1);

      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.arc(px, py, cellSize * 0.16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });
  }

  // 바둑돌 렌더링 (정통 명품돌 vs 캐릭터돌) 및 땀방울 연출
  drawCharacterStone(x, y, r, color, isAtari, stepNumber) {
    const ctx = this.ctx;

    // 1. 바둑돌 그림자
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.max(4, r * 0.35);
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);

    // 2. 바둑돌 본체 및 디자인 렌더링
    const isCustomSpriteStyle = ['cat', 'smile', 'galaxy', 'robot', 'crystal'].includes(this.stoneStyle);
    let spriteDrawn = false;

    if (isCustomSpriteStyle && this.stoneSprites) {
      const spriteKey = `${this.stoneStyle}_${color === 1 ? 'black' : 'white'}`;
      const spriteImg = this.stoneSprites[spriteKey];
      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        // 프리미엄 3D 텍스처 스프라이트 렌더링 (그림자 포함 정밀 위치 매핑)
        ctx.drawImage(spriteImg, x - r, y - r, r * 2, r * 2);
        spriteDrawn = true;
      }
    }

    // 기본 본체 렌더링 (classic, adventurer, knight 모드이거나 스프라이트 미로딩 시)
    if (!spriteDrawn) {
      if (this.stoneStyle && this.stoneStyle.startsWith('gem-')) {
        this.drawGemstoneStone(x, y, r, color, this.stoneStyle);
      } else if (color === 1) {
        // 흑돌 (깊고 은은한 명품 흑요석 광택)
        const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        grad.addColorStop(0, '#555');
        grad.addColorStop(0.5, '#222');
        grad.addColorStop(1, '#050505');
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        // 백돌 (은은한 최고급 조개/진주빛)
        const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#e2e8f0');
        grad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }
    ctx.restore();

    // 3. 수순 번호 표시가 켜져 있으면 번호 우선 렌더링
    if (this.showStepNumbers && stepNumber) {
      ctx.fillStyle = color === 1 ? '#ffffff' : '#111111';
      ctx.font = `bold ${Math.max(10, Math.floor(r * 0.85))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stepNumber, x, y + 1);
    } 
    // 4. 캐릭터돌 모드별 렌더링 (adventurer, knight 벡터)
    if (!isCustomSpriteStyle && this.stoneStyle !== 'classic' && r >= 12) {
      if (this.stoneStyle === 'adventurer') {
        // [스타일 2: 앙증 요정돌] - 입/스카프 제거하고 맑고 귀여운 눈망울만 렌더링
        const eyeY = y - r * 0.06;

        // 눈망울 흰자 (흑백 동일)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - r * 0.32, eyeY, r * 0.18, 0, Math.PI * 2);
        ctx.arc(x + r * 0.32, eyeY, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // 눈동자 (흑백 동일)
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(x - r * 0.3, eyeY, r * 0.1, 0, Math.PI * 2);
        ctx.arc(x + r * 0.34, eyeY, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 앙증맞은 반짝임 (흑백 동일)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - r * 0.35, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.29, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

      } else if (this.stoneStyle === 'knight') {
        // [스타일 3: 꼬마 기사단] - 흑/백 모양 100% 동일 (동일한 3지창 기사 왕관 & 눈)
        // 3지창 미니 왕관 (흑돌: 황금 왕관 / 백돌: 은빛 백금 왕관)
        ctx.fillStyle = color === 1 ? '#f59e0b' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.42, y - r * 0.65);
        ctx.lineTo(x - r * 0.25, y - r * 0.4);
        ctx.lineTo(x, y - r * 0.75);
        ctx.lineTo(x + r * 0.25, y - r * 0.4);
        ctx.lineTo(x + r * 0.42, y - r * 0.65);
        ctx.lineTo(x + r * 0.3, y - r * 0.25);
        ctx.lineTo(x - r * 0.3, y - r * 0.25);
        ctx.closePath();
        ctx.fill();

        // 왕관 테두리 (흑백 동일)
        ctx.strokeStyle = color === 1 ? '#b45309' : '#0284c7';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 늠름한 눈망울 (흑백 동일 크기와 모양)
        ctx.fillStyle = color === 1 ? '#ffffff' : '#0f172a';
        ctx.beginPath();
        ctx.arc(x - r * 0.28, y + r * 0.05, r * 0.12, 0, Math.PI * 2);
        ctx.arc(x + r * 0.28, y + r * 0.05, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // 눈동자 하이라이트 (흑백 동일)
        ctx.fillStyle = color === 1 ? '#000000' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x - r * 0.28, y + r * 0.05, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.28, y + r * 0.05, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. 💦 단수(Atari) 시 입체적인 3D 땀방울 1개 연출 💦
    if (isAtari && this.showSweat && r >= 10) {
      this.draw3DSweatDrop(x, y, r);
    }
  }

  // 💦 단수 3D 입체 땀방울 렌더링 (돌 안쪽 우상단 이마 부근에 안정적으로 안착) 💦
  draw3DSweatDrop(x, y, r) {
    // 바둑돌 경계 안쪽(우상단 이마 부근)에 깔끔하게 안착
    const dropX = x + r * 0.48;
    const dropY = y - r * 0.42;
    const dropS = r * 0.28;
    const dropAngle = 0.22; // 살짝 비스듬한 만화풍 땀방울 각도

    this.renderSingle3DSweatDrop(dropX, dropY, dropS, dropAngle);
  }

  // 개별 3D 물방울 렌더링 함수
  renderSingle3DSweatDrop(cx, cy, s, angle = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // 1. 입체 드롭 섀도우
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
    ctx.shadowBlur = Math.max(3, s * 0.3);
    ctx.shadowOffsetX = Math.max(1, s * 0.15);
    ctx.shadowOffsetY = Math.max(2, s * 0.25);

    // 물방울 경로 생성 (상단 뾰족, 하단 통통한 입체 티어드롭)
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(-s * 0.8, -s * 0.15, -s * 0.75, s * 0.75, 0, s * 0.75);
    ctx.bezierCurveTo(s * 0.75, s * 0.75, s * 0.8, -s * 0.15, 0, -s);
    ctx.closePath();

    // 2. 3D 투명 유리알/물방울 래디얼 그라데이션 본체
    // 좌상단에서 빛이 들어오고, 하단과 우측에 맑은 청록빛 굴절광
    const bodyGrad = ctx.createRadialGradient(-s * 0.25, -s * 0.2, s * 0.1, 0, 0, s);
    bodyGrad.addColorStop(0, '#e0f2fe');   // 맑고 투명한 빛 중심부
    bodyGrad.addColorStop(0.35, '#7dd3fc'); // 산뜻한 하늘색
    bodyGrad.addColorStop(0.75, '#0284c7'); // 깊이감 있는 블루
    bodyGrad.addColorStop(1, '#0369a1');    // 물방울 가장자리 굴절 림

    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 3. 물방울 외곽 테두리 (입체 림 라이트)
    ctx.shadowColor = 'transparent'; // 내부 하이라이트 시 그림자 제거
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = Math.max(0.8, s * 0.08);
    ctx.stroke();

    // 4. 물방울 좌상단 반사 하이라이트 (빛나는 광택 타원)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.25, -s * 0.22, s * 0.28, s * 0.14, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // 5. 물방울 하단 내부 반사광 (물방울 특유의 영롱한 하단 광채)
    ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
    ctx.beginPath();
    ctx.ellipse(s * 0.1, s * 0.45, s * 0.22, s * 0.09, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ===================================================
  // ⚪⚫ 오목 대전 게임 엔진 로직
  // ===================================================
  restartOmok() {
    this.omokBoard = Array(15).fill(null).map(() => Array(15).fill(0));
    this.omokHistory = [];
    this.omokTurn = 1; // 항상 흑돌 선공
    this.omokGameOver = false;
    this.omokWinLine = null;
    this.isOmokAiThinking = false;
    if (this.omokAi) {
      this.omokAi.boardSize = 15;
    }

    // AI 대전인데 플레이어가 백돌(2)을 선택한 경우: AI(흑돌=1)가 첫 수로 천원(7, 7) 착점
    if (this.omokGameMode === 'ai' && this.omokPlayerColor === 2) {
      this.updateOmokStatus();
      this.render();
      setTimeout(() => {
        if (this.omokHistory.length === 0 && this.omokGameMode === 'ai' && this.omokPlayerColor === 2) {
          this.placeOmokStone(7, 7, 1);
        }
      }, 350);
      return;
    }

    this.updateOmokStatus();
    this.render();
  }

  handleOmokClick(x, y) {
    if (this.omokGameOver || this.isOmokAiThinking) return;
    if (x < 0 || x >= 15 || y < 0 || y >= 15) return;
    if (this.omokBoard[y][x] !== 0) return;

    // AI 대전일 때 플레이어 턴이 아니면 클릭 무시
    if (this.omokGameMode === 'ai' && this.omokTurn !== this.omokPlayerColor) return;

    // 🚫 흑돌 3·3(쌍삼) 금수 규칙 검사 (흑돌 착수 시)
    if (this.omokTurn === 1 && this.omokBanDoubleThree && this.omokAi) {
      const pat = this.omokAi.analyzePointPatterns(this.omokBoard, x, y, 1);
      if (pat.openThree >= 2) {
        if (window.badukAudio) window.badukAudio.playDdang();
        this.showBoardToast("🚫 흑돌은 '3·3(쌍삼) 금수'입니다! 다른 곳에 두세요.", "🚫");
        return;
      }
    }

    this.placeOmokStone(x, y, this.omokTurn);
  }

  placeOmokStone(x, y, color) {
    if (this.omokBoard[y][x] !== 0 || this.omokGameOver) return;

    this.omokBoard[y][x] = color;
    const step = this.omokHistory.length + 1;
    this.omokHistory.push({ x, y, color, step });

    // 착수 사운드
    if (window.badukAudio) window.badukAudio.playStone();

    // 5목 승리 판정
    const winResult = this.checkOmokWin(x, y, color);
    if (winResult) {
      this.omokGameOver = true;
      this.omokWinLine = winResult;
      this.render();
      if (window.badukAudio) window.badukAudio.playSuccess();
      const winnerName = color === 1 ? '흑돌(선공)' : '백돌(후공)';
      setTimeout(() => {
        alert(`🎉 축하합니다! 5목 완성으로 ${winnerName}이 승리했습니다! 🏆`);
      }, 300);
      this.updateOmokStatus();
      return;
    }

    // 턴 교체
    this.omokTurn = (this.omokTurn === 1) ? 2 : 1;
    this.hoverPos = null;
    this.updateOmokStatus();
    this.render();

    // AI 대전일 때 상대(AI) 차례이면 AI 응수
    const aiColor = (this.omokPlayerColor === 1) ? 2 : 1;
    if (this.omokGameMode === 'ai' && this.omokTurn === aiColor && !this.omokGameOver) {
      this.triggerOmokAiMove(aiColor);
    }
  }

  triggerOmokAiMove(aiColor = 2) {
    this.isOmokAiThinking = true;
    this.updateOmokStatus();

    setTimeout(() => {
      if (this.omokGameOver || !this.isOmokMode) {
        this.isOmokAiThinking = false;
        return;
      }
      if (!this.omokAi) {
        this.omokAi = new GomokuAI(15);
      }
      const bestMove = this.omokAi.findBestMove(this.omokBoard, aiColor, this.omokDifficulty);
      this.isOmokAiThinking = false;
      if (bestMove) {
        this.placeOmokStone(bestMove.x, bestMove.y, aiColor);
      }
    }, 320);
  }

  checkOmokWin(x, y, color) {
    const directions = [
      [1, 0],  // 가로
      [0, 1],  // 세로
      [1, 1],  // 우하향 대각선
      [1, -1]  // 우상향 대각선
    ];

    for (const [dx, dy] of directions) {
      const line = [{ x, y }];

      // 정방향 탐색
      let step = 1;
      while (true) {
        const nx = x + dx * step;
        const ny = y + dy * step;
        if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && this.omokBoard[ny][nx] === color) {
          line.push({ x: nx, y: ny });
          step++;
        } else break;
      }

      // 역방향 탐색
      step = 1;
      while (true) {
        const nx = x - dx * step;
        const ny = y - dy * step;
        if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && this.omokBoard[ny][nx] === color) {
          line.push({ x: nx, y: ny });
          step++;
        } else break;
      }

      if (line.length >= 5) {
        return line;
      }
    }
    return null;
  }

  undoOmok() {
    if (!this.omokAllowUndo) {
      this.showBoardToast("⚠️ 한 수 무르기 옵션이 꺼져있습니다.", "⚠️");
      return;
    }
    if (this.omokHistory.length === 0 || this.isOmokAiThinking) return;

    if (this.omokGameMode === 'ai') {
      // AI 모드: 플레이어 턴으로 돌아올 때까지 수 되돌리기
      const aiColor = (this.omokPlayerColor === 1) ? 2 : 1;
      if (this.omokTurn === this.omokPlayerColor) {
        // 플레이어 차례일 때는 [AI 수 + 플레이어 직전 수] 2수를 무름
        for (let i = 0; i < 2; i++) {
          if (this.omokHistory.length > 0) {
            const last = this.omokHistory.pop();
            this.omokBoard[last.y][last.x] = 0;
          }
        }
      } else {
        // AI 생각 전 또는 특수 상황: 마지막 1수 무름
        if (this.omokHistory.length > 0) {
          const last = this.omokHistory.pop();
          this.omokBoard[last.y][last.x] = 0;
        }
      }
      this.omokTurn = this.omokPlayerColor;
    } else {
      // 2인 모드는 1수 무름
      const last = this.omokHistory.pop();
      this.omokBoard[last.y][last.x] = 0;
      this.omokTurn = (this.omokTurn === 1) ? 2 : 1;
    }

    this.omokGameOver = false;
    this.omokWinLine = null;
    this.updateOmokStatus();
    this.render();
  }

  updateOmokStatus() {
    const turnText = document.getElementById('omokTurnText');
    const stepCounter = document.getElementById('omokStepCounter');
    const turnDot = document.getElementById('omokTurnDot');

    if (stepCounter) {
      stepCounter.textContent = `${this.omokHistory.length}수`;
    }

    if (turnText) {
      if (this.omokGameOver) {
        turnText.textContent = "🏆 대국이 종료되었습니다!";
      } else if (this.isOmokAiThinking) {
        turnText.textContent = "🤖 AI가 수읽기 중입니다...";
      } else {
        const name = (this.omokTurn === 1) ? "⚫ 흑돌 차례입니다" : "⚪ 백돌 차례입니다";
        turnText.textContent = name;
      }
    }

    if (turnDot) {
      turnDot.classList.toggle('waiting', this.isOmokAiThinking);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.badukApp = new BadukGameApp();
  window.gameApp = window.badukApp;
});
