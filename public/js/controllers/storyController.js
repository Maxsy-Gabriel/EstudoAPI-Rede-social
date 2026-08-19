import { state } from "../state.js";
import * as storyModel from "../models/storyModel.js";

// Isso busca os stories ativos no backend (ele já só devolve os das últimas 24h):
export async function carregarStories() {
  try {
    state.stories = await storyModel.listarStories();
  } catch (erro) {
    console.error("Falha ao carregar stories:", erro);
    return false;
  }
  return true;
}

// Isso agrupa os stories por autor (mais antigo primeiro dentro de cada grupo):
export function agruparPorUsuario() {
  const grupos = new Map();

  [...state.stories]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((story) => {
      if (!grupos.has(story.userId)) grupos.set(story.userId, []);
      grupos.get(story.userId).push(story);
    });

  return grupos;
}

export function grupoTemNaoVisto(itens) {
  return itens.some((s) => !state.storiesVistas.has(s.id));
}

// Isso mostra o status na hora (otimista), antes do servidor confirmar — troca pelo
// story de verdade quando a resposta chega, ou desfaz se der erro:
export async function criarStory({ userId, text, image, video }) {
  const idTemporario = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const storyOtimista = {
    id: idTemporario,
    userId,
    text: text || "",
    image: image || null,
    hasVideo: !!video,
    createdAt: new Date().toISOString(),
  };

  state.stories.push(storyOtimista);

  try {
    const storyReal = await storyModel.criarStory(userId, text, image, video);
    const index = state.stories.findIndex((s) => s.id === idTemporario);
    if (index !== -1) state.stories[index] = storyReal;
    return storyReal;
  } catch (erro) {
    state.stories = state.stories.filter((s) => s.id !== idTemporario);
    throw erro;
  }
}

export function marcarComoVisto(storyId) {
  state.storiesVistas.add(storyId);
}

export async function excluirStory(storyId, adminId) {
  await storyModel.excluirStory(storyId, adminId);
  state.stories = state.stories.filter((s) => s.id !== storyId);
}
