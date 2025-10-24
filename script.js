const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retry");
const nomeInput = document.getElementById("nomeJogador");
const somSelect = document.getElementById("somOption");
const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");
const infoJogador = document.getElementById("infoJogador");
const recordeAtual = document.getElementById("recordeAtual");
const rankingList = document.getElementById("listaRanking");
const gameOverDiv = document.getElementById("gameOver");
const pontuacaoFinal = document.getElementById("pontuacaoFinal");

// 🔄 Ajusta o tamanho do canvas conforme a tela
function ajustarCanvas() {
  const tamanho = Math.min(window.innerWidth * 0.9, 400);
  canvas.width = tamanho;
  canvas.height = tamanho;
}
ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

// Variáveis principais
let somComer, somMorte, somBonus;
let somAtivo = true;
let jogador = "";
let box = 20;
let score = 0;
let snake = [];
let d;
let food;
let velocidade = 250; // começa devagar
let game;

// 🎮 Iniciar o jogo
startBtn.addEventListener("click", () => {
  jogador = nomeInput.value.trim() || "Anônimo";
  somAtivo = somSelect.value === "on";

  somComer = new Audio("audio/eat.mp3");
  somMorte = new Audio("audio/die.mp3");
  somBonus = new Audio("audio/levelup.mp3");

  menu.style.display = "none";
  gameContainer.style.display = "flex";
  gameContainer.style.flexDirection = "column";
  gameContainer.style.alignItems = "center";

  resetarJogo();
  mostrarRanking();
  atualizarHUD();
  game = setInterval(draw, velocidade);
});

document.addEventListener("keydown", direction);

function direction(e) {
  if (e.key === "ArrowLeft" && d !== "RIGHT") d = "LEFT";
  else if (e.key === "ArrowUp" && d !== "DOWN") d = "UP";
  else if (e.key === "ArrowRight" && d !== "LEFT") d = "RIGHT";
  else if (e.key === "ArrowDown" && d !== "UP") d = "DOWN";
}

function gerarComida() {
  const maxX = Math.floor(canvas.width / box);
  const maxY = Math.floor(canvas.height / box);
  return {
    x: Math.floor(Math.random() * maxX) * box,
    y: Math.floor(Math.random() * maxY) * box
  };
}

function resetarJogo() {
  snake = [{ x: 10 * box, y: 10 * box }];
  score = 0;
  d = undefined;
  food = gerarComida();
  clearInterval(game);
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // desenha cobra
  for (let i = 0; i < snake.length; i++) {
    if (i === 0) {
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(snake[i].x + box / 2, snake[i].y + box / 2, box / 2, 0, Math.PI * 2);
      ctx.fill();

      // olhos
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(snake[i].x + 5, snake[i].y + 5, 2, 0, Math.PI * 2);
      ctx.arc(snake[i].x + 15, snake[i].y + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const grad = ctx.createLinearGradient(
        snake[i].x,
        snake[i].y,
        snake[i].x + box,
        snake[i].y + box
      );
      grad.addColorStop(0, "#27ae60");
      grad.addColorStop(1, "#145a32");
      ctx.fillStyle = grad;
      ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }
  }

  // desenha comida
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(food.x + box / 2, food.y + box / 2, box / 2, 0, Math.PI * 2);
  ctx.fill();

  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (d === "LEFT") snakeX -= box;
  if (d === "UP") snakeY -= box;
  if (d === "RIGHT") snakeX += box;
  if (d === "DOWN") snakeY += box;

  // comer comida
  if (snakeX === food.x && snakeY === food.y) {
    score++;
    food = gerarComida();
    if (somAtivo) {
      somComer.currentTime = 0;
      somComer.play();
    }

    // aumenta velocidade a cada 10 pontos
    if (score % 10 === 0) {
      velocidade *= 0.99;
      clearInterval(game);
      game = setInterval(draw, velocidade);
      if (somAtivo) {
        somBonus.currentTime = 0;
        somBonus.play();
      }
      flashCanvas();
    }
  } else {
    snake.pop();
  }

  const newHead = { x: snakeX, y: snakeY };
  if (
    snakeX < 0 ||
    snakeY < 0 ||
    snakeX >= canvas.width ||
    snakeY >= canvas.height ||
    collision(newHead, snake)
  ) {
    clearInterval(game);
    if (somAtivo) {
      somMorte.currentTime = 0;
      somMorte.play();
    }
    gameOver();
    return;
  }

  snake.unshift(newHead);
  atualizarHUD();
}

function collision(head, array) {
  return array.some(seg => seg.x === head.x && seg.y === head.y);
}

function atualizarHUD() {
  infoJogador.textContent = `👤 ${jogador} | 🧮 Pontos: ${score}`;
  const melhor = getMelhorPontuacao(jogador);
  recordeAtual.textContent = melhor ? `🏅 Recorde: ${melhor} pts` : "";
}

function getMelhorPontuacao(nome) {
  const ranking = JSON.parse(localStorage.getItem("rankingSnake")) || [];
  const player = ranking.find(r => r.nome === nome);
  return player ? player.pontos : 0;
}

function gameOver() {
  pontuacaoFinal.textContent = `${jogador}, sua pontuação foi ${score}!`;
  gameOverDiv.style.display = "block";
  salvarRanking(jogador, score);
  mostrarRanking();
}

function salvarRanking(nome, pontos) {
  const data = new Date().toLocaleString("pt-BR");
  let ranking = JSON.parse(localStorage.getItem("rankingSnake")) || [];
  ranking.push({ nome, pontos, data });
  ranking.sort((a, b) => b.pontos - a.pontos);
  ranking = ranking.slice(0, 5);
  localStorage.setItem("rankingSnake", JSON.stringify(ranking));
}

function mostrarRanking() {
  const ranking = JSON.parse(localStorage.getItem("rankingSnake")) || [];
  rankingList.innerHTML = "";
  ranking.forEach((r, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${r.nome} - ${r.pontos} pts (${r.data})`;
    rankingList.appendChild(li);
  });
}

retryBtn.addEventListener("click", () => {
  gameOverDiv.style.display = "none";
  resetarJogo();
  game = setInterval(draw, velocidade);
});

function flashCanvas() {
  const oldShadow = canvas.style.boxShadow;
  const oldBorder = canvas.style.borderColor;
  canvas.style.boxShadow = "0 0 25px #00ff99";
  canvas.style.borderColor = "#00ff99";
  setTimeout(() => {
    canvas.style.boxShadow = oldShadow;
    canvas.style.borderColor = oldBorder || "#4caf50";
  }, 200);
}

// 📱 Controles por toque (qualquer lugar da tela)
let startX = 0;
let startY = 0;

document.addEventListener("touchstart", function (e) {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
});

document.addEventListener("touchmove", function (e) {
  if (!startX || !startY) return;

  const touch = e.touches[0];
  const diffX = touch.clientX - startX;
  const diffY = touch.clientY - startY;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0 && d !== "LEFT") d = "RIGHT";
    else if (diffX < 0 && d !== "RIGHT") d = "LEFT";
  } else {
    if (diffY > 0 && d !== "UP") d = "DOWN";
    else if (diffY < 0 && d !== "DOWN") d = "UP";
  }

  startX = 0;
  startY = 0;
  e.preventDefault(); // evita scroll
});
