import { state } from "../state.js";
import { storiesList } from "../elements.js";
import { criarAvatar } from "../utils/dom.js";
import { agruparPorUsuario, grupoTemNaoVisto } from "../controllers/storyController.js";

function usuarioPorId(id) {
  return state.usuarios.find((u) => u.id === id);
}

// onVer(grupoOrdenados, index) abre o visualizador; onCriar() abre o composer:
export function renderStories(onVer, onCriar) {
  storiesList.innerHTML = "";

  const grupos = agruparPorUsuario();
  const meuId = state.identidadeAtualId;
  const meusItens = grupos.get(meuId) || [];

  const outros = [...grupos.entries()]
    .filter(([userId]) => userId !== meuId)
    .sort(([, itensA], [, itensB]) => {
      const aNaoVisto = grupoTemNaoVisto(itensA);
      const bNaoVisto = grupoTemNaoVisto(itensB);
      if (aNaoVisto !== bNaoVisto) return aNaoVisto ? -1 : 1;
      return new Date(itensB.at(-1).createdAt) - new Date(itensA.at(-1).createdAt);
    });

  // Lista navegável no visualizador (eu primeiro, se eu tiver status ativo):
  const grupoOrdenados = meusItens.length > 0 ? [[meuId, meusItens], ...outros] : outros;

  storiesList.appendChild(criarBolhaPropria(meusItens, grupoOrdenados, onVer, onCriar));

  if (outros.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "stories-empty";
    vazio.textContent = "Sem status postado";
    storiesList.appendChild(vazio);
    return;
  }

  outros.forEach(([userId, itens]) => {
    const index = grupoOrdenados.findIndex(([id]) => id === userId);
    storiesList.appendChild(criarBolha(userId, itens, grupoOrdenados, index, onVer));
  });
}

function criarAvatarWrap(user) {
  const avatarWrap = document.createElement("span");
  avatarWrap.className = "story-bubble-avatar-wrap";

  const ring = document.createElement("span");
  ring.className = "story-ring";

  const inner = document.createElement("span");
  inner.className = "story-ring-inner";
  inner.appendChild(criarAvatar(user));

  ring.appendChild(inner);
  avatarWrap.appendChild(ring);
  return { avatarWrap, ring };
}

function criarBolhaPropria(meusItens, grupoOrdenados, onVer, onCriar) {
  const user = usuarioPorId(state.identidadeAtualId);
  const li = document.createElement("li");

  const bubble = document.createElement("div");
  bubble.className = "story-bubble";

  const { avatarWrap, ring } = criarAvatarWrap(user);
  ring.classList.add("self");

  const hitBtn = document.createElement("button");
  hitBtn.type = "button";
  hitBtn.className = "story-bubble-hit";
  hitBtn.setAttribute("aria-label", meusItens.length > 0 ? "Ver seu status" : "Adicionar status");
  hitBtn.onclick = () => {
    if (meusItens.length > 0) onVer(grupoOrdenados, 0);
    else onCriar();
  };

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "story-add-badge";
  addBtn.textContent = "+";
  addBtn.setAttribute("aria-label", "Adicionar novo status");
  addBtn.onclick = (e) => {
    e.stopPropagation();
    onCriar();
  };

  avatarWrap.append(hitBtn, addBtn);

  const nome = document.createElement("span");
  nome.className = "story-name";
  nome.textContent = "Seu status";

  bubble.append(avatarWrap, nome);
  li.appendChild(bubble);
  return li;
}

function criarBolha(userId, itens, grupoOrdenados, index, onVer) {
  const user = usuarioPorId(userId);
  const li = document.createElement("li");

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "story-bubble";

  const { avatarWrap, ring } = criarAvatarWrap(user);
  if (grupoTemNaoVisto(itens)) ring.classList.add("unread");

  const nome = document.createElement("span");
  nome.className = "story-name";
  nome.textContent = user ? user.name.split(" ")[0] : "Usuário";

  botao.append(avatarWrap, nome);
  botao.onclick = () => onVer(grupoOrdenados, index);

  li.appendChild(botao);
  return li;
}
