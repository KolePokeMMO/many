import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- Firebase config (use your own!) ---
const firebaseConfig = {
  apiKey: "AIzaSyBVbb67rvWjdY279rAo8BEyPTNKZVGqfIY",
  authDomain: "sl-rps.firebaseapp.com",
  databaseURL: "https://sl-rps-default-rtdb.firebaseio.com",
  projectId: "sl-rps",
  storageBucket: "sl-rps.firebasestorage.app",
  messagingSenderId: "670763987872",
  appId: "1:670763987872:web:7dd535b257065e9fd82ac5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elements
const nameInput = document.getElementById('player-name');
const pinInput = document.getElementById('player-pin');
const startButton = document.getElementById('start-game');
const gameContainerWrapper = document.getElementById('hangmon-game-wrapper');
const loginContainer = document.getElementById('login-screen');
const wordDisplay = document.getElementById('word-display');
const letterButtons = document.getElementById('letter-buttons');
const guessInput = document.getElementById('guess-word');
const guessSubmit = document.getElementById('submit-guess');
const wrongCountEl = document.getElementById('wrong-count');
const timerEl = document.getElementById('game-timer');
const leaderboardEl = document.getElementById('leaderboard');
const messageBox = document.getElementById('message-box');

let currentWord = '';
let guessedLetters = new Set();
let wrongGuesses = 0;
let maxWrong = 6;
let timer = 0;
let timerInterval = null;
let gameActive = false;

let playerName = '';
let playerPin = '';

// Local Storage keys
function localKey(key) {
  return `hangmon-${key}`;
}

// Show messages inside left column message box
function showMessage(text, type = 'info', duration = 4000) {
  messageBox.textContent = text;
  messageBox.className = 'message-box'; // reset classes
  if (type === 'error') messageBox.classList.add('error');
  else if (type === 'success') messageBox.classList.add('success');
  else messageBox.classList.add('info');
  messageBox.classList.remove('hidden');

  if (duration > 0) {
    clearTimeout(messageBox._timeout);
    messageBox._timeout = setTimeout(() => {
      messageBox.classList.add('hidden');
    }, duration);
  }
}

// Load word list from your JSON file
async function loadWordList() {
  try {
    const response = await fetch('/many/assets/data/hangmon-words.json');
    if (!response.ok) throw new Error('Failed to load word list');
    const words = await response.json();
    return words;
  } catch (err) {
    console.error('Error loading words:', err);
    showMessage('Error loading word list. Check console.', 6000);
    return [];
  }
}

// Initialize the game UI for a new word
function initGame(word) {
  currentWord = word.toLowerCase();
  guessedLetters = new Set();
  wrongGuesses = 0;
  timer = 0;
  gameActive = true;

  updateWordDisplay();
  wrongCountEl.textContent = wrongGuesses;
  timerEl.textContent = `${timer}s`;
  guessInput.value = '';
  guessInput.disabled = false;
  guessSubmit.disabled = false;

  createLetterButtons();

  // Start timer
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    timerEl.textContent = `${timer}s`;
  }, 1000);
}

// Update displayed word with guessed letters and underscores
function updateWordDisplay() {
  const display = [...currentWord].map(char => guessedLetters.has(char) || char === ' ' ? char : '_').join(' ');
  wordDisplay.textContent = display;
}

// Create letter buttons for guessing
function createLetterButtons() {
  letterButtons.innerHTML = '';
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.disabled = guessedLetters.has(letter.toLowerCase());
    btn.addEventListener('click', () => handleLetterGuess(letter.toLowerCase(), btn));
    letterButtons.appendChild(btn);
  }
}

// Handle guessing a single letter
function handleLetterGuess(letter, button) {
  if (!gameActive) return;
  button.disabled = true;
  guessedLetters.add(letter);

  if (currentWord.includes(letter)) {
    updateWordDisplay();
    if (checkWin()) {
      endGame(true);
    }
  } else {
    wrongGuesses++;
    wrongCountEl.textContent = wrongGuesses;
    if (wrongGuesses >= maxWrong) {
      endGame(false);
    }
  }
}

// Check if player won
function checkWin() {
  return [...currentWord].every(char => char === ' ' || guessedLetters.has(char));
}

// Handle guessing the full word
function handleWordGuess() {
  if (!gameActive) return;
  const guess = guessInput.value.trim().toLowerCase();
  if (!guess) return;
  if (guess === currentWord) {
    updateWordDisplay();
    endGame(true);
  } else {
    wrongGuesses++;
    wrongCountEl.textContent = wrongGuesses;
    if (wrongGuesses >= maxWrong) {
      endGame(false);
    }
  }
  guessInput.value = '';
}

// End game, update scores, stop timer
async function endGame(won) {
  gameActive = false;
  clearInterval(timerInterval);
  guessInput.disabled = true;
  guessSubmit.disabled = true;

  if (won) {
    showMessage(`You guessed it right! The word was "${currentWord}".`, 'success', 6000);
  } else {
    showMessage(`Game over! The word was "${currentWord}".`, 'error', 6000);
    guessedLetters = new Set([...currentWord]);
    updateWordDisplay();
  }

  await updatePlayerStats(won);
  loadLeaderboard();

  setTimeout(() => {
    startNewRound();
  }, 2500);
}

