export async function listarUsuarios() {
  const res = await fetch("/users");
  return res.json();
}

export async function criarUsuario(name, username) {
  await fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username }),
  });
}

export async function deletarUsuario(id) {
  await fetch(`/users/${id}`, { method: "DELETE" });
}
