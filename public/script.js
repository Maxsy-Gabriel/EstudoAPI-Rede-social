const usersList = document.getElementById("users-list");
const usersForm = document.getElementById("users-form");
const postsList = document.getElementById("posts-list");
const postsForm = document.getElementById("posts-form");
const identityCard = document.getElementById("identity-card");
const composerAvatar = document.getElementById("composer-avatar");
const postText = document.getElementById("post-text");

let usuariosCache = [];
let feedCache = [];
let identidadeAtualId = null;
const comentariosAbertos = new Set();

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : partes[0].slice(0, 2);
  return letras.toUpperCase();
}

function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tempoRelativo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutos = Math.floor(diffMs / 60000);

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos}min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;

  return formatarData(iso);
}

function mostrarMensagem(lista, texto) {
  lista.innerHTML = "";
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = texto;
  lista.appendChild(li);
}

function criarAvatar(user) {
  const avatar = document.createElement("span");
  avatar.className = user ? "avatar" : "avatar removed";
  avatar.textContent = user ? iniciais(user.name) : "?";
  return avatar;
}

// ---------- pessoas ----------

async function carregarUsuarios() {
  try {
    const res = await fetch("/users");
    usuariosCache = await res.json();
  } catch (erro) {
    console.error("Falha ao carregar usuários:", erro);
    mostrarMensagem(usersList, "Não foi possível carregar os usuários.");
    return;
  }

  if (identidadeAtualId && !usuariosCache.some((u) => u.id === identidadeAtualId)) {
    identidadeAtualId = null;
  }
  if (!identidadeAtualId && usuariosCache.length > 0) {
    identidadeAtualId = usuariosCache[0].id;
  }

  renderPeopleList();
  renderIdentity();
}

function renderPeopleList() {
  usersList.innerHTML = "";

  if (usuariosCache.length === 0) {
    mostrarMensagem(usersList, "Nenhuma pessoa cadastrada ainda.");
    return;
  }

  usuariosCache.forEach((user) => {
    const li = document.createElement("li");
    li.className = "person" + (user.id === identidadeAtualId ? " active" : "");
    li.onclick = () => selecionarIdentidade(user.id);

    const info = document.createElement("div");
    info.className = "person-info";

    const nome = document.createElement("span");
    nome.className = "person-name";
    nome.textContent = user.name;

    const handle = document.createElement("span");
    handle.className = "person-handle";
    handle.textContent = `@${user.username}`;

    info.append(nome, handle);

    const btnDeletar = document.createElement("button");
    btnDeletar.className = "remove-btn";
    btnDeletar.textContent = "×";
    btnDeletar.setAttribute("aria-label", `Remover ${user.name}`);
    btnDeletar.onclick = (e) => {
      e.stopPropagation();
      deletarUsuario(user.id);
    };

    li.append(criarAvatar(user), info, btnDeletar);
    usersList.appendChild(li);
  });
}

function renderIdentity() {
  const user = usuariosCache.find((u) => u.id === identidadeAtualId) || null;

  identityCard.innerHTML = "";
  if (!user) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Escolha alguém em Pessoas.";
    identityCard.appendChild(vazio);
  } else {
    const info = document.createElement("div");
    info.className = "person-info";

    const nome = document.createElement("span");
    nome.className = "person-name";
    nome.textContent = user.name;

    const handle = document.createElement("span");
    handle.className = "person-handle";
    handle.textContent = `@${user.username}`;

    info.append(nome, handle);
    identityCard.append(criarAvatar(user), info);
  }

  composerAvatar.className = user ? "avatar" : "avatar removed";
  composerAvatar.textContent = user ? iniciais(user.name) : "?";
  postText.disabled = !user;
  postText.placeholder = user ? "O que você está pensando?" : "Escolha alguém em Pessoas para postar";
  postsForm.querySelector("button").disabled = !user;
}

function selecionarIdentidade(id) {
  identidadeAtualId = id;
  renderPeopleList();
  renderIdentity();
  renderFeed();
}

async function criarUsuario(name, username) {
  await fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username }),
  });
  await carregarUsuarios();
}

async function deletarUsuario(id) {
  await fetch(`/users/${id}`, { method: "DELETE" });
  await carregarUsuarios();
  await carregarFeed();
}

// ---------- feed ----------

async function carregarFeed() {
  try {
    const res = await fetch("/feed");
    feedCache = await res.json();
  } catch (erro) {
    console.error("Falha ao carregar o feed:", erro);
    mostrarMensagem(postsList, "Não foi possível carregar o feed.");
    return;
  }
  renderFeed();
}

function renderFeed() {
  postsList.innerHTML = "";

  if (feedCache.length === 0) {
    mostrarMensagem(postsList, "Ainda não há posts. Publique algo!");
    return;
  }

  const maisRecentesPrimeiro = [...feedCache].reverse();
  maisRecentesPrimeiro.forEach((post) => postsList.appendChild(criarCardDePost(post)));
}

