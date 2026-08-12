const reactionModel = require("../models/reactionModel");
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

// Isso cria a reação de um usuário num post, ou atualiza se já existir:
async function criar(req, res) {
  const postId = Number(req.params.postId);
  const { userId, type } = req.body;

  if (type !== "like" && type !== "dislike") {
    return res.status(400).json({ message: "type deve ser like ou dislike" });
  }

  const postExiste = await postModel.existe(postId);
  if (!postExiste) {
    return res.status(404).json({ message: "Post não encontrado" });
  }

  const usuarioExiste = await userModel.existe(userId);
  if (!usuarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const reacao = await reactionModel.criarOuAtualizar(postId, userId, type);
  res.status(201).json(reacao);
}

module.exports = { criar };
