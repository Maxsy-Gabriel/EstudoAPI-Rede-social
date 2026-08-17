const { pool } = require("../config/db");

// Isso faz alguém começar a seguir outra pessoa (não duplica se já seguir):
async function seguir(followerId, followedId) {
  await pool.query(
    `INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT (follower_id, followed_id) DO NOTHING`,
    [followerId, followedId]
  );
}

// Isso faz alguém parar de seguir outra pessoa:
async function deixarDeSeguir(followerId, followedId) {
  await pool.query("DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2", [followerId, followedId]);
}

// Isso confere se alguém já segue outra pessoa:
async function estaSeguindo(followerId, followedId) {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2",
    [followerId, followedId]
  );
  return rowCount > 0;
}

// Isso lista os ids de quem uma pessoa está seguindo (usado pra marcar o feed):
async function listarSeguindoIds(followerId) {
  const { rows } = await pool.query("SELECT followed_id FROM follows WHERE follower_id = $1", [followerId]);
  return rows.map((r) => r.followed_id);
}

// Isso conta quantos seguidores e quantas pessoas alguém está seguindo:
async function contarRelacionamentos(userId) {
  const { rows } = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM follows WHERE followed_id = $1) AS followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following_count`,
    [userId]
  );

  return {
    followersCount: Number(rows[0].followers_count),
    followingCount: Number(rows[0].following_count),
  };
}

module.exports = { seguir, deixarDeSeguir, estaSeguindo, listarSeguindoIds, contarRelacionamentos };
