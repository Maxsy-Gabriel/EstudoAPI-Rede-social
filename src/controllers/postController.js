const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

const TAMANHO_MAXIMO_VIDEO_BYTES = 20 * 1024 * 1024;

// Isso estima o tamanho em bytes de uma data URI base64 (sem decodificar ela inteira):
function tamanhoBase64EmBytes(dataUri) {
  const base64 = dataUri.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

// Isso lista todos os posts:
async function listar(req, res) {
  const posts = await postModel.listarTodos();
  res.json(posts);
}

// Isso cria um novo post:
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

  const novoPost = await postModel.criar(userId, text || "", image || null, video || null);
  res.status(201).json(novoPost);
}

// Isso serve o vídeo de um post com suporte a Range (necessário pro <video> dar seek):
async function streamVideo(req, res) {
  const id = Number(req.params.id);
  const post = await postModel.buscarPorId(id);

  if (!post || !post.video) {
    return res.status(404).end();
  }

  const match = post.video.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    return res.status(404).end();
  }

  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  const total = buffer.length;
  const range = req.headers.range;

  res.setHeader("Content-Type", mime || "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, max-age=3600");

  if (!range) {
    res.setHeader("Content-Length", total);
    return res.status(200).end(buffer);
  }

  const partes = range.match(/bytes=(\d*)-(\d*)/);
  const start = partes && partes[1] ? parseInt(partes[1], 10) : 0;
  const end = Math.min(partes && partes[2] ? parseInt(partes[2], 10) : total - 1, total - 1);

  if (Number.isNaN(start) || start >= total || start > end) {
    res.setHeader("Content-Range", `bytes */${total}`);
    return res.status(416).end();
  }

  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
  res.setHeader("Content-Length", end - start + 1);
  res.end(buffer.subarray(start, end + 1));
}

// Isso remove um post (rota já passa pelo exigirAdmin):
async function remover(req, res) {
  const id = Number(req.params.id);
  const rowCount = await postModel.remover(id);

  if (rowCount === 0) {
    return res.status(404).json({ message: "Post não encontrado" });
  }

  res.status(204).send();
}

module.exports = { listar, criar, streamVideo, remover };
