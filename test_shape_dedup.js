const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../badukstudy_all_books.json');
const allChapters = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Parse SGF stones into sorted list
function parseStones(sgf) {
  if (!sgf) return { B: [], W: [] };
  const bStones = [];
  const wStones = [];
  const regex = /;([BW])\[([a-s]{2})\]/g;
  let match;
  while ((match = regex.exec(sgf)) !== null) {
    const color = match[1];
    const coord = match[2];
    const x = coord.charCodeAt(0) - 97;
    const y = coord.charCodeAt(1) - 97;
    if (color === 'B') bStones.push({ x, y });
    else wStones.push({ x, y });
  }
  return { B: bStones, W: wStones };
}

// Canonical key 1: Exact coordinates (order-independent)
function getExactKey(bStones, wStones) {
  const bStr = bStones.map(s => `${s.x},${s.y}`).sort().join(';');
  const wStr = wStones.map(s => `${s.x},${s.y}`).sort().join(';');
  return `B:${bStr}|W:${wStr}`;
}

// Canonical key 2: 8 D4 transformations (symmetry / corner-invariant)
function transform(stones, op, boardSize = 19) {
  return stones.map(({ x, y }) => {
    let nx = x, ny = y;
    if (op === 0) { nx = x; ny = y; }
    else if (op === 1) { nx = boardSize - 1 - y; ny = x; } // rot 90
    else if (op === 2) { nx = boardSize - 1 - x; ny = boardSize - 1 - y; } // rot 180
    else if (op === 3) { nx = y; ny = boardSize - 1 - x; } // rot 270
    else if (op === 4) { nx = boardSize - 1 - x; ny = y; } // flip H
    else if (op === 5) { nx = x; ny = boardSize - 1 - y; } // flip V
    else if (op === 6) { nx = y; ny = x; } // diag 1
    else if (op === 7) { nx = boardSize - 1 - y; ny = boardSize - 1 - x; } // diag 2
    return { x: nx, y: ny };
  });
}

function getSymmetryKey(bStones, wStones, boardSize = 19) {
  const candidates = [];
  for (let op = 0; op < 8; op++) {
    const tb = transform(bStones, op, boardSize);
    const tw = transform(wStones, op, boardSize);
    const key = getExactKey(tb, tw);
    candidates.push(key);
  }
  candidates.sort();
  return candidates[0]; // Lexicographically minimal key = canonical representation
}

// Canonical key 3: Translation to origin (0,0) + 8 symmetries (Local shape invariant)
function getLocalShapeKey(bStones, wStones) {
  const all = [...bStones, ...wStones];
  if (all.length === 0) return 'EMPTY';
  const minX = Math.min(...all.map(s => s.x));
  const minY = Math.min(...all.map(s => s.y));
  const tb = bStones.map(s => ({ x: s.x - minX, y: s.y - minY }));
  const tw = wStones.map(s => ({ x: s.x - minX, y: s.y - minY }));
  
  // Find bounding box width/height for local rotation
  const maxX = Math.max(...all.map(s => s.x - minX));
  const maxY = Math.max(...all.map(s => s.y - minY));
  const size = Math.max(maxX, maxY) + 1;
  
  const candidates = [];
  for (let op = 0; op < 8; op++) {
    const rotB = transform(tb, op, size);
    const rotW = transform(tw, op, size);
    const allRot = [...rotB, ...rotW];
    const rMinX = Math.min(...allRot.map(s => s.x));
    const rMinY = Math.min(...allRot.map(s => s.y));
    const normB = rotB.map(s => ({ x: s.x - rMinX, y: s.y - rMinY }));
    const normW = rotW.map(s => ({ x: s.x - rMinX, y: s.y - rMinY }));
    candidates.push(getExactKey(normB, normW));
  }
  candidates.sort();
  return candidates[0];
}

// 1. Analyze KO problems
const koProblems = [];
allChapters.forEach(chap => {
  const t = chap.chapter || chap.title || '';
  if (/패|팻감/.test(t) && !/승패|패망선/.test(t)) {
    if (chap.problems) {
      chap.problems.forEach((p, idx) => {
        const { B, W } = parseStones(p.data);
        koProblems.push({
          series: chap.series,
          book: chap.book,
          chapter: t,
          idx: idx + 1,
          question: (p.question || '').replace(/\r?\n/g, ' ').slice(0, 30),
          ans: p.answer1 || '',
          data: p.data || '',
          B, W
        });
      });
    }
  }
});

console.log('Total Ko Problems:', koProblems.length);

// Group by exact key
const exactMap = new Map();
koProblems.forEach(p => {
  const key = getExactKey(p.B, p.W);
  if (!exactMap.has(key)) exactMap.set(key, []);
  exactMap.get(key).push(p);
});

// Group by symmetry key (corner rotation/flip)
const symMap = new Map();
koProblems.forEach(p => {
  const key = getSymmetryKey(p.B, p.W, 19);
  if (!symMap.has(key)) symMap.set(key, []);
  symMap.get(key).push(p);
});

// Group by local shape key (relative pattern)
const localMap = new Map();
koProblems.forEach(p => {
  const key = getLocalShapeKey(p.B, p.W);
  if (!localMap.has(key)) localMap.set(key, []);
  localMap.get(key).push(p);
});

console.log('Unique Exact Shapes:', exactMap.size);
console.log('Unique Symmetry-normalized Shapes:', symMap.size);
console.log('Unique Local Relative Shapes:', localMap.size);

// Find duplicate groups in symmetry map (same shape appearing across multiple books/chapters)
const dupSymGroups = Array.from(symMap.entries())
  .filter(([_, list]) => list.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('\nTop 5 Most Duplicated / Shared Ko Shapes (Symmetry Invariant):');
dupSymGroups.slice(0, 5).forEach(([key, list], i) => {
  console.log(`\n[형태 #${i + 1}] 동일한 형태 ${list.length}회 출현:`);
  list.slice(0, 4).forEach(item => {
    console.log(`  - [${item.series}] ${item.book} > ${item.chapter} #${item.idx} (정답:${item.ans})`);
  });
  if (list.length > 4) console.log(`  ... 외 ${list.length - 4}개 문제`);
});
