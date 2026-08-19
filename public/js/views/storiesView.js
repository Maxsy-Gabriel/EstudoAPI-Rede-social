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

  // O círculo de adicionar é sempre a primeira bolha; meu status (se eu tiver) fica logo ao lado dele:
  storiesList.appendChild(criarBolhaAdicionar(onCriar));

  if (meusItens.length > 0) {
    storiesList.appendChild(criarBolhaPropria(grupoOrdenados, onVer));
  }

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

function criarBolhaAdicionar(onCriar) {
  const li = document.createElement("li");

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "story-bubble story-bubble-adicionar";
  botao.setAttribute("aria-label", "Adicionar status");
  botao.onclick = onCriar;

  const circulo = document.createElement("span");
  circulo.className = "story-add-circulo";
  circulo.textContent = "+";
  circulo.setAttribute("aria-hidden", "true");

  const nome = document.createElement("span");
  nome.className = "story-name";
  nome.textContent = "Novo status";

  botao.append(circulo, nome);
  li.appendChild(botao);
  return li;
}

function criarBolhaPropria(grupoOrdenados, onVer) {
  const user = usuarioPorId(state.identidadeAtualId);
  const li = document.createElement("li");

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "story-bubble";
  botao.setAttribute("aria-label", "Ver seu status");
  botao.onclick = () => onVer(grupoOrdenados, 0);

  const { avatarWrap, ring } = criarAvatarWrap(user);
  ring.classList.add("self");

  const nome = document.createElement("span");
  nome.className = "story-name";
  nome.textContent = "Seu status";

  botao.append(avatarWrap, nome);
  li.appendChild(botao);
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
