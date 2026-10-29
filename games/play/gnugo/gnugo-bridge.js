// =========================================================================
// JH 바둑스쿨 - 🤖 GNU Go WebAssembly 브릿지 (GNU Go 3.9.1 Wasm Engine)
// 서버 없이 브라우저에서 100% 로컬로 구동되는 정통 오픈소스 바둑 AI
// =========================================================================

(function () {
  'use strict';

  var DB_NAME = 'BadukSchoolWasmCache';
  var DB_STORE = 'wasm_files';
  var WASM_KEY = 'gnugo_3_9_1';

  var GNUGoBridge = {
    isReady: false,
    isLoading: false,
    module: null,
    onReadyCallbacks: [],

    init: function (wasmUrl) {
      if (this.isReady) return Promise.resolve();
      if (this.isLoading) {
        return new Promise(function (resolve) {
          GNUGoBridge.onReadyCallbacks.push(resolve);
        });
      }

      this.isLoading = true;
      var self = this;
      wasmUrl = wasmUrl || 'gnugo/gnugo.wasm';

      return new Promise(function (resolve, reject) {
        // 1. IndexedDB 캐시에서 WASM 바이너리 조회 (고속 로딩)
        self.loadWasmBinary(wasmUrl, function (err, binary) {
          if (err || !binary) {
            console.warn('[GNUGo] Failed to load binary:', err);
            self.isLoading = false;
            reject(err);
            return;
          }

          try {
            var Module = {
              wasmBinary: binary,
              onRuntimeInitialized: function () {
                self.module = Module;
                self.isReady = true;
                self.isLoading = false;
                console.log('✅ [GNUGo] WebAssembly Engine Ready (GNU Go 3.9.1)!');
                resolve();
                while (self.onReadyCallbacks.length > 0) {
                  var cb = self.onReadyCallbacks.shift();
                  if (typeof cb === 'function') cb();
                }
              }
            };

            if (window.GNUGo && typeof window.GNUGo.init === 'function') {
              window.GNUGo.init(Module);
            } else {
              console.error('[GNUGo] window.GNUGo.init is not available.');
              self.isLoading = false;
              reject(new Error('window.GNUGo.init not found'));
            }
          } catch (initErr) {
            console.error('[GNUGo] Init error:', initErr);
            self.isLoading = false;
            reject(initErr);
          }
        });
      });
    },

    // WASM 바이너리 로딩 (IndexedDB 캐시 -> fetch 폴백)
    loadWasmBinary: function (url, callback) {
      var self = this;
      self.getCachedWasm(function (cachedBuffer) {
        if (cachedBuffer) {
          console.log('[GNUGo] Loaded from IndexedDB cache (' + cachedBuffer.byteLength + ' bytes)');
          callback(null, cachedBuffer);
          return;
        }

        console.log('[GNUGo] Fetching wasm from network: ' + url);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 0) {
            var buf = xhr.response;
            self.saveCachedWasm(buf);
            callback(null, buf);
          } else {
            callback(new Error('HTTP status ' + xhr.status));
          }
        };
        xhr.onerror = function (e) {
          callback(e || new Error('XHR Network Error'));
        };
        xhr.send(null);
      });
    },

    // IndexedDB 캐시 조회
    getCachedWasm: function (cb) {
      try {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.createObjectStore(DB_STORE);
          }
        };
        req.onsuccess = function (e) {
          var db = e.target.result;
          var tx = db.transaction(DB_STORE, 'readonly');
          var store = tx.objectStore(DB_STORE);
          var getReq = store.get(WASM_KEY);
          getReq.onsuccess = function () {
            cb(getReq.result || null);
          };
          getReq.onerror = function () {
            cb(null);
          };
        };
        req.onerror = function () {
          cb(null);
        };
      } catch (err) {
        cb(null);
      }
    },

    // IndexedDB 캐시 저장
    saveCachedWasm: function (buffer) {
      try {
        var req = indexedDB.open(DB_NAME, 1);
        req.onsuccess = function (e) {
          var db = e.target.result;
          var tx = db.transaction(DB_STORE, 'readwrite');
          var store = tx.objectStore(DB_STORE);
          store.put(buffer, WASM_KEY);
        };
      } catch (err) {
        // 캐시 실패는 무시하고 계속 진행
      }
    },

    // 좌표 변환 (0-indexed x, y -> "dp")
    coordToSGF: function (x, y) {
      return String.fromCharCode(97 + x) + String.fromCharCode(97 + y);
    },

    // SGF 좌표 ("dp" -> {x, y})
    sgfToCoord: function (str, size) {
      size = size || 19;
      if (!str || str.length < 2) return null; // Pass
      var x = str.charCodeAt(0) - 97;
      var y = str.charCodeAt(1) - 97;
      if (x >= size || y >= size) return null; // Pass (e.g. "tt" for 19x19)
      return { x: x, y: y };
    },

    // 현재 판 상태를 표준 SGF 문자열로 생성
    buildSGF: function (size, komi, handicapPoints, moves) {
      var sgf = '(;GM[1]SZ[' + size + ']KM[' + komi + ']RU[Japanese]';

      if (handicapPoints && handicapPoints.length > 0) {
        sgf += 'HA[' + handicapPoints.length + ']AB';
        for (var i = 0; i < handicapPoints.length; i++) {
          var pt = handicapPoints[i];
          sgf += '[' + this.coordToSGF(pt[0], pt[1]) + ']';
        }
      }

      if (moves && moves.length > 0) {
        for (var j = 0; j < moves.length; j++) {
          var m = moves[j];
          var colStr = (m.color === 1) ? 'B' : 'W';
          if (m.isPass || m.x < 0 || m.y < 0) {
            sgf += ';' + colStr + '[]';
          } else {
            sgf += ';' + colStr + '[' + this.coordToSGF(m.x, m.y) + ']';
          }
        }
      }

      sgf += ')';
      return sgf;
    },

    // GNU Go 3.9.1에 착수 요청 (level: 0~10)
    findBestMove: function (size, komi, handicapPoints, moves, level) {
      if (!this.isReady || !this.module) return null;

      level = (level !== undefined) ? level : 10;
      var sgf = this.buildSGF(size, komi, handicapPoints, moves);

      try {
        var resultSgf = this.module.ccall(
          'play',
          'string',
          ['number', 'string'],
          [level, sgf]
        );

        if (!resultSgf) return null;

        var matches = resultSgf.match(/;([BW])\[([a-z]{0,2})\]/g);
        if (!matches || matches.length === 0) return null;

        var last = matches[matches.length - 1];
        var m = last.match(/;([BW])\[([a-z]{0,2})\]/);
        if (!m) return null;

        return this.sgfToCoord(m[2], size);
      } catch (err) {
        console.error('[GNUGo] play execution error:', err);
        return null;
      }
    }
  };

  window.GNUGoBridge = GNUGoBridge;

  // 자동 백그라운드 초기화 시작
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function () {
      GNUGoBridge.init('gnugo/gnugo.wasm').catch(function (e) {
        console.warn('[GNUGo] Automatic background initialization deferred:', e);
      });
    });
  }
})();
