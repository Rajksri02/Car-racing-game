// DOM Elements
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const road = document.querySelector(".road");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const speedDisplay = document.getElementById("speedDisplay");
const finalScoreDisplay = document.getElementById("finalScoreDisplay");
const muteToggle = document.getElementById("muteToggle");

// Game State
let playerX = 135; // Centered for 320px width (320 - 50)/2 = 135
const gameWidth = 320;
const carWidth = 50;
let score = 0;
let speed = 4;
let gameRunning = false;
let animationFrameId;
let enemySpawnTimeout;
let frameCount = 0;

// Audio System (Web Audio API)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let engineOsc;
let engineGain;
let isMuted = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  
  // Engine sound
  engineOsc = audioCtx.createOscillator();
  engineOsc.type = 'triangle';
  engineOsc.frequency.value = 50; // Low hum
  
  engineGain = audioCtx.createGain();
  engineGain.gain.value = 0;
  
  engineOsc.connect(engineGain);
  engineGain.connect(audioCtx.destination);
  engineOsc.start();
}

function updateEngineSound() {
  if (!audioCtx || isMuted || !gameRunning) {
    if (engineGain) engineGain.gain.value = 0;
    return;
  }
  engineGain.gain.value = 0.1;
  // Pitch goes up with speed
  engineOsc.frequency.value = 50 + (speed * 10);
}

function playCrashSound() {
  if (!audioCtx || isMuted) return;
  
  const crashOsc = audioCtx.createOscillator();
  crashOsc.type = 'sawtooth';
  const crashGain = audioCtx.createGain();
  
  crashOsc.connect(crashGain);
  crashGain.connect(audioCtx.destination);
  
  crashOsc.frequency.setValueAtTime(100, audioCtx.currentTime);
  crashOsc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
  
  crashGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  crashGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  
  crashOsc.start();
  crashOsc.stop(audioCtx.currentTime + 0.5);
}

function playScoreSound() {
  if (!audioCtx || isMuted) return;
  
  const scoreOsc = audioCtx.createOscillator();
  scoreOsc.type = 'sine';
  const scoreGain = audioCtx.createGain();
  
  scoreOsc.connect(scoreGain);
  scoreGain.connect(audioCtx.destination);
  
  scoreOsc.frequency.setValueAtTime(400, audioCtx.currentTime);
  scoreOsc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
  
  scoreGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  scoreGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  
  scoreOsc.start();
  scoreOsc.stop(audioCtx.currentTime + 0.1);
}

// Particle System
function spawnParticle(x, y, type) {
  const particle = document.createElement("div");
  particle.classList.add("particle");
  
  let size, duration, color, dx, dy;
  
  if (type === 'dust') {
    size = Math.random() * 8 + 4;
    duration = 500;
    color = `rgba(200, 200, 200, ${Math.random() * 0.5})`;
    dx = (Math.random() - 0.5) * 20;
    dy = Math.random() * 20 + 10;
  } else if (type === 'explosion') {
    size = Math.random() * 15 + 5;
    duration = 800;
    const colors = ['#ff4b2b', '#ff416c', '#ffea00'];
    color = colors[Math.floor(Math.random() * colors.length)];
    dx = (Math.random() - 0.5) * 100;
    dy = (Math.random() - 0.5) * 100;
  }

  particle.style.width = size + 'px';
  particle.style.height = size + 'px';
  particle.style.background = color;
  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  
  gameArea.appendChild(particle);
  
  const startTime = performance.now();
  
  function animateParticle(time) {
    let progress = (time - startTime) / duration;
    if (progress > 1) {
      particle.remove();
      return;
    }
    
    particle.style.transform = `translate(${dx * progress}px, ${dy * progress}px) scale(${1 - progress})`;
    particle.style.opacity = 1 - progress;
    requestAnimationFrame(animateParticle);
  }
  
  requestAnimationFrame(animateParticle);
}


// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
muteToggle.addEventListener("change", (e) => {
  isMuted = e.target.checked;
  updateEngineSound();
});

