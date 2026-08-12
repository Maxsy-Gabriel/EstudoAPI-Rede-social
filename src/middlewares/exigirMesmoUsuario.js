// Isso bloqueia a rota pra quem não é o dono da conta (usa o header X-User-Id enviado pelo front):
function exigirMesmoUsuario(req, res, next) {
  const solicitanteId = Number(req.get("X-User-Id"));
  const alvoId = Number(req.params.id);

  if (!solicitanteId || solicitanteId !== alvoId) {
    return res.status(403).json({ message: "Você só pode editar o seu próprio perfil" });
  }

  next();
}

module.exports = exigirMesmoUsuario;
