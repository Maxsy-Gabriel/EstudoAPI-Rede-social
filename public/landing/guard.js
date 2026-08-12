// Isso manda quem já está logado direto pro feed, sem passar pela landing:
(function () {
  if (localStorage.getItem("lindosSocial.usuario")) {
    window.location.replace("/app");
  }
})();
