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

console.log('Total Ko Chapters:', koChapters.length);

let totalProblems = 0;
let oneMoveProblems = 0;
let multiMoveProblems = 0;
let emptyAnswerProblems = 0;
let choiceProblems = 0; // O/X or multiple choice
const moveCountDist = {};

koChapters.forEach(c => {
  if (c.problems) {
    c.problems.forEach(p => {
      totalProblems++;
      const ans = p.answer1 || '';
      const moves = ans ? ans.split(';').filter(Boolean).length : 0;
      moveCountDist[moves] = (moveCountDist[moves] || 0) + 1;
      if (moves === 0) emptyAnswerProblems++;
      else if (moves === 1) oneMoveProblems++;
      else multiMoveProblems++;
      
      if (p.sample || p.choiceOptions || /가|나|○|×/.test(p.question || '')) {
        choiceProblems++;
      }
    });
  }
});

console.log('Total Problems Scraped:', totalProblems);
console.log('1-move problems (단발 착수):', oneMoveProblems);
console.log('Multi-move problems (수순 진행):', multiMoveProblems);
console.log('Empty answer problems:', emptyAnswerProblems);
console.log('Move count distribution:', moveCountDist);
