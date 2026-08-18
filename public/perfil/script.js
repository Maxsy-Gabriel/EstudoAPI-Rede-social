import { getUsuarioLogado, iniciarHeartbeat } from "../js/auth.js";
import { iniciais, tempoRelativo } from "../js/utils/format.js";
import { criarAvatar } from "../js/utils/dom.js";
import { iniciarChat } from "../js/chat.js";
import { abrirLightbox } from "../js/utils/lightbox.js";

const ESTADOS_CIVIS = {
  solteiro: "Solteiro(a)",
  namorando: "Namorando",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
};

const usuarioLogado = getUsuarioLogado();
const idParam = Number(new URLSearchParams(window.location.search).get("id"));
const perfilId = idParam || usuarioLogado.id;
const ehMeuPerfil = perfilId === usuarioLogado.id;

const adminLink = document.getElementById("admin-link");
const perfilLink = document.getElementById("perfil-link");
const editarLink = document.getElementById("editar-link");
const seguirBtn = document.getElementById("seguir-btn");

const avatarPreview = document.getElementById("avatar-preview");
const usernameTitulo = document.getElementById("perfil-username");
const nomeEl = document.getElementById("perfil-nome");
const totalPostsEl = document.getElementById("perfil-total-posts");
const seguidoresEl = document.getElementById("perfil-seguidores");
const seguindoEl = document.getElementById("perfil-seguindo");
const sobreEl = document.getElementById("perfil-sobre-texto");
const detalhesEl = document.getElementById("perfil-detalhes");
const postsList = document.getElementById("perfil-posts");

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

async function carregarPerfil() {
  const res = await fetch(`/users/${perfilId}`);

  if (!res.ok) {
    usernameTitulo.textContent = "Perfil não encontrado";
    return;
  }

  const usuario = await res.json();

  mostrarAvatar(usuario);
  usernameTitulo.textContent = `@${usuario.username}`;
  nomeEl.textContent = usuario.name;

  if (usuario.sobre) {
    sobreEl.textContent = usuario.sobre;
    sobreEl.classList.remove("hidden");
  }

  const detalhes = [];
  if (usuario.idade) detalhes.push(`${usuario.idade} anos`);
  if (usuario.estado_civil) detalhes.push(ESTADOS_CIVIS[usuario.estado_civil] || usuario.estado_civil);
  if (detalhes.length > 0) {
    detalhesEl.textContent = detalhes.join(" · ");
    detalhesEl.classList.remove("hidden");
  }

  if (ehMeuPerfil) {
    editarLink.classList.remove("hidden");
  }
}

function criarItemPost(post) {
  const li = document.createElement("li");
  li.className = "post";

  const meta = document.createElement("div");
  meta.className = "post-meta";

  const tempo = document.createElement("span");
  tempo.textContent = tempoRelativo(post.createdAt);

  const reacoes = document.createElement("span");
  reacoes.textContent = `▲ ${post.likes}   ▼ ${post.dislikes}`;

  const comentarios = document.createElement("span");
  const total = post.comments.length;
  comentarios.textContent = `${total} resposta${total === 1 ? "" : "s"}`;

  meta.append(tempo, reacoes, comentarios);

  if (post.text) {
    const texto = document.createElement("p");
    texto.className = "post-text";
    texto.textContent = post.text;
    li.appendChild(texto);
  }

  if (post.image) {
    const imagem = document.createElement("img");
    imagem.className = "post-image";
    imagem.src = post.image;
    imagem.alt = "";
    imagem.onclick = () => abrirLightbox(post.image);
    li.appendChild(imagem);
  }

  if (post.hasVideo) {
    const video = document.createElement("video");
    video.className = "post-video";
    video.src = `/posts/${post.id}/video`;
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    li.appendChild(video);
  }

  li.appendChild(meta);
  return li;
}

async function carregarPosts() {
  const res = await fetch("/feed");
  const feed = await res.json();
  const posts = feed.filter((post) => post.user && post.user.id === perfilId).reverse();

  totalPostsEl.textContent = posts.length;
  postsList.innerHTML = "";

  if (posts.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "empty";
    vazio.textContent = "Ainda não publicou nada.";
    postsList.appendChild(vazio);
    return;
  }

  posts.forEach((post) => postsList.appendChild(criarItemPost(post)));
}

function atualizarBotaoSeguir(seguindo) {
  seguirBtn.textContent = seguindo ? "Deixar de seguir" : "Seguir";
  seguirBtn.classList.toggle("btn-primary", !seguindo);
  seguirBtn.classList.toggle("btn-ghost", seguindo);
  seguirBtn.dataset.seguindo = seguindo ? "true" : "false";
}

async function carregarSeguidores() {
  const res = await fetch(`/users/${perfilId}/seguidores`, {
    headers: { "X-User-Id": usuarioLogado.id },
  });
  if (!res.ok) return;

  const dados = await res.json();
  seguidoresEl.textContent = dados.followersCount;
  seguindoEl.textContent = dados.followingCount;

  if (!ehMeuPerfil) {
    seguirBtn.classList.remove("hidden");
    atualizarBotaoSeguir(dados.isFollowing);
  }
}

let seguirEmAndamento = false;

seguirBtn.addEventListener("click", async () => {
  if (seguirEmAndamento) return;
  seguirEmAndamento = true;

  const seguindoAgora = seguirBtn.dataset.seguindo === "true";
  const novoEstado = !seguindoAgora;

  // Isso muda o botão e o contador na hora, sem esperar o servidor confirmar:
  atualizarBotaoSeguir(novoEstado);
  seguidoresEl.textContent = Math.max(0, Number(seguidoresEl.textContent) + (novoEstado ? 1 : -1));

  try {
    const res = await fetch(`/users/${perfilId}/seguir`, {
      method: seguindoAgora ? "DELETE" : "POST",
      headers: { "X-User-Id": usuarioLogado.id },
    });

    if (!res.ok) throw new Error("Falha ao seguir/deixar de seguir");

    const dados = await res.json();
    seguidoresEl.textContent = dados.followersCount;
    seguindoEl.textContent = dados.followingCount;
    atualizarBotaoSeguir(dados.isFollowing);
  } catch (erro) {
    console.error(erro);
    // Se der erro, desfaz a mudança otimista e busca o estado real de novo:
    atualizarBotaoSeguir(seguindoAgora);
    await carregarSeguidores();
  } finally {
    seguirEmAndamento = false;
  }
});

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

iniciarHeartbeat(usuarioLogado);
iniciarChat(usuarioLogado);
atualizarTopnav();
carregarPerfil();
carregarPosts();
carregarSeguidores();
