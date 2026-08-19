const { pool } = require("../config/db");
const videoStream = require("../utils/videoStream");

// Isso busca os stories ainda ativos (postados nas últimas 24h):
async function listarAtivos() {
  const { rows } = await pool.query(
    "SELECT * FROM stories WHERE created_at > now() - interval '24 hours' ORDER BY created_at"
  );
  return rows;
}

// Isso busca um story com todos os campos (usado pra servir o vídeo):
async function buscarPorId(id) {
  const { rows } = await pool.query("SELECT * FROM stories WHERE id = $1", [id]);
  return rows[0] || null;
}

// Isso cria um novo story:
async function criar(userId, text, image, video) {
  const { rows } = await pool.query(
    "INSERT INTO stories (user_id, text, image, video) VALUES ($1, $2, $3, $4) RETURNING *",
    [userId, text, image, video]
  );
  return rows[0];
}

// Isso remove um story (usado pelo admin):
async function remover(id) {
  const { rowCount } = await pool.query("DELETE FROM stories WHERE id = $1", [id]);
  return rowCount;
}

// Isso apaga os stories com mais de 24h. Chamado no boot e periodicamente pelo server.js;
// engole erro pra não derrubar o processo se o banco falhar num desses ciclos:
async function apagarExpirados() {
  try {
    const { rows } = await pool.query(
      "DELETE FROM stories WHERE created_at <= now() - interval '24 hours' RETURNING id"
    );
    rows.forEach((row) => videoStream.invalidar(`story:${row.id}`));
    if (rows.length > 0) {
      console.log(`Stories expirados removidos: ${rows.length}`);
    }
    return rows.length;
  } catch (erro) {
    console.error("Erro ao apagar stories expirados:", erro.message);
    return 0;
  }
}

module.exports = { listarAtivos, buscarPorId, criar, remover, apagarExpirados };
