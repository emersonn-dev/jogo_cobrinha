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

// === ELEMENTOS DO DOM ===
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retry");
const voltarMenuBtn = document.getElementById("voltarMenu");
const abrirRankingBtn = document.getElementById("abrirRankingBtn");
const voltarJogoBtn = document.getElementById("voltarJogo");

const nomeInput = document.getElementById("nomeJogador");
const somSelect = document.getElementById("somOption");
const musicaSelect = document.getElementById("musicaOption");

const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");
const rankingTela = document.getElementById("rankingTela");

const infoJogador = document.getElementById("infoJogador");
const listaRanking = document.getElementById("listaRanking");

const gameOverDiv = document.getElementById("gameOver");
const pontuacaoFinal = document.getElementById("pontuacaoFinal");

// === VARIÁVEIS DO JOGO ===
let snake = [];
let food;
let d;
let score = 0;
let box = 20;
let game;
let velocidadeInicial = 250;
let velocidade = velocidadeInicial;

let jogador = "";
let somAtivo = true;
let musicaAtiva = false;

let somComer, somMorte, somBonus, musicaFundo;

let startX = 0,
  startY = 0;

// evita virar duas vezes no mesmo frame
let podeMover = true;

// === CANVAS RESPONSIVO ===
function ajustarCanvas() {
  const tamanho = Math.min(window.innerWidth * 0.9, 400);
  canvas.width = tamanho;
  canvas.height = tamanho;
}
ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

// === INICIAR JOGO ===
startBtn.addEventListener("click", async () => {
  jogador = nomeInput.value.trim() || "Anônimo";

  somAtivo = somSelect.value === "on";
  musicaAtiva = musicaSelect.value === "on";

  // carrega áudios
  somComer = new Audio("audio/eat.mp3");
  somMorte = new Audio("audio/die.mp3");
  somBonus = new Audio("audio/levelup.mp3");

  musicaFundo = new Audio("audio/background.mp3");
  musicaFundo.loop = true;
  musicaFundo.volume = 0.5;

  if (musicaAtiva) {
    musicaFundo.currentTime = 0;
    musicaFundo.play().catch(() => {
      console.warn("⚠️ Autoplay bloqueado até interação adicional");
    });
  }

  // mostrar área do jogo / esconder menu
  menu.style.display = "none";
  rankingTela.style.display = "none";
  gameContainer.style.display = "flex";

  resetarJogo();
  atualizarHUD();

  // inicia loop
  game = setInterval(draw, velocidade);
});

// === ABRIR RANKING (menu -> rankingTela) ===
abrirRankingBtn.addEventListener("click", async () => {
  menu.style.display = "none";
  rankingTela.style.display = "flex";
  rankingTela.style.flexDirection = "column";
  rankingTela.style.alignItems = "center";

  await carregarRankingGlobal();
});

// voltar da tela de ranking pro menu
voltarJogoBtn.addEventListener("click", () => {
  rankingTela.style.display = "none";
  menu.style.display = "flex";
});

// === FUNÇÕES DO JOGO ===
function resetarJogo() {
  snake = [{ x: 10 * box, y: 10 * box }];
  score = 0;
  velocidade = velocidadeInicial;
  d = undefined;
  podeMover = true;
  food = gerarComida();
  clearInterval(game);
  gameOverDiv.style.display = "none";
}

function gerarComida() {
  const maxX = Math.floor(canvas.width / box);
  const maxY = Math.floor(canvas.height / box);
  return {
    x: Math.floor(Math.random() * maxX) * box,
    y: Math.floor(Math.random() * maxY) * box,
  };
}

