const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../badukstudy_all_books.json');
const allChapters = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Parse stones
function parseStones(sgf) {
  if (!sgf) return { B: [], W: [] };
  const b = [], w = [];
  const re = /;([BW])\[([a-s]{2})\]/g;
  let m;
  while ((m = re.exec(sgf)) !== null) {
    const x = m[2].charCodeAt(0) - 97;
    const y = m[2].charCodeAt(1) - 97;
    if (m[1] === 'B') b.push({ x, y }); else w.push({ x, y });
  }
  return { B: b, W: w };
}

function transform(stones, op, size = 19) {
  return stones.map(({ x, y }) => {
    let nx = x, ny = y;
    if (op === 1) { nx = size - 1 - y; ny = x; }
    else if (op === 2) { nx = size - 1 - x; ny = size - 1 - y; }
    else if (op === 3) { nx = y; ny = size - 1 - x; }
    else if (op === 4) { nx = size - 1 - x; ny = y; }
    else if (op === 5) { nx = x; ny = size - 1 - y; }
    else if (op === 6) { nx = y; ny = x; }
    else if (op === 7) { nx = size - 1 - y; ny = size - 1 - x; }
    return { x: nx, y: ny };
  });
}

function getSymKey(B, W) {
  const cands = [];
  for (let op = 0; op < 8; op++) {
    const tb = transform(B, op).map(s => s.x + ',' + s.y).sort().join(';');
    const tw = transform(W, op).map(s => s.x + ',' + s.y).sort().join(';');
    cands.push('B:' + tb + '|W:' + tw);
  }
  cands.sort();
  return cands[0];
}

// Assess level based on origin book & series & problem characteristics
function assessLevel(series, book, chapterTitle) {
  // Level 1: 입문 / 기초 (Introduction to Ko rules)
  if (/입문|바둑나라 A|알파바둑 1$|파워씽크 2$|씽크탱크 5$/.test(book)) return 1;
  if (/바둑나라 B4/.test(book)) return 1.5;
  
  // Level 2: 초급 (Basic Ko life/death & connection)
  if (/논리바둑 7$|논리바둑 8$|알파바둑 11$|알파바둑 12$|씽크탱크 11$/.test(book)) return 2;
  if (/사활 1|파워사활특강|씽크탱크 14$|씽크탱크 15$|알파바둑 13$|알파바둑 14$/.test(book)) return 2.5;
  
  // Level 3: 중급 (Ko threats & tactical Ko)
  if (/논리바둑 11$|논리바둑 12$|논리바둑 13$|논리바둑 15$|알파바둑 17$|알파바둑 18$|사활 2|수상전 1/.test(book)) return 3;
  if (/논리바둑 19$|논리바둑 20$|알파바둑 19$|알파바둑 20$|파워씽크 8$/.test(book)) return 3.5;
  
  // Level 4: 고급 (Semeai Ko, approach Ko, calculation)
  if (/논리바둑 24$|알파바둑 21$|알파바둑 22$|알파바둑 23$|알파바둑 24$|사활 3|수상전 3|씽크탱크 18$/.test(book)) return 4;
  if (/퍼펙트/.test(series)) return 4;

  // Level 5: 유단자 / 마스터 (Classical master problems)
  if (/기경중묘/.test(series) || /기경중묘/.test(book)) return 4.5;
  if (/발양론/.test(series) || /발양론/.test(book)) return 5;

  return 3;
}

// Collect deduplicated problems
const shapeMap = new Map();
let totalScanned = 0;

allChapters.forEach(c => {
  const t = c.chapter || c.title || '';
  if (/패|팻감/.test(t) && !/승패|패망선/.test(t)) {
    if (c.problems) {
      c.problems.forEach((p, idx) => {
        totalScanned++;
        const { B, W } = parseStones(p.data);
        const symKey = getSymKey(B, W);
        const lvl = assessLevel(c.series, c.book, t);
        
        const candidate = {
          series: c.series,
          book: c.book,
          chapter: t,
          idx: idx + 1,
          question: p.question || '',
          hint: p.hint || '',
          data: p.data || '',
          answer1: p.answer1 || '',
          answer2: p.answer2 || '',
          answer3: p.answer3 || '',
          answer4: p.answer4 || '',
          answer5: p.answer5 || '',
          sample: p.sample || '',
          level: lvl,
          stoneCount: B.length + W.length
        };

        if (!shapeMap.has(symKey)) {
          shapeMap.set(symKey, candidate);
        } else {
          // If already exists, keep the one with cleaner/better question description or lower level
          const existing = shapeMap.get(symKey);
          if ((!existing.question && candidate.question) || candidate.level < existing.level) {
            shapeMap.set(symKey, candidate);
          }
        }
      });
    }
  }
});

const dedupList = Array.from(shapeMap.values());
console.log('Total Scanned Ko Problems:', totalScanned);
console.log('Unique Deduplicated Ko Problems:', dedupList.length);

// Group by Level
const levelGroups = {
  1: [],    // 1단계: 입문·기초 (패의 개념과 모양 알기)
  2: [],    // 2단계: 초급 (패를 이용한 삶과 죽음 기초)
  3: [],    // 3단계: 중급 (패 연결/끊음, 팻감 활용)
  4: [],    // 4단계: 고급 (패 수상전, 늘어진 패, 팻감 계산)
  5: []     // 5단계: 유단자 (고전 기경중묘, 발양론 정수)
};

dedupList.forEach(p => {
  if (p.level <= 1.5) levelGroups[1].push(p);
  else if (p.level <= 2.5) levelGroups[2].push(p);
  else if (p.level <= 3.5) levelGroups[3].push(p);
  else if (p.level <= 4) levelGroups[4].push(p);
  else levelGroups[5].push(p);
});

console.log('\n--- Deduplicated Problems by Difficulty Stage ---');
console.log(`[1단계: 입문·기초 - 패의 규칙과 형태] ${levelGroups[1].length}문제`);
console.log(`[2단계: 초급 - 패로 살기 & 패로 잡기] ${levelGroups[2].length}문제`);
console.log(`[3단계: 중급 - 팻감의 기본 & 패 사활 응용] ${levelGroups[3].length}문제`);
console.log(`[4단계: 고급 - 패 수상전 & 늘어진 패] ${levelGroups[4].length}문제`);
console.log(`[5단계: 유단자 - 기경중묘·발양론 명작 패] ${levelGroups[5].length}문제`);
console.log('총 합계:', dedupList.length, '문제');
