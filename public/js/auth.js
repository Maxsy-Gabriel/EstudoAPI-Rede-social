const CHAVE = "lindosSocial.usuario";
const INTERVALO_HEARTBEAT_MS = 20000;

// Isso lê o usuário logado guardado no localStorage:
export function getUsuarioLogado() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

// Isso desloga o usuário e volta pra landing page:
export function logout() {
  localStorage.removeItem(CHAVE);
  window.location.href = "/";
}

// Isso avisa o backend que esse usuário está ativo agora (usado pra bolinha verde de online):
export function iniciarHeartbeat(usuario) {
  if (!usuario) return;

  const enviar = () => fetch(`/users/${usuario.id}/heartbeat`, { method: "POST" });
  enviar();
  setInterval(enviar, INTERVALO_HEARTBEAT_MS);
}
