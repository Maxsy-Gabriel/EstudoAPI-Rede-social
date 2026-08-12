import { state } from "../state.js";
import * as userModel from "../models/userModel.js";
import { mostrarMensagem } from "../utils/dom.js";
import { usersList } from "../elements.js";
import { logout } from "../auth.js";

export async function carregarUsuarios() {
  try {
    state.usuarios = await userModel.listarUsuarios();
  } catch (erro) {
    console.error("Falha ao carregar usuários:", erro);
    mostrarMensagem(usersList, "Não foi possível carregar os usuários.");
    return false;
  }

  // Isso desloga o usuário se a conta dele não existir mais:
  if (state.identidadeAtualId && !state.usuarios.some((u) => u.id === state.identidadeAtualId)) {
    logout();
    return false;
  }

  return true;
}