function criarCardDePost(post) {
  const li = document.createElement("li");
  li.className = "post";

  const row = document.createElement("div");
  row.className = "post-row";

  const body = document.createElement("div");
  body.className = "post-body";

  const head = document.createElement("div");
  head.className = "post-head";

  const nome = document.createElement("span");
  nome.className = "post-name";
  nome.textContent = post.user ? post.user.name : "Usuário removido";

  const hora = document.createElement("span");
  hora.className = "post-time";
  hora.textContent = tempoRelativo(post.createdAt);

  head.append(nome, hora);

  const texto = document.createElement("p");
  texto.className = "post-text";
  texto.textContent = post.text;

  body.append(head, texto, criarAcoes(post), criarComentarios(post));
  row.append(criarAvatar(post.user), body);
  li.appendChild(row);

  return li;
}

function criarAcoes(post) {
  const minhaReacao = post.reactions.find((r) => r.userId === identidadeAtualId);

  const acoes = document.createElement("div");
  acoes.className = "post-actions";

  const btnLike = document.createElement("button");
  btnLike.className = "reaction-btn" + (minhaReacao?.type === "like" ? " active" : "");
  btnLike.textContent = `▲ ${post.likes}`;
  btnLike.disabled = !identidadeAtualId;
  btnLike.onclick = () => reagir(post.id, "like");

  const btnDislike = document.createElement("button");
  btnDislike.className = "reaction-btn" + (minhaReacao?.type === "dislike" ? " active" : "");
  btnDislike.textContent = `▼ ${post.dislikes}`;
  btnDislike.disabled = !identidadeAtualId;
  btnDislike.onclick = () => reagir(post.id, "dislike");

  const btnComentarios = document.createElement("button");
  btnComentarios.className = "comments-toggle";
  const total = post.comments.length;
  btnComentarios.textContent = `${total} resposta${total === 1 ? "" : "s"}`;
  btnComentarios.onclick = () => toggleComments(post.id);

  acoes.append(btnLike, btnDislike, btnComentarios);
  return acoes;
}

function criarComentarios(post) {
  const wrapper = document.createElement("div");
  wrapper.className = "comments" + (comentariosAbertos.has(post.id) ? "" : " hidden");
  wrapper.id = `comments-${post.id}`;

  if (post.comments.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Nenhuma resposta ainda.";
    wrapper.appendChild(vazio);
  } else {
    const lista = document.createElement("ul");
    lista.className = "comment-list";

    post.comments.forEach((c) => {
      const autor = usuariosCache.find((u) => u.id === c.userId);

      const item = document.createElement("li");
      item.className = "comment-item";

      const nomeAutor = document.createElement("span");
      nomeAutor.className = autor ? "comment-author" : "comment-author removed";
      nomeAutor.textContent = autor ? autor.name : "Usuário removido";

      const texto = document.createElement("span");
      texto.textContent = c.text;

      item.append(nomeAutor, texto);
      lista.appendChild(item);
    });

    wrapper.appendChild(lista);
  }

  const form = document.createElement("form");
  form.className = "comment-form";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = identidadeAtualId ? "Escreva uma resposta..." : "Escolha alguém em Pessoas";
  input.disabled = !identidadeAtualId;
  input.required = true;

  const botao = document.createElement("button");
  botao.type = "submit";
  botao.textContent = "Responder";
  botao.disabled = !identidadeAtualId;

  form.append(input, botao);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;

    botao.disabled = true;
    comentariosAbertos.add(post.id);
    await responder(post.id, texto);
  });

  wrapper.appendChild(form);
  return wrapper;
}

function toggleComments(postId) {
  if (comentariosAbertos.has(postId)) {
    comentariosAbertos.delete(postId);
  } else {
    comentariosAbertos.add(postId);
  }
  renderFeed();
}

async function criarPost(text) {
  await fetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: identidadeAtualId, text }),
  });
  await carregarFeed();
}

async function reagir(postId, tipo) {
  if (!identidadeAtualId) return;
  await fetch(`/posts/${postId}/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: identidadeAtualId, type: tipo }),
  });
  await carregarFeed();
}

async function responder(postId, texto) {
  if (!identidadeAtualId) return;
  await fetch(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: identidadeAtualId, text: texto }),
  });
  await carregarFeed();
}

// ---------- formulários ----------

usersForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const botao = usersForm.querySelector("button");
  const name = document.getElementById("user-name").value;
  const username = document.getElementById("user-username").value;

  botao.disabled = true;
  botao.textContent = "Adicionando...";
  await criarUsuario(name, username);
  usersForm.reset();
  botao.disabled = false;
  botao.textContent = "Adicionar";
});

postsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const botao = postsForm.querySelector("button");
  const text = postText.value;

  botao.disabled = true;
  botao.textContent = "Postando...";
  await criarPost(text);
  postsForm.reset();
  botao.disabled = false;
  botao.textContent = "Postar";
});

async function iniciar() {
  mostrarMensagem(usersList, "Carregando...");
  mostrarMensagem(postsList, "Carregando...");

  await carregarUsuarios();
  await carregarFeed();
}

iniciar();
