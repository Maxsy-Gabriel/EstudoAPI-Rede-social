const userModel = require("../models/userModel");

// Isso lista todos os usuários:
async function listar(req, res) {
  const usuarios = await userModel.listarTodos();
  res.json(usuarios);
}

// Isso busca um usuário específico pelo id:
async function buscar(req, res) {
  const id = Number(req.params.id);
  const usuario = await userModel.buscarPorId(id);

  if (!usuario) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.json(usuario);
}

// Isso cria um novo usuário:
async function criar(req, res) {
  const { name, username } = req.body;

  if (!name || !username) {
    return res.status(400).json({ message: "name e username são obrigatórios" });
  }

  const novoUsuario = await userModel.criar(name, username);
  res.status(201).json(novoUsuario);
}

// Isso remove um usuário (não remove posts, comments e reactions dele, só o cadastro):
async function remover(req, res) {
  const id = Number(req.params.id);
  const rowCount = await userModel.remover(id);

  if (rowCount === 0) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.status(204).send();
}

module.exports = { listar, buscar, criar, remover };
