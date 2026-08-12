const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

// Isso tira o password do usuário antes de mandar pro front-end:
function semPassword(usuario) {
  if (!usuario) return usuario;
  const { password, ...resto } = usuario;
  return resto;
}

// Isso lista todos os usuários:
async function listar(req, res) {
  const usuarios = await userModel.listarTodos();
  res.json(usuarios.map(semPassword));
}

// Isso busca um usuário específico pelo id:
async function buscar(req, res) {
  const id = Number(req.params.id);
  const usuario = await userModel.buscarPorId(id);

  if (!usuario) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.json(semPassword(usuario));
}

// Isso cria um novo usuário, com o password já em hash:
async function criar(req, res) {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: "name, username e password são obrigatórios" });
  }

  const usuarioExistente = await userModel.buscarPorUsername(username);
  if (usuarioExistente) {
    return res.status(409).json({ message: "Esse username já está em uso" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const novoUsuario = await userModel.criar(name, username, passwordHash);
  res.status(201).json(semPassword(novoUsuario));
}

// Isso confere username e password e loga o usuário:
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username e password são obrigatórios" });
  }

  const usuario = await userModel.buscarPorUsername(username);
  const senhaValida = usuario && (await bcrypt.compare(password, usuario.password));

  if (!senhaValida) {
    return res.status(401).json({ message: "Usuário ou senha inválidos" });
  }

  res.json(semPassword(usuario));
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

module.exports = { listar, buscar, criar, remover, login };
