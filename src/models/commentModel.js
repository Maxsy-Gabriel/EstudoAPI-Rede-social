const { pool } = require("../config/db");

// Isso busca todos os comentários (usado para montar o feed):
async function listarTodos() {
  const { rows } = await pool.query("SELECT * FROM comments");
  return rows;
}

// Isso cria um novo comentário em um post:
async function criar(postId, userId, text) {
  const { rows } = await pool.query(
    "INSERT INTO comments (post_id, user_id, text) VALUES ($1, $2, $3) RETURNING *",
    [postId, userId, text]
  );
  return rows[0];
}

// Isso remove um comentário:
async function remover(id) {
  const { rowCount } = await pool.query("DELETE FROM comments WHERE id = $1", [id]);
  return rowCount;
}

module.exports = { listarTodos, criar, remover };
