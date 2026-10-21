const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../badukstudy_all_books.json');
console.log('Loading badukstudy_all_books.json...');
const allChapters = JSON.parse(fs.readFileSync(filePath, 'utf8'));
console.log('Total chapters in JSON:', allChapters.length);

// Check chapters in JSON
const koChapters = [];
let totalKoProbs = 0;

allChapters.forEach(chap => {
  const chapTitle = chap.chapter || chap.title || '';
  if (/패|팻감/.test(chapTitle)) {
    // Exclude false positives: '승패', '패망선'
    if (!/승패|패망선/.test(chapTitle)) {
      const pCount = chap.problems ? chap.problems.length : 0;
      koChapters.push({
        series: chap.series || '',
        book: chap.book || '',
        chapter: chapTitle,
        count: pCount,
        problems: chap.problems || []
      });
      totalKoProbs += pCount;
    }
  }
});

console.log('Found Ko Chapters with actual problem data in JSON:', koChapters.length);
console.log('Total Ko Problems with board data:', totalKoProbs);

// Summary by Series & Level
const seriesSummary = {};
koChapters.forEach(c => {
  const s = c.series || '기타';
  if (!seriesSummary[s]) seriesSummary[s] = { count: 0, chapters: [] };
  seriesSummary[s].count += c.count;
  seriesSummary[s].chapters.push(c);
});

console.log('\n========================================');
for (const [s, data] of Object.entries(seriesSummary)) {
  console.log(`\n### [${s}] - 총 ${data.chapters.length}개 단원 (${data.count}문제)`);
  data.chapters.forEach(c => {
    console.log(`  * ${c.book} > ${c.chapter} (${c.count}문제)`);
  });
}
console.log('========================================\n');

// Sample problem #0
if (koChapters.length > 0 && koChapters[0].problems.length > 0) {
  console.log('\nSample Problem #1 from', koChapters[0].book, '>', koChapters[0].chapter);
  const p = koChapters[0].problems[0];
  console.log({
    id: p.id,
    question: p.question || p.title || p.desc,
    answer: p.answer1 || p.answer,
    dataPreview: (p.data || '').slice(0, 60) + '...'
  });
}
