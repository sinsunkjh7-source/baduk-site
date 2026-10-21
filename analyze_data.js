const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../badukstudy_all_books.json');
console.log('Reading file:', filePath);

const rawData = fs.readFileSync(filePath, 'utf8');
const chapters = JSON.parse(rawData);

console.log('Total Chapters collected:', chapters.length);

const seriesSet = new Set();
const booksSet = new Set();
let totalProblems = 0;
const uniqueProblemsByBoardAndAnswer = new Map();
const uniqueProblemsByBoard = new Map();
const bookProblemCounts = {};

chapters.forEach(chap => {
    if (chap.series) seriesSet.add(chap.series);
    if (chap.book) booksSet.add(chap.book);

    const bName = chap.book || 'Unknown';
    bookProblemCounts[bName] = (bookProblemCounts[bName] || 0) + (chap.problems ? chap.problems.length : 0);

    if (chap.problems) {
        chap.problems.forEach(p => {
            totalProblems++;
            const boardKey = (p.data || '').trim();
            const fullKey = `${boardKey} | ans:${p.answer1 || ''}`;

            if (boardKey) {
                uniqueProblemsByBoard.set(boardKey, (uniqueProblemsByBoard.get(boardKey) || 0) + 1);
            }
            if (fullKey) {
                uniqueProblemsByBoardAndAnswer.set(fullKey, (uniqueProblemsByBoardAndAnswer.get(fullKey) || 0) + 1);
            }
        });
    }
});

console.log('--- Statistics ---');
console.log('Total Series:', seriesSet.size);
console.log('Total Books:', booksSet.size);
console.log('Total Chapters:', chapters.length);
console.log('Total Problems Scraped:', totalProblems);
console.log('Unique Board Layouts:', uniqueProblemsByBoard.size);
console.log('Unique Problems (Board + Ans):', uniqueProblemsByBoardAndAnswer.size);

const duplicates = totalProblems - uniqueProblemsByBoardAndAnswer.size;
const dupRate = ((duplicates / totalProblems) * 100).toFixed(1);
console.log(`Duplicate Problems: ${duplicates} (${dupRate}% 중복)`);

console.log('\nTop Series:');
Array.from(seriesSet).slice(0, 15).forEach(s => console.log(' - ' + s));

console.log('\nSample Problem #0:');
console.log(JSON.stringify(chapters[0].problems[0], null, 2));
