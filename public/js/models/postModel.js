export async function listarFeed(usuarioId) {
  const res = await fetch("/feed", {
    headers: usuarioId ? { "X-User-Id": usuarioId } : {},
  });
  return res.json();
}

export async function criarPost(userId, text) {
  await fetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, text }),
  });
}

export async function reagir(postId, userId, type) {
  await fetch(`/posts/${postId}/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type }),
  });
}

export async function responder(postId, userId, text) {
  await fetch(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, text }),
  });
}

export async function excluirPost(postId, adminId) {
  await fetch(`/posts/${postId}`, {
    method: "DELETE",
    headers: { "X-User-Id": adminId },
  });
}

export async function excluirComentario(postId, commentId, adminId) {
  await fetch(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    headers: { "X-User-Id": adminId },
  });
}
