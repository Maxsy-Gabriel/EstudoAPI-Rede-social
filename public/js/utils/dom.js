import { iniciais } from "./format.js";

export function mostrarMensagem(lista, texto) {
  lista.innerHTML = "";
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = texto;
  lista.appendChild(li);
}

export function criarAvatar(user) {
  const avatar = document.createElement("span");
  avatar.className = user ? "avatar" : "avatar removed";
  avatar.textContent = user ? iniciais(user.name) : "?";
  return avatar;
}
