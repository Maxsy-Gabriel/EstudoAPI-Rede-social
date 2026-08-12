// Isso bloqueia a página de perfil pra quem não está logado (roda antes do script.js):
(function () {
  if (!localStorage.getItem("lindosSocial.usuario")) {
    window.location.replace("/");
  }
})();
