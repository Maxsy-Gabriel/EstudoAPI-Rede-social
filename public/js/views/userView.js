import { state } from "../state.js";
import { usersList, identityCard, composerAvatar, postText, postsForm } from "../elements.js";
import { criarAvatar } from "../utils/dom.js";
import { iniciais } from "../utils/format.js";

export function renderPeopleList() {
  usersList.innerHTML = "";

  if (state.usuarios.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nenhuma pessoa cadastrada ainda.";
    usersList.appendChild(li);
    return;
  }

  state.usuarios.forEach((user) => {
    const li = document.createElement("li");
    li.className = "person" + (user.id === state.identidadeAtualId ? " active" : "");

    const info = document.createElement("div");
    info.className = "person-info";

    const nome = document.createElement("span");
    nome.className = "person-name";
    nome.textContent = user.name;

    const handle = document.createElement("span");
    handle.className = "person-handle";
    handle.textContent = `@${user.username}`;

    info.append(nome, handle);
    li.append(criarAvatar(user), info);
    usersList.appendChild(li);
  });
}

export function renderIdentity() {
  const user = state.usuarios.find((u) => u.id === state.identidadeAtualId) || null;

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
