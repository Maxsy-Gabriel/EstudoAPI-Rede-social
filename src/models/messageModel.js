const { pool } = require("../config/db");

// Isso busca a conversa entre duas pessoas, nos dois sentidos, em ordem cronológica:
async function listarConversa(usuarioId, outroId) {
  const { rows } = await pool.query(
    `SELECT * FROM messages
     WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
     ORDER BY created_at`,
    [usuarioId, outroId]
  );
  return rows;
}

// Isso cria uma mensagem nova:
async function criar(senderId, recipientId, text) {
  const { rows } = await pool.query(
    `INSERT INTO messages (sender_id, recipient_id, text) VALUES ($1, $2, $3) RETURNING *`,
    [senderId, recipientId, text]
  );
  return rows[0];
}

module.exports = { listarConversa, criar };
