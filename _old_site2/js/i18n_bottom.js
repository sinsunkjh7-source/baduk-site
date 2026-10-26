/* ============================================================
   홈 아래쪽(카드 다음 ~ 푸터) 영문 문구를 한국어로 바꾸고
   영문 표현을 바둑 용어로 바꾼다.
   - 텍스트 노드 단위로 정확히 일치하는 문구만 교체
   - 카드/통계/히어로/헤더는 건드리지 않음
   ============================================================ */
(function () {
  var MAP = {
    /* 인트로 */
    "Why Kids Love BadukSchool": "아이들이 바둑스쿨을 좋아하는 이유",
    "Join our inspiring community": "함께 성장하는 우리 커뮤니티",

    /* 4개 특징 */
    "BadukSchool is Safe and Positive": "안전하고 건강한 바둑 교실",
    "No chat": "채팅 기능 없음",
    "Auto-generated usernames": "자동 생성 아이디",
    "Child activity reports": "자녀 활동 리포트",

    "Educational Screen Time": "배움이 되는 화면 시간",
    "Healthy screen time that parents can approve of": "부모가 안심할 수 있는 화면 사용",
    "Kids learn pattern recognition and problem solving": "아이들이 패턴 인식과 문제 해결력을 배웁니다",
    "to play on-the-go!": "언제 어디서나 대국!",

    "Classroom Approved": "교실에서 검증된 수업",
    "Used by 2000+ schools to support interactive learning": "2,000개 이상 학교에서 수업에 활용",
    "Teacher training video lessons and resources": "교사 연수 영상과 수업 자료",
    "makes access from anywhere easy": "어디서든 쉽게 접속",

    "Personalized Learning": "나에게 맞춘 학습",
    "Lessons are tailored to every skill level and pace": "실력과 속도에 맞춘 맞춤 수업",
    "Translated into 30+ languages": "30개 이상 언어 지원",
    "Option for personal instruction from certified coaches": "공인 지도자 1:1 지도 가능",

    "Featured in...": "언론에 소개된 바둑스쿨",

    /* 후기·새소식 섹션은 삭제됨 */

    /* 골드 배너 */
    "Discover your full potential": "숨은 실력을 깨워보세요",
    "by becoming a Gold Member": "골드 회원이 되면",
    "Unlimited everything! Puzzles, Lessons, Videos, Workouts and Game History!":
      "사활 문제·강의·영상·연습·기보까지 모두 무제한!",
    "Upgrade to Gold": "골드로 업그레이드",

    /* 앱 다운로드 */
    "Available on iOS and Android": "iOS와 안드로이드에서 사용 가능",
    "Download here:": "다운로드:",
    "Follow us": "팔로우",
    "Download our App": "앱 다운로드",

    /* 푸터 링크 */
    "My Avatar": "내 아바타",
    "Play": "대국",
    "대국": "바둑 대국",
    "AI 대국": "AI와 대국",
    "Live Games": "실시간 대국",
    "Slow games": "느린 대국",
    "사활 문제": "사활 문제",
    "Puzzle Duel": "문제 대결",
    "Vision Trainer": "수읽기 훈련",
    "Computer Workouts": "AI 연습",
    "바둑 배우기": "바둑 배우기",
    "Lessons": "강의",
    "Videos": "영상",
    "Articles": "읽을거리",
    "Analysis": "기보 분석",
    "Grants": "지원 프로그램",
    "Lesson Planner": "수업 계획",
    "Live Classroom": "온라인 교실",
    "Resources": "자료실",
    "바둑 자료실": "바둑 자료",
    "바둑 대회": "바둑 대회",
    "Events Calendar": "대회 일정",
    "About Us": "회사 소개",
    "Contact Us": "문의하기",
    "Downloadable Materials": "내려받기 자료",
    "BadukSchool Shop": "바둑스쿨 스토어",
    "Privacy & Legal": "개인정보 · 약관",
    "Privacy & Safety": "개인정보 · 안전",
    "2026 © All rights reserved": "2026 © 바둑스쿨. All rights reserved",
    "BadukSchool is part of": "바둑스쿨 운영",
    "Guest": "게스트",
    "⏱️ 느린 대국": "⏱️ 느린 대국",
    "⚡ 빠른 대국": "⚡ 빠른 대국",
    "🏆 Tournaments": "🏆 토너먼트",
    "🧩 Daily Puzzles": "🧩 오늘의 사활"
  };

  var SKIP = ".bk-hero, .bk-stats, .bk-cards, .bk-card, .ck-app-shell, .bk-hbtn, .bk-domain, .bk-logo";

  function run() {
    var root = document.querySelector(".ck-landing-wrapper") || document.body;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n = 0, node;
    while ((node = walker.nextNode())) {
      var p = node.parentElement;
      if (!p) continue;
      if (p.closest("script, style, " + SKIP)) continue;
      var raw = node.nodeValue;
      var key = raw.trim();
      if (MAP[key]) {
        node.nodeValue = raw.replace(key, MAP[key]);
        n++;
      }
    }
    window.__bkBottomI18n = n;
    return n;
  }

  /* 로드 실패한 이미지는 숨긴다 (alt 영문이 그대로 보이던 문제) */
  function hideBrokenImages() {
    var n = 0;
    document.querySelectorAll("img").forEach(function (im) {
      if (im.complete && im.naturalWidth === 0 && !im.dataset.bkHidden) {
        im.dataset.bkHidden = "1";
        im.style.display = "none";
        n++;
      }
    });
    window.__bkBrokenImages = n;
  }

  function all() { run(); hideBrokenImages(); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", all);
  else all();
  setTimeout(all, 900);
  window.addEventListener("load", function () { setTimeout(hideBrokenImages, 300); });
})();
