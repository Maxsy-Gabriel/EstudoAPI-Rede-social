const express = require("express");
const userController = require("../controllers/userController");
const followController = require("../controllers/followController");
const exigirAdmin = require("../middlewares/exigirAdmin");
const exigirMesmoUsuario = require("../middlewares/exigirMesmoUsuario");

const router = express.Router();

// Isso define as rotas de usuários:
router.get("/", userController.listar);
router.get("/admin", exigirAdmin, userController.listarParaAdmin);
router.get("/:id", userController.buscar);
router.post("/", userController.criar);
router.post("/login", userController.login);
router.post("/:id/heartbeat", userController.heartbeat);
router.patch("/:id/cargo", exigirAdmin, userController.atualizarCargo);
router.patch("/:id/perfil", exigirMesmoUsuario, userController.atualizarPerfil);
router.patch("/:id/senha", exigirMesmoUsuario, userController.atualizarSenha);
router.delete("/:id", exigirAdmin, userController.remover);

// Isso define as rotas de seguir/deixar de seguir:
router.get("/:id/seguidores", followController.info);
router.post("/:id/seguir", followController.seguir);
router.delete("/:id/seguir", followController.deixarDeSeguir);

module.exports = router;
