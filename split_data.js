const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'data/badukstudy_all_books.json');
const outDir = path.join(__dirname, 'data/books');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

console.log('Loading full JSON...');
const raw = fs.readFileSync(srcPath, 'utf8');
const chapters = JSON.parse(raw);
console.log('Total chapters:', chapters.length);

// Structure for index.json:
// seriesList: [ { id: 'series_name', title: '시리즈명', books: [ { code: '116', title: '책이름', chapterCount: 20, totalProblems: 480 } ] } ]
const seriesMap = new Map();
const bookFiles = new Map(); // bookCode -> { series, book, bookCode, chapters: [] }

chapters.forEach(chap => {
    const sName = chap.series || '기타교재';
    const bName = chap.book || '기타';
    const bCode = chap.bookCode || 'unknown';

    if (!seriesMap.has(sName)) {
        seriesMap.set(sName, new Map());
    }
    const bMap = seriesMap.get(sName);
    if (!bMap.has(bCode)) {
        bMap.set(bCode, {
            code: bCode,
            title: bName,
            chapters: []
        });
    }

    const chapSummary = {
        code: chap.chapterCode,
        title: chap.chapter,
        problemCount: chap.problems ? chap.problems.length : 0
    };
    bMap.get(bCode).chapters.push(chapSummary);

    // Prepare full book data
    if (!bookFiles.has(bCode)) {
        bookFiles.set(bCode, {
            series: sName,
            book: bName,
            bookCode: bCode,
            chapters: []
        });
    }
    bookFiles.get(bCode).chapters.push(chap);
});

// Build index.json
const catalog = [];
for (const [sName, bMap] of seriesMap.entries()) {
    const books = [];
    for (const [bCode, bData] of bMap.entries()) {
        const totalProblems = bData.chapters.reduce((sum, c) => sum + c.problemCount, 0);
        books.push({
            code: bCode,
            title: bData.title,
            chapterCount: bData.chapters.length,
            totalProblems,
            chapters: bData.chapters
        });
    }
    catalog.push({
        title: sName,
        bookCount: books.length,
        books
    });
}

fs.writeFileSync(path.join(__dirname, 'data/catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');
console.log('Saved catalog.json (series and book index)');

// Save each book separately
let savedBooks = 0;
for (const [bCode, bObj] of bookFiles.entries()) {
    const outBookFile = path.join(outDir, `book_${bCode}.json`);
    fs.writeFileSync(outBookFile, JSON.stringify(bObj), 'utf8');
    savedBooks++;
}

console.log(`Saved ${savedBooks} individual book JSON files to baduk/data/books/`);
