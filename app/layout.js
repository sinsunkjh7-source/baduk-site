/* ============================================================
   바둑스쿨 레이아웃 재배치
   - 사이드바: 맨 좌측 (원본 유지)
   - 바둑판: 가운데
   - 문제번호·조작메뉴·설정: 바둑판 오른쪽
   - 마스터·힌트: 그 아래
   ============================================================ */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var mc = document.querySelector('.ck-main-viewport .main-content') || document.querySelector('.main-content');
    if (!mc) return;

    var sp = mc.querySelector('.story-panel');
    var bw = mc.querySelector('.board-wrapper');

    /* 이미 처리됨 */
    if (mc.querySelector('.bs-right')) return;

    var right = document.createElement('div');
    right.className = 'bs-right';

    /* 1) 문제번호·메뉴·설정 패널 → 오른쪽 열로 */
    if (sp) right.appendChild(sp);

    /* 2) 마스터(코치) + 힌트 → 패널 아래 */
    var master = document.createElement('div');
    master.className = 'bs-master';

    var picked = [];
    ['.master-coach-frame', '.master-speech-bubble', '.master-coach-name', '.master-coach-sub',
     '.char-coach-box'].forEach(function (sel) {
      var el = mc.querySelector(sel) || document.querySelector(sel);
      if (el && picked.indexOf(el) === -1) { picked.push(el); }
    });
    picked.forEach(function (el) {
      var wrap = document.createElement('div');
      wrap.className = 'bs-master-item';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      master.appendChild(wrap);
    });

    if (master.children.length) right.appendChild(master);

    /* 3) 판 뒤에 오른쪽 열 삽입 */
    if (bw && bw.parentNode === mc) bw.parentNode.insertBefore(right, bw.nextSibling);
    else mc.appendChild(right);

    mc.classList.add('bs-two-col');
    document.body.classList.add('bs-layout');
  });
})();
