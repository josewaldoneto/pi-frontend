const API_BASE_URL = 'http://localhost:8080'; // ajuste para sua API

// Utilitário para pegar o ID do workspace da URL
function getWorkspaceIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Utilitário para pegar o token
function getToken() {
  return localStorage.getItem('authToken');
}

// Busca informações do workspace
async function fetchWorkspaceInfo(workspaceId) {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/workspace/info/${workspaceId}`, {
        headers: { 'Authorization': `${token}` }
    });
    if (!response.ok) throw new Error('Erro ao buscar informações do workspace');
    return await response.json();
}

// Preenche o header e a seção de boas-vindas
function renderWorkspaceHeader(info) {
    // document.getElementById('workspace-header-name').textContent = info.name;
    document.getElementById('workspace-name').textContent = info.name;
    document.getElementById('workspace-description').textContent = info.description || '';
}

// Exemplo de função para atualizar a data
function renderCurrentDate() {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('data-atual').textContent = dataAtual;
}

async function fetchUserWorkspaces() {
  const token = getToken();

  try {
    const response = await fetch(`${API_BASE_URL}/user/my-workspaces/list`, {
      method: 'GET',
      headers: {
        'Authorization': `${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar workspaces');
    }

    const workspaces = await response.json();
    return workspaces;
  } catch (error) {
    console.error(error);
    return [];
  }
}

function createWorkspaceNavitem(workspace) {
  const navitem = document.createElement('a');
  const currentId = getWorkspaceIdFromUrl();
  const isActive = String(workspace.id) === String(currentId);

  navitem.className = isActive ? 'nav-link active' : 'nav-link';
  navitem.setAttribute('href', `workspace.html?id=${workspace.id}`);

  navitem.innerHTML = `
    <i class="bi bi-graph-up-arrow"></i>
    <span>${workspace.name}</span>
  `;

  return navitem;
}

async function renderUserWorkspaces() {
  const container2 = document.getElementById('navbar-container');
  const workspaces = await fetchUserWorkspaces();

  workspaces.forEach(workspace => {
    const navitem = createWorkspaceNavitem(workspace);
    container2.appendChild(navitem);
  });
}

