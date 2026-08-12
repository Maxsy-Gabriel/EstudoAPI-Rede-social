const app = require("./src/app");
const { initDb } = require("./src/config/db");

const PORT = process.env.PORT || 3000;

// Isso cria as tabelas no banco e só depois liga o servidor:
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((erro) => {
    console.error("Erro ao inicializar o banco:", erro);
    process.exit(1);
  });
