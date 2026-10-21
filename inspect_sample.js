const fs = require('fs');
const path = require('path');

const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, '../badukstudy_all_books.json'), 'utf8'));

function sampleChapter(bookName, chapTitle) {
  const chap = chapters.find(c => c.book && c.book.includes(bookName) && (c.chapter || c.title || '').includes(chapTitle));
  if (!chap) { console.log('Not found:', bookName, chapTitle); return; }
  console.log('\n======================================================');
  console.log('Chapter:', chap.series, '>', chap.book, '>', (chap.chapter || chap.title), `(${chap.problems ? chap.problems.length : 0} problems)`);
  console.log('======================================================');
  const problems = chap.problems || [];
  for (let i = 0; i < Math.min(6, problems.length); i++) {
    const p = problems[i];
    console.log(`\n[Problem #${i + 1}]`);
    console.log(`  Question : ${JSON.stringify(p.question)}`);
    console.log(`  Hint     : ${JSON.stringify(p.hint)}`);
    console.log(`  Data     : ${p.data}`);
    console.log(`  Answer1  : ${p.answer1}`);
    console.log(`  Type     : ${p.type}, Size: ${p.size}`);
  }
}

sampleChapter('씽크탱크 5', '12. 패');
sampleChapter('입문 1', '13. 패');
sampleChapter('논리바둑 7', '10. 패');
sampleChapter('논리바둑 7', '11. 사는 수-패');
sampleChapter('기경중묘', '패의 편 1');
