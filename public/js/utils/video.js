// Isso lê a duração de um arquivo de vídeo sem precisar mandar ele pro servidor:
export function lerDuracaoDoVideo(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Arquivo não é um vídeo válido"));
    video.src = URL.createObjectURL(file);
  });
}

// Isso converte o arquivo em data URI base64 (vídeo não dá pra recomprimir no navegador):
export function arquivoParaDataUri(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o vídeo"));
    leitor.onload = () => resolve(leitor.result);
    leitor.readAsDataURL(file);
  });
}
