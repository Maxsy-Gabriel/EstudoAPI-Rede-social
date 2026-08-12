const postModel = require("./postModel");
const userModel = require("./userModel");
const commentModel = require("./commentModel");
const reactionModel = require("./reactionModel");

// Isso monta o feed juntando cada post com seu autor, comentários e reações:
async function montar() {
  const posts = await postModel.listarTodos();
  const users = await userModel.listarTodos();
  const comments = await commentModel.listarTodos();
  const reactions = await reactionModel.listarTodos();

  return posts.map((post) => {
    const autorDoPost = users.find((u) => u.id === post.user_id);
    const reactionsDoPost = reactions.filter((r) => r.post_id === post.id);
    const likes = reactionsDoPost.filter((r) => r.type === "like").length;
    const dislikes = reactionsDoPost.filter((r) => r.type === "dislike").length;

    // O Postgres devolve as colunas em snake_case; o front-end espera camelCase.
    const commentsDoPost = comments
      .filter((c) => c.post_id === post.id)
      .map((c) => ({ id: c.id, postId: c.post_id, userId: c.user_id, text: c.text, createdAt: c.created_at }));

    const reactionsMapeadas = reactionsDoPost.map((r) => ({
      id: r.id,
      postId: r.post_id,
      userId: r.user_id,
      type: r.type,
    }));

    return {
      id: post.id,
      text: post.text,
      createdAt: post.created_at,
      user: autorDoPost
        ? { id: autorDoPost.id, name: autorDoPost.name, online: autorDoPost.online }
        : null,
      comments: commentsDoPost,
      reactions: reactionsMapeadas,
      likes,
      dislikes,
    };
  });
}

module.exports = { montar };
