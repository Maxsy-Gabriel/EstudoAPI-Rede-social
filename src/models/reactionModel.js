const { pool } = require("../config/db");

// Isso busca todas as reações (usado para montar o feed):
async function listarTodos() {
  const { rows } = await pool.query("SELECT * FROM reactions");
  return rows;
}

// Isso cria a reação de um usuário num post, ou atualiza se já existir:
async function criarOuAtualizar(postId, userId, type) {
  const { rows } = await pool.query(
    `INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)
     ON CONFLICT (post_id, user_id) DO UPDATE SET type = EXCLUDED.type
     RETURNING *`,
    [postId, userId, type]
  );
  return rows[0];
}

// Isso remove uma reação:
async function remover(id) {
  const { rowCount } = await pool.query("DELETE FROM reactions WHERE id = $1", [id]);
  return rowCount;
}

module.exports = { listarTodos, criarOuAtualizar, remover };
