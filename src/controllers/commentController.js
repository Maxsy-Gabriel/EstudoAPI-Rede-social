const commentModel = require("../models/commentModel");
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

// Isso cria um comentário em um post:
async function criar(req, res) {
  const postId = Number(req.params.postId);
  const { userId, text } = req.body;

  const postExiste = await postModel.existe(postId);
  if (!postExiste) {
    return res.status(404).json({ message: "Post não encontrado" });
  }

  if (!userId || !text) {
    return res.status(400).json({ message: "userId e text são obrigatórios" });
  }

  const usuarioExiste = await userModel.existe(userId);
  if (!usuarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const novoComentario = await commentModel.criar(postId, userId, text);
  res.status(201).json(novoComentario);
}

// Isso remove um comentário (rota já passa pelo exigirAdmin):
async function remover(req, res) {
  const id = Number(req.params.id);
  const rowCount = await commentModel.remover(id);

  if (rowCount === 0) {
    return res.status(404).json({ message: "Comentário não encontrado" });
  }

  res.status(204).send();
}

module.exports = { criar, remover };
