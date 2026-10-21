const fs = require('fs');
const path = require('path');

// 1. catalog_data.js 분석
const catalogContent = fs.readFileSync(path.join(__dirname, 'catalog_data.js'), 'utf8');
// eval _CAT
global.window = {};
eval(catalogContent);
const CAT_DATA = window.CATALOG_DATA;

console.log('Total series in CAT_DATA:', CAT_DATA.length);

const koChaptersInCatalog = [];
let totalKoProblemsInCatalog = 0;

CAT_DATA.forEach(series => {
  if (!series.books) return;
  series.books.forEach(book => {
    if (!book.chapters) return;
    book.chapters.forEach(chap => {
      const title = chap.title || '';
      // Check if title mentions '패' (or 팻감)
      // Exclude false positive like '패망선'(2선 패망선) unless it's Ko
      // Note: '2선-패망선' is not Ko! Let's check:
      if (/패|팻감/.test(title)) {
        const isFalsePositive = /패망선/.test(title);
        if (!isFalsePositive) {
          koChaptersInCatalog.push({
            series: series.title,
            book: book.title,
            bookCode: book.code,
            chapterCode: chap.code,
            chapterTitle: title,
            problemCount: chap.problemCount || 0
          });
          totalKoProblemsInCatalog += chap.problemCount || 0;
        }
      }
    });
  });
});

console.log('Found Ko Chapters in Catalog:', koChaptersInCatalog.length);
console.log('Total Ko Problems in Catalog chapters:', totalKoProblemsInCatalog);

// Group by series
const bySeries = {};
koChaptersInCatalog.forEach(c => {
  if (!bySeries[c.series]) bySeries[c.series] = [];
  bySeries[c.series].push(c);
});

console.log('\n--- Ko Chapters by Series ---');
for (const [sName, list] of Object.entries(bySeries)) {
  const sum = list.reduce((acc, cur) => acc + cur.problemCount, 0);
  console.log(`\n### [${sName}] (총 ${list.length}개 단원, ${sum}문제)`);
  list.forEach(c => {
    console.log(`  * ${c.book} > ${c.chapterTitle} (${c.problemCount}문제) [code:${c.chapterCode}]`);
  });
}
