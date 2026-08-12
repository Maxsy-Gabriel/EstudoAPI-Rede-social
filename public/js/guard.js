// Isso bloqueia o acesso à página do feed pra quem não está logado (roda antes do app.js):
(function () {
  if (!localStorage.getItem("lindosSocial.usuario")) {
    window.location.replace("/");
  }
})();
