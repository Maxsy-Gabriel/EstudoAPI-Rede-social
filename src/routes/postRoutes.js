const express = require("express");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const reactionController = require("../controllers/reactionController");

const router = express.Router();

// Isso define as rotas de posts:
router.get("/", postController.listar);
router.post("/", postController.criar);

// Isso define as rotas de comentários e reações, aninhadas em um post:
router.post("/:postId/comments", commentController.criar);
router.post("/:postId/reactions", reactionController.criar);

module.exports = router;
