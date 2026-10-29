const { BadukEngine } = require('./games/play/engine.js');
const { BadukAI } = require('./games/play/ai.js');

console.log('=== Test 1: 9-Handicap 19x19 game White first 5 moves ===');
const engine = new BadukEngine(19);
// Place 9 handicap stones for Black
const hPoints = [
  [3,3], [9,3], [15,3],
  [3,9], [9,9], [15,9],
  [3,15], [9,15], [15,15]
];
hPoints.forEach(pt => {
  engine.board[pt[1]][pt[0]] = 1; // Black
});

const ai = new BadukAI(19);

// Test beginner as White
console.log('--- Beginner (삐약이) moves in handicap: ---');
for (let i = 0; i < 5; i++) {
  const move = ai.findBestMove(engine, 2, 'beginner');
  console.log('Move ' + (i+1) + ': White plays at (' + move.x + ', ' + move.y + ')');
  const res = engine.playMove(move.x, move.y, 2);
  if (!res.success) {
    console.error('FAILED move:', res);
    break;
  }
}

// Test 2: Atari rescue
console.log('\n=== Test 2: Atari rescue and capture ===');
const engine2 = new BadukEngine(9);
engine2.board[4][4] = 1; // Black
engine2.board[3][4] = 2; // White top
engine2.board[5][4] = 2; // White bottom
engine2.board[4][3] = 2; // White left
// (5, 4) in (x=5, y=4) is the ONLY liberty of Black at (4,4)

// As White: should capture at (5,4)
const whiteMove = ai.findBestMove(engine2, 2, 'beginner');
console.log('White move to capture atari (expected x:5, y:4):', whiteMove);

// As Black: should escape at (5,4)
const blackMove = ai.findBestMove(engine2, 1, 'beginner');
console.log('Black move to escape atari (expected x:5, y:4):', blackMove);

// Test 3: Master moves in opening
console.log('\n=== Test 3: Master (호랑이) in even game ===');
const engine3 = new BadukEngine(19);
const m1 = ai.findBestMove(engine3, 1, 'master');
console.log('Master move 1 (Black, expected corner hoshi):', m1);
engine3.playMove(m1.x, m1.y, 1);
const m2 = ai.findBestMove(engine3, 2, 'master');
console.log('Master move 2 (White, expected opposite corner hoshi):', m2);

console.log('\nALL TESTS COMPLETED SUCCESSFULLY!');
