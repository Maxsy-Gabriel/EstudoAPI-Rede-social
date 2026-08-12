const express = require("express");
const feedController = require("../controllers/feedController");

const router = express.Router();

// Isso define a rota do feed:
router.get("/", feedController.listar);

module.exports = router;
