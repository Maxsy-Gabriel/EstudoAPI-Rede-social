// Isso lê um arquivo de imagem do disco e devolve o <img> já carregado:
function lerImagem(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida"));
      img.onload = () => resolve(img);
      img.src = leitor.result;
    };
    leitor.readAsDataURL(file);
  });
}

// Isso recorta a imagem em quadrado e reduz o tamanho (usado no avatar de perfil):
export async function redimensionarQuadrado(file, tamanho = 256) {
  const img = await lerImagem(file);
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext("2d");

  const lado = Math.min(img.width, img.height);
  const sx = (img.width - lado) / 2;
  const sy = (img.height - lado) / 2;
  ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamanho, tamanho);

  return canvas.toDataURL("image/jpeg", 0.85);
}

// Isso reduz a imagem mantendo a proporção original, sem cortar (usado nas fotos de post):
export async function redimensionarParaPost(file, ladoMaximo = 1280) {
  const img = await lerImagem(file);
  const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
  const largura = Math.round(img.width * escala);
  const altura = Math.round(img.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext("2d").drawImage(img, 0, 0, largura, altura);

  return canvas.toDataURL("image/jpeg", 0.82);
}
