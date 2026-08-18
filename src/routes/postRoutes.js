const express = require("express");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const reactionController = require("../controllers/reactionController");
const exigirAdmin = require("../middlewares/exigirAdmin");

const router = express.Router();

// Isso define as rotas de posts:
router.get("/", postController.listar);
router.post("/", postController.criar);
router.get("/:id/video", postController.streamVideo);
router.delete("/:id", exigirAdmin, postController.remover);

// Isso define as rotas de comentários e reações, aninhadas em um post:
router.post("/:postId/comments", commentController.criar);
router.delete("/:postId/comments/:id", exigirAdmin, commentController.remover);
router.post("/:postId/reactions", reactionController.criar);
router.delete("/:postId/reactions/:id", exigirAdmin, reactionController.remover);

module.exports = router;
