import { state } from "./state.js";
import { usersList, postsList, postsForm, postText, logoutBtn } from "./elements.js";
import { mostrarMensagem } from "./utils/dom.js";
import { getUsuarioLogado, logout } from "./auth.js";
import * as userController from "./controllers/userController.js";
import * as postController from "./controllers/postController.js";
import { renderPeopleList, renderIdentity } from "./views/userView.js";
import { renderFeed } from "./views/postView.js";

// Isso trava a identidade do usuário na conta com que ele fez login (o guard.js já barrou quem não está logado):
const usuarioLogado = getUsuarioLogado();
if (usuarioLogado) {
  state.identidadeAtualId = usuarioLogado.id;
}

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
    renderFeed(reagir, responder, toggleComments);
  }
}

async function publicarPost(text) {
  await postController.criarPost(state.identidadeAtualId, text);
  await atualizarFeed();
}

async function reagir(postId, tipo) {
  if (!state.identidadeAtualId) return;
  await postController.reagir(postId, state.identidadeAtualId, tipo);
  await atualizarFeed();
}

async function responder(postId, texto) {
  if (!state.identidadeAtualId) return;
  await postController.responder(postId, state.identidadeAtualId, texto);
  await atualizarFeed();
}

function toggleComments(postId) {
  if (state.comentariosAbertos.has(postId)) {
    state.comentariosAbertos.delete(postId);
  } else {
    state.comentariosAbertos.add(postId);
  }
  renderFeed(reagir, responder, toggleComments);
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
