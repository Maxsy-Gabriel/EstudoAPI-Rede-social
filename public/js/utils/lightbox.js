// Isso cria (uma única vez) o overlay usado pra ver a foto de um post em tamanho maior:
let overlay = null;
let imgEl = null;

function criarOverlay() {
  overlay = document.createElement("div");
  overlay.className = "lightbox-overlay hidden";

  imgEl = document.createElement("img");
  imgEl.className = "lightbox-img";
  imgEl.alt = "";

  const fecharBtn = document.createElement("button");
  fecharBtn.type = "button";
  fecharBtn.className = "lightbox-fechar";
  fecharBtn.setAttribute("aria-label", "Fechar");
  fecharBtn.textContent = "×";
  fecharBtn.onclick = fecharLightbox;

  overlay.append(imgEl, fecharBtn);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharLightbox();
  });

  document.body.appendChild(overlay);
}

export function abrirLightbox(src) {
  if (!overlay) criarOverlay();
  imgEl.src = src;
  overlay.classList.remove("hidden");
}

function fecharLightbox() {
  overlay.classList.add("hidden");
}
