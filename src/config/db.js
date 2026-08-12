require("dotenv").config();
const { Pool } = require("pg");

// Isso decide se a conexão precisa de SSL (a rede interna do Railway e o túnel local não usam):
const usaSSL =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("railway.internal") &&
  !process.env.DATABASE_URL.includes("127.0.0.1") &&
  !process.env.DATABASE_URL.includes("localhost");

// Isso cria o pool de conexões com o Postgres:
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: usaSSL ? { rejectUnauthorized: false } : false,
});

// Isso cria as tabelas do banco, caso ainda não existam:
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
      UNIQUE (post_id, user_id)
    );
  `);
}

module.exports = { pool, initDb };
