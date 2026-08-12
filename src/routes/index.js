const express = require("express");
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const feedRoutes = require("./feedRoutes");

const router = express.Router();

// Isso responde na raiz da API:
router.get("/", (req, res) => {
  res.json({ message: "Mini Rede Social API", status: "online" });
});

// Isso conecta cada grupo de rotas ao seu prefixo:
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/feed", feedRoutes);

module.exports = router;