async function fetchTasks(workspaceId) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/task/list`, {
    headers: { 'Authorization': `${token}` }
  });
  if (!response.ok) throw new Error('Erro ao buscar tarefas');
  return await response.json();
}

async function createTask(workspaceId, taskData) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/task/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
    body: JSON.stringify(taskData)
  });
  if (!response.ok) throw new Error('Erro ao criar tarefa');
  return await response.json();
}

function createTaskCard(task) {
  return `
    <div class="col-md-4">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${task.title}</h5>
          <p class="card-text">${task.description || ''}</p>
          <p class="mb-1"><strong>Status:</strong> ${task.status}</p>
          <p class="mb-1"><strong>Prioridade:</strong> ${task.priority}</p>
          <p class="mb-1"><strong>Expira em:</strong> ${task.expiration_date ? new Date(task.expiration_date).toLocaleDateString('pt-BR') : 'Sem data'}</p>
          ${task.attachment ? `<a href="${task.attachment}" target="_blank">Ver anexo</a>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderTasks(tasks) {
  const container = document.getElementById('tasks-container');
  if (!tasks.length) {
    container.innerHTML = '<p class="text-muted">Nenhuma tarefa encontrada.</p>';
    return;
  }
  container.innerHTML = tasks.map(createTaskCard).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  const workspaceId = getWorkspaceIdFromUrl();
  const createTaskBtn = document.getElementById('createTaskBtn');
  const createTaskForm = document.getElementById('createTaskForm');
  const modal = new bootstrap.Modal(document.getElementById('createTaskModal'));

  // Listar tarefas ao carregar a página
  fetchTasks(workspaceId).then(renderTasks);

  createTaskBtn.addEventListener('click', async function() {
    // Coleta os dados do formulário
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) {
      alert('Título é obrigatório!');
      return;
    }
    const description = document.getElementById('taskDescription').value.trim();
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const expiration_date = document.getElementById('taskExpiration').value
      ? new Date(document.getElementById('taskExpiration').value).toISOString()
      : null;
    const attachment = document.getElementById('taskAttachment').value.trim();

    const taskData = {
      title,
      description,
      status,
      priority,
      expiration_date,
      attachment
    };

    createTaskBtn.disabled = true;
    createTaskBtn.textContent = 'Criando...';

    try {
      await createTask(workspaceId, taskData);
      modal.hide();
      createTaskForm.reset();
      // Atualiza a lista de tarefas
      const tasks = await fetchTasks(workspaceId);
      renderTasks(tasks);
    } catch (err) {
      alert('Erro ao criar tarefa.');
    } finally {
      createTaskBtn.disabled = false;
      createTaskBtn.textContent = 'Criar Tarefa';
    }
  });

  // Limpa o formulário ao fechar o modal
  document.getElementById('createTaskModal').addEventListener('hidden.bs.modal', function() {
    createTaskForm.reset();
  });
});


// Revisão de Código
document.getElementById('submitCodeReview').onclick = async function() {
  const token = getToken();
  const workspace_id = getWorkspaceIdFromUrl();
  const code = document.getElementById('codeInput').value.trim();
  const language = document.getElementById('codeLanguage').value.trim();
  const resultDiv = document.getElementById('codeReviewResult');
  resultDiv.innerHTML = 'Analisando...';

  try {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspace_id}/ai/code-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify({ code, language })
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      resultDiv.innerHTML = '<span class="text-danger">Erro ao ler resposta do servidor.</span>';
      return;
    }

    if (res.status === 200 && data) {
      resultDiv.innerHTML = `
        <strong>Revisão:</strong><br>${data.review || 'Sem revisão.'}
      `;
    } else {
      resultDiv.innerHTML = `<span class="text-danger">Erro: ${data?.error || 'Resposta inesperada.'}</span>`;
    }
  } catch (err) {
    resultDiv.innerHTML = '<span class="text-danger">Erro ao revisar código.</span>';
  }
};

// Resumir Texto
document.getElementById('submitSummarizeText').onclick = async function() {
  const token = getToken();
  const workspace_id = getWorkspaceIdFromUrl();
  const text = document.getElementById('textToSummarize').value.trim();
  const resultDiv = document.getElementById('summarizeTextResult');
  resultDiv.innerHTML = 'Resumindo...';

  try {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspace_id}/ai/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify({ text })
    });
    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      resultDiv.innerHTML = '<span class="text-danger">Erro ao ler resposta do servidor.</span>';
      return;
    }

    if (res.status === 200 && data) {
      resultDiv.innerHTML = `
        <strong>Resumo:</strong><br>${data.summary || 'Sem resumo.'}
      `;
    } else {
      resultDiv.innerHTML = `<span class="text-danger">Erro: ${data?.error || 'Resposta inesperada.'}</span>`;
    }
  } catch (err) {
    resultDiv.innerHTML = '<span class="text-danger">Erro ao revisar código.</span>';
  }
};

// Mapa Mental
document.getElementById('submitMindmap').onclick = async function() {
  const token = getToken();
  const workspace_id = getWorkspaceIdFromUrl();
  const text = document.getElementById('mindmapText').value.trim();
  const resultDiv = document.getElementById('mindmapResult');
  resultDiv.innerHTML = 'Gerando ideias...';

  try {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspace_id}/ai/mindmap-ideas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify({ text })
    });
    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      resultDiv.innerHTML = '<span class="text-danger">Erro ao ler resposta do servidor.</span>';
      return;
    }

    if (res.status === 200 && data) {
      resultDiv.innerHTML = `
        <strong>Mapa mental:</strong><br>${data.mind_map_ideas || 'Sem resumo.'}
      `;
    } else {
      resultDiv.innerHTML = `<span class="text-danger">Erro: ${data?.error || 'Resposta inesperada.'}</span>`;
    }
  } catch (err) {
    resultDiv.innerHTML = '<span class="text-danger">Erro ao revisar código.</span>';
  }
};

// Assistente de Tarefas
document.getElementById('submitTaskAssistant').onclick = async function() {
  const token = getToken();
  const user_message = document.getElementById('taskAssistantMessage').value.trim();
  const workspace_id = getWorkspaceIdFromUrl();
  const resultDiv = document.getElementById('taskAssistantResult');
  resultDiv.innerHTML = 'Consultando assistente...';

  try {
    const res = await fetch(`${API_BASE_URL}/workspace/${workspace_id}/ai/task-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify({ user_message, workspace_id })
    });
    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      resultDiv.innerHTML = '<span class="text-danger">Erro ao ler resposta do servidor.</span>';
      return;
    }

    if (res.status === 200 && data) {
      resultDiv.innerHTML = `
        <strong>Sugestão:</strong><br>${data.suggestions || 'Sem resumo.'}
      `;
    } else {
      resultDiv.innerHTML = `<span class="text-danger">Erro: ${data?.error || 'Resposta inesperada.'}</span>`;
    }
  } catch (err) {
    resultDiv.innerHTML = '<span class="text-danger">Erro ao revisar código.</span>';
  }
};

