const modalOverlay = document.getElementById("modal-overlay");
const modalClose = document.getElementById("modal-close");
const abrirModalBtns = document.querySelectorAll("[data-abrir-modal]");
const tabs = document.querySelectorAll(".tab");
const forms = document.querySelectorAll(".acesso-form");
const criarErro = document.getElementById("criar-erro");

function selecionarTab(nome) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === nome));
  forms.forEach((form) => form.classList.toggle("hidden", form.dataset.form !== nome));
}

function abrirModal(tab) {
  selecionarTab(tab);
  modalOverlay.classList.remove("hidden");
}

function fecharModal() {
  modalOverlay.classList.add("hidden");
}

abrirModalBtns.forEach((btn) => {
  btn.addEventListener("click", () => abrirModal(btn.dataset.abrirModal));
});

modalClose.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) fecharModal();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selecionarTab(tab.dataset.tab));
});

// Isso ainda não verifica senha (não existe autenticação ainda), só entra direto no feed:
document.querySelector('[data-form="entrar"]').addEventListener("submit", (e) => {
  e.preventDefault();
  window.location.href = "/app";
});

// Isso cria o usuário de verdade na API, e só então entra no feed:
document.querySelector('[data-form="criar"]').addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const botao = form.querySelector("button[type=submit]");
  const name = form.elements.name.value;
  const username = form.elements.username.value;

  criarErro.classList.add("hidden");
  botao.disabled = true;
  botao.textContent = "Criando...";

  try {
    const res = await fetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username }),
    });

    if (!res.ok) {
      const erro = await res.json();
      criarErro.textContent = erro.message || "Não foi possível criar sua conta.";
      criarErro.classList.remove("hidden");
      botao.disabled = false;
      botao.textContent = "Criar conta";
      return;
    }

    window.location.href = "/app";
  } catch (erro) {
    criarErro.textContent = "Não foi possível falar com o servidor.";
    criarErro.classList.remove("hidden");
    botao.disabled = false;
    botao.textContent = "Criar conta";
  }
});

// Isso dá vida ao post de exemplo, simulando reações chegando:
const likeCount = document.getElementById("like-count");
const typing = document.getElementById("typing");

if (likeCount) {
  setInterval(() => {
    likeCount.textContent = Number(likeCount.textContent) + 1;
  }, 4000);
}

if (typing) {
  setInterval(() => {
    typing.classList.toggle("visible");
  }, 3000);
}
