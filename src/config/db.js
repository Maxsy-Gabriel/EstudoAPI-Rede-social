require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

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
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    INSERT INTO roles (name) VALUES ('admin'), ('user') ON CONFLICT (name) DO NOTHING;

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      role_id INTEGER REFERENCES roles(id),
      last_seen_at TIMESTAMPTZ
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

    UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'user') WHERE role_id IS NULL;
    ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

    -- Isso garante que a conta do Gabriel (Maxsy) seja sempre admin:
    UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE username = 'Maxsy';

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

    -- Isso faz post/comentário/reação sobreviverem à exclusão do usuário (viram "Usuário removido"):
    ALTER TABLE posts ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
    ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
    ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    ALTER TABLE reactions ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;
    ALTER TABLE reactions ADD CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    -- Isso faz comentário/reação sumirem junto quando o post deles é excluído:
    ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
    ALTER TABLE comments ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

    ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_post_id_fkey;
    ALTER TABLE reactions ADD CONSTRAINT reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

    -- Isso adiciona os campos do perfil (foto em base64, sobre, idade, estado civil):
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS sobre TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS idade INTEGER;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS estado_civil TEXT;
  `);

  await hashearSenhasEmTextoPuro();
}

// Isso conserta senha que foi editada direto no banco (sem hash), pra login sempre funcionar:
async function hashearSenhasEmTextoPuro() {
  const { rows } = await pool.query("SELECT id, password FROM users WHERE password !~ '^\\$2[aby]\\$'");

  for (const usuario of rows) {
    const hash = await bcrypt.hash(usuario.password, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, usuario.id]);
  }
}

module.exports = { pool, initDb };
