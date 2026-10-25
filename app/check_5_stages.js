const fs = require('fs');
const path = require('path');

const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, '../badukstudy_all_books.json'), 'utf8')).filter(c => {
  const t = c.chapter || c.title || '';
  return /패|팻감/.test(t) && !/승패|패망선/.test(t);
});

function assessLevel(series, book) {
  if (/입문|바둑나라 A|알파바둑 1$|파워씽크 2$|씽크탱크 5$/.test(book)) return 1;
  if (/바둑나라 B4/.test(book)) return 1.5;
  if (/논리바둑 7$|논리바둑 8$|알파바둑 11$|알파바둑 12$|씽크탱크 11$/.test(book)) return 2;
  if (/사활 1|파워사활특강|씽크탱크 14$|씽크탱크 15$|알파바둑 13$|알파바둑 14$/.test(book)) return 2.5;
  if (/논리바둑 11$|논리바둑 12$|논리바둑 13$|논리바둑 15$|알파바둑 17$|알파바둑 18$|사활 2|수상전 1/.test(book)) return 3;
  if (/논리바둑 19$|논리바둑 20$|알파바둑 19$|알파바둑 20$|파워씽크 8$/.test(book)) return 3.5;
  if (/논리바둑 24$|알파바둑 21$|알파바둑 22$|알파바둑 23$|알파바둑 24$|사활 3|수상전 3|씽크탱크 18$/.test(book)) return 4;
  if (/퍼펙트/.test(series)) return 4;
  if (/기경중묘|발양론|고전/.test(series) || /기경중묘|발양론/.test(book)) return 5;
  return 3;
}

const groups = { 1: [], 2: [], 3: [], 4: [], 5: [] };

chapters.forEach(c => {
  if (c.problems) {
    c.problems.forEach(p => {
      const lvl = assessLevel(c.series, c.book);
      let g = 3;
      if (lvl <= 1.5) g = 1;
      else if (lvl <= 2.5) g = 2;
      else if (lvl <= 3.5) g = 3;
      else if (lvl === 4) g = 4;
      else if (lvl === 5) g = 5;
      
      groups[g].push({
        series: c.series,
        book: c.book,
        chap: c.chapter || c.title,
        q: p.question,
        ans1: p.answer1,
        type: p.type
      });
    });
  }
});

console.log('=== 5단계별 정확한 문제 수 현황 ===');
const stageNames = {
  1: '1단계: 입문·기초 (패의 개념과 모양 알기)',
  2: '2단계: 초급 (패로 살기 & 패로 잡기 기본)',
  3: '3단계: 중급 (패 연결/끊음, 팻감 활용 기초)',
  4: '4단계: 고급 (패 수상전, 늘어진 패, 팻감 계산)',
  5: '5단계: 유단자 (기경중묘·발양론 고전 명작 패)'
};

for (let i = 1; i <= 5; i++) {
  const allCount = groups[i].length;
  const stoneCount = groups[i].filter(p => p.ans1 && p.ans1.trim() !== '').length;
  const choiceCount = allCount - stoneCount;
  console.log(`[${stageNames[i]}]`);
  console.log(`   - 전체 문제 수: ${allCount}문제 (바둑돌 착수형: ${stoneCount}개, 객관식 보기형: ${choiceCount}개)`);
}
