import { state } from "./state.js";
import { usersList, postsList, postsForm, postText, logoutBtn, adminLink, perfilLink } from "./elements.js";
import { mostrarMensagem, criarAvatar } from "./utils/dom.js";
import { getUsuarioLogado, logout, iniciarHeartbeat } from "./auth.js";
import * as userController from "./controllers/userController.js";
import * as postController from "./controllers/postController.js";
import { renderPeopleList, renderIdentity } from "./views/userView.js";
import { renderFeed } from "./views/postView.js";

// Isso trava a identidade do usuário na conta com que ele fez login (o guard.js já barrou quem não está logado):
const usuarioLogado = getUsuarioLogado();
if (usuarioLogado) {
  state.identidadeAtualId = usuarioLogado.id;
  if (usuarioLogado.role === "admin") {
    state.isAdmin = true;
    adminLink.classList.remove("hidden");
  }
  perfilLink.appendChild(criarAvatar(usuarioLogado));
}
iniciarHeartbeat(usuarioLogado);

async function atualizarUsuarios() {
  const ok = await userController.carregarUsuarios();
  if (ok) {
    renderPeopleList();
    renderIdentity();
  }
}

async function atualizarFeed() {
  const ok = await postController.carregarFeed();
  if (ok) {
    renderFeed(reagir, responder, toggleComments, excluirPost, excluirComentario);
  }
}

async function publicarPost(text) {
  await postController.criarPost(state.identidadeAtualId, text);
  await atualizarFeed();
}

// Isso atualiza a reação na tela na hora, sem esperar o servidor nem recarregar o feed inteiro:
function aplicarReacaoOtimista(post, tipo) {
  const minhaReacao = post.reactions.find((r) => r.userId === state.identidadeAtualId);

  if (minhaReacao) {
    if (minhaReacao.type === tipo) return;
    if (minhaReacao.type === "like") post.likes--;
    if (minhaReacao.type === "dislike") post.dislikes--;
    minhaReacao.type = tipo;
  } else {
    post.reactions.push({ postId: post.id, userId: state.identidadeAtualId, type: tipo });
  }

  if (tipo === "like") post.likes++;
  if (tipo === "dislike") post.dislikes++;
}

async function reagir(postId, tipo) {
  if (!state.identidadeAtualId) return;

  const post = state.feed.find((p) => p.id === postId);
  if (!post) return;

  aplicarReacaoOtimista(post, tipo);
  renderFeed(reagir, responder, toggleComments, excluirPost, excluirComentario);

  try {
    await postController.reagir(postId, state.identidadeAtualId, tipo);
  } catch (erro) {
    console.error("Falha ao reagir:", erro);
    await atualizarFeed();
  }
}

// Isso adiciona o comentário na tela na hora, sem esperar o servidor nem recarregar o feed inteiro:
function aplicarComentarioOtimista(post, texto) {
  post.comments.push({
    id: `otimista-${Date.now()}`,
    postId: post.id,
    userId: state.identidadeAtualId,
    text: texto,
    createdAt: new Date().toISOString(),
  });
}

async function responder(postId, texto) {
  if (!state.identidadeAtualId) return;

  const post = state.feed.find((p) => p.id === postId);
  if (!post) return;

  aplicarComentarioOtimista(post, texto);
  state.comentariosAbertos.add(postId);
  renderFeed(reagir, responder, toggleComments, excluirPost, excluirComentario);

  try {
    await postController.responder(postId, state.identidadeAtualId, texto);
  } catch (erro) {
    console.error("Falha ao comentar:", erro);
    await atualizarFeed();
  }
}

function toggleComments(postId) {
  if (state.comentariosAbertos.has(postId)) {
    state.comentariosAbertos.delete(postId);
  } else {
    state.comentariosAbertos.add(postId);
  }
  renderFeed(reagir, responder, toggleComments, excluirPost, excluirComentario);
}

async function excluirPost(postId) {
  if (!window.confirm("Excluir este post? Isso não pode ser desfeito.")) return;
  await postController.excluirPost(postId, usuarioLogado.id);
  await atualizarFeed();
}

async function excluirComentario(postId, commentId) {
  if (!window.confirm("Excluir este comentário? Isso não pode ser desfeito.")) return;
  await postController.excluirComentario(postId, commentId, usuarioLogado.id);
  await atualizarFeed();
}

logoutBtn.addEventListener("click", logout);

postsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const botao = postsForm.querySelector("button");
  const text = postText.value;

  botao.disabled = true;
  botao.textContent = "Postando...";
  await publicarPost(text);
  postsForm.reset();
  botao.disabled = false;
  botao.textContent = "Postar";
});

async function iniciar() {
  mostrarMensagem(usersList, "Carregando...");
  mostrarMensagem(postsList, "Carregando...");

  await atualizarUsuarios();
  await atualizarFeed();
}

iniciar();