function draw() {
  // fundo
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // desenhar cobra
  for (let i = 0; i < snake.length; i++) {
    const seg = snake[i];

    if (i === 0) {
      // cabeça
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(
        seg.x + box / 2,
        seg.y + box / 2,
        box / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // OLHINHOS 👀
      ctx.fillStyle = "#000"; // preto
      ctx.beginPath();
      ctx.arc(seg.x + 5, seg.y + 5, 2, 0, Math.PI * 2);
      ctx.arc(seg.x + 15, seg.y + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // corpo com degradê verde
      const grad = ctx.createLinearGradient(
        seg.x,
        seg.y,
        seg.x + box,
        seg.y + box
      );
      grad.addColorStop(0, "#27ae60");
      grad.addColorStop(1, "#145a32");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(
        seg.x + box / 2,
        seg.y + box / 2,
        box / 2.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // desenhar comida
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(food.x + box / 2, food.y + box / 2, box / 2, 0, Math.PI * 2);
  ctx.fill();

  // posição atual da cabeça
  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  // movimento
  if (d === "LEFT") snakeX -= box;
  if (d === "UP") snakeY -= box;
  if (d === "RIGHT") snakeX += box;
  if (d === "DOWN") snakeY += box;

  // comeu comida?
  if (snakeX === food.x && snakeY === food.y) {
    score++;
    food = gerarComida();
    if (somAtivo) somComer.play();

    // a cada 10 pontos aumenta velocidade
    if (score % 10 === 0) {
      velocidade *= 0.95; // fica mais rápido
      clearInterval(game);
      game = setInterval(draw, velocidade);
      if (somAtivo) somBonus.play();
      flashCanvas();
    }
  } else {
    // não comeu -> remove rabo
    snake.pop();
  }

  // nova cabeça
  const newHead = { x: snakeX, y: snakeY };

  // checar colisão parede / corpo
  if (
    snakeX < 0 ||
    snakeY < 0 ||
    snakeX >= canvas.width ||
    snakeY >= canvas.height ||
    collision(newHead, snake)
  ) {
    clearInterval(game);
    if (musicaAtiva && musicaFundo) musicaFundo.pause();
    if (somAtivo) somMorte.play();
    gameOver();
    return;
  }

  snake.unshift(newHead);
  atualizarHUD();
  podeMover = true;
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

// === EFEITO VISUAL QUANDO SOBE DE "NÍVEL" ===
function flashCanvas() {
  const oldShadow = canvas.style.boxShadow;
  canvas.style.boxShadow = "0 0 25px #00ff99, 0 0 50px #00ff99";
  setTimeout(() => {
    canvas.style.boxShadow = oldShadow;
  }, 200);
}

// === RANKING GLOBAL (Firebase) ===
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

  // maior pontuação primeiro
  lista.sort((a, b) => b.pontos - a.pontos);

  listaRanking.innerHTML = "";

  // mostra tudo (ou se quiser só top 10 troca pra slice(0,10))
  lista.forEach((r, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${r.nome} - ${r.pontos} pts (${r.data})`;
    listaRanking.appendChild(li);
  });
}

// === CONTROLES DE TECLADO ===
document.addEventListener("keydown", (e) => {
  if (!podeMover) return;

  if (e.key === "ArrowLeft" && d !== "RIGHT") d = "LEFT";
  else if (e.key === "ArrowUp" && d !== "DOWN") d = "UP";
  else if (e.key === "ArrowRight" && d !== "LEFT") d = "RIGHT";
  else if (e.key === "ArrowDown" && d !== "UP") d = "DOWN";

  podeMover = false;
});

// === CONTROLES TOUCH / MOBILE ===
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

// === BOTÕES GAME OVER ===
retryBtn.addEventListener("click", () => {
  gameOverDiv.style.display = "none";
  resetarJogo();

  if (musicaAtiva && musicaFundo) {
    musicaFundo.currentTime = 0;
    musicaFundo.play().catch(() => { });
  }

  game = setInterval(draw, velocidade);
});

voltarMenuBtn.addEventListener("click", () => {
  if (musicaFundo) musicaFundo.pause();

  gameContainer.style.display = "none";
  gameOverDiv.style.display = "none";
  rankingTela.style.display = "none";
  menu.style.display = "flex";
});
