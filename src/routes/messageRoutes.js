const express = require("express");
const messageController = require("../controllers/messageController");

const router = express.Router();

// Isso define as rotas de mensagens privadas, aninhadas por quem é a outra pessoa da conversa:
router.get("/:userId", messageController.listar);
router.post("/:userId", messageController.criar);

module.exports = router;
