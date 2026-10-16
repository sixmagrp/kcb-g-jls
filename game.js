let size = 16, mineCount = 40;
let board = [], revealed = [], flagged = [];
let gameOver = false, started = false, timerInt = null, seconds = 0;

const boardEl = document.getElementById('board');
const minesEl = document.getElementById('mines');
const flagsEl = document.getElementById('flags');
const timerEl = document.getElementById('timer');
const msgEl = document.getElementById('msg');

document.querySelectorAll('.controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    [size, mineCount] = btn.dataset.level.split(',').map(Number);
    init();
  });
});

function init() {
  clearInterval(timerInt);
  seconds = 0; timerEl.textContent = 0;
  gameOver = false; started = false; msgEl.textContent = '';
  board = Array.from({length: size}, () => Array(size).fill(0));
  revealed = Array.from({length: size}, () => Array(size).fill(false));
  flagged = Array.from({length: size}, () => Array(size).fill(false));
  minesEl.textContent = mineCount;
  flagsEl.textContent = 0;
  render();
}

function placeMines(safeR, safeC) {
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (board[r][c] === -1) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue; // zona aman klik pertama
    board[r][c] = -1; placed++;
  }
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (board[r][c] === -1) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === -1) n++;
        }
      board[r][c] = n;
    }
}

function startTimer() {
  timerInt = setInterval(() => { seconds++; timerEl.textContent = seconds; }, 1000);
}

function render() {
  boardEl.style.gridTemplateColumns = `repeat(${size}, 34px)`;
  boardEl.innerHTML = '';
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.dataset.r = r; cell.dataset.c = c;
      if (revealed[r][c]) {
        cell.classList.add('revealed');
        if (board[r][c] === -1) { cell.textContent = '💣'; cell.classList.add('mine'); }
        else if (board[r][c] > 0) { cell.textContent = board[r][c]; cell.classList.add('n' + board[r][c]); }
      } else if (flagged[r][c]) {
        cell.textContent = '🚩';
      }
      cell.addEventListener('click', () => reveal(r, c));
      cell.addEventListener('contextmenu', e => { e.preventDefault(); toggleFlag(r, c); });
      let pressTimer;
      cell.addEventListener('touchstart', () => { pressTimer = setTimeout(() => toggleFlag(r, c), 400); });
      cell.addEventListener('touchend', () => clearTimeout(pressTimer));
      boardEl.appendChild(cell);
    }
}

function reveal(r, c) {
  if (gameOver || flagged[r][c] || revealed[r][c]) return;
  if (!started) { placeMines(r, c); started = true; startTimer(); }
  if (board[r][c] === -1) return lose();
  flood(r, c);
  checkWin();
  render();
}

function flood(r, c) {
  if (r < 0 || r >= size || c < 0 || c >= size || revealed[r][c] || flagged[r][c]) return;
  revealed[r][c] = true;
  if (board[r][c] === 0)
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        flood(r + dr, c + dc);
}

function toggleFlag(r, c) {
  if (gameOver || revealed[r][c]) return;

  const flagCount = flagged.flat().filter(Boolean).length;
  if (!flagged[r][c] && flagCount >= mineCount) return;

  flagged[r][c] = !flagged[r][c];
  flagsEl.textContent = flagged.flat().filter(Boolean).length;
  render();
}

function lose() {
  gameOver = true; clearInterval(timerInt);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (board[r][c] === -1) revealed[r][c] = true;
  render();
  msgEl.textContent = '💥 Game Over! Pilih level untuk main lagi.';
}

function checkWin() {
  let hidden = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!revealed[r][c]) hidden++;
  if (hidden === mineCount) {
    gameOver = true; clearInterval(timerInt);
    msgEl.textContent = `🎉 Menang dalam ${seconds} detik!`;
  }
}

init();
