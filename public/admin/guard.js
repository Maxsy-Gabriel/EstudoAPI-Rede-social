// Isso bloqueia a página de administração pra quem não é admin (roda antes do script.js):
(function () {
  var bruto = localStorage.getItem("lindosSocial.usuario");
  var usuario = null;

  try {
    usuario = bruto ? JSON.parse(bruto) : null;
  } catch (erro) {
    usuario = null;
  }

  if (!usuario) {
    window.location.replace("/");
  } else if (usuario.role !== "admin") {
    window.location.replace("/app");
  }
})();
