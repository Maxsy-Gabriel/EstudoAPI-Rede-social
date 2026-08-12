const { pool } = require("../config/db");

// Isso decide se o usuário está online (teve um heartbeat nos últimos 45s):
const SELECT_BASE = `
  SELECT users.*, roles.name AS role,
    (users.last_seen_at IS NOT NULL AND now() - users.last_seen_at < interval '45 seconds') AS online
  FROM users
  JOIN roles ON roles.id = users.role_id
`;

// Isso busca todos os usuários cadastrados:
async function listarTodos() {
  const { rows } = await pool.query(`${SELECT_BASE} ORDER BY users.id`);
  return rows;
}

// Isso busca um usuário pelo id:
async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE users.id = $1`, [id]);
  return rows[0];
}

// Isso confere se um usuário existe:
async function existe(id) {
  const { rowCount } = await pool.query("SELECT id FROM users WHERE id = $1", [id]);
  return rowCount > 0;
}

// Isso busca um usuário pelo username (usado no cadastro e no login):
async function buscarPorUsername(username) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE users.username = $1`, [username]);
  return rows[0];
}

// Isso cria um novo usuário (o password já deve chegar com hash pronto), sempre com cargo "user":
async function criar(name, username, password) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, username, password, role_id, last_seen_at)
     VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = 'user'), now())
     RETURNING id`,
    [name, username, password]
  );
  return buscarPorId(rows[0].id);
}

// Isso troca o cargo de um usuário ('admin' ou 'user'):
async function atualizarCargo(id, role) {
  await pool.query(
    `UPDATE users SET role_id = (SELECT id FROM roles WHERE name = $2) WHERE id = $1`,
    [id, role]
  );
  return buscarPorId(id);
}

// Isso marca o usuário como ativo agora (usado pela bolinha de online):
async function atualizarUltimoAcesso(id) {
  await pool.query("UPDATE users SET last_seen_at = now() WHERE id = $1", [id]);
}

// Isso remove um usuário pelo id:
async function remover(id) {
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return rowCount;
}

module.exports = {
  listarTodos,
  buscarPorId,
  buscarPorUsername,
  existe,
  criar,
  atualizarCargo,
  atualizarUltimoAcesso,
  remover,
};
