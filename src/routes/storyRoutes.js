const express = require("express");
const storyController = require("../controllers/storyController");
const exigirAdmin = require("../middlewares/exigirAdmin");

const router = express.Router();

// Isso define as rotas de stories/status:
router.get("/", storyController.listar);
router.post("/", storyController.criar);
router.get("/:id/video", storyController.streamVideo);
router.delete("/:id", exigirAdmin, storyController.remover);

module.exports = router;
