const { pool } = require("../config/db");

// Isso busca todos os posts (sem o vídeo, que é pesado e só é buscado quando o user dá play):
async function listarTodos() {
  const { rows } = await pool.query(
    "SELECT id, user_id, text, image, (video IS NOT NULL) AS has_video, created_at FROM posts ORDER BY id"
  );
  return rows;
}

// Isso confere se um post existe:
async function existe(id) {
  const { rowCount } = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
  return rowCount > 0;
}

// Isso cria um novo post:
async function criar(userId, text, image, video) {
  const { rows } = await pool.query(
    "INSERT INTO posts (user_id, text, image, video) VALUES ($1, $2, $3, $4) RETURNING *",
    [userId, text, image, video]
  );
  return rows[0];
}

// Isso busca um post com todos os campos (usado pra servir o vídeo):
async function buscarPorId(id) {
  const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
  return rows[0] || null;
}

// Isso remove um post (comentários e reações dele saem junto):
async function remover(id) {
  const { rowCount } = await pool.query("DELETE FROM posts WHERE id = $1", [id]);
  return rowCount;
}

module.exports = { listarTodos, existe, criar, buscarPorId, remover };
