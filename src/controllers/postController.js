const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

// Isso lista todos os posts:
async function listar(req, res) {
  const posts = await postModel.listarTodos();
  res.json(posts);
}

// Isso cria um novo post:
async function criar(req, res) {
  const { userId, text } = req.body;

  if (!userId || !text) {
    return res.status(400).json({ message: "userId e text são obrigatórios" });
  }

  const usuarioExiste = await userModel.existe(userId);
  if (!usuarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const novoPost = await postModel.criar(userId, text);
  res.status(201).json(novoPost);
}

module.exports = { listar, criar };
