let size = 16, mineCount = 40;
let board = [], revealed = [], flagged = [];
let gameOver = false, started = false, timerInt = null, seconds = 0;

const boardEl = document.getElementById('board');
const minesEl = document.getElementById('mines');
const flagsEl = document.getElementById('flags');
const timerEl = document.getElementById('timer');
const msgEl = document.getElementById('msg');
const gameModal = document.getElementById('gameModal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const closeModalBtn = document.getElementById('closeModal');
const modalActionBtn = document.getElementById('modalAction');

closeModalBtn.addEventListener('click', closeGameModal);
modalActionBtn.addEventListener('click', () => {
  closeGameModal();
  init();
});
gameModal.addEventListener('click', e => {
  if (e.target === gameModal) closeGameModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && gameModal.classList.contains('open')) closeGameModal();
});

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
  closeGameModal();
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
  const candidates = [];

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const inSafeZone = Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1;
      if (!inSafeZone && !flagged[r][c]) candidates.push([r, c]);
    }

  // Fisher-Yates menghasilkan urutan acak tanpa duplikasi dan tanpa random-loop.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const minesToPlace = Math.min(mineCount, candidates.length);
  for (let i = 0; i < minesToPlace; i++) {
    const [r, c] = candidates[i];
    board[r][c] = -1;
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
  if (gameOver || r < 0 || r >= size || c < 0 || c >= size || flagged[r][c] || revealed[r][c]) return;
  if (!started) { placeMines(r, c); started = true; startTimer(); }
  if (board[r][c] === -1) return lose();
  flood(r, c);
  checkWin();
  render();
}

function flood(r, c) {
  const queue = [[r, c]];
  let index = 0;

  while (index < queue.length) {
    const [currentR, currentC] = queue[index++];
    if (currentR < 0 || currentR >= size || currentC < 0 || currentC >= size) continue;
    if (revealed[currentR][currentC] || flagged[currentR][currentC]) continue;
    if (board[currentR][currentC] === -1) continue;

    revealed[currentR][currentC] = true;
    if (board[currentR][currentC] !== 0) continue;

    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (dr !== 0 || dc !== 0) queue.push([currentR + dr, currentC + dc]);
  }
}

function toggleFlag(r, c) {
  if (gameOver || r < 0 || r >= size || c < 0 || c >= size || revealed[r][c]) return;

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
  showGameModal('💥', 'Game Over', 'Kamu menekan bom. Coba lagi dan gunakan petunjuk angka dengan lebih hati-hati.');
}

function checkWin() {
  let hidden = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!revealed[r][c]) hidden++;
  if (hidden === mineCount) {
    gameOver = true; clearInterval(timerInt);
    showGameModal('🎉', 'Kamu menang!', `Papan berhasil dibersihkan dalam ${seconds} detik. Strategi yang bagus!`);
  }
}

function showGameModal(icon, title, text) {
  modalIcon.textContent = icon;
  modalTitle.textContent = title;
  modalText.textContent = text;
  gameModal.classList.add('open');
  closeModalBtn.focus();
}

function closeGameModal() {
  gameModal.classList.remove('open');
}

init();
