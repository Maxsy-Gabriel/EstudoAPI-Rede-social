const express = require("express");
const userController = require("../controllers/userController");
const exigirAdmin = require("../middlewares/exigirAdmin");

const router = express.Router();

// Isso define as rotas de usuários:
router.get("/", userController.listar);
router.get("/admin", exigirAdmin, userController.listarParaAdmin);
router.get("/:id", userController.buscar);
router.post("/", userController.criar);
router.post("/login", userController.login);
router.post("/:id/heartbeat", userController.heartbeat);
router.patch("/:id/cargo", exigirAdmin, userController.atualizarCargo);
router.delete("/:id", exigirAdmin, userController.remover);

module.exports = router;
