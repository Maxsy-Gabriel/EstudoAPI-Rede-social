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

module.exports = { criar };
