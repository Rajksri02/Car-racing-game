const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const scoreText = document.getElementById("score");

let playerX = 125;
let score = 0;
let speed = 3;
let gameRunning = false;

startBtn.addEventListener("click", startGame);

function startGame() {
  startScreen.classList.add("hide");
  gameArea.classList.remove("hide");
  gameRunning = true;
  score = 0;
  speed = 3;
  scoreText.innerText = "Score: 0";
  player.style.left = playerX + "px";
  setInterval(createEnemy, 1200);
}

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft" && playerX > 0) {
    playerX -= 20;
  }
  if (e.key === "ArrowRight" && playerX < 250) {
    playerX += 20;
  }
  player.style.left = playerX + "px";
});

function createEnemy() {
  if (!gameRunning) return;

  const enemy = document.createElement("div");
  enemy.classList.add("enemy");
  enemy.style.left = Math.floor(Math.random() * 250) + "px";
  gameArea.appendChild(enemy);

  let enemyY = -100;

  function moveEnemy() {
    if (!gameRunning) return;

    enemyY += speed;
    enemy.style.top = enemyY + "px";

    if (
      enemyY > 330 &&
      parseInt(enemy.style.left) < playerX + 50 &&
      parseInt(enemy.style.left) + 50 > playerX
    ) {
      endGame();
    }

    if (enemyY > 500) {
      enemy.remove();
      score++;
      speed += 0.2;
      scoreText.innerText = "Score: " + score;
    } else {
      requestAnimationFrame(moveEnemy);
    }
  }

  moveEnemy();
}

function endGame() {
  gameRunning = false;
  alert("Game Over! Your Score: " + score);
  location.reload();
}
