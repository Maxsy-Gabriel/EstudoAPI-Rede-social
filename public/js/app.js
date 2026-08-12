import { state } from "./state.js";
import { usersList, usersForm, postsList, postsForm, postText } from "./elements.js";
import { mostrarMensagem } from "./utils/dom.js";
import * as userController from "./controllers/userController.js";
import * as postController from "./controllers/postController.js";
import { renderPeopleList, renderIdentity } from "./views/userView.js";
import { renderFeed } from "./views/postView.js";

async function atualizarUsuarios() {
  const ok = await userController.carregarUsuarios();
  if (ok) {
    renderPeopleList(selecionarIdentidade, excluirUsuario);
    renderIdentity();
  }
}

async function atualizarFeed() {
  const ok = await postController.carregarFeed();
  if (ok) {
    renderFeed(reagir, responder, toggleComments);
  }
}

function selecionarIdentidade(id) {
  state.identidadeAtualId = id;
  renderPeopleList(selecionarIdentidade, excluirUsuario);
  renderIdentity();
  renderFeed(reagir, responder, toggleComments);
}

async function excluirUsuario(id) {
  await userController.deletarUsuario(id);
  await atualizarUsuarios();
  await atualizarFeed();
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

usersForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const botao = usersForm.querySelector("button");
  const name = document.getElementById("user-name").value;
  const username = document.getElementById("user-username").value;

  botao.disabled = true;
  botao.textContent = "Adicionando...";
  await userController.criarUsuario(name, username);
  await atualizarUsuarios();
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
