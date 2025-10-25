// === Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, push, set, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCMC9YrmIcVmm4HNpgzL-E1WTEJVtoY4s4",
  authDomain: "jogo-cobrinha-23a5a.firebaseapp.com",
  databaseURL: "https://jogo-cobrinha-23a5a-default-rtdb.firebaseio.com",
  projectId: "jogo-cobrinha-23a5a",
  storageBucket: "jogo-cobrinha-23a5a.firebasestorage.app",
  messagingSenderId: "894615929117",
  appId: "1:894615929117:web:a52c4cc21ed385a22ea1f4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("✅ Firebase conectado!");

// === Elementos ===
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retry");
const nomeInput = document.getElementById("nomeJogador");
const somSelect = document.getElementById("somOption");
const showRankingBtn = document.getElementById("showRankingBtn");
const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");
const infoJogador = document.getElementById("infoJogador");
const recordeAtual = document.getElementById("recordeAtual");
const rankingList = document.getElementById("listaRanking");
const gameOverDiv = document.getElementById("gameOver");
const pontuacaoFinal = document.getElementById("pontuacaoFinal");
const voltarMenu = document.getElementById("voltarMenu");


// === Config Canvas ===
function ajustarCanvas() {
  const tamanho = Math.min(window.innerWidth * 0.9, 400);
  canvas.width = tamanho;
  canvas.height = tamanho;
}
ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

// === Variáveis do jogo ===
let somComer, somMorte, somBonus;
let somAtivo = true;
let jogador = "";
let box = 20;
let score = 0;
let snake = [];
let d;
let food;
let velocidade = 250;
let game;

// === Iniciar Jogo ===
startBtn.addEventListener("click", async () => {
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
  await carregarRankingGlobal();
  atualizarHUD();
  game = setInterval(draw, velocidade);
});

// === Ver Ranking (sem jogar) ===
showRankingBtn.addEventListener("click", async () => {
  menu.style.display = "none";
  gameContainer.style.display = "flex";
  gameContainer.style.flexDirection = "column";
  gameContainer.style.alignItems = "center";
  await carregarRankingGlobal();
});

// === Direções ===
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" && d !== "RIGHT") d = "LEFT";
  else if (e.key === "ArrowUp" && d !== "DOWN") d = "UP";
  else if (e.key === "ArrowRight" && d !== "LEFT") d = "RIGHT";
  else if (e.key === "ArrowDown" && d !== "UP") d = "DOWN";
});

// === Funções ===
function gerarComida() {
  const maxX = Math.floor(canvas.width / box);
  const maxY = Math.floor(canvas.height / box);
  return { x: Math.floor(Math.random() * maxX) * box, y: Math.floor(Math.random() * maxY) * box };
}

function resetarJogo() {
  snake = [{ x: 10 * box, y: 10 * box }];
  score = 0;
  d = undefined;
  food = gerarComida();
  clearInterval(game);
}

function draw() {
  // fundo
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // === desenhar cobrinha ===
  for (let i = 0; i < snake.length; i++) {
    if (i === 0) {
      // cabeça
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(
        snake[i].x + box / 2,
        snake[i].y + box / 2,
        box / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // olhos 🐍
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(snake[i].x + box * 0.25, snake[i].y + box * 0.25, 2, 0, Math.PI * 2);
      ctx.arc(snake[i].x + box * 0.75, snake[i].y + box * 0.25, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // corpo (segmentos arredondados com degradê)
      const grad = ctx.createLinearGradient(
        snake[i].x,
        snake[i].y,
        snake[i].x + box,
        snake[i].y + box
      );
      grad.addColorStop(0, "#27ae60");
      grad.addColorStop(1, "#145a32");
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(
        snake[i].x + box / 2,
        snake[i].y + box / 2,
        box / 2.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // === desenhar comida ===
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(food.x + box / 2, food.y + box / 2, box / 2, 0, Math.PI * 2);
  ctx.fill();

  // movimento da cabeça
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
    if (somAtivo) somComer.play();

    // aumenta a velocidade a cada 10 pontos
    if (score % 10 === 0) {
      velocidade *= 0.99;
      clearInterval(game);
      game = setInterval(draw, velocidade);
      if (somAtivo) somBonus.play();
      flashCanvas();
    }
  } else {
    snake.pop();
  }

  const newHead = { x: snakeX, y: snakeY };

  // colisão com bordas ou corpo
  if (
    snakeX < 0 ||
    snakeY < 0 ||
    snakeX >= canvas.width ||
    snakeY >= canvas.height ||
    collision(newHead, snake)
  ) {
    clearInterval(game);
    if (somAtivo) somMorte.play();
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
}

function gameOver() {
  pontuacaoFinal.textContent = `${jogador}, sua pontuação foi ${score}!`;
  gameOverDiv.style.display = "block";
  salvarRankingGlobal(jogador, score).then(() => carregarRankingGlobal());
}

// === Ranking Global ===
async function salvarRankingGlobal(nome, pontos) {
  const dataAgora = new Date().toLocaleString("pt-BR");
  const rankingRef = ref(db, "ranking");
  const novoRef = push(rankingRef);
  return set(novoRef, { nome, pontos, data: dataAgora });
}

async function carregarRankingGlobal() {
  const rankingRef = ref(db, "ranking");
  const q = query(rankingRef, orderByChild("pontos"), limitToLast(50));
  const snap = await get(q);
  let lista = [];
  if (snap.exists()) snap.forEach(c => lista.push(c.val()));
  lista.sort((a, b) => b.pontos - a.pontos);
  lista = lista.slice(0, 5);
  rankingList.innerHTML = "";
  lista.forEach((r, i) => {
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

// === Controles por toque ===
let startX = 0;
let startY = 0;
document.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
});
document.addEventListener("touchmove", e => {
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
  e.preventDefault();
});

voltarMenu.addEventListener("click", () => {
  gameContainer.style.display = "none";
  menu.style.display = "flex";
});

