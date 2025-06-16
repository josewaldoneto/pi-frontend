const API_BASE_URL = 'http://localhost:8080'; // ajuste para sua API

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    if (!checkAuthentication()) {
        return;
    }
    renderCurrentDate();
    getUserInfo();
    renderUserWorkspaces()
});

async function logout() {
    try {
        const token = getAuthToken();
        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('isLoggedIn');
        firebase.auth().signOut().then(() => {
            window.location.href = 'login.html';
        });
    } catch (error) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Exemplo de uso do token em requests protegidas:
async function getUserInfo() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/user/info`, {
        method: 'GET',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    const usuarioAtual = data.display_name
    document.getElementById('usuario-atual').textContent = usuarioAtual;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname;
    
    // Páginas que não precisam de autenticação
    const publicPages = ['/login.html', '/register.html'];
    const isPublicPage = publicPages.some(page => currentPage.includes(page));
    
    if (!isLoggedIn && !isPublicPage) {
        // Usuário não está logado e está tentando acessar página protegida
        window.location.href = 'login.html';
        return false;
    }
    
    if (isLoggedIn && isPublicPage) {
        // Usuário já está logado e está tentando acessar página de login/registro
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Funcionalidades da sidebar
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleMain = document.getElementById('sidebarToggleMain');
    
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);
    
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }
    
    // Event listeners
    if (sidebarToggleMain) {
        sidebarToggleMain.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Fecha a sidebar ao clicar no overlay
    overlay.addEventListener('click', toggleSidebar);
    
    // Fecha a sidebar ao redimensionar a janela para desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 992) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Estado ativo do link de navegação
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove a classe active de todos os links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Adiciona a classe active ao link clicado
            this.classList.add('active');
            
            // Fecha a sidebar no mobile após o clique
            if (window.innerWidth < 992) {
                toggleSidebar();
            }
        });
    });
    
    // Animações para os cartões
    const cards = document.querySelectorAll('.dashboard-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
    
    // Adiciona interações de clique aos botões
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.getAttribute('href') && !this.type === 'submit') {
                e.preventDefault();
                
                // Adiciona feedback visual
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
                
                // Log da ação do botão (para demonstração)
                console.log('Botão clicado:', this.textContent.trim());
            }
        });
    });
    
    // Animações das barras de progresso
    const progressBars = document.querySelectorAll('.progress-bar');
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.transition = 'width 1s ease-out';
                    bar.style.width = width;
                }, 200);
            }
        });
    });
    
    progressBars.forEach(bar => progressObserver.observe(bar));
    
    // Interações dos itens de tarefa
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.backgroundColor = '#e0f2fe';
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 200);
        });
    });
    
    // Interações dos itens de arquivo
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Arquivo clicado:', this.querySelector('span').textContent);
        });
    });
    
    // Interações dos membros da equipe
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('click', function() {
            const name = this.querySelector('.fw-medium').textContent;
            console.log('Membro da equipe clicado:', name);
        });
    });
});

// Funções utilitárias
function showNotification(message, type = 'info') {
    // Cria elemento de notificação
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Exemplo de função para atualizar a data
function renderCurrentDate() {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('data-atual').textContent = dataAtual;
}

async function fetchUserWorkspaces() {
  const token = localStorage.getItem('authToken');

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

function createWorkspaceCard(workspace) {
  const card = document.createElement('div');
  card.className = 'col-lg-6';

  card.innerHTML = `
    <div class="card dashboard-card h-100">
    <div class="card-header">
    <div class="d-flex align-items-center">
    <div class="icon-wrapper bg-danger bg-opacity-10 me-3">
    <i class="bi bi-graph-up-arrow text-danger"></i>
    </div>
    <h5 class="card-title mb-0">${workspace.name}</h5>
    </div>
    </div>
    <div class="card-body">
    <p class="text-muted mb-3">
    Papel: ${workspace.user_role}
    </p>
    <p class="text-muted mb-3">
    ${workspace.is_owner ? 'Você é o dono' : ''}
    </p>
    <button onclick="openWorkspace(${workspace.id})" class="btn btn-outline-danger btn-sm">
    <i class="bi bi-bar-chart me-1"></i>
    Abrir Workspace
    </button>
    </div>
  `;

  return card;
}

function openWorkspace(workspaceId) {
  window.location.href = `workspace.html?id=${workspaceId}`;
}

function createWorkspaceNavitem(workspace) {
  const navitem = document.createElement('a');
  navitem.className = 'nav-link';
  navitem.setAttribute('href', `workspace.html?id=${workspace.id}`);

  navitem.innerHTML = `
    <i class="bi bi-graph-up-arrow"></i>
    <span>${workspace.name}</span>
  `;

  return navitem;
}

async function renderUserWorkspaces() {
  const container = document.getElementById('workspaces-container');
  const container2 = document.getElementById('navbar-container');
  container.innerHTML = '<p>Carregando...</p>';

  const workspaces = await fetchUserWorkspaces();

  container.innerHTML = ''; // Limpa o loading

  if (workspaces.length === 0) {
    container.innerHTML = '<p>Nenhum workspace encontrado.</p>';
    return;
  }

  workspaces.forEach(workspace => {
    const card = createWorkspaceCard(workspace);
    container.appendChild(card);
  });
  workspaces.forEach(workspace => {
    const navitem = createWorkspaceNavitem(workspace);
    container2.appendChild(navitem);
  });
}

// Função para criar workspace
async function createWorkspace(workspaceData) {
  const token = localStorage.getItem('authToken');
  try {
    const response = await fetch(`${API_BASE_URL}/workspace/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify(workspaceData)
    });

    if (!response.ok) {
      throw new Error('Erro ao criar workspace');
    }

    const newWorkspace = await response.json();
    return newWorkspace;
  } catch (error) {
    console.error('Erro ao criar workspace:', error);
    alert('Erro ao criar workspace. Tente novamente.');
    return null;
  }
}

// Event listener para o botão de criar workspace
document.addEventListener('DOMContentLoaded', function() {
  const createWorkspaceBtn = document.getElementById('createWorkspaceBtn');
  const createWorkspaceForm = document.getElementById('createWorkspaceForm');
  const modal = new bootstrap.Modal(document.getElementById('createWorkspaceModal'));

  createWorkspaceBtn.addEventListener('click', async function() {
    // Validação básica
    const name = document.getElementById('workspaceName').value.trim();
    if (!name) {
      alert('Nome do workspace é obrigatório!');
      return;
    }

    // Coleta os dados do formulário
    const workspaceData = {
      name: name,
      description: document.getElementById('workspaceDescription').value.trim(),
      is_public: document.getElementById('isPublic').checked
    };

    // Desabilita o botão durante a requisição
    createWorkspaceBtn.disabled = true;
    createWorkspaceBtn.textContent = 'Criando...';

    // Chama a função para criar o workspace
    const newWorkspace = await createWorkspace(workspaceData);

    if (newWorkspace) {
      // Sucesso - fecha o modal e limpa o formulário
      modal.hide();
      createWorkspaceForm.reset();
      
      // Atualiza a lista de workspaces
      renderUserWorkspaces();
      
      alert('Workspace criado com sucesso!');
    }

    // Reabilita o botão
    createWorkspaceBtn.disabled = false;
    createWorkspaceBtn.textContent = 'Criar Workspace';
  });

  // Limpa o formulário quando o modal é fechado
  document.getElementById('createWorkspaceModal').addEventListener('hidden.bs.modal', function() {
    createWorkspaceForm.reset();
  });
});