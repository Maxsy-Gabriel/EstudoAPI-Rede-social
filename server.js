const http = require("http");
const app = require("./src/app");
const { initDb } = require("./src/config/db");
const socket = require("./src/socket");
const storyModel = require("./src/models/storyModel");

const PORT = process.env.PORT || 3000;
const INTERVALO_LIMPEZA_STORIES_MS = 15 * 60 * 1000;

// Isso cria um servidor HTTP "por fora" do Express, pra ele e o Socket.IO dividirem a mesma porta:
const servidorHttp = http.createServer(app);
socket.iniciar(servidorHttp);

// Isso cria as tabelas no banco e só depois liga o servidor:
initDb()
  .then(() => {
    servidorHttp.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });

    // Isso apaga os stories com mais de 24h agora e depois a cada 15min:
    storyModel.apagarExpirados();
    setInterval(storyModel.apagarExpirados, INTERVALO_LIMPEZA_STORIES_MS);
  })
  .catch((erro) => {
    console.error("Erro ao inicializar o banco:", erro);
    process.exit(1);
  });
