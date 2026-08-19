const storyModel = require("../models/storyModel");
const userModel = require("../models/userModel");
const videoStream = require("../utils/videoStream");

const TAMANHO_MAXIMO_VIDEO_BYTES = 20 * 1024 * 1024;

// Isso estima o tamanho em bytes de uma data URI base64 (sem decodificar ela inteira):
function tamanhoBase64EmBytes(dataUri) {
  const base64 = dataUri.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

// O Postgres devolve as colunas em snake_case; o front-end espera camelCase.
// O vídeo não vai nessa lista (é pesado) — só um indicador; o conteúdo real
// só é buscado quando o usuário abre aquele story, via streamVideo:
function mapear(story) {
  return {
    id: story.id,
    userId: story.user_id,
    text: story.text,
    image: story.image,
    hasVideo: !!story.video,
    createdAt: story.created_at,
  };
}

// Isso lista os stories ainda ativos (últimas 24h):
async function listar(req, res) {
  const stories = await storyModel.listarAtivos();
  res.json(stories.map(mapear));
}

// Isso cria um novo story:
async function criar(req, res) {
  const { userId, text, image, video } = req.body;

  if (!userId || (!text && !image && !video)) {
    return res.status(400).json({ message: "userId e (text, image ou video) são obrigatórios" });
  }

  if (video && tamanhoBase64EmBytes(video) > TAMANHO_MAXIMO_VIDEO_BYTES) {
    return res.status(400).json({ message: "Vídeo muito grande (máximo 20MB)" });
  }

  const usuarioExiste = await userModel.existe(userId);
  if (!usuarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const novoStory = await storyModel.criar(userId, text || "", image || null, video || null);
  res.status(201).json(mapear(novoStory));
}

// Isso serve o vídeo de um story com suporte a Range (necessário pro <video> dar seek);
// o data URI só é buscado no banco na primeira requisição, depois fica em cache:
async function streamVideo(req, res) {
  const id = Number(req.params.id);
  await videoStream.servirVideo(req, res, `story:${id}`, async () => {
    const story = await storyModel.buscarPorId(id);
    return story?.video || null;
  });
}

// Isso remove um story (rota já passa pelo exigirAdmin):
async function remover(req, res) {
  const id = Number(req.params.id);
  const rowCount = await storyModel.remover(id);

  if (rowCount === 0) {
    return res.status(404).json({ message: "Status não encontrado" });
  }

  videoStream.invalidar(`story:${id}`);
  res.status(204).send();
}

module.exports = { listar, criar, streamVideo, remover };
