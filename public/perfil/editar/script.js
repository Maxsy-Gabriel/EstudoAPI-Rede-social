import { getUsuarioLogado, logout, iniciarHeartbeat, salvarUsuarioLogado } from "../../js/auth.js";
import { iniciais } from "../../js/utils/format.js";
import { criarAvatar } from "../../js/utils/dom.js";
import { iniciarChat } from "../../js/chat.js";

const usuarioLogado = getUsuarioLogado();
const adminLink = document.getElementById("admin-link");
const perfilLink = document.getElementById("perfil-link");
const logoutBtn = document.getElementById("logout-btn");

const avatarPreview = document.getElementById("avatar-preview");
const trocarFotoBtn = document.getElementById("trocar-foto-btn");
const avatarInput = document.getElementById("avatar-input");

const perfilForm = document.getElementById("perfil-form");
const nameInput = document.getElementById("perfil-name");
const usernameInput = document.getElementById("perfil-username");
const sobreInput = document.getElementById("perfil-sobre");
const idadeInput = document.getElementById("perfil-idade");
const estadoCivilInput = document.getElementById("perfil-estado-civil");
const perfilErro = document.getElementById("perfil-erro");
const perfilSucesso = document.getElementById("perfil-sucesso");

const senhaForm = document.getElementById("senha-form");
const senhaErro = document.getElementById("senha-erro");
const senhaSucesso = document.getElementById("senha-sucesso");

let avatarAtual = null;

function mostrarAvatar(usuario) {
  avatarPreview.innerHTML = "";

  if (usuario.avatar) {
    avatarPreview.classList.add("avatar-com-foto");
    const img = document.createElement("img");
    img.src = usuario.avatar;
    img.alt = "";
    avatarPreview.appendChild(img);
  } else {
    avatarPreview.classList.remove("avatar-com-foto");
    avatarPreview.textContent = iniciais(usuario.name);
  }
}

// Isso usa sempre o dado fresco do banco (não o que ficou salvo no localStorage) pro topnav:
async function atualizarTopnav() {
  const res = await fetch(`/users/${usuarioLogado.id}`);
  if (!res.ok) return;

  const eu = await res.json();
  if (eu.role === "admin") {
    adminLink.classList.remove("hidden");
  }

  perfilLink.innerHTML = "";
  perfilLink.appendChild(criarAvatar(eu));
}

async function carregarPerfil() {
  const res = await fetch(`/users/${usuarioLogado.id}`);
  const usuario = await res.json();

  avatarAtual = usuario.avatar || null;
  mostrarAvatar(usuario);
  nameInput.value = usuario.name || "";
  usernameInput.value = usuario.username || "";
  sobreInput.value = usuario.sobre || "";
  idadeInput.value = usuario.idade ?? "";
  estadoCivilInput.value = usuario.estado_civil || "";
}

// Isso recorta a imagem em quadrado e reduz o tamanho antes de mandar pro servidor:
function redimensionarImagem(file, tamanho = 256) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = tamanho;
        canvas.height = tamanho;
        const ctx = canvas.getContext("2d");

        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamanho, tamanho);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(file);
  });
}

trocarFotoBtn.addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;

  if (file.size > 8 * 1024 * 1024) {
    perfilErro.textContent = "Imagem muito grande (máximo 8MB).";
    perfilErro.classList.remove("hidden");
    return;
  }

  try {
    avatarAtual = await redimensionarImagem(file);
    mostrarAvatar({ name: nameInput.value, avatar: avatarAtual });
    perfilErro.classList.add("hidden");
  } catch (erro) {
    perfilErro.textContent = "Não foi possível processar essa imagem.";
    perfilErro.classList.remove("hidden");
  }
});

perfilForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  perfilErro.classList.add("hidden");
  perfilSucesso.classList.add("hidden");

  const botao = perfilForm.querySelector("button[type=submit]");
  botao.disabled = true;

  try {
    const res = await fetch(`/users/${usuarioLogado.id}/perfil`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-User-Id": usuarioLogado.id },
      body: JSON.stringify({
        name: nameInput.value,
        sobre: sobreInput.value,
        idade: idadeInput.value,
        estadoCivil: estadoCivilInput.value,
        avatar: avatarAtual,
      }),
    });

    if (!res.ok) {
      const erro = await res.json();
      perfilErro.textContent = erro.message || "Não foi possível salvar o perfil.";
      perfilErro.classList.remove("hidden");
      return;
    }

    const usuarioAtualizado = await res.json();
    salvarUsuarioLogado(usuarioAtualizado);
    perfilLink.innerHTML = "";
    perfilLink.appendChild(criarAvatar(usuarioAtualizado));
    perfilSucesso.classList.remove("hidden");
  } catch (erro) {
    perfilErro.textContent = "Não foi possível falar com o servidor.";
    perfilErro.classList.remove("hidden");
  } finally {
    botao.disabled = false;
  }
});

senhaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  senhaErro.classList.add("hidden");
  senhaSucesso.classList.add("hidden");

  const senhaAtual = document.getElementById("senha-atual").value;
  const novaSenha = document.getElementById("nova-senha").value;
  const confirmarSenha = document.getElementById("confirmar-senha").value;

  if (novaSenha !== confirmarSenha) {
    senhaErro.textContent = "A confirmação não bate com a nova senha.";
    senhaErro.classList.remove("hidden");
    return;
  }

  const botao = senhaForm.querySelector("button[type=submit]");
  botao.disabled = true;

  try {
    const res = await fetch(`/users/${usuarioLogado.id}/senha`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-User-Id": usuarioLogado.id },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });

    if (!res.ok) {
      const erro = await res.json();
      senhaErro.textContent = erro.message || "Não foi possível trocar a senha.";
      senhaErro.classList.remove("hidden");
      return;
    }

    senhaForm.reset();
    senhaSucesso.classList.remove("hidden");
  } catch (erro) {
    senhaErro.textContent = "Não foi possível falar com o servidor.";
    senhaErro.classList.remove("hidden");
  } finally {
    botao.disabled = false;
  }
});

logoutBtn.addEventListener("click", logout);
iniciarHeartbeat(usuarioLogado);
iniciarChat(usuarioLogado);
atualizarTopnav();
carregarPerfil();
