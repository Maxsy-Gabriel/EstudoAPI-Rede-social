import { state } from "../state.js";
import { postsList } from "../elements.js";
import { mostrarMensagem, criarAvatar } from "../utils/dom.js";
import { tempoRelativo } from "../utils/format.js";

export function renderFeed(onReagir, onResponder, onToggleComments) {
  postsList.innerHTML = "";

  if (state.feed.length === 0) {
    mostrarMensagem(postsList, "Ainda não há posts. Publique algo!");
    return;
  }

  const maisRecentesPrimeiro = [...state.feed].reverse();
  maisRecentesPrimeiro.forEach((post) =>
    postsList.appendChild(criarCardDePost(post, onReagir, onResponder, onToggleComments))
  );
}

function criarCardDePost(post, onReagir, onResponder, onToggleComments) {
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

  body.append(
    head,
    texto,
    criarAcoes(post, onReagir, onToggleComments),
    criarComentarios(post, onResponder)
  );
  row.append(criarAvatar(post.user), body);
  li.appendChild(row);

  return li;
}

function criarAcoes(post, onReagir, onToggleComments) {
  const minhaReacao = post.reactions.find((r) => r.userId === state.identidadeAtualId);

  const acoes = document.createElement("div");
  acoes.className = "post-actions";

  const btnLike = document.createElement("button");
  btnLike.className = "reaction-btn" + (minhaReacao?.type === "like" ? " active" : "");
  btnLike.textContent = `▲ ${post.likes}`;
  btnLike.disabled = !state.identidadeAtualId;
  btnLike.onclick = () => onReagir(post.id, "like");

  const btnDislike = document.createElement("button");
  btnDislike.className = "reaction-btn" + (minhaReacao?.type === "dislike" ? " active" : "");
  btnDislike.textContent = `▼ ${post.dislikes}`;
  btnDislike.disabled = !state.identidadeAtualId;
  btnDislike.onclick = () => onReagir(post.id, "dislike");

  const btnComentarios = document.createElement("button");
  btnComentarios.className = "comments-toggle";
  const total = post.comments.length;
  btnComentarios.textContent = `${total} resposta${total === 1 ? "" : "s"}`;
  btnComentarios.onclick = () => onToggleComments(post.id);

  acoes.append(btnLike, btnDislike, btnComentarios);
  return acoes;
}

function criarComentarios(post, onResponder) {
  const wrapper = document.createElement("div");
  wrapper.className = "comments" + (state.comentariosAbertos.has(post.id) ? "" : " hidden");
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
      const autor = state.usuarios.find((u) => u.id === c.userId);

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
  input.placeholder = state.identidadeAtualId ? "Escreva uma resposta..." : "Escolha alguém em Pessoas";
  input.disabled = !state.identidadeAtualId;
  input.required = true;

  const botao = document.createElement("button");
  botao.type = "submit";
  botao.textContent = "Responder";
  botao.disabled = !state.identidadeAtualId;

  form.append(input, botao);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;

    botao.disabled = true;
    state.comentariosAbertos.add(post.id);
    await onResponder(post.id, texto);
  });

  wrapper.appendChild(form);
  return wrapper;
}
