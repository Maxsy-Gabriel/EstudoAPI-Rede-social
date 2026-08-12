export async function listarUsuarios() {
  const res = await fetch("/users");
  return res.json();
}
