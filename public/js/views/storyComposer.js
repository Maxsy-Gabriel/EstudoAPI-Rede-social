import { redimensionarParaPost } from "../utils/imagem.js";
import { lerDuracaoDoVideo, arquivoParaDataUri } from "../utils/video.js";
import { criarStory } from "../controllers/storyController.js";

const DURACAO_MAXIMA_VIDEO_SEGUNDOS = 30;
const TAMANHO_MAXIMO_VIDEO_BYTES = 20 * 1024 * 1024;

let overlay = null;
let textoEl = null;
let previewEl = null;
let previewImgEl = null;
let previewVideoEl = null;
let imagemInput = null;
let videoInput = null;

let imagemSelecionada = null;
let videoSelecionado = null;
let usuarioIdAtual = null;
let aoPostarCallback = null;

function criarIconeImagem() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.innerHTML =
    '<rect x="2.5" y="4" width="15" height="12" rx="2.5" />' +
    '<circle cx="7" cy="8.5" r="1.3" fill="currentColor" stroke="none" />' +
    '<path d="M4 14.5 8 10.5 11 13 14 10 16.5 12.5" />';
  return svg;
}

function criarIconeVideo() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.innerHTML =
    '<rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />' +
    '<path d="M8.5 7.3 13 10l-4.5 2.7V7.3Z" fill="currentColor" stroke="none" />';
  return svg;
}

function criarOverlay() {
  overlay = document.createElement("div");
  overlay.className = "story-composer-overlay hidden";

  const card = document.createElement("div");
  card.className = "story-composer-card";

  const cabecalho = document.createElement("div");
  cabecalho.className = "story-composer-cabecalho";

  const titulo = document.createElement("h2");
  titulo.className = "story-composer-titulo";
  titulo.textContent = "Novo status";

  const fecharBtn = document.createElement("button");
  fecharBtn.type = "button";
  fecharBtn.className = "story-composer-fechar";
  fecharBtn.textContent = "×";
  fecharBtn.setAttribute("aria-label", "Fechar");
  fecharBtn.onclick = fecharComposer;

  cabecalho.append(titulo, fecharBtn);

  textoEl = document.createElement("textarea");
  textoEl.className = "story-composer-texto";
  textoEl.placeholder = "Escreva algo para o seu status...";
  textoEl.rows = 3;

  previewEl = document.createElement("div");
  previewEl.className = "story-composer-preview hidden";

  previewImgEl = document.createElement("img");
  previewImgEl.className = "hidden";
  previewImgEl.alt = "";

  previewVideoEl = document.createElement("video");
  previewVideoEl.className = "hidden";
  previewVideoEl.muted = true;
  previewVideoEl.controls = true;

  const removerPreviewBtn = document.createElement("button");
  removerPreviewBtn.type = "button";
  removerPreviewBtn.className = "story-composer-remover-preview";
  removerPreviewBtn.textContent = "×";
  removerPreviewBtn.setAttribute("aria-label", "Remover mídia");
  removerPreviewBtn.onclick = limparMidia;

  previewEl.append(previewImgEl, previewVideoEl, removerPreviewBtn);

  const acoes = document.createElement("div");
  acoes.className = "story-composer-acoes";

  const imagemBtn = document.createElement("button");
  imagemBtn.type = "button";
  imagemBtn.className = "composer-image-btn";
  imagemBtn.title = "Adicionar imagem";
  imagemBtn.appendChild(criarIconeImagem());

  imagemInput = document.createElement("input");
  imagemInput.type = "file";
  imagemInput.accept = "image/*";
  imagemInput.className = "hidden";
  imagemBtn.onclick = () => imagemInput.click();

  const videoBtn = document.createElement("button");
  videoBtn.type = "button";
  videoBtn.className = "composer-image-btn";
  videoBtn.title = "Adicionar vídeo (máx. 30s)";
  videoBtn.appendChild(criarIconeVideo());

  videoInput = document.createElement("input");
  videoInput.type = "file";
  videoInput.accept = "video/*";
  videoInput.className = "hidden";
  videoBtn.onclick = () => videoInput.click();

  const postarBtn = document.createElement("button");
  postarBtn.type = "button";
  postarBtn.className = "btn btn-primary";
  postarBtn.textContent = "Postar status";
  postarBtn.onclick = postar;

  acoes.append(imagemBtn, videoBtn, postarBtn);

  imagemInput.addEventListener("change", aoEscolherImagem);
  videoInput.addEventListener("change", aoEscolherVideo);

  card.append(cabecalho, textoEl, previewEl, acoes, imagemInput, videoInput);
  overlay.appendChild(card);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharComposer();
  });

  document.addEventListener("keydown", (e) => {
    if (overlay.classList.contains("hidden")) return;
    if (e.key === "Escape") fecharComposer();
  });

  document.body.appendChild(overlay);
}

async function aoEscolherImagem() {
  const file = imagemInput.files[0];
  if (!file) return;

  if (file.size > 8 * 1024 * 1024) {
    window.alert("Imagem muito grande (máximo 8MB).");
    imagemInput.value = "";
    return;
  }

  try {
    const dataUri = await redimensionarParaPost(file);
    limparMidia();
    imagemSelecionada = dataUri;
    previewImgEl.src = dataUri;
    previewImgEl.classList.remove("hidden");
    previewVideoEl.classList.add("hidden");
    previewEl.classList.remove("hidden");
  } catch (erro) {
    console.error("Falha ao processar imagem do status:", erro);
    window.alert("Não foi possível processar essa imagem.");
  } finally {
    imagemInput.value = "";
  }
}

async function aoEscolherVideo() {
  const file = videoInput.files[0];
  if (!file) return;

  if (file.size > TAMANHO_MAXIMO_VIDEO_BYTES) {
    window.alert("Vídeo muito grande (máximo 20MB).");
    videoInput.value = "";
    return;
  }

  try {
    const duracao = await lerDuracaoDoVideo(file);
    if (duracao > DURACAO_MAXIMA_VIDEO_SEGUNDOS) {
      window.alert("Vídeo muito longo (máximo 30 segundos).");
      return;
    }

    const dataUri = await arquivoParaDataUri(file);
    limparMidia();
    videoSelecionado = dataUri;
    previewVideoEl.src = dataUri;
    previewVideoEl.classList.remove("hidden");
    previewImgEl.classList.add("hidden");
    previewEl.classList.remove("hidden");
  } catch (erro) {
    console.error("Falha ao processar vídeo do status:", erro);
    window.alert("Não foi possível processar esse vídeo.");
  } finally {
    videoInput.value = "";
  }
}

function limparMidia() {
  imagemSelecionada = null;
  videoSelecionado = null;
  previewImgEl.src = "";
  previewVideoEl.src = "";
  previewEl.classList.add("hidden");
}

function postar() {
  const texto = textoEl.value.trim();
  if (!texto && !imagemSelecionada && !videoSelecionado) return;

  criarStory({ userId: usuarioIdAtual, text: texto, image: imagemSelecionada, video: videoSelecionado });
  fecharComposer();
  if (aoPostarCallback) aoPostarCallback();
}

function fecharComposer() {
  overlay.classList.add("hidden");
  textoEl.value = "";
  limparMidia();
}

export function abrirComposerDeStory(usuarioId, aoPostar) {
  if (!overlay) criarOverlay();
  usuarioIdAtual = usuarioId;
  aoPostarCallback = aoPostar || null;
  overlay.classList.remove("hidden");
  textoEl.focus();
}
