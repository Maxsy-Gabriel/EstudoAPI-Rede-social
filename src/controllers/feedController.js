const feedModel = require("../models/feedModel");

// Isso retorna o feed com cada post, autor, comentários e reações:
async function listar(req, res) {
  const feed = await feedModel.montar();
  res.json(feed);
}

module.exports = { listar };
