const express = require("express");
const path = require("path");
const routes = require("./routes");

const app = express();

// Isso permite receber JSON no corpo das requisições (limite maior por causa da foto de perfil em base64):
app.use(express.json({ limit: "2mb" }));

// Isso registra cada requisição recebida no console:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Isso serve a landing page/login na raiz do site:
app.use(express.static(path.join(__dirname, "../public/landing")));

// Isso serve os arquivos estáticos do front-end:
app.use("/app", express.static(path.join(__dirname, "../public")));

// Isso conecta todas as rotas da API:
app.use(routes);

module.exports = app;