function initGame() {
  score = 0;
  speed = 4;
  playerX = (gameWidth - carWidth) / 2;
  frameCount = 0;
  
  player.style.left = playerX + "px";
  scoreDisplay.innerText = "Score: 0";
  levelDisplay.innerText = "Level: 1";
  speedDisplay.innerText = "Speed: 100 km/h";
  
  // Clear existing enemies and particles
  document.querySelectorAll('.enemy, .particle').forEach(el => el.remove());
  gameArea.classList.remove('shake');
}

function startGame() {
  initAudio();
  
  // Audio context requires user interaction to resume
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  startScreen.classList.add("hide");
  gameOverScreen.classList.add("hide");
  gameArea.classList.remove("hide");
  
  initGame();
  
  gameRunning = true;
  road.classList.add("animated");
  road.style.animationDuration = (10 / speed) + "s";
  updateEngineSound();
  
  createEnemy();
  gameLoop();
}

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft" && playerX > 10) {
    playerX -= 60; // Larger step for snappy lane-like changing
  }
  if (e.key === "ArrowRight" && playerX < (gameWidth - carWidth - 10)) {
    playerX += 60;
  }
  
  // Clamp values just in case
  playerX = Math.max(10, Math.min(playerX, gameWidth - carWidth - 10));
  player.style.left = playerX + "px";
});

function createEnemy() {
  if (!gameRunning) return;

  const enemy = document.createElement("div");
  enemy.classList.add("enemy");
  
  // Random lane positioning
  const lanes = [20, 135, 250]; // Left, center, right approx
  const laneIndex = Math.floor(Math.random() * 3);
  enemy.style.left = lanes[laneIndex] + "px";
  
  enemy.y = -100;
  enemy.style.top = enemy.y + "px";
  gameArea.appendChild(enemy);

  const spawnDelay = Math.max(600, 1500 - (speed * 100));
  enemySpawnTimeout = setTimeout(createEnemy, spawnDelay);
}

function moveEnemies() {
  const enemies = document.querySelectorAll(".enemy");
  
  enemies.forEach(enemy => {
    enemy.y += speed;
    enemy.style.top = enemy.y + "px";
    
    // Collision detection
    const eRect = enemy.getBoundingClientRect();
    const pRect = player.getBoundingClientRect();
    
    // Use slightly smaller hitboxes for better game feel
    const margin = 10;
    if (
      eRect.top + margin < pRect.bottom - margin &&
      eRect.bottom - margin > pRect.top + margin &&
      eRect.left + margin < pRect.right - margin &&
      eRect.right - margin > pRect.left + margin
    ) {
      endGame(eRect, pRect);
      return;
    }

    if (enemy.y > 550) {
      enemy.remove();
      score++;
      
      if (score % 5 === 0) {
        speed += 0.5;
        playScoreSound();
        road.style.animationDuration = (10 / speed) + "s";
        updateEngineSound();
      }
      
      scoreDisplay.innerText = "Score: " + score;
      levelDisplay.innerText = "Level: " + Math.floor(score / 5 + 1);
      
      const displaySpeed = Math.floor(100 + (speed - 4) * 20);
      speedDisplay.innerText = "Speed: " + displaySpeed + " km/h";
    }
  });
}

function gameLoop() {
  if (!gameRunning) return;
  
  moveEnemies();
  
  // Dust particles behind car
  frameCount++;
  if (frameCount % 3 === 0) {
    spawnParticle(playerX + 10, 500, 'dust');
    spawnParticle(playerX + 40, 500, 'dust');
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame(eRect, pRect) {
  gameRunning = false;
  cancelAnimationFrame(animationFrameId);
  clearTimeout(enemySpawnTimeout);
  
  road.classList.remove("animated");
  
  if (engineGain) engineGain.gain.value = 0;
  playCrashSound();
  
  // Explosion particles at collision point
  const explodeX = (eRect.left + pRect.left) / 2 - gameArea.getBoundingClientRect().left;
  const explodeY = (eRect.top + pRect.top) / 2 - gameArea.getBoundingClientRect().top;
  
  for (let i = 0; i < 30; i++) {
    spawnParticle(explodeX + 25, explodeY + 45, 'explosion');
  }
  
  gameArea.classList.add('shake');
  
  setTimeout(() => {
    finalScoreDisplay.innerText = "Final Score: " + score;
    gameOverScreen.classList.remove("hide");
  }, 1000);
}
