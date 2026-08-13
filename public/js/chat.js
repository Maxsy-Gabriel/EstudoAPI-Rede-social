import { criarAvatar } from "./utils/dom.js";

// Isso monta a barrinha de chat (estilo LinkedIn) e liga tudo: lista de pessoas, conversa e tempo real.
export function iniciarChat(usuarioLogado) {
  if (!usuarioLogado) return;

  const elementos = criarBarraDeChat();
  const socket = window.io({ auth: { userId: usuarioLogado.id } });

  let pessoas = [];
  let conversaAbertaComId = null;
  const idsRenderizados = new Set();

  function horaCurta(iso) {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function marcarNaoLida() {
    if (elementos.painel.classList.contains("hidden")) {
      elementos.badge.classList.remove("hidden");
    }
  }

  async function carregarPessoas() {
    const res = await fetch("/users");
    const usuarios = await res.json();
    pessoas = usuarios.filter((u) => u.id !== usuarioLogado.id);
    renderizarListaDePessoas();
  }

  function renderizarListaDePessoas() {
    elementos.lista.innerHTML = "";

    if (pessoas.length === 0) {
      const vazio = document.createElement("p");
      vazio.className = "chat-vazio";
      vazio.textContent = "Não tem mais ninguém por aqui ainda.";
      elementos.lista.appendChild(vazio);
      return;
    }

    pessoas.forEach((pessoa) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "chat-pessoa";

      const info = document.createElement("span");
      info.className = "person-info";
      const nome = document.createElement("span");
      nome.className = "person-name";
      nome.textContent = pessoa.name;
      info.appendChild(nome);

      item.append(criarAvatar(pessoa), info);
      item.addEventListener("click", () => abrirConversa(pessoa));
      elementos.lista.appendChild(item);
    });
  }

  async function abrirConversa(pessoa) {
    conversaAbertaComId = pessoa.id;
    idsRenderizados.clear();

    elementos.lista.classList.add("hidden");
    elementos.janela.classList.remove("hidden");
    elementos.janelaTitulo.textContent = pessoa.name;
    elementos.mensagens.innerHTML = "";
    mostrarAviso(elementos.mensagens, "Carregando...");

    const res = await fetch(`/messages/${pessoa.id}`, {
      headers: { "X-User-Id": usuarioLogado.id },
    });
    const historico = await res.json();

    elementos.mensagens.innerHTML = "";
    historico.forEach(adicionarBolha);
    elementos.input.disabled = false;
    elementos.input.focus();
    rolarParaFinal();
  }

  function voltarParaLista() {
    conversaAbertaComId = null;
    elementos.janela.classList.add("hidden");
    elementos.lista.classList.remove("hidden");
  }

  function adicionarBolha(mensagem) {
    if (idsRenderizados.has(mensagem.id)) return;
    idsRenderizados.add(mensagem.id);

    const bolha = document.createElement("div");
    bolha.className = "chat-bolha " + (mensagem.senderId === usuarioLogado.id ? "chat-bolha-minha" : "chat-bolha-outro");

    const texto = document.createElement("p");
    texto.textContent = mensagem.text;

    const hora = document.createElement("span");
    hora.className = "chat-bolha-hora";
    hora.textContent = horaCurta(mensagem.createdAt);

    bolha.append(texto, hora);
    elementos.mensagens.appendChild(bolha);
  }

  function rolarParaFinal() {
    elementos.mensagens.scrollTop = elementos.mensagens.scrollHeight;
  }

  function mostrarAviso(container, texto) {
    const p = document.createElement("p");
    p.className = "chat-vazio";
    p.textContent = texto;
    container.appendChild(p);
  }

  elementos.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = elementos.input.value.trim();
    if (!texto || !conversaAbertaComId) return;

    const destinatarioId = conversaAbertaComId;
    elementos.input.value = "";

    // Isso mostra a mensagem na hora, sem esperar o servidor confirmar:
    adicionarBolha({
      id: `otimista-${Date.now()}`,
      senderId: usuarioLogado.id,
      recipientId: destinatarioId,
      text: texto,
      createdAt: new Date().toISOString(),
    });
    rolarParaFinal();

    await fetch(`/messages/${destinatarioId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": usuarioLogado.id },
      body: JSON.stringify({ text: texto }),
    });
  });

  elementos.botaoVoltar.addEventListener("click", voltarParaLista);

  elementos.toggle.addEventListener("click", () => {
    const estavaFechado = elementos.painel.classList.contains("hidden");
    elementos.painel.classList.toggle("hidden");
    if (estavaFechado) {
      elementos.badge.classList.add("hidden");
    }
  });

  socket.on("nova-mensagem", (mensagem) => {
    // A mensagem que eu mesmo mandei já apareceu na hora (otimista) — isso aqui é só o eco do servidor:
    if (mensagem.senderId === usuarioLogado.id) return;

    if (mensagem.senderId === conversaAbertaComId && !elementos.painel.classList.contains("hidden")) {
      adicionarBolha(mensagem);
      rolarParaFinal();
    } else {
      marcarNaoLida();
    }
  });

  carregarPessoas();
}

// Isso cria o HTML da barrinha inteira (bem no canto inferior direito, igual LinkedIn):
function criarBarraDeChat() {
  const bar = document.createElement("div");
  bar.className = "chat-bar";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "chat-bar-toggle";
  toggle.innerHTML = "Mensagens";
  const badge = document.createElement("span");
  badge.className = "chat-badge hidden";
  toggle.appendChild(badge);

  const painel = document.createElement("div");
  painel.className = "chat-painel hidden";

  const lista = document.createElement("div");
  lista.className = "chat-lista";

  const janela = document.createElement("div");
  janela.className = "chat-janela hidden";

  const janelaTopo = document.createElement("div");
  janelaTopo.className = "chat-janela-topo";
  const botaoVoltar = document.createElement("button");
  botaoVoltar.type = "button";
  botaoVoltar.className = "chat-voltar";
  botaoVoltar.textContent = "←";
  botaoVoltar.setAttribute("aria-label", "Voltar pra lista");
  const janelaTitulo = document.createElement("span");
  janelaTitulo.className = "chat-janela-titulo";
  janelaTopo.append(botaoVoltar, janelaTitulo);

  const mensagens = document.createElement("div");
  mensagens.className = "chat-mensagens";

  const form = document.createElement("form");
  form.className = "chat-form";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Escreva uma mensagem...";
  input.disabled = true;
  input.maxLength = 1000;
  const botaoEnviar = document.createElement("button");
  botaoEnviar.type = "submit";
  botaoEnviar.textContent = "Enviar";
  form.append(input, botaoEnviar);

  janela.append(janelaTopo, mensagens, form);
  painel.append(lista, janela);
  bar.append(painel, toggle);
  document.body.appendChild(bar);

  return { bar, toggle, badge, painel, lista, janela, janelaTitulo, botaoVoltar, mensagens, form, input };
}
