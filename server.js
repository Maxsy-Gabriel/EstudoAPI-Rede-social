const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;
const ARQUIVO = path.join(__dirname, "db.json");

// Middlewares:

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/app", express.static(path.join(__dirname, "public")));

// Funções auxiliares:

async function lerDados() {
  try {
    const conteudo = await fs.readFile(ARQUIVO, "utf-8");
    return JSON.parse(conteudo);
  } catch(erro) {
    return { users: [], posts: [], comments: [], reactions: [] };
  }
}

async function salvarDados(dados) {
  //                 'null' pode filtrar campos (espera uma arrow function)
  await fs.writeFile(ARQUIVO, JSON.stringify(dados, null, 2));
}


function gerarId(lista) {
  if(lista.length === 0) {
    return 1;
  }

  // Junta todos os ids achados em uma lista:
  const ids = lista.map((item) => item.id);
  // 'ids' são uma lista de números, os 3 pontos separam esse número por virgula:
  return Math.max(...ids) + 1;
}

app.get("/", (req, res) => {
  res.json({ message: "Mini Rede Social API", status: "online" });
});

// ============================================================
// USERS
// ============================================================

app.get("/users", async (req, res) => {
  const dados = await lerDados();
  res.json(dados.users);
});

app.get("/users/:id", async (req, res) => {
  const dados = await lerDados();
  const id = Number(req.params.id);
  const user = dados.users.find((u) => u.id === id);

  if(!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.json(user);
});

app.post("/users", async (req, res) => {
  const dados = await lerDados();
  const { name, username } = req.body;

  if(!name || !username) {
    return res.status(400).json({ message: "name e username são obrigatórios" });
  }

  const newUser = { id: gerarId(dados.users), name, username };
  dados.users.push(newUser);
  await salvarDados(dados);
  res.status(201).json(newUser);
});

// Não remove posts, comments e reactions do usuário, só o cadastro dele.
app.delete("/users/:id", async (req, res) => {
  const dados = await lerDados();
  const id = Number(req.params.id);
  const tamanhoAntes = dados.users.length;
  dados.users = dados.users.filter((u) => u.id !== id);

  if(dados.users.length === tamanhoAntes) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  await salvarDados(dados);
  res.status(204).send();
});

// ============================================================
// POSTS
// ============================================================

app.get("/posts", async (req, res) => {
  const dados = await lerDados();
  res.json(dados.posts);
});

app.post("/posts", async (req, res) => {
  const dados = await lerDados();
  const { userId, text } = req.body;

  if(!userId || !text) {
    return res.status(400).json({ message: "userId e text são obrigatórios" });
  }

  const usuarioExiste = dados.users.some((u) => u.id === userId);
  if(!usuarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const newPost = {
    id: gerarId(dados.posts),
    userId,
    text,
    createdAt: new Date().toISOString(),
  };

  dados.posts.push(newPost);
  await salvarDados(dados);
  res.status(201).json(newPost);
});

// ============================================================
// COMMENTS
// ============================================================

app.post("/posts/:postId/comments", async (req, res) => {
  const dados = await lerDados();
  const postId = Number(req.params.postId);
  const { userId, text } = req.body;

  const post = dados.posts.find((p) => p.id === postId);
  if(!post) {
    return res.status(404).json({ message: "Post não encontrado" });
  }

  if(!userId || !text) {
    return res.status(400).json({ message: "userId e text são obrigatórios" });
  }

  const usuarioExiste = dados.users.some((u) => u.id === userId);
  if(!usuarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const newComment = {
    id: gerarId(dados.comments),
    postId,
    userId,
    text,
    createdAt: new Date().toISOString(),
  };

  dados.comments.push(newComment);
  await salvarDados(dados);
  res.status(201).json(newComment);
});

// ============================================================
// REACTIONS
// ============================================================

app.post("/posts/:postId/reactions", async (req, res) => {
  const dados = await lerDados();
  const postId = Number(req.params.postId);
  const { userId, type } = req.body;

  if(type !== "like" && type !== "dislike") {
    return res.status(400).json({ message: "type deve ser like ou dislike" });
  }

  const post = dados.posts.find((p) => p.id === postId);
  if(!post) {
    return res.status(404).json({ message: "Post não encontrado" });
  }

  const usuarioExiste = dados.users.some((u) => u.id === userId);
  if(!usuarioExiste) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const reactionExistente = dados.reactions.find(
    (r) => r.postId === postId && r.userId === userId
  );

  // Usuário já reagiu a esse post: atualiza em vez de duplicar.
  if(reactionExistente) {
    reactionExistente.type = type;
    await salvarDados(dados);
    return res.json(reactionExistente);
  }

  const newReaction = { id: gerarId(dados.reactions), postId, userId, type };
  dados.reactions.push(newReaction);
  await salvarDados(dados);
  res.status(201).json(newReaction);
});

// ============================================================
// FEED
// ============================================================

app.get("/feed", async (req, res) => {
  const dados = await lerDados();

  // Para cada post, busca (find/filter) o que pertence a ele nos outros arrays.
  const feed = dados.posts.map((post) => {
    const autorDoPost = dados.users.find((u) => u.id === post.userId);
    const commentsDoPost = dados.comments.filter((c) => c.postId === post.id);
    const reactionsDoPost = dados.reactions.filter((r) => r.postId === post.id);
    const likes = reactionsDoPost.filter((r) => r.type === "like").length;
    const dislikes = reactionsDoPost.filter((r) => r.type === "dislike").length;

    return {
      id: post.id,
      text: post.text,
      createdAt: post.createdAt,
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
