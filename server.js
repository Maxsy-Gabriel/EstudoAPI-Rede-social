require("dotenv").config();
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const usaSSL = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("railway.internal");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: usaSSL ? { rejectUnauthorized: false } : false,
});

// Middlewares:

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/app", express.static(path.join(__dirname, "public")));

// Setup do banco:

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

app.get("/", (req, res) => {
  res.json({ message: "Mini Rede Social API", status: "online" });
});

// ============================================================
// USERS
// ============================================================

app.get("/users", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY id");
  res.json(rows);
});

app.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

  if (!rows[0]) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.json(rows[0]);
});

app.post("/users", async (req, res) => {
  const { name, username } = req.body;

  if (!name || !username) {
    return res.status(400).json({ message: "name e username são obrigatórios" });
  }

  const { rows } = await pool.query(
    "INSERT INTO users (name, username) VALUES ($1, $2) RETURNING *",
    [name, username]
  );

  res.status(201).json(rows[0]);
});

// Não remove posts, comments e reactions do usuário, só o cadastro dele.
app.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);

  if (rowCount === 0) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.status(204).send();
});

// ============================================================
// POSTS
// ============================================================

app.get("/posts", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM posts ORDER BY id");
  res.json(rows);
});

app.post("/posts", async (req, res) => {
  const { userId, text } = req.body;

  if (!userId || !text) {
    return res.status(400).json({ message: "userId e text são obrigatórios" });
  }

  const usuario = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
  if (usuario.rowCount === 0) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const { rows } = await pool.query(
    "INSERT INTO posts (user_id, text) VALUES ($1, $2) RETURNING *",
    [userId, text]
  );

  res.status(201).json(rows[0]);
});

// ============================================================
// COMMENTS
// ============================================================

app.post("/posts/:postId/comments", async (req, res) => {
  const postId = Number(req.params.postId);
  const { userId, text } = req.body;

  const post = await pool.query("SELECT id FROM posts WHERE id = $1", [postId]);
  if (post.rowCount === 0) {
    return res.status(404).json({ message: "Post não encontrado" });
  }

  if (!userId || !text) {
    return res.status(400).json({ message: "userId e text são obrigatórios" });
  }

  const usuario = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
  if (usuario.rowCount === 0) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const { rows } = await pool.query(
    "INSERT INTO comments (post_id, user_id, text) VALUES ($1, $2, $3) RETURNING *",
    [postId, userId, text]
  );

  res.status(201).json(rows[0]);
});

// ============================================================
// REACTIONS
// ============================================================

app.post("/posts/:postId/reactions", async (req, res) => {
  const postId = Number(req.params.postId);
  const { userId, type } = req.body;

  if (type !== "like" && type !== "dislike") {
    return res.status(400).json({ message: "type deve ser like ou dislike" });
  }

  const post = await pool.query("SELECT id FROM posts WHERE id = $1", [postId]);
  if (post.rowCount === 0) {
    return res.status(404).json({ message: "Post não encontrado" });
  }

  const usuario = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
  if (usuario.rowCount === 0) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const { rows } = await pool.query(
    `INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)
     ON CONFLICT (post_id, user_id) DO UPDATE SET type = EXCLUDED.type
     RETURNING *`,
    [postId, userId, type]
  );

  res.status(201).json(rows[0]);
});

// ============================================================
// FEED
// ============================================================

app.get("/feed", async (req, res) => {
  const posts = (await pool.query("SELECT * FROM posts ORDER BY id")).rows;
  const users = (await pool.query("SELECT * FROM users")).rows;
  const comments = (await pool.query("SELECT * FROM comments")).rows;
  const reactions = (await pool.query("SELECT * FROM reactions")).rows;

  const feed = posts.map((post) => {
    const autorDoPost = users.find((u) => u.id === post.user_id);
    const commentsDoPost = comments.filter((c) => c.post_id === post.id);
    const reactionsDoPost = reactions.filter((r) => r.post_id === post.id);
    const likes = reactionsDoPost.filter((r) => r.type === "like").length;
    const dislikes = reactionsDoPost.filter((r) => r.type === "dislike").length;

    return {
      id: post.id,
      text: post.text,
      createdAt: post.created_at,
      user: autorDoPost ? { id: autorDoPost.id, name: autorDoPost.name } : null,
      comments: commentsDoPost,
      reactions: reactionsDoPost,
      likes,
      dislikes,
    };
  });

  res.json(feed);
});

// ============================================================
// START
// ============================================================

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((erro) => {
    console.error("Erro ao inicializar o banco:", erro);
    process.exit(1);
  });
