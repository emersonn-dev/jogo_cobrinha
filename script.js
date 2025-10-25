// === Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCMC9YrmIcVmm4HNpgzL-E1WTEJVtoY4s4",
  authDomain: "jogo-cobrinha-23a5a.firebaseapp.com",
  databaseURL: "https://jogo-cobrinha-23a5a-default-rtdb.firebaseio.com",
  projectId: "jogo-cobrinha-23a5a",
  storageBucket: "jogo-cobrinha-23a5a.firebasestorage.app",
  messagingSenderId: "894615929117",
  appId: "1:894615929117:web:a52c4cc21ed385a22ea1f4",
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
const rankingList = document.getElementById("listaRanking");
const gameOverDiv = document.getElementById("gameOver");
const pontuacaoFinal = document.getElementById("pontuacaoFinal");
const voltarMenu = document.getElementById("voltarMenu");

// === Canvas Responsivo ===
function ajustarCanvas() {
  const tamanho = Math.min(window.innerWidth * 0.9, 400);
  canvas.width = tamanho;
  canvas.height = tamanho;
}
ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

// === Variáveis ===
let somComer, somMorte, somBonus;
let somAtivo = true;
let jogador = "";
let box = 20;
let score = 0;
let snake = [];
let d;
let food;
let velocidadeInicial = 250;
let velocidade = velocidadeInicial;
let game;

// === Iniciar o jogo ===
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
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" && d !== "RIGHT") d = "LEFT";
  else if (e.key === "ArrowUp" && d !== "DOWN") d = "UP";
  else if (e.key === "ArrowRight" && d !== "LEFT") d = "RIGHT";
  else if (e.key === "ArrowDown" && d !== "UP") d = "DOWN";
});

// === Funções ===
function gerarComida() {
  const maxX = Math.floor(canvas.width / box);
  const maxY = Math.floor(canvas.height / box);
  return {
    x: Math.floor(Math.random() * maxX) * box,
    y: Math.floor(Math.random() * maxY) * box,
  };
}

function resetarJogo() {
  snake = [{ x: 10 * box, y: 10 * box }];
  score = 0;
  velocidade = velocidadeInicial;
  d = undefined;
  food = gerarComida();
  clearInterval(game);
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < snake.length; i++) {
    if (i === 0) {
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(snake[i].x + box / 2, snake[i].y + box / 2, box / 2, 0, Math.PI * 2);
      ctx.fill();

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
      ctx.beginPath();
      ctx.arc(snake[i].x + box / 2, snake[i].y + box / 2, box / 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // desenhar comida
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

  if (snakeX === food.x && snakeY === food.y) {
    score++;
    food = gerarComida();
    if (somAtivo) somComer.play();

    if (score % 10 === 0) {
      velocidade *= 0.95;
      clearInterval(game);
      game = setInterval(draw, velocidade);
      if (somAtivo) somBonus.play();
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
    if (somAtivo) somMorte.play();
    gameOver();
    return;
  }

  snake.unshift(newHead);
  atualizarHUD();
}

function collision(head, array) {
  return array.some((seg) => seg.x === head.x && seg.y === head.y);
}

function atualizarHUD() {
  infoJogador.textContent = `👤 ${jogador} | 🧮 Pontos: ${score}`;
}

async function gameOver() {
  pontuacaoFinal.textContent = `${jogador}, sua pontuação foi ${score}!`;
  gameOverDiv.style.display = "block";
  await salvarRankingGlobal(jogador, score);
  await carregarRankingGlobal();
}

// === Firebase Ranking ===
async function salvarRankingGlobal(nome, pontos) {
  const dataAgora = new Date().toLocaleString("pt-BR");
  const rankingRef = ref(db, "ranking");

  const snap = await get(rankingRef);
  let jaExiste = null;

  if (snap.exists()) {
    snap.forEach((child) => {
      const val = child.val();
      if (val.nome === nome) {
        jaExiste = { id: child.key, ...val };
      }
    });
  }

  if (jaExiste) {
    if (pontos > jaExiste.pontos) {
      const jogadorRef = ref(db, `ranking/${jaExiste.id}`);
      await set(jogadorRef, { nome, pontos, data: dataAgora });
    }
  } else {
    const novoRef = push(rankingRef);
    await set(novoRef, { nome, pontos, data: dataAgora });
  }
}

async function carregarRankingGlobal() {
  const rankingRef = ref(db, "ranking");
  const snap = await get(rankingRef);
  const lista = [];

  if (snap.exists()) {
    snap.forEach((child) => {
      const val = child.val();
      if (val && typeof val.pontos === "number") lista.push(val);
    });
  }

  lista.sort((a, b) => b.pontos - a.pontos);
  rankingList.innerHTML = "";

  lista.slice(0, 5).forEach((r, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${r.nome} - ${r.pontos} pts (${r.data})`;
    rankingList.appendChild(li);
  });
}

// === Botões ===
retryBtn.addEventListener("click", () => {
  gameOverDiv.style.display = "none";
  resetarJogo();
  game = setInterval(draw, velocidade);
});

voltarMenu.addEventListener("click", () => {
  gameContainer.style.display = "none";
  gameOverDiv.style.display = "none";
  menu.style.display = "flex";
});

// === Toque (celular) ===
let startX = 0, startY = 0;
document.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
});
document.addEventListener("touchmove", (e) => {
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

// === Efeito visual ===
function flashCanvas() {
  const oldShadow = canvas.style.boxShadow;
  canvas.style.boxShadow = "0 0 25px #00ff99";
  setTimeout(() => {
    canvas.style.boxShadow = oldShadow;
  }, 200);
}

