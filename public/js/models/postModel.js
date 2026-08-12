export async function listarFeed() {
  const res = await fetch("/feed");
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
