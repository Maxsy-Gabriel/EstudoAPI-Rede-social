const feedModel = require("../models/feedModel");

// Isso retorna o feed com cada post, autor, comentários e reações:
async function listar(req, res) {
  const solicitanteId = Number(req.get("X-User-Id"));
  const feed = await feedModel.montar(solicitanteId);
  res.json(feed);
}

module.exports = { listar };