// Buscar membros do workspace
async function fetchWorkspaceMembers(workspaceId) {
  const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/members/list`, {
    headers: { 'Authorization': `${getToken()}` }
  });
  if (!res.ok) throw new Error('Erro ao buscar membros');
  return await res.json();
}

// Buscar todos os usuários
async function fetchAllUsers() {
  const res = await fetch(`${API_BASE_URL}/users/list`, {
    headers: { 'Authorization': `${getToken()}` }
  });
  if (!res.ok) throw new Error('Erro ao buscar usuários');
  return await res.json();
}

// Adicionar membro
async function addMember(workspaceId, userId, role, email) {
  const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/members/add`, {
    method: 'POST',
    headers: {
      'Authorization': `${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: userId, email, role })
  });
  if (!res.ok) throw new Error('Erro ao adicionar membro');
  return await res.json();
}

// Remover membro
async function removeMember(workspaceId, userId) {
  const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/members/remove`, {
    method: 'DELETE',
    headers: {
      'Authorization': `${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userFirebaseUid: userId })
  });
}

// Renderizar lista de membros
function renderMembersList(members, workspaceId) {
  const list = document.getElementById('membersList');
  if (!members.length) {
    list.innerHTML = '<li class="list-group-item text-muted">Nenhum membro.</li>';
    return;
  }
  list.innerHTML = members.map(m =>
    `<li class="list-group-item d-flex justify-content-between align-items-center">
      <span>
        <strong>${m.display_name}</strong> <small class="text-muted">(${m.email})</small>
        <span class="badge bg-secondary ms-2">${m.role}</span>
      </span>
      <button class="btn btn-sm btn-danger" onclick="handleRemoveMember('${m.user_id}')">
        <i class="bi bi-person-x"></i> Remover
      </button>
    </li>`
  ).join('');
  window._currentMembers = members;
}

// Preencher select de usuários para adicionar
function renderUsersSelect(users, members) {
  const select = document.getElementById('userToAdd');
  const memberIds = new Set(members.map(m => m.user_id));
  select.innerHTML = '<option value="">Selecione um usuário</option>' +
    users.filter(u => !memberIds.has(u.firebase_uid))
      .map(u => `<option value="${u.firebase_uid}">${u.display_name} (${u.email})</option>`)
      .join('');
}

// Atualizar modal de membros
async function updateMembersModal() {
  const workspaceId = getWorkspaceIdFromUrl();
  try {
    const [members, users] = await Promise.all([
      fetchWorkspaceMembers(workspaceId),
      fetchAllUsers()
    ]);
    renderMembersList(members, workspaceId);
    renderUsersSelect(users, members);
    document.getElementById('addMemberMsg').innerHTML = '';
  } catch (err) {
    document.getElementById('membersList').innerHTML = '<li class="list-group-item text-danger">Erro ao carregar membros.</li>';
  }
}

// Handler para remover membro
window.handleRemoveMember = async function(userId) {
  if (!confirm('Tem certeza que deseja remover este membro?')) return;
  const workspaceId = getWorkspaceIdFromUrl();
  try {
    await removeMember(workspaceId, userId);
    await updateMembersModal();
  } catch {
    alert('Erro ao remover membro.');
  }
};

// Handler para adicionar membro
document.getElementById('addMemberForm').onsubmit = async function(e) {
  e.preventDefault();
  const userId = document.getElementById('userToAdd').value;
  const role = document.getElementById('roleToAdd').value.trim();
  const workspaceId = getWorkspaceIdFromUrl();
  const msgDiv = document.getElementById('addMemberMsg');
  msgDiv.innerHTML = 'Adicionando...';

  // Busca o email do usuário selecionado
  const users = await fetchAllUsers();
  const user = users.find(u => u.firebase_uid === userId);
  const email = user ? user.email : '';

  try {
    await addMember(workspaceId, userId, role, email);
    msgDiv.innerHTML = '<span class="text-success">Membro adicionado!</span>';
    await updateMembersModal();
    this.reset();
  } catch {
    msgDiv.innerHTML = '<span class="text-danger">Erro ao adicionar membro.</span>';
  }
};

// Atualiza modal sempre que abrir
document.getElementById('membersModal').addEventListener('show.bs.modal', updateMembersModal);

// Função para atualizar workspace
async function updateWorkspace(workspaceId, name, description) {
  const res = await fetch(`${API_BASE_URL}/workspace/update/${workspaceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description })
  });
  if (res.status !== 200) throw new Error('Erro ao atualizar workspace');
}

// Função para deletar workspace
async function deleteWorkspace(workspaceId) {
  const res = await fetch(`${API_BASE_URL}/workspace/delete/${workspaceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `${getToken()}`
    }
  });
  if (res.status !== 204) throw new Error('Erro ao excluir workspace');
}

// Preencher o modal com os dados atuais do workspace
async function fillWorkspaceSettingsModal() {
  const workspaceId = getWorkspaceIdFromUrl();
  try {
    const info = await fetchWorkspaceInfo(workspaceId);
    document.getElementById('workspaceSettingsName').value = info.name;
    document.getElementById('workspaceSettingsDescription').value = info.description || '';
    document.getElementById('workspaceSettingsMsg').innerHTML = '';
  } catch {
    document.getElementById('workspaceSettingsMsg').innerHTML = '<span class="text-danger">Erro ao carregar dados do workspace.</span>';
  }
}

// Salvar alterações
document.getElementById('saveWorkspaceSettingsBtn').onclick = async function() {
  const workspaceId = getWorkspaceIdFromUrl();
  const name = document.getElementById('workspaceSettingsName').value.trim();
  const description = document.getElementById('workspaceSettingsDescription').value.trim();
  const msgDiv = document.getElementById('workspaceSettingsMsg');
  msgDiv.innerHTML = 'Salvando...';

  try {
    await updateWorkspace(workspaceId, name, description);
    msgDiv.innerHTML = '<span class="text-success">Alterações salvas!</span>';
    // Atualiza o nome/descrição na tela principal
    document.getElementById('workspace-header-name').textContent = name;
    document.getElementById('workspace-name').textContent = name;
    document.getElementById('workspace-description').textContent = description;
  } catch {
    msgDiv.innerHTML = '<span class="text-danger">Erro ao salvar alterações.</span>';
  }
};

// Excluir workspace
document.getElementById('deleteWorkspaceBtn').onclick = async function() {
  if (!confirm('Tem certeza que deseja excluir este workspace? Esta ação não pode ser desfeita.')) return;
  const workspaceId = getWorkspaceIdFromUrl();
  const msgDiv = document.getElementById('workspaceSettingsMsg');
  msgDiv.innerHTML = 'Excluindo...';

  try {
    await deleteWorkspace(workspaceId);
    msgDiv.innerHTML = '<span class="text-success">Workspace excluído!</span>';
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  } catch {
    msgDiv.innerHTML = '<span class="text-danger">Erro ao excluir workspace.</span>';
  }
};

// Preencher modal ao abrir
document.getElementById('workspaceSettingsModal').addEventListener('show.bs.modal', fillWorkspaceSettingsModal);

// Função principal
async function main() {
    renderCurrentDate();
    const workspaceId = getWorkspaceIdFromUrl();
    if (!workspaceId) {
        alert('Workspace não encontrado!');
        window.location.href = 'index.html';
        return;
    }
    try {
        const info = await fetchWorkspaceInfo(workspaceId);
        renderWorkspaceHeader(info);
    } catch (err) {
        alert('Erro ao carregar workspace.');
        window.location.href = 'index.html';
    }
    renderUserWorkspaces();
}

document.addEventListener('DOMContentLoaded', main);