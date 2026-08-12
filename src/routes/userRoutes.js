const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Isso define as rotas de usuários:
router.get("/", userController.listar);
router.get("/:id", userController.buscar);
router.post("/", userController.criar);
router.delete("/:id", userController.remover);

module.exports = router;
