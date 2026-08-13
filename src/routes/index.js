const express = require("express");
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const feedRoutes = require("./feedRoutes");
const messageRoutes = require("./messageRoutes");

const router = express.Router();

// Isso conecta cada grupo de rotas ao seu prefixo:
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/feed", feedRoutes);
router.use("/messages", messageRoutes);

module.exports = router;
