/**
 * 난가대국 (爛柯對局) — 표준 종이 극장 앱 엔트리
 */
(function () {
  'use strict';

  function init() {
    var container = document.getElementById('paperTheaterApp');
    if (!container || !window.PaperTheaterEngine || !window.STORY_NANGA) {
      return;
    }

    window.paperTheater = new window.PaperTheaterEngine({
      container: container,
      story: window.STORY_NANGA,
      autoPlay: false,
      voiceEnabled: true,
      onEnded: function () {
        console.log('[PaperTheater] Nanga Daeguk ended.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
