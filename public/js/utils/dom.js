import { iniciais } from "./format.js";

export function mostrarMensagem(lista, texto) {
  lista.innerHTML = "";
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = texto;
  lista.appendChild(li);
}

export function criarAvatar(user) {
  const wrap = document.createElement("span");
  wrap.className = "avatar-wrap";

  const avatar = document.createElement("span");
  avatar.className = user ? "avatar" : "avatar removed";

  if (user?.avatar) {
    avatar.classList.add("avatar-com-foto");
    const img = document.createElement("img");
    img.src = user.avatar;
    img.alt = "";
    avatar.appendChild(img);
  } else {
    avatar.textContent = user ? iniciais(user.name) : "?";
  }

  wrap.appendChild(avatar);

  if (user?.online) {
    const bolinha = document.createElement("span");
    bolinha.className = "status-dot";
    bolinha.setAttribute("aria-label", "Online");
    wrap.appendChild(bolinha);
  }

  return wrap;
}
