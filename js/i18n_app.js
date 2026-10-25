/* ============================================================
   앱 화면(사이드바 · 상단 탭 · 카드 · 푸터) 한국어화 + 바둑 용어 전환
   - 텍스트 노드 단위 정확 일치 교체
   - 화면 이동 때마다 다시 그려지므로 MutationObserver로 재적용
   ============================================================ */
(function () {
  var MAP = {
    /* 브랜드 · 사용자 */
    "BadukSchool": "바둑스쿨",
    "👑CK": "JH",
    "CK": "JH",
    "Guest": "게스트",
    "Me": "나",

    /* 사이드바 */
    "My Avatar": "내 아바타",
    "Play": "대국",
    "⚡ 빠른 대국": "⚡ 빠른 대국",
    "⏱️ 느린 대국": "⏱️ 느린 대국",
    "🏆 Tournaments": "🏆 토너먼트",
    "Puzzles": "사활 문제",
    "🧩 Daily Puzzles": "🧩 오늘의 사활",
    "⚡ Puzzle Duel": "⚡ 문제 대결",
    "🔥 Puzzle Rush": "🔥 연속 풀이",
    "Bots": "AI 봇",
    "🐣 Beginner Bots": "🐣 입문 봇",
    "🦊 Intermediate Bots": "🦊 중급 봇",
    "👑 Master Bots": "👑 고수 봇",
    "Lessons": "강의",
    "🎓 Interactive Lessons": "🎓 인터랙티브 강의",
    "🎥 Video Tutorials": "🎥 영상 강좌",
    "Go Gold": "골드 멤버십",
    "More": "더보기",
    "🏆 Leaderboard": "🏆 랭킹",
    "🏰 Clubs": "🏰 바둑 동아리",
    "⚙️ Settings": "⚙️ 설정",

    /* 하단 링크 */
    "Testimonials": "이용 후기",
    "About": "소개",
    "FAQs": "자주 묻는 질문",
    "Privacy & Safety": "개인정보 · 안전",
    "COPPA": "아동 보호",
    "Contact": "문의",

    /* Play 화면 */
    "빠른 대국": "빠른 대국",
    "Play a quick 5-minute or 10-minute game against kids around the world!": "전국 친구들과 5분·10분 빠른 대국을 해보세요!",
    "Play Now ➔": "바로 대국 ➔",
    "Play vs Bots": "AI와 대국",
    "Practice stress-free against 바둑 선생님 and a zoo of friendly AI 봇!": "실력에 맞는 AI와 부담 없이 연습해보세요!",
    "Choose a Bot ➔": "AI 고르기 ➔",
    "Tournaments": "토너먼트",
    "Join safe Swiss tournaments with your club, school, or friends!": "학교·동아리 친구들과 안전하게 토너먼트에 참가해보세요!",
    "View Tourneys ➔": "대회 보기 ➔",

    /* 아바타 */
    "Log In to edit your avatar!": "로그인하면 아바타를 꾸밀 수 있어요!",
    "Sign Up": "회원가입",
    "♟️ 바둑판 색상": "🎨 바둑판 색상 테마",
    "🌿 Classic Green": "🌿 클래식 그린",
    "🪵 Wood": "🪵 나무",
    "🌊 Ocean Blue": "🌊 오션 블루",
    "🌸 Bubblegum": "🌸 버블검",
    "♚ 바둑돌 스타일": "⚫ 바둑알 스타일",
    "Staunton (Classic)": "기본 (클래식)",
    "Wood Carved": "나무 조각",
    "💾 Save Theme": "💾 테마 저장",
    "👑 Choose Your Royal Coach": "👑 나의 바둑 스승",
    "바둑 선생님": "도원 스승",
    "Head Royal Coach of BadukSchool": "바둑스쿨 대표 스승",
    "FunMaster Mike": "바둑 명인",
    "FIDE Master & Lead Instructor": "프로기사 · 수석 지도자",
    "💾 Select Coach": "💾 스승 선택",

    /* 사활 문제 화면 */
    "🧩 오늘의 문제": "🧩 오늘의 사활 문제",
    "Puzzle 1: Scholar's Mate (Checkmate in 1)": "1번 문제: 초반 필살기 (한 수 마무리)",
    "White to move! Find the winning checkmate square with your Queen!": "흑 차례! 상대 돌을 잡는 자리를 찾아보세요!",
    "💡 Show Hint": "💡 힌트 보기",
    "🔄 Retry": "🔄 다시 풀기",
    "White to Move (Your Turn)": "흑 차례 (당신 차례)",


    /* AI 봇 목록 */
    "상급 봇": "소피",
    "Rating 800 (Apprentice)": "급수 800 (초급)",
    "초반부터 적극적으로 싸웁니다!": "초반부터 과감하게 공격하는 스타일!",
    "초급 봇": "레오",
    "Rating 1000 (Intermediate)": "급수 1000 (중급)",
    "영리하고 재빠릅니다. 끊는 수를 조심하세요!": "영리하고 교활해요. 끊어치기와 양단수를 조심하세요!",
    "중급 봇": "벤",
    "Rating 1200 (Advanced)": "급수 1200 (상급)",
    "차분하지만 결정적인 한 수를 둡니다!": "차분하지만 결정적인 곳에서 크게 잡아갑니다!",
    "왕초보 봇": "록시",
    "Rating 1400 (Expert)": "급수 1400 (고수)",
    "거침없는 공격과 끝내기 승부를 즐깁니다!": "끝내기 실력이 뛰어난 봇이에요!",
    "Rating 500 (Beginner)": "급수 500 (입문)",


    "Rating 1600 (Champion)": "급수 1600 (챔피언)",
    "The royal champion of BadukSchool! Can you checkmate the King?": "바둑스쿨 최강 챔피언! 스승을 이길 수 있을까요?",
    "도전하기 ➔": "도전하기 ➔",
    "BadukSchool Curriculum": "바둑스쿨 커리큘럼",
    "입문부터 고급까지 단계별로 배워요!": "입문부터 고수까지 단계별로 배워요!",
    "Completed ✓": "완료 ✓",
    "Current Lesson ▶": "진행 중 ▶",


    "Start Today's Lesson": "오늘의 강의 시작",
    "Weekly Star Leaderboard": "주간 별 랭킹",
    "The hardest working BadukSchools of the week!": "이번 주 가장 열심히 한 친구들!",
    "Solve Puzzles to Earn Stars!": "사활 문제를 풀고 별을 모으세요!",
    "Settings & Sound": "설정 · 소리",
    "Configure your sound effects and piece animation speed.": "효과음과 돌 놓는 애니메이션 속도를 조절합니다.",
    "Save Settings": "설정 저장",

    /* AI 봇 화면 */
    "Official BadukSchool Master": "공식 바둑스쿨 마스터",
    "FunBot": "즐거운 봇",
    "Rating 500 (Beginner)": "급수 500 (입문)",
    "Just hatched! Still learning how 돌의 활로.": "이제 막 시작했어요! 아직 돌 놓는 법을 배우는 중입니다.",
    "Play Bot ➔": "대국하기 ➔"
  };

  /* 사이드바 상단 로고를 우리 로고로 교체 */
  function swapLogo() {
    var el = document.querySelector(".ck-sb-logo");
    if (!el || el.dataset.bkLogo === "1") return;
    el.dataset.bkLogo = "1";
    el.innerHTML = '<img src="images/baduk_logo_final.png" alt="JH 바둑스쿨" class="bk-sb-logo__img">';
  }

  /* 사이드바 아바타 버튼 글자도 '아바타'로 */
  function swapAvatarLabel() {
    var btn = document.querySelector(".ck-badge-btn");
    if (!btn) return;
    var span = btn.querySelector("span") || btn;
    if (span.textContent.trim() === "JH") span.textContent = "아바타";
  }

  function translate() {
    swapLogo();
    swapAvatarLabel();
    var root = document.querySelector(".ck-app-shell");
    if (!root) return 0;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n = 0, node;
    while ((node = w.nextNode())) {
      var p = node.parentElement;
      if (!p || p.closest("script, style")) continue;
      var raw = node.nodeValue, key = raw.trim();
      if (MAP[key]) { node.nodeValue = raw.replace(key, MAP[key]); n++; }
    }
    window.__bkAppI18n = n;
    return n;
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      translate();
    });
  }

  translate();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  setInterval(translate, 1200);   /* 화면 전환 대비 안전망 */
})();
