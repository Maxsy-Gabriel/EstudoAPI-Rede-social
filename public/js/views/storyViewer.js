import { state } from "../state.js";
import { criarAvatar } from "../utils/dom.js";
import { tempoRelativo } from "../utils/format.js";
import { marcarComoVisto } from "../controllers/storyController.js";

const DURACAO_ITEM_MS = 5000;

let overlay = null;
let barrasEl = null;
let headerAvatarEl = null;
let headerNomeEl = null;
let headerTempoEl = null;
let conteudoEl = null;

let grupos = [];
let grupoIndex = 0;
let itemIndex = 0;
let timer = null;
let aoFecharCallback = null;

function criarOverlay() {
  overlay = document.createElement("div");
  overlay.className = "story-viewer-overlay hidden";

  const card = document.createElement("div");
  card.className = "story-viewer-card";

  barrasEl = document.createElement("div");
  barrasEl.className = "story-viewer-progress";

  const header = document.createElement("div");
  header.className = "story-viewer-header";

  headerAvatarEl = document.createElement("span");
  headerNomeEl = document.createElement("span");
  headerNomeEl.className = "story-viewer-nome";
  headerTempoEl = document.createElement("span");
  headerTempoEl.className = "story-viewer-tempo";

  const fecharBtn = document.createElement("button");
  fecharBtn.type = "button";
  fecharBtn.className = "story-viewer-fechar";
  fecharBtn.textContent = "×";
  fecharBtn.setAttribute("aria-label", "Fechar");
  fecharBtn.onclick = fecharVisualizador;

  header.append(headerAvatarEl, headerNomeEl, headerTempoEl, fecharBtn);

  conteudoEl = document.createElement("div");
  conteudoEl.className = "story-viewer-conteudo";

  const zonaAnterior = document.createElement("div");
  zonaAnterior.className = "story-viewer-zona story-viewer-zona-anterior";
  zonaAnterior.onclick = () => navegar(-1);

  const zonaProxima = document.createElement("div");
  zonaProxima.className = "story-viewer-zona story-viewer-zona-proxima";
  zonaProxima.onclick = () => navegar(1);

  card.append(barrasEl, header, conteudoEl, zonaAnterior, zonaProxima);
  overlay.appendChild(card);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharVisualizador();
  });

  document.addEventListener("keydown", (e) => {
    if (overlay.classList.contains("hidden")) return;
    if (e.key === "Escape") fecharVisualizador();
    if (e.key === "ArrowLeft") navegar(-1);
    if (e.key === "ArrowRight") navegar(1);
  });

  document.body.appendChild(overlay);
}

export function abrirVisualizadorDeStories(gruposOrdenados, indexInicial, aoFechar) {
  if (!overlay) criarOverlay();
  grupos = gruposOrdenados;
  grupoIndex = indexInicial;
  itemIndex = 0;
  aoFecharCallback = aoFechar || null;

  overlay.classList.remove("hidden");
  renderizarItemAtual();
}

function grupoAtual() {
  return grupos[grupoIndex];
}

function renderizarBarras() {
  const [, itens] = grupoAtual();
  barrasEl.innerHTML = "";

  itens.forEach((_, i) => {
    const barra = document.createElement("div");
    barra.className = "story-viewer-barra";
    const preenchimento = document.createElement("div");
    preenchimento.className = "story-viewer-barra-preenchimento";
    if (i < itemIndex) preenchimento.style.width = "100%";
    barra.appendChild(preenchimento);
    barrasEl.appendChild(barra);
  });
}

function preenchimentoAtualEl() {
  return barrasEl.children[itemIndex]?.firstChild;
}

function pararTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function renderizarItemAtual() {
  pararTimer();
  const [userId, itens] = grupoAtual();
  const item = itens[itemIndex];
  const user = state.usuarios.find((u) => u.id === userId);

  marcarComoVisto(item.id);
  renderizarBarras();

  headerAvatarEl.innerHTML = "";
  headerAvatarEl.appendChild(criarAvatar(user));
  headerNomeEl.textContent = user ? user.name : "Usuário";
  headerTempoEl.textContent = tempoRelativo(item.createdAt);

  conteudoEl.innerHTML = "";

  if (item.video) {
    const video = document.createElement("video");
    video.className = "story-viewer-video";
    video.src = item.video;
    video.autoplay = true;
    video.playsInline = true;
    video.onended = () => navegar(1);
    conteudoEl.appendChild(video);
    iniciarBarraDeProgresso(true);
  } else {
    if (item.image) {
      const img = document.createElement("img");
      img.className = "story-viewer-imagem";
      img.src = item.image;
      img.alt = "";
      conteudoEl.appendChild(img);
    }

    if (item.text) {
      const texto = document.createElement("p");
      texto.className = "story-viewer-texto" + (item.image ? " story-viewer-texto-legenda" : "");
      texto.textContent = item.text;
      conteudoEl.appendChild(texto);
    }

    iniciarBarraDeProgresso(false);
  }
}

function iniciarBarraDeProgresso(controladoPeloVideo) {
  const preench = preenchimentoAtualEl();
  if (!preench) return;

  preench.style.transition = "none";
  preench.style.width = "0%";

  requestAnimationFrame(() => {
    preench.style.transition = `width ${DURACAO_ITEM_MS}ms linear`;
    preench.style.width = "100%";
  });

  if (!controladoPeloVideo) {
    timer = setTimeout(() => navegar(1), DURACAO_ITEM_MS);
  }
}

function navegar(direcao) {
  const [, itens] = grupoAtual();
  const novoItemIndex = itemIndex + direcao;

  if (novoItemIndex >= 0 && novoItemIndex < itens.length) {
    itemIndex = novoItemIndex;
    renderizarItemAtual();
    return;
  }

  const novoGrupoIndex = grupoIndex + direcao;
  if (novoGrupoIndex >= 0 && novoGrupoIndex < grupos.length) {
    grupoIndex = novoGrupoIndex;
    itemIndex = direcao > 0 ? 0 : grupos[grupoIndex][1].length - 1;
    renderizarItemAtual();
    return;
  }

  fecharVisualizador();
}

function fecharVisualizador() {
  pararTimer();
  overlay.classList.add("hidden");
  conteudoEl.innerHTML = "";
  if (aoFecharCallback) aoFecharCallback();
}
