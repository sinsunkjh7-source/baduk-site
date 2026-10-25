const fs = require('fs');
const path = require('path');

const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, '../badukstudy_all_books.json'), 'utf8'));

let koChapters = [];
chapters.forEach(c => {
  const t = c.chapter || c.title || '';
  if (/패|팻감/.test(t) && !/승패|패망선/.test(t)) {
    koChapters.push(c);
  }
});

console.log('=== Checking Empty Answers in Ko Chapters ===');
koChapters.forEach(c => {
  const t = c.chapter || c.title || '';
  if (c.problems) {
    const empties = c.problems.filter(p => !p.answer1 || p.answer1.trim() === '');
    if (empties.length > 0) {
      console.log(`- [${c.series}] ${c.book} > ${t}: ${empties.length} / ${c.problems.length} 문제 정답 데이터 누락!`);
    }
  }
});
