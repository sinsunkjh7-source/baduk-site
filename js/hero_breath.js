/* 히어로 캐릭터 미세 움직임 (아주 천천히 숨쉬는 느낌)
   - 이미지 1장에 transform만 준다 (레이아웃 영향 없음)
   - 모션 최소화 설정이면 동작하지 않음                                     */
(function () {
  'use strict';

  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq && mq.matches) return;

  function init() {
    var img = document.querySelector('.hero-art');
    if (!img || img.dataset.bkBreath === '1') return;
    img.dataset.bkBreath = '1';

    var st = document.getElementById('bkHeroBreathStyle');
    if (!st) {
      st = document.createElement('style');
      st.id = 'bkHeroBreathStyle';
      st.textContent = [
        '.hero-art {',
        '  transform-origin: 50% 78%;',
        '  will-change: transform;',
        '  animation: bkHeroBreath 8s ease-in-out infinite;',
        '}',
        '@keyframes bkHeroBreath {',
        '  0%   { transform: scale(1) translateY(0); }',
        '  50%  { transform: scale(1.012) translateY(-5px); }',
        '  100% { transform: scale(1) translateY(0); }',
        '}',
        '@media (prefers-reduced-motion: reduce) {',
        '  .hero-art { animation: none !important; }',
        '}'
      ].join('\n');
      document.head.appendChild(st);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
