const messageModel = require("../models/messageModel");
const userModel = require("../models/userModel");
const socket = require("../socket");

// O Postgres devolve as colunas em snake_case; o front-end espera camelCase.
function paraCamelCase(mensagem) {
  return {
    id: mensagem.id,
    senderId: mensagem.sender_id,
    recipientId: mensagem.recipient_id,
    text: mensagem.text,
    createdAt: mensagem.created_at,
  };
}

// Isso lista a conversa entre quem está pedindo (X-User-Id) e outra pessoa:
async function listar(req, res) {
  const usuarioId = Number(req.get("X-User-Id"));
  const outroId = Number(req.params.userId);

  if (!usuarioId) {
    return res.status(400).json({ message: "X-User-Id é obrigatório" });
  }

  const mensagens = await messageModel.listarConversa(usuarioId, outroId);
  res.json(mensagens.map(paraCamelCase));
}

// Isso manda uma mensagem nova de quem está pedindo (X-User-Id) pra outra pessoa:
async function criar(req, res) {
  const senderId = Number(req.get("X-User-Id"));
  const recipientId = Number(req.params.userId);
  const { text } = req.body;

  if (!senderId) {
    return res.status(400).json({ message: "X-User-Id é obrigatório" });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "text é obrigatório" });
  }

  const destinatarioExiste = await userModel.existe(recipientId);
  if (!destinatarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const mensagem = paraCamelCase(await messageModel.criar(senderId, recipientId, text.trim()));
  socket.notificarNovaMensagem(mensagem);
  res.status(201).json(mensagem);
}

module.exports = { listar, criar };
