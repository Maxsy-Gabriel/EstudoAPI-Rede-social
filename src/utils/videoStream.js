// Isso guarda o vídeo já decodificado em memória, pra não bater no banco nem
// re-decodificar o base64 inteiro a cada pedacinho (Range) que o player pede
// enquanto carrega/dá seek — sem isso, cada requisição de Range refazia tudo,
// o que deixava o carregamento lento e a barra de progresso do story fora de sincronia.
const CACHE_MAX_ENTRADAS = 15;
const cache = new Map(); // chave -> { mime, buffer }

function limparCacheSeNecessario() {
  if (cache.size > CACHE_MAX_ENTRADAS) {
    const primeiraChave = cache.keys().next().value;
    cache.delete(primeiraChave);
  }
}

// Isso remove um vídeo do cache (chamado depois de excluir o post/story dono dele,
// pra não continuar servindo o conteúdo antigo pela URL direta):
function invalidar(chave) {
  cache.delete(chave);
}

// Isso serve um vídeo com suporte a Range. `buscarDataUri` só é chamado (bate no banco)
// se ainda não tiver nada em cache pra essa chave:
async function servirVideo(req, res, chave, buscarDataUri) {
  let emCache = cache.get(chave);

  if (!emCache) {
    const dataUri = await buscarDataUri();
    if (!dataUri) {
      return res.status(404).end();
    }

    const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      return res.status(404).end();
    }

    const [, mime, base64] = match;
    emCache = { mime, buffer: Buffer.from(base64, "base64") };
    cache.set(chave, emCache);
    limparCacheSeNecessario();
  }

  const { mime, buffer } = emCache;
  const total = buffer.length;
  const range = req.headers.range;

  res.setHeader("Content-Type", mime || "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, max-age=3600");

  if (!range) {
    res.setHeader("Content-Length", total);
    return res.status(200).end(buffer);
  }

  const partes = range.match(/bytes=(\d*)-(\d*)/);
  const start = partes && partes[1] ? parseInt(partes[1], 10) : 0;
  const end = Math.min(partes && partes[2] ? parseInt(partes[2], 10) : total - 1, total - 1);

  if (Number.isNaN(start) || start >= total || start > end) {
    res.setHeader("Content-Range", `bytes */${total}`);
    return res.status(416).end();
  }

  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
  res.setHeader("Content-Length", end - start + 1);
  res.end(buffer.subarray(start, end + 1));
}

module.exports = { servirVideo, invalidar };
