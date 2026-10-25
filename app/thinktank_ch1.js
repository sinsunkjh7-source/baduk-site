// ===================================================
// 씽크탱크 1권 - 제1단원: 돌의 활로 (전체 24문제 정밀 데이터)
// ===================================================

const THINKTANK_CH1_PROBLEMS = [
  {
    id: 1,
    code: "714",
    sign: "A1-001",
    title: "1. 돌의 활로 (1/24) A1-001",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 1개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 16, "y": 15, "color": 1}, {"x": 15, "y": 16, "color": 1}, {"x": 14, "y": 15, "color": 1}],
    answers19: [{"x": 15, "y": 14, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 2,
    code: "715",
    sign: "A1-002",
    title: "1. 돌의 활로 (2/24) A1-002",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 2개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 16, "y": 15, "color": 1}, {"x": 15, "y": 16, "color": 1}, {"x": 15, "y": 14, "color": 1}],
    answers19: [{"x": 14, "y": 15, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 3,
    code: "716",
    sign: "A1-003",
    title: "1. 돌의 활로 (3/24) A1-003",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 3개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 16, "y": 15, "color": 1}, {"x": 15, "y": 14, "color": 1}, {"x": 14, "y": 15, "color": 1}],
    answers19: [{"x": 15, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 4,
    code: "717",
    sign: "A1-004",
    title: "1. 돌의 활로 (4/24) A1-004",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 4개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 15, "y": 14, "color": 1}, {"x": 14, "y": 15, "color": 1}, {"x": 15, "y": 16, "color": 1}],
    answers19: [{"x": 16, "y": 15, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 5,
    code: "718",
    sign: "A1-005",
    title: "1. 돌의 활로 (5/24) A1-005",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 3개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 18, "color": 2}, {"x": 15, "y": 17, "color": 1}, {"x": 14, "y": 18, "color": 1}],
    answers19: [{"x": 16, "y": 18, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 6,
    code: "719",
    sign: "A1-006",
    title: "1. 돌의 활로 (6/24) A1-006",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 2개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 18, "y": 18, "color": 2}, {"x": 17, "y": 18, "color": 1}],
    answers19: [{"x": 18, "y": 17, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 7,
    code: "723",
    sign: "A1-007",
    title: "1. 돌의 활로 (7/24) A1-007",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 6개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 14, "y": 15, "color": 2}, {"x": 14, "y": 14, "color": 1}, {"x": 15, "y": 14, "color": 1}, {"x": 13, "y": 15, "color": 1}, {"x": 14, "y": 16, "color": 1}, {"x": 15, "y": 16, "color": 1}],
    answers19: [{"x": 16, "y": 15, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 8,
    code: "724",
    sign: "A1-008",
    title: "1. 돌의 활로 (8/24) A1-008",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 5개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 18, "color": 2}, {"x": 15, "y": 17, "color": 2}, {"x": 14, "y": 17, "color": 1}, {"x": 14, "y": 18, "color": 1}, {"x": 16, "y": 17, "color": 1}, {"x": 16, "y": 18, "color": 1}],
    answers19: [{"x": 15, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 9,
    code: "725",
    sign: "A1-009",
    title: "1. 돌의 활로 (9/24) A1-009",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 4개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 18, "color": 2}, {"x": 14, "y": 18, "color": 2}, {"x": 13, "y": 18, "color": 1}, {"x": 14, "y": 17, "color": 1}, {"x": 15, "y": 17, "color": 1}],
    answers19: [{"x": 16, "y": 18, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 10,
    code: "726",
    sign: "A1-010",
    title: "1. 돌의 활로 (10/24) A1-010",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 3개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 18, "y": 17, "color": 2}, {"x": 18, "y": 18, "color": 2}, {"x": 18, "y": 16, "color": 1}, {"x": 17, "y": 18, "color": 1}],
    answers19: [{"x": 17, "y": 17, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 11,
    code: "727",
    sign: "A1-011",
    title: "1. 돌의 활로 (11/24) A1-011",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 7개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 14, "color": 2}, {"x": 15, "y": 15, "color": 2}, {"x": 14, "y": 15, "color": 2}, {"x": 15, "y": 13, "color": 1}, {"x": 14, "y": 14, "color": 1}, {"x": 13, "y": 15, "color": 1}, {"x": 16, "y": 14, "color": 1}, {"x": 16, "y": 15, "color": 1}, {"x": 15, "y": 16, "color": 1}],
    answers19: [{"x": 14, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 12,
    code: "728",
    sign: "A1-012",
    title: "1. 돌의 활로 (12/24) A1-012",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 5개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 14, "y": 18, "color": 2}, {"x": 15, "y": 18, "color": 2}, {"x": 15, "y": 17, "color": 2}, {"x": 14, "y": 17, "color": 1}, {"x": 13, "y": 18, "color": 1}, {"x": 16, "y": 17, "color": 1}, {"x": 16, "y": 18, "color": 1}],
    answers19: [{"x": 15, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 13,
    code: "729",
    sign: "A1-013",
    title: "1. 돌의 활로 (13/24) A1-013",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 3개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 17, "y": 18, "color": 2}, {"x": 18, "y": 18, "color": 2}, {"x": 18, "y": 17, "color": 2}, {"x": 18, "y": 16, "color": 1}, {"x": 16, "y": 18, "color": 1}],
    answers19: [{"x": 17, "y": 17, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 14,
    code: "730",
    sign: "A1-014",
    title: "1. 돌의 활로 (14/24) A1-014",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 5개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 마지막 남은 활로를 막아 따내 보세요!",
    movesNeeded: 1,
    initialStones19: [{"x": 15, "y": 17, "color": 2}, {"x": 15, "y": 18, "color": 2}, {"x": 16, "y": 18, "color": 2}, {"x": 14, "y": 18, "color": 2}, {"x": 15, "y": 16, "color": 1}, {"x": 16, "y": 17, "color": 1}, {"x": 17, "y": 18, "color": 1}, {"x": 14, "y": 17, "color": 1}],
    answers19: [{"x": 13, "y": 18, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 15,
    code: "731",
    sign: "A1-015",
    title: "1. 돌의 활로 (15/24) A1-015",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 8개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 15, "y": 14, "color": 2}, {"x": 15, "y": 16, "color": 2}, {"x": 14, "y": 15, "color": 2}, {"x": 15, "y": 13, "color": 1}, {"x": 14, "y": 14, "color": 1}, {"x": 13, "y": 15, "color": 1}, {"x": 16, "y": 14, "color": 1}, {"x": 16, "y": 15, "color": 1}, {"x": 16, "y": 16, "color": 1}],
    answers19: [{"x": 15, "y": 17, "color": 1}, {"x": 14, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 16,
    code: "732",
    sign: "A1-016",
    title: "1. 돌의 활로 (16/24) A1-016",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 8개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 15, "y": 14, "color": 2}, {"x": 14, "y": 14, "color": 2}, {"x": 14, "y": 15, "color": 2}, {"x": 14, "y": 13, "color": 1}, {"x": 15, "y": 13, "color": 1}, {"x": 16, "y": 14, "color": 1}, {"x": 16, "y": 15, "color": 1}, {"x": 13, "y": 14, "color": 1}, {"x": 13, "y": 15, "color": 1}],
    answers19: [{"x": 14, "y": 16, "color": 1}, {"x": 15, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 17,
    code: "733",
    sign: "A1-017",
    title: "1. 돌의 활로 (17/24) A1-017",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 6개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 18, "color": 2}, {"x": 15, "y": 17, "color": 2}, {"x": 14, "y": 17, "color": 2}, {"x": 14, "y": 18, "color": 2}, {"x": 16, "y": 17, "color": 1}, {"x": 16, "y": 18, "color": 1}, {"x": 13, "y": 17, "color": 1}, {"x": 13, "y": 18, "color": 1}],
    answers19: [{"x": 14, "y": 16, "color": 1}, {"x": 15, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 18,
    code: "734",
    sign: "A1-018",
    title: "1. 돌의 활로 (18/24) A1-018",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 4개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 17, "y": 17, "color": 2}, {"x": 18, "y": 17, "color": 2}, {"x": 18, "y": 18, "color": 2}, {"x": 17, "y": 18, "color": 2}, {"x": 17, "y": 16, "color": 1}, {"x": 18, "y": 16, "color": 1}],
    answers19: [{"x": 16, "y": 17, "color": 1}, {"x": 16, "y": 18, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 19,
    code: "735",
    sign: "A1-019",
    title: "1. 돌의 활로 (19/24) A1-019",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 9개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 15, "y": 16, "color": 2}, {"x": 14, "y": 16, "color": 2}, {"x": 13, "y": 16, "color": 2}, {"x": 15, "y": 14, "color": 1}, {"x": 14, "y": 15, "color": 1}, {"x": 16, "y": 15, "color": 1}, {"x": 16, "y": 16, "color": 1}, {"x": 15, "y": 17, "color": 1}, {"x": 14, "y": 17, "color": 1}, {"x": 13, "y": 17, "color": 1}],
    answers19: [{"x": 13, "y": 15, "color": 1}, {"x": 12, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 20,
    code: "736",
    sign: "A1-020",
    title: "1. 돌의 활로 (20/24) A1-020",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 8개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 16, "y": 15, "color": 2}, {"x": 15, "y": 16, "color": 2}, {"x": 14, "y": 16, "color": 2}, {"x": 15, "y": 14, "color": 1}, {"x": 14, "y": 15, "color": 1}, {"x": 13, "y": 16, "color": 1}, {"x": 14, "y": 17, "color": 1}, {"x": 15, "y": 17, "color": 1}, {"x": 16, "y": 16, "color": 1}],
    answers19: [{"x": 17, "y": 15, "color": 1}, {"x": 16, "y": 14, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 21,
    code: "737",
    sign: "A1-021",
    title: "1. 돌의 활로 (21/24) A1-021",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 8개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 16, "y": 15, "color": 2}, {"x": 15, "y": 14, "color": 2}, {"x": 14, "y": 15, "color": 2}, {"x": 15, "y": 16, "color": 2}, {"x": 15, "y": 13, "color": 1}, {"x": 14, "y": 14, "color": 1}, {"x": 13, "y": 15, "color": 1}, {"x": 16, "y": 14, "color": 1}, {"x": 17, "y": 15, "color": 1}, {"x": 15, "y": 17, "color": 1}],
    answers19: [{"x": 14, "y": 16, "color": 1}, {"x": 16, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 22,
    code: "738",
    sign: "A1-022",
    title: "1. 돌의 활로 (22/24) A1-022",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 9개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 15, "color": 2}, {"x": 15, "y": 14, "color": 2}, {"x": 14, "y": 14, "color": 2}, {"x": 14, "y": 15, "color": 2}, {"x": 13, "y": 15, "color": 2}, {"x": 14, "y": 13, "color": 1}, {"x": 15, "y": 13, "color": 1}, {"x": 16, "y": 14, "color": 1}, {"x": 16, "y": 15, "color": 1}, {"x": 13, "y": 14, "color": 1}, {"x": 12, "y": 15, "color": 1}, {"x": 15, "y": 16, "color": 1}],
    answers19: [{"x": 13, "y": 16, "color": 1}, {"x": 14, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 23,
    code: "739",
    sign: "A1-023",
    title: "1. 돌의 활로 (23/24) A1-023",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 6개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 15, "y": 18, "color": 2}, {"x": 15, "y": 17, "color": 2}, {"x": 14, "y": 17, "color": 2}, {"x": 14, "y": 18, "color": 2}, {"x": 13, "y": 18, "color": 2}, {"x": 14, "y": 16, "color": 1}, {"x": 15, "y": 16, "color": 1}, {"x": 13, "y": 17, "color": 1}, {"x": 16, "y": 17, "color": 1}],
    answers19: [{"x": 12, "y": 18, "color": 1}, {"x": 16, "y": 18, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  },
  {
    id: 24,
    code: "740",
    sign: "A1-024",
    title: "1. 돌의 활로 (24/24) A1-024",
    desc: "1. 돌의 활로 백의 활로(살아가는 길)를 모두 막아 보세요.",
    hint: "활로 4개, 활로는 직선으로만 이어집니다.",
    targetPlayer: 1,
    speech: "백돌의 남은 두 활로를 차례대로 모두 막아 보세요!",
    movesNeeded: 2,
    initialStones19: [{"x": 18, "y": 17, "color": 2}, {"x": 17, "y": 17, "color": 2}, {"x": 18, "y": 18, "color": 2}, {"x": 17, "y": 18, "color": 2}, {"x": 16, "y": 18, "color": 2}, {"x": 17, "y": 16, "color": 1}, {"x": 16, "y": 17, "color": 1}],
    answers19: [{"x": 15, "y": 18, "color": 1}, {"x": 18, "y": 16, "color": 1}],
    initBoard: function(size) {
      const offset = 19 - size;
      return this.initialStones19.map(s => ({
        x: s.x - offset,
        y: s.y - offset,
        color: s.color
      }));
    },
    getAnswers: function(size) {
      const offset = 19 - size;
      return this.answers19.map(a => ({
        x: a.x - offset,
        y: a.y - offset,
        color: a.color
      }));
    },
    getAnswer: function(size) {
      return this.getAnswers(size)[0];
    },
    isValidLibertyMove: function(x, y, engine, size) {
      const whiteLiberties = new Set();
      for (let gy = 0; gy < size; gy++) {
        for (let gx = 0; gx < size; gx++) {
          if (engine.board[gy][gx] === 2) {
            const res = engine.getGroupAndLiberties(gx, gy);
            res.liberties.forEach(l => whiteLiberties.add(l));
          }
        }
      }
      return whiteLiberties.has(x + ',' + y);
    },
    checkSuccess: function(engine, size) {
      return engine.blackCaptures >= 1;
    },
    successMessage: "완벽합니다! 👏 백의 모든 활로를 막아 멋지게 따냈습니다! 🎉"
  }
];

if (typeof window !== "undefined") {
  window.THINKTANK_CH1_PROBLEMS = THINKTANK_CH1_PROBLEMS;
}
