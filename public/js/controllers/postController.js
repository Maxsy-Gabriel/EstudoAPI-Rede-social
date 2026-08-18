import { state } from "../state.js";
import * as postModel from "../models/postModel.js";
import { mostrarMensagem } from "../utils/dom.js";
import { postsList } from "../elements.js";

export async function carregarFeed() {
  try {
    state.feed = await postModel.listarFeed(state.identidadeAtualId);
  } catch (erro) {
    console.error("Falha ao carregar o feed:", erro);
    mostrarMensagem(postsList, "Não foi possível carregar o feed.");
    return false;
  }

  return true;
}

export async function criarPost(userId, text, image, video) {
  await postModel.criarPost(userId, text, image, video);
}

export async function reagir(postId, userId, type) {
  await postModel.reagir(postId, userId, type);
}

export async function responder(postId, userId, text) {
  await postModel.responder(postId, userId, text);
}

export async function excluirPost(postId, adminId) {
  await postModel.excluirPost(postId, adminId);
}

export async function excluirComentario(postId, commentId, adminId) {
  await postModel.excluirComentario(postId, commentId, adminId);
}
