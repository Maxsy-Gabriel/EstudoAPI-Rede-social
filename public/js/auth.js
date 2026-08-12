const CHAVE = "lindosSocial.usuario";

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
