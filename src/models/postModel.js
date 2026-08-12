const { pool } = require("../config/db");

// Isso busca todos os posts:
async function listarTodos() {
  const { rows } = await pool.query("SELECT * FROM posts ORDER BY id");
  return rows;
}

// Isso confere se um post existe:
async function existe(id) {
  const { rowCount } = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
  return rowCount > 0;
}

// Isso cria um novo post:
async function criar(userId, text) {
  const { rows } = await pool.query(
    "INSERT INTO posts (user_id, text) VALUES ($1, $2) RETURNING *",
    [userId, text]
  );
  return rows[0];
}

module.exports = { listarTodos, existe, criar };
