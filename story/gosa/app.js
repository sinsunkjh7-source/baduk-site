/**
 * 종이 극장 앱 진입점 (Standard Paper Theater App Entry)
 * ========================================================
 * 스토리 데이터(STORY_UGONG)를 표준 PaperTheaterEngine에 전달하여 구동
 */
(function () {
  'use strict';

  function init() {
    var container = document.getElementById('paperTheaterApp');
    if (!container || !window.PaperTheaterEngine || !window.STORY_UGONG) {
      console.warn('[PaperTheater] App initialization deferred - missing requirements.');
      return;
    }

    // 표준 엔진 인스턴스화 (사용자가 직접 재생 버튼을 누를 때 시작)
    window.paperTheater = new window.PaperTheaterEngine({
      container: container,
      story: window.STORY_UGONG,
      autoPlay: false,
      voiceEnabled: true,
      onEnded: function () {
        console.log('[PaperTheater] Story ended.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
