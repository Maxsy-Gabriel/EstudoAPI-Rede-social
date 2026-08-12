const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Isso define as rotas de usuários:
router.get("/", userController.listar);
router.get("/:id", userController.buscar);
router.post("/", userController.criar);
router.post("/login", userController.login);
router.delete("/:id", userController.remover);

module.exports = router;
