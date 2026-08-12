const userModel = require("../models/userModel");

// Isso bloqueia a rota pra quem não é admin (usa o header X-User-Id enviado pelo front):
async function exigirAdmin(req, res, next) {
  const solicitanteId = Number(req.get("X-User-Id"));
  const solicitante = solicitanteId ? await userModel.buscarPorId(solicitanteId) : null;

  if (!solicitante || solicitante.role !== "admin") {
    return res.status(403).json({ message: "Apenas administradores podem fazer isso" });
  }

  req.solicitante = solicitante;
  next();
}

module.exports = exigirAdmin;