// Update player stats in Firebase
async function updatePlayerStats(won) {
  if (!playerName) return;
  const playerRef = ref(db, `hangmon/scores/${playerName}`);
  const snapshot = await get(playerRef);
  let data = {};
  if (snapshot.exists()) {
    data = snapshot.val();
  } else {
    data = {
      pin: playerPin,
      totalScore: 0,
      gamesPlayed: 0,
      wins: 0,
      fastestWin: null,
      accuracy: null,
    };
  }

  const totalGames = (data.gamesPlayed || 0) + 1;
  const totalWins = (data.wins || 0) + (won ? 1 : 0);
  const newTotalScore = (data.totalScore || 0) + calculateScore(won);
  const fastestWin = won && (data.fastestWin === null || timer < data.fastestWin) ? timer : data.fastestWin;

  const totalLetters = currentWord.replace(/\s/g, '').length;
  const accuracy = ((totalLetters - wrongGuesses) / totalLetters * 100).toFixed(1);

  await update(playerRef, {
    gamesPlayed: totalGames,
    wins: totalWins,
    totalScore: newTotalScore,
    fastestWin: fastestWin,
    accuracy: accuracy,
  });
}

// Scoring function
function calculateScore(won) {
  if (!won) return 0;
  const base = 100;
  const speedBonus = Math.max(0, 50 - timer);
  const penalty = wrongGuesses * 5;
  return base + speedBonus - penalty;
}

// Load and display leaderboard
function loadLeaderboard() {
  const scoresRef = ref(db, 'hangmon/scores');
  onValue(scoresRef, (snapshot) => {
    const scores = snapshot.val();
    if (!scores) {
      leaderboardEl.innerHTML = '<li>No players yet.</li>';
      return;
    }
    const players = Object.entries(scores).map(([name, data]) => ({
      name,
      score: data.totalScore || 0,
      wins: data.wins || 0,
      games: data.gamesPlayed || 0,
      fastestWin: data.fastestWin,
      accuracy: data.accuracy,
    }));
    players.sort((a, b) => b.score - a.score);
    leaderboardEl.innerHTML = '';
    for (const p of players) {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${p.name}</strong> - Score: ${p.score} | Wins: ${p.wins} | Games: ${p.games} | Fastest: ${p.fastestWin !== null ? p.fastestWin + 's' : 'N/A'} | Accuracy: ${p.accuracy}%
      `;
      leaderboardEl.appendChild(li);
    }
  });
}

// Start a new round
async function startNewRound() {
  const words = await loadWordList();
  if (words.length === 0) {
    showMessage('No words found! Please check your hangmon-words.json file.', 'error', 6000);
    return;
  }
  const word = words[Math.floor(Math.random() * words.length)].toLowerCase();
  initGame(word);
}

// Event listeners

// Start game - handle login and setup
startButton.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const pin = pinInput.value.trim();

  if (!name || !pin || pin.length !== 4 || isNaN(pin)) {
    showMessage('Please enter a valid name and a 4-digit numeric PIN.', 'error', 6000);
    return;
  }

  const playerRef = ref(db, `hangmon/scores/${name}`);
  const snapshot = await get(playerRef);

  if (snapshot.exists()) {
    const playerData = snapshot.val();
    if (playerData.pin === pin) {
      playerName = name;
      playerPin = pin;
      localStorage.setItem(localKey('name'), name);
      localStorage.setItem(localKey('pin'), pin);
      showMessage(`Welcome back, ${name}! Ready to play.`, 'success', 0);
      loginContainer.style.display = 'none';
      gameContainerWrapper.classList.remove('hidden');
      loadLeaderboard();
      startNewRound();
    } else {
      showMessage('Incorrect PIN for that name. Try again or pick a different name.', 'error', 6000);
    }
  } else {
    await set(playerRef, {
      pin: pin,
      totalScore: 0,
      gamesPlayed: 0,
      wins: 0,
      fastestWin: null,
      accuracy: null,
    });
    playerName = name;
    playerPin = pin;
    localStorage.setItem(localKey('name'), name);
    localStorage.setItem(localKey('pin'), pin);
    showMessage(`Welcome, ${name}! Your new game will start now.`, 'success', 0);
    loginContainer.style.display = 'none';
    gameContainerWrapper.classList.remove('hidden');
    loadLeaderboard();
    startNewRound();
  }
});

// Allow pressing Enter to trigger Start Game button
[nameInput, pinInput].forEach(input => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      startButton.click();
    }
  });
});

// Submit guess button event
guessSubmit.addEventListener('click', () => {
  handleWordGuess();
});

// Allow pressing Enter in guess input
guessInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    handleWordGuess();
  }
});

// Load leaderboard on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard();
});
