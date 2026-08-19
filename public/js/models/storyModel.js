export async function listarStories() {
  const res = await fetch("/stories");
  return res.json();
}

export async function criarStory(userId, text, image, video) {
  const res = await fetch("/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, text, image, video }),
  });
  return res.json();
}

export async function excluirStory(storyId, adminId) {
  await fetch(`/stories/${storyId}`, {
    method: "DELETE",
    headers: { "X-User-Id": adminId },
  });
}
