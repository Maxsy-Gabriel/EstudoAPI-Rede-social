import { state } from "../state.js";
import * as userModel from "../models/userModel.js";
import { mostrarMensagem } from "../utils/dom.js";
import { usersList } from "../elements.js";

export async function carregarUsuarios() {
  try {
    state.usuarios = await userModel.listarUsuarios();
  } catch (erro) {
    console.error("Falha ao carregar usuários:", erro);
    mostrarMensagem(usersList, "Não foi possível carregar os usuários.");
    return false;
  }

  if (state.identidadeAtualId && !state.usuarios.some((u) => u.id === state.identidadeAtualId)) {
    state.identidadeAtualId = null;
  }
  if (!state.identidadeAtualId && state.usuarios.length > 0) {
    state.identidadeAtualId = state.usuarios[0].id;
  }

  return true;
}

export async function criarUsuario(name, username) {
  await userModel.criarUsuario(name, username);
}

export async function deletarUsuario(id) {
  await userModel.deletarUsuario(id);
}
