const { pool } = require("../config/db");

// Isso busca todos os usuários cadastrados:
async function listarTodos() {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY id");
  return rows;
}

// Isso busca um usuário pelo id:
async function buscarPorId(id) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0];
}

// Isso confere se um usuário existe:
async function existe(id) {
  const { rowCount } = await pool.query("SELECT id FROM users WHERE id = $1", [id]);
  return rowCount > 0;
}

// Isso cria um novo usuário:
async function criar(name, username) {
  const { rows } = await pool.query(
    "INSERT INTO users (name, username) VALUES ($1, $2) RETURNING *",
    [name, username]
  );
  return rows[0];
}

// Isso remove um usuário pelo id:
async function remover(id) {
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return rowCount;
}

module.exports = { listarTodos, buscarPorId, existe, criar, remover };
