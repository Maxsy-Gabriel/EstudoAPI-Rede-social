import { state } from "../state.js";

const DURACAO_STORY_MS = 24 * 60 * 60 * 1000;

// TODO: quando o back de stories existir, isso vira um fetch("/stories") de verdade.
// Por enquanto os stories só existem na sessão do navegador (não persistem).
export async function carregarStories() {
  return true;
}

// Isso mantém só os stories postados nas últimas 24h:
export function storiesAtivas() {
  const limite = Date.now() - DURACAO_STORY_MS;
  return state.stories.filter((s) => new Date(s.createdAt).getTime() > limite);
}

// Isso agrupa os stories ativos por autor (mais antigo primeiro dentro de cada grupo):
export function agruparPorUsuario() {
  const grupos = new Map();

  storiesAtivas()
    .slice()
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

export function criarStory({ userId, text, image, video }) {
  const story = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    text: text || "",
    image: image || null,
    video: video || null,
    createdAt: new Date().toISOString(),
  };
  state.stories.push(story);
  return story;
}

export function marcarComoVisto(storyId) {
  state.storiesVistas.add(storyId);
}
