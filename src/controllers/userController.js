const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const CARGOS_VALIDOS = ["admin", "user"];
const ESTADOS_CIVIS_VALIDOS = ["solteiro", "namorando", "casado", "divorciado", "viuvo"];

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

// Isso lista todos os usuários pra tela de administração (rota já passa pelo exigirAdmin):
async function listarParaAdmin(req, res) {
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

  await userModel.atualizarUltimoAcesso(usuario.id);
  usuario.online = true;
  res.json(semPassword(usuario));
}

// Isso troca o cargo de um usuário (rota já passa pelo exigirAdmin):
async function atualizarCargo(req, res) {
  const id = Number(req.params.id);
  const { role } = req.body;

  if (!CARGOS_VALIDOS.includes(role)) {
    return res.status(400).json({ message: "role deve ser 'admin' ou 'user'" });
  }

  const existe = await userModel.existe(id);
  if (!existe) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const usuarioAtualizado = await userModel.atualizarCargo(id, role);
  res.json(semPassword(usuarioAtualizado));
}

// Isso atualiza o perfil (rota já passa pelo exigirMesmoUsuario; nunca mexe em username nem password):
async function atualizarPerfil(req, res) {
  const id = Number(req.params.id);
  const { name, sobre, idade, estadoCivil, avatar } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "name é obrigatório" });
  }

  if (sobre && sobre.length > 500) {
    return res.status(400).json({ message: "sobre pode ter no máximo 500 caracteres" });
  }

  if (idade !== undefined && idade !== null && idade !== "") {
    const idadeNumero = Number(idade);
    if (!Number.isInteger(idadeNumero) || idadeNumero < 0 || idadeNumero > 120) {
      return res.status(400).json({ message: "idade inválida" });
    }
  }

  if (estadoCivil && !ESTADOS_CIVIS_VALIDOS.includes(estadoCivil)) {
    return res.status(400).json({ message: "estadoCivil inválido" });
  }

  if (avatar && avatar.length > 2_000_000) {
    return res.status(400).json({ message: "Imagem muito grande" });
  }

  const usuarioAtualizado = await userModel.atualizarPerfil(id, {
    name: name.trim(),
    sobre: sobre || null,
    idade: idade ? Number(idade) : null,
    estadoCivil: estadoCivil || null,
    avatar: avatar || null,
  });

  res.json(semPassword(usuarioAtualizado));
}

// Isso troca a senha (rota já passa pelo exigirMesmoUsuario; exige confirmar a senha atual):
async function atualizarSenha(req, res) {
  const id = Number(req.params.id);
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ message: "senhaAtual e novaSenha são obrigatórias" });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ message: "novaSenha precisa ter pelo menos 6 caracteres" });
  }

  const usuario = await userModel.buscarPorId(id);
  const senhaValida = usuario && (await bcrypt.compare(senhaAtual, usuario.password));

  if (!senhaValida) {
    return res.status(401).json({ message: "Senha atual incorreta" });
  }

  const passwordHash = await bcrypt.hash(novaSenha, 10);
  await userModel.atualizarSenha(id, passwordHash);
  res.status(204).send();
}

// Isso marca o usuário como ativo agora (chamado periodicamente pelo front-end):
async function heartbeat(req, res) {
  const id = Number(req.params.id);
  await userModel.atualizarUltimoAcesso(id);
  res.status(204).send();
}

// Isso remove um usuário (rota já passa pelo exigirAdmin; posts, comments e reactions dele ficam como "Usuário removido"):
async function remover(req, res) {
  const id = Number(req.params.id);

  if (id === req.solicitante.id) {
    return res.status(400).json({ message: "Você não pode excluir sua própria conta por aqui" });
  }

  const rowCount = await userModel.remover(id);

  if (rowCount === 0) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.status(204).send();
}

module.exports = {
  listar,
  listarParaAdmin,
  buscar,
  criar,
  login,
  atualizarCargo,
  atualizarPerfil,
  atualizarSenha,
  heartbeat,
  remover,
};
