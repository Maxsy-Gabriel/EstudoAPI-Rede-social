import { getUsuarioLogado, logout, iniciarHeartbeat } from "../js/auth.js";
import { criarAvatar } from "../js/utils/dom.js";

const usuarioLogado = getUsuarioLogado();
const corpo = document.getElementById("admin-tabela-corpo");
const logoutBtn = document.getElementById("logout-btn");
const perfilLink = document.getElementById("perfil-link");

// Isso usa sempre o dado fresco do banco (não o que ficou salvo no localStorage) pro avatar:
async function atualizarAvatarTopnav() {
  const res = await fetch(`/users/${usuarioLogado.id}`);
  if (!res.ok) return;

  perfilLink.innerHTML = "";
  perfilLink.appendChild(criarAvatar(await res.json()));
}

async function carregarUsuarios() {
  try {
    const res = await fetch("/users/admin", {
      headers: { "X-User-Id": usuarioLogado.id },
    });

    if (!res.ok) {
      corpo.innerHTML = '<tr><td colspan="3" class="empty">Não foi possível carregar os usuários.</td></tr>';
      return;
    }

    renderizar(await res.json());
  } catch (erro) {
    corpo.innerHTML = '<tr><td colspan="3" class="empty">Não foi possível falar com o servidor.</td></tr>';
  }
}

function renderizar(usuarios) {
  corpo.innerHTML = "";

  usuarios.forEach((usuario) => {
    const tr = document.createElement("tr");

    const tdPessoa = document.createElement("td");
    const pessoa = document.createElement("div");
    pessoa.className = "admin-pessoa";

    const info = document.createElement("div");
    const nome = document.createElement("div");
    nome.textContent = usuario.name;
    const handle = document.createElement("div");
    handle.className = "person-handle";
    handle.textContent = `@${usuario.username}`;
    info.append(nome, handle);

    pessoa.append(criarAvatar(usuario), info);
    tdPessoa.appendChild(pessoa);

    const tdCargo = document.createElement("td");
    const select = document.createElement("select");

    [
      { valor: "user", rotulo: "Usuário" },
      { valor: "admin", rotulo: "Administrador" },
    ].forEach(({ valor, rotulo }) => {
      const option = document.createElement("option");
      option.value = valor;
      option.textContent = rotulo;
      option.selected = usuario.role === valor;
      select.appendChild(option);
    });

    select.disabled = usuario.id === usuarioLogado.id;
    select.addEventListener("change", () => alterarCargo(usuario.id, select.value));
    tdCargo.appendChild(select);

    const tdAcao = document.createElement("td");
    if (usuario.id !== usuarioLogado.id) {
      const btnExcluir = document.createElement("button");
      btnExcluir.type = "button";
      btnExcluir.className = "remove-btn";
      btnExcluir.textContent = "×";
      btnExcluir.setAttribute("aria-label", `Excluir ${usuario.name}`);
      btnExcluir.addEventListener("click", () => excluirUsuario(usuario));
      tdAcao.appendChild(btnExcluir);
    }

    tr.append(tdPessoa, tdCargo, tdAcao);
    corpo.appendChild(tr);
  });
}

async function alterarCargo(id, role) {
  await fetch(`/users/${id}/cargo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-User-Id": usuarioLogado.id },
    body: JSON.stringify({ role }),
  });
  await carregarUsuarios();
}

async function excluirUsuario(usuario) {
  const confirmou = window.confirm(`Excluir ${usuario.name} (@${usuario.username})? Isso não pode ser desfeito.`);
  if (!confirmou) return;

  await fetch(`/users/${usuario.id}`, {
    method: "DELETE",
    headers: { "X-User-Id": usuarioLogado.id },
  });
  await carregarUsuarios();
}

logoutBtn.addEventListener("click", logout);
iniciarHeartbeat(usuarioLogado);
atualizarAvatarTopnav();
carregarUsuarios();
