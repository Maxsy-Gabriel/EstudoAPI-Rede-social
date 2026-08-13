const { Server } = require("socket.io");

let io = null;

// Isso liga o Socket.IO no mesmo servidor HTTP do Express (mesma porta, sem serviço novo):
function iniciar(servidorHttp) {
  io = new Server(servidorHttp);

  io.on("connection", (socket) => {
    const userId = Number(socket.handshake.auth?.userId);

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Isso coloca cada usuário numa "sala" só dele, pra mandar mensagem direto pro destinatário certo:
    socket.join(`user:${userId}`);
  });
}

// Isso avisa em tempo real quem estiver com o site aberto que chegou mensagem nova:
function notificarNovaMensagem(mensagem) {
  if (!io) return;
  io.to(`user:${mensagem.senderId}`).to(`user:${mensagem.recipientId}`).emit("nova-mensagem", mensagem);
}

module.exports = { iniciar, notificarNovaMensagem };
