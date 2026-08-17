export async function listarUsuarios() {
  const res = await fetch("/users");
  return res.json();
}

export async function seguir(id, solicitanteId) {
  await fetch(`/users/${id}/seguir`, {
    method: "POST",
    headers: { "X-User-Id": solicitanteId },
  });
}

export async function deixarDeSeguir(id, solicitanteId) {
  await fetch(`/users/${id}/seguir`, {
    method: "DELETE",
    headers: { "X-User-Id": solicitanteId },
  });
}
