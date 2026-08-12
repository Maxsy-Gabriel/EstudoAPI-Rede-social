# Lindos Social API — Etapa Inicial

Projeto de treinamento com **Node.js + ExpressJS**.

Nesta etapa temos apenas:

- estrutura inicial do projeto;
- Express configurado;
- middleware para JSON;
- middleware de log;
- bases de dados em memória;
- uma rota inicial;
- histórias comentadas para os próximos exercícios.

Nenhum CRUD foi implementado ainda.

## Instalação

```bash
npm install
```

## Execução

```bash
npm start
```

Ou, durante o desenvolvimento:

```bash
npm run dev
```

Servidor:

```text
http://localhost:3000
```

## Teste inicial

```http
GET /
```

Resposta:

```json
{
  "message": "Mini Rede Social API",
  "status": "online"
}
```

## Dados em memória

O projeto possui quatro arrays:

```text
users
posts
comments
reactions
```

Eles funcionam como nosso banco de dados temporário.

Ao reiniciar o servidor, todas as alterações são perdidas.

## Relacionamentos

```text
User
 |
 +---- Post
 |      |
 |      +---- Comment
 |      |
 |      +---- Reaction
 |
 +---- Comment
 |
 +---- Reaction
```

Os relacionamentos são feitos por IDs:

```javascript
post.userId
comment.userId
comment.postId
reaction.userId
reaction.postId
```

## Próximas etapas

Dentro de `server.js` existem histórias comentadas para implementar gradualmente:

1. listar usuários;
2. buscar usuário por id;
3. criar usuário;
4. listar posts;
5. criar post;
6. comentar em post;
7. like/dislike;
8. montar feed completo.

A ideia é desenvolver cada história durante o treinamento, explicando os conceitos envolvidos antes de avançar para a próxima.
