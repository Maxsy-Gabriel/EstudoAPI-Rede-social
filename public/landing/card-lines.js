// Isso desenha as linhas de circuito ligando cada ícone flutuante à borda do card da Ana
// Beatriz. Diferente do fundo (imagem estática) e dos ícones (fixos em % da tela), o card é
// um elemento de layout de verdade — ele muda de posição em cada tamanho de tela. Por isso a
// linha só pode "tocar" a borda real dele medindo a posição com JS, não com % fixo em CSS.
// Em tablet/mobile os ícones somem via CSS (a % fixa deixa de bater quando o card desce pra
// baixo do texto) — esse script detecta isso e também para de desenhar as linhas.
(function () {
  const svg = document.querySelector(".card-lines");
  const card = document.getElementById("preview-card");
  const icones = Array.from(document.querySelectorAll(".overlay-icon"));

  if (!svg || !card || icones.length === 0) return;

  // Isso acha o ponto na borda de um retângulo (o card) mais perto de um ponto externo,
  // pra linha sempre "encostar" na moldura do card, não atravessar por dentro dele.
  function pontoNaBorda(rect, x, y) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = x - cx;
    const dy = y - cy;

    if (dx === 0 && dy === 0) return { x: cx, y: cy };

    const halfW = rect.width / 2;
    const halfH = rect.height / 2;

    const escalaX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
    const escalaY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
    const escala = Math.min(escalaX, escalaY);

    return { x: cx + dx * escala, y: cy + dy * escala };
  }

  // Isso acha um ponto nomeado de um retângulo (meio de um lado, ou um dos cantos),
  // definido no atributo data-lado/data-lado-card de cada ícone — a linha sai/chega sempre
  // naquele ponto exato, não num ponto calculado por ângulo:
  function pontoNomeado(rect, nome) {
    switch (nome) {
      case "esquerda":
        return { x: rect.left, y: rect.top + rect.height / 2 };
      case "direita":
        return { x: rect.right, y: rect.top + rect.height / 2 };
      case "cima":
        return { x: rect.left + rect.width / 2, y: rect.top };
      case "canto-superior-esquerdo":
        return { x: rect.left, y: rect.top };
      case "canto-superior-direito":
        return { x: rect.right, y: rect.top };
      case "canto-inferior-esquerdo":
        return { x: rect.left, y: rect.bottom };
      case "canto-inferior-direito":
        return { x: rect.right, y: rect.bottom };
      // Ponto a meio caminho entre o canto e o centro do card (1/4 da largura/altura
      // a partir da borda, pra DENTRO do card, não colado no canto nem no meio do lado):
      case "quarto-superior-esquerdo":
        return { x: rect.left + rect.width / 4, y: rect.top + rect.height / 4 };
      case "quarto-superior-direito":
        return { x: rect.right - rect.width / 4, y: rect.top + rect.height / 4 };
      case "quarto-inferior-esquerdo":
        return { x: rect.left + rect.width / 4, y: rect.bottom - rect.height / 4 };
      case "quarto-inferior-direito":
        return { x: rect.right - rect.width / 4, y: rect.bottom - rect.height / 4 };
      // Ponto EM CIMA da borda (não pra dentro do card), deslocado do meio do lado em
      // direção a um dos cantos — usado quando a linha entra pelo lado de cima/baixo:
      case "borda-superior-quarto-esquerdo":
        return { x: rect.left + rect.width / 4, y: rect.top };
      case "borda-superior-quarto-direito":
        return { x: rect.right - rect.width / 4, y: rect.top };
      case "borda-inferior-quarto-esquerdo":
        return { x: rect.left + rect.width / 4, y: rect.bottom };
      case "borda-inferior-quarto-direito":
        return { x: rect.right - rect.width / 4, y: rect.bottom };
      case "baixo":
      default:
        return { x: rect.left + rect.width / 2, y: rect.bottom };
    }
  }

  // Isso monta um caminho em "cotovelo" (estilo circuito): primeiro sai reto, perpendicular
  // à face do ícone de onde partiu, e só depois vira na direção do card — em vez de já
  // sair enviesado, o que ficaria estranho partindo do meio exato de uma borda.
  function caminhoCotovelo(origem, destino, lado) {
    const dx = destino.x - origem.x;
    const dy = destino.y - origem.y;

    if (lado === "esquerda" || lado === "direita") {
      const meioX = origem.x + dx * 0.55;
      return `M ${origem.x} ${origem.y} L ${meioX} ${origem.y} L ${meioX} ${destino.y} L ${destino.x} ${destino.y}`;
    }

    const meioY = origem.y + dy * 0.55;
    return `M ${origem.x} ${origem.y} L ${origem.x} ${meioY} L ${destino.x} ${meioY} L ${destino.x} ${destino.y}`;
  }

  function redesenhar() {
    const rectCard = card.getBoundingClientRect();
    const larguraTela = window.innerWidth;
    const alturaTela = window.innerHeight;

    svg.setAttribute("viewBox", `0 0 ${larguraTela} ${alturaTela}`);
    svg.setAttribute("width", larguraTela);
    svg.setAttribute("height", alturaTela);
    svg.innerHTML = "";

    // Em tablet/mobile os ícones ficam com display:none (ver CSS) — sem eles, não desenha
    // as linhas também, já que não têm mais pra onde apontar:
    const primeiroIcone = icones[0];
    if (getComputedStyle(primeiroIcone).display === "none") return;

    icones.forEach((icone) => {
      const rectIcone = icone.getBoundingClientRect();
      const centroIcone = {
        x: rectIcone.left + rectIcone.width / 2,
        y: rectIcone.top + rectIcone.height / 2,
      };

      // A linha sai bem do meio de um lado do ícone (esquerda/direita/cima/baixo,
      // definido em data-lado no HTML) e para na borda do card. Por padrão o ponto de
      // chegada é o mais próximo do ícone (pode cair numa lateral); se o ícone tiver
      // data-lado-card, a linha força a chegada por aquele lado específico do card:
      const lado = icone.dataset.lado || "baixo";
      const ladoCard = icone.dataset.ladoCard;
      const origem = pontoNomeado(rectIcone, lado);
      const destino = ladoCard ? pontoNomeado(rectCard, ladoCard) : pontoNaBorda(rectCard, centroIcone.x, centroIcone.y);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", caminhoCotovelo(origem, destino, lado));
      svg.appendChild(path);

      // Ponto de luz no encaixe da linha com o ícone, tipo uma faísca de conexão:
      const faisca = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      faisca.setAttribute("class", "line-spark");
      faisca.setAttribute("cx", origem.x);
      faisca.setAttribute("cy", origem.y);
      faisca.setAttribute("r", 3);
      svg.appendChild(faisca);
    });
  }

  // Isso evita redesenhar a cada pixel durante o resize (mais leve, sem travar o scroll):
  let pendente = null;
  function agendarRedesenho() {
    if (pendente) cancelAnimationFrame(pendente);
    pendente = requestAnimationFrame(redesenhar);
  }

  window.addEventListener("load", redesenhar);
  window.addEventListener("resize", agendarRedesenho);

  if (document.readyState === "complete") {
    redesenhar();
  }
})();

