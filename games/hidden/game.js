/**
 * 숨은 그림 찾기 대모험 (Hidden Object Adventure)
 * 바둑스쿨 Fun — Modern Stage Engine
 */
(function () {
  'use strict';

  /* ---------------- Audio Engine (Web Audio API) ---------------- */
  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  var sfx = {
    found: function () {
      var ctx = getAudio(); if (!ctx) return;
      var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.36);
      });
    },
    hint: function () {
      var ctx = getAudio(); if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    },
    miss: function () {
      var ctx = getAudio(); if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    },
    win: function () {
      var ctx = getAudio(); if (!ctx) return;
      var fanfare = [
        { f: 523.25, d: 0.12, t: 0.00 },
        { f: 659.25, d: 0.12, t: 0.12 },
        { f: 783.99, d: 0.14, t: 0.24 },
        { f: 1046.50, d: 0.40, t: 0.40 }
      ];
      fanfare.forEach(function (n) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);
        gain.gain.setValueAtTime(0.28, ctx.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.t);
        osc.stop(ctx.currentTime + n.t + n.d + 0.05);
      });
    }
  };

  /* ---------------- Stage & Target Data ---------------- */
  var VW = 1376, VH = 768; // Native image coordinate space

  var STAGES = [
    {
      id: 'stage1_study',
      name: '신비한 바둑 서재',
      icon: '🏰',
      imageSrc: 'stages/stage1_study.jpg',
      targetCount: 6,
      allTargets: [
        { id: 'cat', name: '잠자는 삼색냥이', x: 880, y: 700, r: 48, desc: '방석 위에서 쿨쿨 자는 고양이' },
        { id: 'crystal_ball', name: '보라색 마법 구슬', x: 1032, y: 322, r: 42, desc: '책장 위에서 신비롭게 빛나는 보라색 구슬' },
        { id: 'bonsai', name: '소나무 분재', x: 138, y: 514, r: 48, desc: '작고 고풍스러운 소나무 화분' },
        { id: 'golden_fox', name: '황금 여우 조각', x: 468, y: 399, r: 40, desc: '창문 옆에 반짝이는 황금 여우상' },
        { id: 'owl', name: '통나무 부엉이', x: 825, y: 453, r: 40, desc: '눈을 동그랗게 뜬 목각 부엉이' },
        { id: 'blue_bird', name: '파란 작은 새', x: 798, y: 176, r: 38, desc: '책장 위에 앉아 쉬는 파랑새' },
        { id: 'paper_crane', name: '하얀 종이학', x: 1004, y: 445, r: 38, desc: '정성스럽게 접어놓은 흰 종이학' },
        { id: 'moon', name: '창밖의 초승달', x: 289, y: 138, r: 46, desc: '둥근 창문 밖 밤하늘에 뜬 은빛 초승달' },
        { id: 'star_chart', name: '별자리 지도 액자', x: 1018, y: 606, r: 46, desc: '다다미 바닥에 세워둔 천문 지도' },
        { id: 'gold_star', name: '황금 별 장식', x: 1210, y: 599, r: 38, desc: '책장에 놓인 반짝이는 별 장식' },
        { id: 'feather_pen', name: '푸른 깃털 펜', x: 330, y: 868, r: 42, desc: '바닥 지도 위의 푸른 깃털 펜' },
        { id: 'red_dragon', name: '붉은 용 두루마리', x: 316, y: 522, r: 42, desc: '용이 멋지게 그려진 족자' }
      ]
    },
    {
      id: 'stage2_ocean',
      name: '바닷속 용궁',
      icon: '🌊',
      imageSrc: 'stages/stage2_ocean.jpg',
      targetCount: 7,
      allTargets: [
        { id: 'yellow_seahorse', name: '황금 해마', x: 1307, y: 560, r: 44, desc: '보물상자 옆을 헤엄치는 황금빛 해마' },
        { id: 'pink_seahorse', name: '분홍 아기해마', x: 55, y: 568, r: 44, desc: '산호초 숲에 숨어 있는 귀여운 분홍 해마' },
        { id: 'treasure_chest', name: '황금 보물상자', x: 1142, y: 561, r: 50, desc: '보석과 금화가 가득 찬 보물상자' },
        { id: 'sunken_ship', name: '침몰한 난파선', x: 385, y: 215, r: 54, desc: '바닷속에 잠든 웅장한 목조 범선' },
        { id: 'palace_sign', name: '용궁 현판', x: 949, y: 261, r: 44, desc: '용궁이라고 적힌 금빛 대문 현판' },
        { id: 'clownfish', name: '흰동가리 (니모)', x: 110, y: 460, r: 42, desc: '말미잘 사이를 누비는 주황 물고기' },
        { id: 'blue_tang', name: '파란 열대어', x: 1293, y: 407, r: 44, desc: '노란 지느러미의 푸른 물고기' },
        { id: 'swimming_turtle', name: '헤엄치는 바다거북', x: 371, y: 453, r: 48, desc: '시원하게 바다를 헤엄치는 거북이' },
        { id: 'red_starfish', name: '빨간 불가사리', x: 1114, y: 730, r: 44, desc: '바닥 모래 위에 놓인 별 모양 불가사리' },
        { id: 'glowing_jellyfish', name: '황금빛 해파리', x: 220, y: 92, r: 46, desc: '등불처럼 빛나는 해파리' },
        { id: 'giant_pearl', name: '조개 속 왕진주', x: 124, y: 683, r: 44, desc: '조개 껍질 속에 영롱하게 빛나는 진주' },
        { id: 'shell_turtle', name: '바둑판 옆 거북이', x: 880, y: 453, r: 44, desc: '조개 바둑판 위를 빼꼼 내다보는 거북이' }
      ]
    },
    {
      id: 'stage3_forest',
      name: '요정의 숲속 비밀 캠프',
      icon: '⛺',
      imageSrc: 'stages/stage3_forest.jpg',
      targetCount: 8,
      allTargets: [
        { id: 'fawn_deer', name: '잠자는 아기 사슴', x: 1155, y: 591, r: 52, desc: '클로버 풀밭에 웅크려 곤히 자는 사슴' },
        { id: 'backpack_hedgehog', name: '배낭 멘 고슴도치', x: 468, y: 614, r: 46, desc: '파란 탐험가 배낭을 멘 고슴도치' },
        { id: 'leaf_frog', name: '연잎 위 청개구리', x: 179, y: 653, r: 44, desc: '맑은 옹달샘 연잎에 앉은 초록 개구리' },
        { id: 'acorn_squirrel', name: '도토리 든 다람쥐', x: 110, y: 384, r: 48, desc: '나뭇가지에서 도토리를 쥔 붉은 다람쥐' },
        { id: 'blue_butterfly', name: '숲속 파란 나비', x: 1169, y: 337, r: 42, desc: '나뭇잎 사이를 사뿐사뿐 나는 파랑나비' },
        { id: 'orange_butterfly', name: '호랑나비', x: 137, y: 138, r: 42, desc: '하늘 높이 날아가는 주황빛 호랑나비' },
        { id: 'hanging_lantern', name: '버섯 등불', x: 495, y: 376, r: 44, desc: '가지에 걸려 은은하게 빛나는 버섯 램프' },
        { id: 'balcony_fairy', name: '발코니 꼬마 요정', x: 1018, y: 222, r: 42, desc: '오두막 테라스에서 반갑게 손 흔드는 요정' },
        { id: 'stump_baduk', name: '밑동 바둑판', x: 715, y: 622, r: 50, desc: '나무 그루터기에 정교하게 새겨진 바둑판' },
        { id: 'watering_fairy', name: '꽃밭 요정', x: 991, y: 476, r: 44, desc: '꽃밭에 물을 주는 날개 달린 요정' },
        { id: 'chimney_smoke', name: '연기 나는 오두막', x: 440, y: 169, r: 48, desc: '지붕 굴뚝에서 모락모락 연기가 피어오르는 집' },
        { id: 'flower_basket', name: '걸린 꽃바구니', x: 1032, y: 345, r: 44, desc: '나뭇가지에 예쁘게 매달린 분홍 꽃바구니' }
      ]
    },
    {
      id: 'stage4_space',
      name: '은하수 우주 정거장',
      icon: '🚀',
      imageSrc: 'stages/stage4_space.jpg',
      targetCount: 8,
      allTargets: [
        { id: 'space_puppy', name: '우주견 멍멍이', x: 798, y: 415, r: 50, desc: '우주복 헬멧을 쓰고 뼈다귀와 유영하는 강아지' },
        { id: 'robot_spark', name: '비행 로봇 SPARK', x: 358, y: 322, r: 46, desc: '웃는 얼굴로 공중에 떠 있는 조수 로봇' },
        { id: 'robot_glow', name: '비행 로봇 GLOW', x: 977, y: 353, r: 46, desc: '오른쪽에서 환하게 안내하는 도우미 로봇' },
        { id: 'saturn_planet', name: '고리 달린 토성', x: 853, y: 161, r: 52, desc: '유리 돔 밖 은하수에 떠 있는 거대한 행성' },
        { id: 'space_satellite', name: '우주 인공위성', x: 481, y: 108, r: 44, desc: '우주 공간에 떠 있는 태양광 인공위성' },
        { id: 'microscope', name: '연구실 현미경', x: 55, y: 499, r: 44, desc: '책상 위에 놓인 첨단 광학 현미경' },
        { id: 'space_strawberry', name: '발광 우주 딸기', x: 1238, y: 476, r: 42, desc: '수경 재배실에서 빛나는 신비한 네온 딸기' },
        { id: 'robot_cat', name: '잠자는 로봇냥이', x: 771, y: 700, r: 44, desc: '안락의자 아래에서 잠든 귀여운 메카 고양이' },
        { id: 'neon_baduk', name: '홀로그램 바둑판', x: 688, y: 561, r: 52, desc: '공중에 떠서 빛나는 첨단 3D 네온 바둑판' },
        { id: 'toolbox', name: '무중력 공구함', x: 248, y: 683, r: 46, desc: '렌치가 꽂혀 있는 빨간 메카닉 공구상자' },
        { id: 'constellation', name: '창밖의 별자리', x: 660, y: 108, r: 44, desc: '우주 창문에 선명하게 빛나는 별자리 선' },
        { id: 'telescope', name: '천체 망원경', x: 248, y: 438, r: 46, desc: '우주 깊은 곳을 관측하는 금빛 망원경' }
      ]
    },
    {
      id: 'stage5_candyland',
      name: '달콤한 과자 마을',
      icon: '🧁',
      imageSrc: 'stages/stage5_candyland.jpg',
      targetCount: 9,
      allTargets: [
        { id: 'chef_bear', name: '파티시에 아기곰', x: 922, y: 379, r: 50, desc: '하얀 셰프 모자를 쓰고 크림을 짜는 곰' },
        { id: 'macaron_bunny', name: '마카롱 토끼', x: 1046, y: 538, r: 50, desc: '마카롱 바구니를 소중히 안고 있는 토끼' },
        { id: 'lollipop_duck', name: '롤리팝 아기오리', x: 1225, y: 645, r: 46, desc: '커다란 무지개 롤리팝 사탕을 든 노란 오리' },
        { id: 'waffle_baduk', name: '와플 바둑판', x: 715, y: 515, r: 52, desc: '초콜릿 트러플과 슈가볼이 놓인 달콤한 바둑판' },
        { id: 'choco_fountain', name: '3단 초콜릿 분수', x: 275, y: 353, r: 48, desc: '진한 초콜릿이 퐁퐁 솟아 흐르는 분수' },
        { id: 'donut_swing', name: '도넛 그네', x: 702, y: 177, r: 46, desc: '달콤한 초코 & 딸기 도넛으로 만든 그네' },
        { id: 'gingerbread_house', name: '진저브레드 과자집', x: 454, y: 254, r: 54, desc: '사탕 지붕과 과자 벽으로 지은 동화 속 집' },
        { id: 'giant_cake', name: '3단 딸기 케이크', x: 1293, y: 223, r: 50, desc: '풍성한 딸기 크림이 덮인 대형 삼단 케이크' },
        { id: 'cupcake', name: '딸기 컵케이크', x: 825, y: 400, r: 44, desc: '테이블 위 분홍 크림이 올라간 큰 컵케이크' },
        { id: 'pretzel_bench', name: '프레첼 벤치', x: 1211, y: 415, r: 48, desc: '노릇노릇 프레첼 모양의 정원 벤치' },
        { id: 'red_gummy', name: '빨간 곰젤리', x: 179, y: 554, r: 42, desc: '길가 울타리 옆에 서 있는 달콤한 빨간 젤리' },
        { id: 'green_gummy', name: '초록 곰젤리', x: 124, y: 415, r: 42, desc: '과자 나무 옆에서 깜찍하게 서 있는 초록 젤리' }
      ]
    }
  ];

  /* ---------------- State ---------------- */
  var state = {
    stageIndex: 0,
    unlockedStage: 0,
    targets: [],        // Active targets for the round
    foundIds: {},       // Set of found target ids
    hintsLeft: 3,
    startTime: 0,
    timerInterval: null,
    elapsedSeconds: 0,
    running: false,
    image: null,
    imageLoaded: false,
    
    // Viewport transform
    scale: 1.0,
    minScale: 1.0,
    maxScale: 2.8,
    panX: 0,
    panY: 0,
    
    // Interaction
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastPanX: 0,
    lastPanY: 0,
    hasMoved: false,
    
    // Visual Effects
    particles: [],
    hintBeacon: null, // { x, y, startTime, duration }
    missRipples: []   // array of { x, y, startTime }
  };

  /* ---------------- Elements ---------------- */
  var canvas = document.getElementById('hiddenCanvas');
  var ctx = canvas.getContext('2d');
  var container = document.getElementById('stageContainer');

  var stageBadge = document.getElementById('stageBadge');
  var stageTitle = document.getElementById('stageTitle');
  var timerVal = document.getElementById('timerVal');
  var remainVal = document.getElementById('remainVal');
  var stageSelect = document.getElementById('stageSelect');

  var btnHint = document.getElementById('btnHint');
  var hintCountEl = document.getElementById('hintCount');
  var btnZoomToggle = document.getElementById('btnZoomToggle');
  var zoomIcon = document.getElementById('zoomIcon');
  var zoomText = document.getElementById('zoomText');
  var btnRestart = document.getElementById('btnRestart');
  var btnRules = document.getElementById('btnRules');

  var targetsTray = document.getElementById('targetsTray');
  var trayGuide = document.getElementById('trayGuide');
  var floatingToast = document.getElementById('floatingToast');

  var resultModal = document.getElementById('resultModal');
  var resultTitle = document.getElementById('resultTitle');
  var resultDesc = document.getElementById('resultDesc');
  var resultStars = document.getElementById('resultStars');
  var resTime = document.getElementById('resTime');
  var resHints = document.getElementById('resHints');
  var resBest = document.getElementById('resBest');
  var btnNextStage = document.getElementById('btnNextStage');
  var btnModalAgain = document.getElementById('btnModalAgain');
  var btnModalClose = document.getElementById('btnModalClose');

  var rulesModal = document.getElementById('rulesModal');
  var btnCloseRules = document.getElementById('btnCloseRules');

  /* ---------------- Helpers ---------------- */
  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function showToast(msg) {
    if (!floatingToast) return;
    floatingToast.textContent = msg;
    floatingToast.hidden = false;
    floatingToast.classList.add('show');
    clearTimeout(floatingToast._timer);
    floatingToast._timer = setTimeout(function () {
      floatingToast.classList.remove('show');
      setTimeout(function () { floatingToast.hidden = true; }, 300);
    }, 1800);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------------- Load Stage ---------------- */
  function loadSavedProgress() {
    try {
      var un = parseInt(localStorage.getItem('bks_hidden_unlocked'), 10);
      if (!isNaN(un) && un >= 0) {
        state.unlockedStage = Math.min(un, STAGES.length - 1);
      }
    } catch (e) {}
    updateStageSelectOptions();
  }

  function updateStageSelectOptions() {
    stageSelect.innerHTML = '';
    STAGES.forEach(function (st, idx) {
      var opt = document.createElement('option');
      opt.value = idx;
      var locked = idx > state.unlockedStage;
      opt.textContent = (locked ? '🔒 ' : st.icon + ' ') + (idx + 1) + '단계: ' + st.name;
      opt.disabled = locked;
      stageSelect.appendChild(opt);
    });
    stageSelect.value = state.stageIndex;
  }

  function initStage(stageIdx) {
    state.stageIndex = stageIdx;
    var stage = STAGES[stageIdx];
    
    // Top Bar Info
    stageTitle.textContent = (stageIdx + 1) + '단계: ' + stage.name;
    stageBadge.querySelector('.badge-icon').textContent = stage.icon;
    stageSelect.value = stageIdx;

    // Reset status
    state.foundIds = {};
    state.hintsLeft = 3;
    hintCountEl.textContent = state.hintsLeft;
    btnHint.disabled = false;
    state.elapsedSeconds = 0;
    timerVal.textContent = '00:00';
    state.particles = [];
    state.hintBeacon = null;
    state.missRipples = [];

    // Select Targets (e.g. 6 to 9 distinct items from stage's 12 targets)
    var shuffled = shuffle(stage.allTargets);
    state.targets = shuffled.slice(0, stage.targetCount);

    updateRemainCount();
    renderTargetsTray();

    // Load Stage Background Image
    state.imageLoaded = false;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = stage.imageSrc;
    img.onload = function () {
      state.image = img;
      state.imageLoaded = true;
      resetViewport();
      render();
    };

    // Timer Start
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.startTime = performance.now();
    state.running = true;
    state.timerInterval = setInterval(function () {
      if (!state.running) return;
      state.elapsedSeconds = (performance.now() - state.startTime) / 1000;
      timerVal.textContent = formatTime(state.elapsedSeconds);
    }, 500);

    resultModal.hidden = true;
  }

  /* ---------------- Viewport & Canvas Layout ---------------- */
  function resizeCanvas() {
    var rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    clampPan();
    render();
  }

  function resetViewport() {
    var rect = container.getBoundingClientRect();
    if (rect.width === 0) return;
    
    // Base fit scale: fit image inside container
    var scaleX = rect.width / VW;
    var scaleY = rect.height / VH;
    state.minScale = Math.min(scaleX, scaleY);
    state.scale = state.minScale;
    
    // Center the image
    var displayW = VW * state.scale;
    var displayH = VH * state.scale;
    state.panX = (rect.width - displayW) / 2;
    state.panY = (rect.height - displayH) / 2;
    
    updateZoomBtn();
  }

  function clampPan() {
    var rect = container.getBoundingClientRect();
    var displayW = VW * state.scale;
    var displayH = VH * state.scale;

    if (displayW <= rect.width) {
      state.panX = (rect.width - displayW) / 2;
    } else {
      var minX = rect.width - displayW;
      var maxX = 0;
      state.panX = Math.min(maxX, Math.max(minX, state.panX));
    }

    if (displayH <= rect.height) {
      state.panY = (rect.height - displayH) / 2;
    } else {
      var minY = rect.height - displayH;
      var maxY = 0;
      state.panY = Math.min(maxY, Math.max(minY, state.panY));
    }
  }

  function updateZoomBtn() {
    var isZoomed = state.scale > state.minScale * 1.15;
    btnZoomToggle.classList.toggle('active', isZoomed);
    zoomText.textContent = isZoomed ? '전체 보기' : '확대';
  }

  /* ---------------- Target Tray Rendering ---------------- */
  function renderTargetsTray() {
    targetsTray.innerHTML = '';
    var stage = STAGES[state.stageIndex];

    state.targets.forEach(function (tgt) {
      var card = document.createElement('div');
      card.className = 'h-target-card';
      card.id = 'tgt-card-' + tgt.id;

      var thumb = document.createElement('img');
      thumb.className = 'target-thumb';
      thumb.src = 'stages/thumbs/' + stage.id + '_' + tgt.id + '.jpg';
      thumb.alt = tgt.name;
      thumb.loading = 'lazy';

      var info = document.createElement('div');
      info.className = 'target-info';

      var name = document.createElement('span');
      name.className = 'target-name';
      name.textContent = tgt.name;

      var status = document.createElement('span');
      status.className = 'target-status';
      status.textContent = '탐색 중 🔍';

      info.appendChild(name);
      info.appendChild(status);
      card.appendChild(thumb);
      card.appendChild(info);

      // Clicking card focuses/hints item gently
      card.addEventListener('click', function () {
        if (!state.foundIds[tgt.id]) {
          showToast('💡 ' + tgt.name + ': ' + (tgt.desc || '그림 속에서 찾아보세요!'));
        }
      });

      targetsTray.appendChild(card);
    });
  }

  function updateRemainCount() {
    var total = state.targets.length;
    var found = Object.keys(state.foundIds).length;
    var left = total - found;
    remainVal.textContent = left + ' / ' + total;
  }

  /* ---------------- Canvas Rendering Loop ---------------- */
  function render() {
    if (!state.imageLoaded) return;
    var dpr = window.devicePixelRatio || 1;
    var rect = container.getBoundingClientRect();

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply viewport transform (pan + scale)
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.scale, state.scale);

    // 1. Draw Background Illustration
    ctx.drawImage(state.image, 0, 0, VW, VH);

    var now = performance.now();

    // 2. Draw Found Markers (Glowing golden ring with checkmark)
    state.targets.forEach(function (tgt) {
      if (state.foundIds[tgt.id]) {
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tgt.x, tgt.y, tgt.r + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Little green badge with check
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(tgt.x + tgt.r * 0.7, tgt.y - tgt.r * 0.7, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', tgt.x + tgt.r * 0.7, tgt.y - tgt.r * 0.7 + 1);
        ctx.restore();
      }
    });

    // 3. Draw Hint Beacon Ripple
    if (state.hintBeacon) {
      var elapsed = now - state.hintBeacon.startTime;
      if (elapsed < state.hintBeacon.duration) {
        var phase = (elapsed % 1000) / 1000;
        var r = state.hintBeacon.r + phase * 60;
        var alpha = (1 - phase) * 0.9;

        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, ' + alpha + ')';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(state.hintBeacon.x, state.hintBeacon.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Inner pulsing orb
        ctx.fillStyle = 'rgba(254, 243, 199, ' + (alpha * 0.7) + ')';
        ctx.beginPath();
        ctx.arc(state.hintBeacon.x, state.hintBeacon.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        state.hintBeacon = null;
      }
    }

    // 4. Draw Miss Ripples
    for (var i = state.missRipples.length - 1; i >= 0; i--) {
      var rip = state.missRipples[i];
      var rel = now - rip.startTime;
      if (rel < 500) {
        var prg = rel / 500;
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, ' + (1 - prg) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, 10 + prg * 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        state.missRipples.splice(i, 1);
      }
    }

    // 5. Draw Sparkle Particles
    for (var p = state.particles.length - 1; p >= 0; p--) {
      var pt = state.particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.15; // gravity
      pt.life -= 0.025;

      if (pt.life > 0) {
        ctx.save();
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        state.particles.splice(p, 1);
      }
    }

    ctx.restore();

    // Request next frame if any active animations
    if (state.particles.length > 0 || state.hintBeacon || state.missRipples.length > 0) {
      requestAnimationFrame(render);
    }
  }

  /* ---------------- Hit Detection & Clicking ---------------- */
  function screenToVirtual(screenX, screenY) {
    var vx = (screenX - state.panX) / state.scale;
    var vy = (screenY - state.panY) / state.scale;
    return { x: vx, y: vy };
  }

  function virtualToScreen(vx, vy) {
    return {
      x: vx * state.scale + state.panX,
      y: vy * state.scale + state.panY
    };
  }

  function handleStageClick(screenX, screenY) {
    if (!state.running || !state.imageLoaded) return;
    var pt = screenToVirtual(screenX, screenY);

    // Check hit against active, unfound targets
    var hitTarget = null;
    var bestDist = Infinity;

    state.targets.forEach(function (tgt) {
      if (state.foundIds[tgt.id]) return;
      var dx = pt.x - tgt.x;
      var dy = pt.y - tgt.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= tgt.r && dist < bestDist) {
        bestDist = dist;
        hitTarget = tgt;
      }
    });

    if (hitTarget) {
      // SUCCESS!
      onTargetFound(hitTarget);
    } else {
      // MISS
      sfx.miss();
      state.missRipples.push({ x: pt.x, y: pt.y, startTime: performance.now() });
      requestAnimationFrame(render);
    }
  }

  function onTargetFound(tgt) {
    state.foundIds[tgt.id] = true;
    sfx.found();

    // Spawn Particles
    for (var i = 0; i < 28; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd = 2 + Math.random() * 5;
      state.particles.push({
        x: tgt.x,
        y: tgt.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        size: 3 + Math.random() * 4,
        color: ['#fbbf24', '#f59e0b', '#10b981', '#6ee7b7', '#ffffff'][Math.floor(Math.random() * 5)],
        life: 1.0
      });
    }

    // Card UI Update
    var card = document.getElementById('tgt-card-' + tgt.id);
    if (card) {
      card.classList.add('found', 'anim-found');
      card.querySelector('.target-status').textContent = '발견 완료! ✨';
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setTimeout(function () { card.classList.remove('anim-found'); }, 600);
    }

    updateRemainCount();
    showToast('✨ ' + tgt.name + ' 발견!');
    requestAnimationFrame(render);

    // Check Victory
    if (Object.keys(state.foundIds).length === state.targets.length) {
      setTimeout(onVictory, 600);
    }
  }

  function onVictory() {
    state.running = false;
    clearInterval(state.timerInterval);
    sfx.win();

    var stage = STAGES[state.stageIndex];
    var timeStr = formatTime(state.elapsedSeconds);

    // Save Record
    var bestKey = 'bks_hidden_best_s' + (state.stageIndex + 1);
    var prevBest = null;
    try { prevBest = parseFloat(localStorage.getItem(bestKey)); } catch (e) {}
    var isNewBest = false;
    if (isNaN(prevBest) || !prevBest || state.elapsedSeconds < prevBest) {
      isNewBest = true;
      try { localStorage.setItem(bestKey, state.elapsedSeconds.toFixed(1)); } catch (e) {}
    }

    // Unlock next stage
    if (state.stageIndex + 1 > state.unlockedStage) {
      state.unlockedStage = Math.min(state.stageIndex + 1, STAGES.length - 1);
      try { localStorage.setItem('bks_hidden_unlocked', state.unlockedStage); } catch (e) {}
      updateStageSelectOptions();
    }

    // Calculate Stars
    var stars = '⭐⭐⭐';
    if (state.elapsedSeconds > 180 || state.hintsLeft === 0) stars = '⭐';
    else if (state.elapsedSeconds > 90 || state.hintsLeft === 1) stars = '⭐⭐';

    resultStars.textContent = stars;
    resultTitle.textContent = (state.stageIndex + 1) + '단계 완벽 클리어!';
    resultDesc.textContent = stage.name + '의 모든 숨은 보물을 찾았습니다!';
    resTime.textContent = timeStr;
    resHints.textContent = (3 - state.hintsLeft) + '회';
    resBest.textContent = isNewBest ? ('🌟 ' + timeStr) : (formatTime(prevBest || state.elapsedSeconds));

    if (state.stageIndex >= STAGES.length - 1) {
      btnNextStage.textContent = '👑 1단계부터 다시 도전';
    } else {
      btnNextStage.textContent = '🚀 다음 ' + (state.stageIndex + 2) + '단계 도전!';
    }

    resultModal.hidden = false;
  }

  /* ---------------- Hint System ---------------- */
  function useHint() {
    if (!state.running || state.hintsLeft <= 0) {
      showToast('⚠️ 사용할 수 있는 힌트가 없습니다!');
      return;
    }

    // Find an unfound target
    var unfound = state.targets.filter(function (t) { return !state.foundIds[t.id]; });
    if (unfound.length === 0) return;

    var tgt = unfound[Math.floor(Math.random() * unfound.length)];
    state.hintsLeft--;
    hintCountEl.textContent = state.hintsLeft;
    if (state.hintsLeft === 0) btnHint.disabled = true;

    sfx.hint();
    showToast('💡 힌트: ' + tgt.name + ' 주변이 반짝입니다!');

    // Smoothly pan towards target if off-screen or zoomed
    var rect = container.getBoundingClientRect();
    if (state.scale > state.minScale * 1.1) {
      state.panX = rect.width / 2 - tgt.x * state.scale;
      state.panY = rect.height / 2 - tgt.y * state.scale;
      clampPan();
    }

    // Set beacon animation
    state.hintBeacon = {
      x: tgt.x,
      y: tgt.y,
      r: tgt.r,
      startTime: performance.now(),
      duration: 3500
    };

    requestAnimationFrame(render);
  }

  /* ---------------- Pointer / Touch / Drag / Zoom Handling ---------------- */
  function getContainerCoords(e) {
    var rect = container.getBoundingClientRect();
    var clientX = e.clientX, clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  container.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    state.isDragging = true;
    state.hasMoved = false;
    var c = getContainerCoords(e);
    state.dragStartX = c.x;
    state.dragStartY = c.y;
    state.lastPanX = state.panX;
    state.lastPanY = state.panY;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', function (e) {
    if (!state.isDragging) return;
    var c = getContainerCoords(e);
    var dx = c.x - state.dragStartX;
    var dy = c.y - state.dragStartY;
    if (Math.hypot(dx, dy) > 6) {
      state.hasMoved = true;
      state.panX = state.lastPanX + dx;
      state.panY = state.lastPanY + dy;
      clampPan();
      render();
    }
  });

  container.addEventListener('pointerup', function (e) {
    if (!state.isDragging) return;
    state.isDragging = false;
    try { container.releasePointerCapture(e.pointerId); } catch (err) {}
    
    if (!state.hasMoved) {
      var c = getContainerCoords(e);
      handleStageClick(c.x, c.y);
    }
  });

  container.addEventListener('pointercancel', function () {
    state.isDragging = false;
  });

  // Wheel Zoom
  container.addEventListener('wheel', function (e) {
    e.preventDefault();
    var c = getContainerCoords(e);
    var oldScale = state.scale;
    var zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    var newScale = Math.min(state.maxScale, Math.max(state.minScale, oldScale * zoomFactor));

    if (newScale !== oldScale) {
      // Zoom centered on pointer
      var mouseVirtualX = (c.x - state.panX) / oldScale;
      var mouseVirtualY = (c.y - state.panY) / oldScale;

      state.scale = newScale;
      state.panX = c.x - mouseVirtualX * newScale;
      state.panY = c.y - mouseVirtualY * newScale;
      clampPan();
      updateZoomBtn();
      render();
    }
  }, { passive: false });

  // Mobile Pinch to Zoom
  var touchDistStart = 0;
  var touchScaleStart = 1;
  container.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistStart = Math.hypot(dx, dy);
      touchScaleStart = state.scale;
    }
  }, { passive: true });

  container.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && touchDistStart > 0) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.hypot(dx, dy);
      var factor = dist / touchDistStart;
      state.scale = Math.min(state.maxScale, Math.max(state.minScale, touchScaleStart * factor));
      clampPan();
      updateZoomBtn();
      render();
    }
  }, { passive: true });

  // Zoom Button Toggle
  btnZoomToggle.addEventListener('click', function () {
    if (state.scale > state.minScale * 1.15) {
      resetViewport();
    } else {
      var rect = container.getBoundingClientRect();
      state.scale = Math.min(state.maxScale, state.minScale * 1.8);
      state.panX = (rect.width - VW * state.scale) / 2;
      state.panY = (rect.height - VH * state.scale) / 2;
      clampPan();
    }
    updateZoomBtn();
    render();
  });

  /* ---------------- UI Event Listeners ---------------- */
  btnHint.addEventListener('click', useHint);

  btnRestart.addEventListener('click', function () {
    initStage(state.stageIndex);
  });

  stageSelect.addEventListener('change', function () {
    var val = parseInt(stageSelect.value, 10);
    if (!isNaN(val) && val >= 0 && val <= state.unlockedStage) {
      initStage(val);
    }
  });

  btnRules.addEventListener('click', function () {
    rulesModal.hidden = false;
  });
  btnCloseRules.addEventListener('click', function () {
    rulesModal.hidden = true;
  });

  // Modal Actions
  btnNextStage.addEventListener('click', function () {
    resultModal.hidden = true;
    var nextIdx = (state.stageIndex + 1) % STAGES.length;
    initStage(nextIdx);
  });

  btnModalAgain.addEventListener('click', function () {
    resultModal.hidden = true;
    initStage(state.stageIndex);
  });

  btnModalClose.addEventListener('click', function () {
    resultModal.hidden = true;
  });

  // Window Resize
  window.addEventListener('resize', function () {
    resizeCanvas();
  });

  // Boot Engine
  loadSavedProgress();
  resizeCanvas();

  var urlParams = new URLSearchParams(location.search);
  var initSt = parseInt(urlParams.get('stage'), 10);
  if (!isNaN(initSt) && initSt >= 0 && initSt < STAGES.length) {
    state.unlockedStage = Math.max(state.unlockedStage, initSt);
    updateStageSelectOptions();
    initStage(initSt);
  } else {
    initStage(0);
  }

  // Hide initial hint overlay after 5 seconds
  setTimeout(function () {
    var hint = document.getElementById('zoomOverlayHint');
    if (hint) {
      hint.style.opacity = '0';
      setTimeout(function () { hint.remove(); }, 600);
    }
  }, 5000);

})();
