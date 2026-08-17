const followModel = require("../models/followModel");
const userModel = require("../models/userModel");

// Isso mostra quantos seguidores/seguindo alguém tem, e se quem está vendo (X-User-Id) já segue essa pessoa:
async function info(req, res) {
  const alvoId = Number(req.params.id);
  const solicitanteId = Number(req.get("X-User-Id"));

  const existe = await userModel.existe(alvoId);
  if (!existe) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const contagem = await followModel.contarRelacionamentos(alvoId);
  const isFollowing = solicitanteId ? await followModel.estaSeguindo(solicitanteId, alvoId) : false;

  res.json({ ...contagem, isFollowing });
}

// Isso faz quem está pedindo (X-User-Id) seguir outra pessoa:
async function seguir(req, res) {
  const alvoId = Number(req.params.id);
  const solicitanteId = Number(req.get("X-User-Id"));

  if (!solicitanteId) {
    return res.status(400).json({ message: "X-User-Id é obrigatório" });
  }

  if (solicitanteId === alvoId) {
    return res.status(400).json({ message: "Você não pode seguir você mesmo" });
  }

  const existe = await userModel.existe(alvoId);
  if (!existe) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  await followModel.seguir(solicitanteId, alvoId);
  const contagem = await followModel.contarRelacionamentos(alvoId);
  res.status(201).json({ ...contagem, isFollowing: true });
}

// Isso faz quem está pedindo (X-User-Id) deixar de seguir outra pessoa:
async function deixarDeSeguir(req, res) {
  const alvoId = Number(req.params.id);
  const solicitanteId = Number(req.get("X-User-Id"));

  if (!solicitanteId) {
    return res.status(400).json({ message: "X-User-Id é obrigatório" });
  }

  await followModel.deixarDeSeguir(solicitanteId, alvoId);
  const contagem = await followModel.contarRelacionamentos(alvoId);
  res.json({ ...contagem, isFollowing: false });
}

module.exports = { info, seguir, deixarDeSeguir };
