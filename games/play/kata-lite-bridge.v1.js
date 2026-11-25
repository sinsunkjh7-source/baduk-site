/* BadukSchool lightweight KataGo adapter. Browser-only, policy inference, no MCTS. */
(function () {
  'use strict';
  var base = new URL('./', document.currentScript.src);
  var worker = null, readyPromise = null, nextId = 1, pending = new Map();
  var info = { status: 'idle', backend: null, model: 'g170e-b10c128-s1141046784-d204142634', lastMoveMs: 0, error: null };
  function notify(status, error) { info.status = status; info.error = error || null; window.dispatchEvent(new CustomEvent('baduk-kata-status', { detail: Object.assign({}, info) })); }
  function failAll(error) { pending.forEach(function (p) { clearTimeout(p.timer); p.reject(error); }); pending.clear(); readyPromise = null; if (worker) worker.terminate(); worker = null; notify('error', error.message); }
  function request(message, key, timeout) { return new Promise(function (resolve, reject) { var timer = setTimeout(function () { failAll(new Error('스쿨봇 응답이 지연되어 중단했습니다. 다시 시도해 주세요.')); }, timeout); pending.set(key, { resolve: resolve, reject: reject, timer: timer }); worker.postMessage(message); }); }
  function load() {
    if (readyPromise) return readyPromise;
    notify('loading');
    readyPromise = Promise.resolve().then(function () {
      worker = new Worker(new URL('kata-lite-worker.v1.js', base).href);
      worker.onerror = function (event) { failAll(new Error(event.message || '카타고 실행 파일을 불러오지 못했습니다.')); };
      worker.onmessageerror = function () { failAll(new Error('카타고 응답을 읽지 못했습니다.')); };
      worker.onmessage = function (event) {
        var message = event.data;
        if (message.type === 'katago:notice') return;
        var key = message.type === 'katago:init_result' ? 'init' : message.id;
        var entry = pending.get(key); if (!entry) return;
        pending.delete(key); clearTimeout(entry.timer);
        if (!message.ok) { entry.reject(new Error(message.error || '카타고 실행에 실패했습니다.')); return; }
        info.backend = message.backend || info.backend; entry.resolve(message);
      };
      return request({ type: 'katago:init', modelUrl: new URL('kata-b10-v1.bin.gz', base).href, backend: 'webgpu' }, 'init', 90000);
    }).then(function () { notify('ready'); }).catch(function (error) { if (worker) worker.terminate(); worker = null; readyPromise = null; notify('error', error.message); throw error; });
    return readyPromise;
  }
  function undoBoard(board, move) {
    var copy = board.map(function (row) { return row.slice(); });
    if (!move || move.isPass || move.x < 0) return copy;
    copy[move.y][move.x] = 0;
    (move.captures || []).forEach(function (stone) { copy[stone.y][stone.x] = 3 - move.color; });
    return copy;
  }
  function toColors(board) { return board.map(function (row) { return row.map(function (v) { return v === 1 ? 'black' : v === 2 ? 'white' : null; }); }); }
  function snapshotPosition(engine, color) {
    var step = typeof engine.currentStep === 'number' ? engine.currentStep : engine.moves.length;
    var moves = engine.moves.slice(0, step), previous = undoBoard(engine.board, moves[moves.length - 1]);
    return { board: toColors(engine.board), previousBoard: toColors(previous), previousPreviousBoard: toColors(undoBoard(previous, moves[moves.length - 2])), currentPlayer: color === 1 ? 'black' : 'white', moveHistory: moves.slice(-5).map(function (m) { return { x: m.x, y: m.y, player: m.color === 1 ? 'black' : 'white' }; }), komi: typeof engine.komi === 'number' ? engine.komi : 6.5, rules: 'japanese' };
  }
  /* opts.temperature: 0(없음) = 항상 가장 좋은 수, 클수록 다른 수도 자주 고른다 (정책 점수를 확률로 바꿔 뽑기). */
  async function findBestMove(engine, color, opts) {
    var temperature = opts && opts.temperature > 0 ? opts.temperature : 0;
    await load();
    var started = performance.now(), id = nextId++;
    var message = Object.assign(snapshotPosition(engine, color), { type: 'baduk:policy', id: id, modelUrl: new URL('kata-b10-v1.bin.gz', base).href, backend: 'webgpu' });
    var response = await request(message, id, 30000), policy = response.policy, n = engine.size;
    if (!policy || policy.length !== n * n + 1) throw new Error('카타고 바둑판 크기가 일치하지 않습니다.');
    var checker = new window.BadukAI(n), best = null, bestScore = -Infinity, legal = [];
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var score = policy[y * n + x];
      if (Number.isFinite(score) && checker.isLegal(engine.board, n, x, y, color, engine.koPoint)) {
        legal.push({ x: x, y: y, score: score });
        if (score > bestScore) { best = { x: x, y: y }; bestScore = score; }
      }
    }
    info.lastMoveMs = Math.round(performance.now() - started); info.backend = response.backend || info.backend;
    var step = typeof engine.currentStep === 'number' ? engine.currentStep : engine.moves.length;
    // 끝내는 판단(패스)은 레벨과 관계없이 가장 좋은 수를 기준으로 한다
    if (!best || (step >= 6 && Number.isFinite(policy[n * n]) && policy[n * n] > bestScore)) return { isPass: true };
    if (!temperature) return best;
    // 점수(로짓)를 온도로 나눠 확률로 바꾼 뒤 한 수를 뽑는다
    var weights = legal.map(function (m) { return Math.exp((m.score - bestScore) / temperature); });
    var total = weights.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * total;
    for (var i = 0; i < legal.length; i++) { r -= weights[i]; if (r <= 0) return { x: legal[i].x, y: legal[i].y }; }
    return best;
  }
  window.KataLiteBridge = { load: load, findBestMove: findBestMove, getInfo: function () { return Object.assign({}, info); }, snapshotPosition: snapshotPosition, dispose: function () { if (worker) worker.terminate(); worker = null; readyPromise = null; pending.forEach(function (p) { clearTimeout(p.timer); p.reject(new Error('카타고 요청이 취소되었습니다.')); }); pending.clear(); notify('idle'); } };
})();
