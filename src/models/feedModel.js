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
}

module.exports = { montar };
