/**
 * Cliente/Empresa Panel JavaScript
 * Painel CRM para empresas/vistoriadores
 */

// Theme Manager - Dark/Light Mode
import ThemeManager from './themeManager.js';

// ============================================
// CONFIGURACAO E VARIAVEIS GLOBAIS
// ============================================
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`;

let currentUser = null;
let currentEmpresa = null;
let currentSection = 'dashboard';

// ============================================
// APP OBJETO GLOBAL
// ============================================
const clienteApp = {
  backToEmail() {
    showStep('stepEmail');
  },

  forgotPassword() {
    alert('Por favor, entre em contato com o suporte para recuperar sua senha.');
  }
};

// Expor globalmente
window.clienteApp = clienteApp;

// ============================================
// INICIALIZACAO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Verificar se ha token salvo
  const token = localStorage.getItem('clienteToken');

  if (token) {
    // Verificar se token ainda e valido
    verificarSessao();
  } else {
    showLoginScreen();
  }

  // Event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Login form - Step 1: Email
  document.getElementById('emailForm')?.addEventListener('submit', handleEmailSubmit);

  // Login form - Step 2: Criar Senha (primeiro acesso)
  document.getElementById('createPasswordForm')?.addEventListener('submit', handleCriarSenha);

  // Login form - Step 3: Login com senha
  document.getElementById('passwordForm')?.addEventListener('submit', handleLogin);

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', handleNavigation);
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // Menu toggle mobile
  document.getElementById('menuToggle')?.addEventListener('click', toggleSidebar);

  // Empresa form
  document.getElementById('empresaForm')?.addEventListener('submit', handleSaveEmpresa);

  // Salvar Horarios
  document.getElementById('btnSalvarHorarios')?.addEventListener('click', handleSaveHorarios);

  // Alterar Senha
  document.getElementById('btnAlterarSenha')?.addEventListener('click', handleAlterarSenha);

  // Filtros de agendamentos
  document.getElementById('btnFiltrar')?.addEventListener('click', loadAgendamentos);

  // Buscar CEP
  document.getElementById('btnBuscarCep')?.addEventListener('click', buscarCep);

  // Modal close
  document.getElementById('closeAgendamentoModal')?.addEventListener('click', closeModal);
}

// ============================================
// AUTENTICACAO
// ============================================
async function handleEmailSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const errorEl = document.getElementById('emailError');
  const btn = e.target.querySelector('button[type="submit"]');

  if (!email) {
    showFieldError(errorEl, 'Digite seu email');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verificando...';

  try {
    const response = await fetch(`${API_URL}/empresa/auth/verificar-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Email nao encontrado');
    }

    // Salvar email para proximo passo
    localStorage.setItem('loginEmail', email);

    if (data.primeiro_acesso) {
      // Mostrar tela de criar senha
      document.getElementById('welcomeName').textContent = data.nome;
      document.getElementById('welcomeEmpresa').textContent = data.empresa_nome;
      document.getElementById('createEmail').value = email;
      showStep('stepCreatePassword');
    } else {
      // Mostrar tela de login normal
      document.getElementById('emailDisplay').textContent = email;
      document.getElementById('passwordEmail').value = email;
      showStep('stepPassword');
    }

    hideFieldError(errorEl);

  } catch (err) {
    showFieldError(errorEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Continuar';
  }
}

async function handleCriarSenha(e) {
  e.preventDefault();

  const email = document.getElementById('createEmail').value || localStorage.getItem('loginEmail');
  const senha = document.getElementById('newPassword').value;
  const confirmarSenha = document.getElementById('confirmPassword').value;
  const errorEl = document.getElementById('createPasswordError');
  const btn = e.target.querySelector('button[type="submit"]');

  if (!senha || !confirmarSenha) {
    showFieldError(errorEl, 'Preencha todos os campos');
    return;
  }

  if (senha !== confirmarSenha) {
    showFieldError(errorEl, 'As senhas nao conferem');
    return;
  }

  if (senha.length < 6) {
    showFieldError(errorEl, 'A senha deve ter no minimo 6 caracteres');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Criando...';

  try {
    const response = await fetch(`${API_URL}/empresa/auth/criar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha, confirmar_senha: confirmarSenha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar senha');
    }

    // Salvar token e dados
    localStorage.setItem('clienteToken', data.token);
    localStorage.setItem('clienteUser', JSON.stringify(data.usuario));
    localStorage.setItem('clienteEmpresa', JSON.stringify(data.empresa));
    localStorage.removeItem('loginEmail');

    currentUser = data.usuario;
    currentEmpresa = data.empresa;

    showToast('Senha criada com sucesso! Bem-vindo!', 'success');

    // Ir para dashboard
    setTimeout(() => {
      showDashboard();
    }, 1000);

  } catch (err) {
    showFieldError(errorEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Senha e Entrar';
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('passwordEmail').value || localStorage.getItem('loginEmail');
  const senha = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('passwordError');
  const btn = e.target.querySelector('button[type="submit"]');

  if (!senha) {
    showFieldError(errorEl, 'Digite sua senha');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    const response = await fetch(`${API_URL}/empresa/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Email ou senha invalidos');
    }

    // Salvar token e dados
    localStorage.setItem('clienteToken', data.token);
    localStorage.setItem('clienteUser', JSON.stringify(data.usuario));
    localStorage.setItem('clienteEmpresa', JSON.stringify(data.empresa));
    localStorage.removeItem('loginEmail');

    currentUser = data.usuario;
    currentEmpresa = data.empresa;

    showToast('Login realizado com sucesso!', 'success');

    // Ir para dashboard
    setTimeout(() => {
      showDashboard();
    }, 500);

  } catch (err) {
    showFieldError(errorEl, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

async function verificarSessao() {
  try {
    const response = await authFetch(`${API_URL}/empresa/auth/me`);

    currentUser = response.usuario;
    currentEmpresa = response.empresa;

    localStorage.setItem('clienteUser', JSON.stringify(currentUser));
    localStorage.setItem('clienteEmpresa', JSON.stringify(currentEmpresa));

    showDashboard();

  } catch (err) {
    console.log('Sessao invalida:', err.message);
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteUser');
    localStorage.removeItem('clienteEmpresa');
    showLoginScreen();
  }
}

function handleLogout() {
  // Chamar API de logout (opcional)
  authFetch(`${API_URL}/empresa/auth/logout`, { method: 'POST' }).catch(() => {});

  // Limpar dados locais
  localStorage.removeItem('clienteToken');
  localStorage.removeItem('clienteUser');
  localStorage.removeItem('clienteEmpresa');
  localStorage.removeItem('loginEmail');

  currentUser = null;
  currentEmpresa = null;

  showLoginScreen();
  showToast('Voce saiu da sua conta', 'success');
}

// ============================================
// NAVEGACAO E UI
// ============================================
function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('clienteDashboard').style.display = 'none';
  showStep('stepEmail');

  // Limpar formularios
  document.getElementById('loginEmail').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('loginPassword').value = '';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('clienteDashboard').style.display = 'flex';

  // Atualizar info do usuario no header
  updateUserInfo();

  // Carregar dashboard
  navigateTo('dashboard');
}

function showStep(stepId) {
  document.querySelectorAll('.login-step').forEach(step => {
    step.style.display = 'none';
  });
  const stepEl = document.getElementById(stepId);
  if (stepEl) {
    stepEl.style.display = 'block';
  }
}

function updateUserInfo() {
  // Nome do usuario
  const userNameEl = document.getElementById('userName');
  if (currentUser && userNameEl) {
    userNameEl.textContent = currentUser.nome;
  }

  // Role do usuario
  const userRoleEl = document.getElementById('userRole');
  if (currentUser && userRoleEl) {
    const roles = { admin: 'Administrador', gerente: 'Gerente', atendente: 'Atendente' };
    userRoleEl.textContent = roles[currentUser.role] || currentUser.role;
  }

  // Nome da empresa
  const empresaNomeEl = document.getElementById('empresaNome');
  if (currentEmpresa && empresaNomeEl) {
    empresaNomeEl.textContent = currentEmpresa.nome;
  }

  // Inicial da empresa no logo
  const empresaInicialEl = document.getElementById('empresaInicial');
  if (currentEmpresa && empresaInicialEl) {
    empresaInicialEl.textContent = currentEmpresa.nome?.charAt(0).toUpperCase() || 'E';
  }

  // Link para ver pagina da empresa
  const verMinhaPaginaEl = document.getElementById('verMinhaPagina');
  if (currentEmpresa && verMinhaPaginaEl) {
    verMinhaPaginaEl.href = `/${currentEmpresa.slug}`;
  }
}

function handleNavigation(e) {
  e.preventDefault();
  const section = e.currentTarget.dataset.section;
  navigateTo(section);

  // Fechar sidebar no mobile
  document.querySelector('.sidebar')?.classList.remove('active');
}

function navigateTo(section) {
  currentSection = section;

  // Atualizar nav active
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.section === section) {
      link.classList.add('active');
    }
  });

  // Esconder todas as secoes
  document.querySelectorAll('.content-section').forEach(s => {
    s.classList.remove('active');
  });

  // Mostrar secao selecionada
  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) {
    sectionEl.classList.add('active');
  }

  // Atualizar titulo da pagina
  const titles = {
    'dashboard': 'Dashboard',
    'agendamentos': 'Agendamentos',
    'clientes': 'Clientes',
    'minha-empresa': 'Minha Empresa',
    'configuracoes': 'Configuracoes'
  };
  document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

  // Carregar dados da secao
  switch(section) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'agendamentos':
      loadAgendamentos();
      break;
    case 'clientes':
      loadClientes();
      break;
    case 'minha-empresa':
      loadEmpresaData();
      break;
    case 'configuracoes':
      loadConfiguracoes();
      break;
  }
}

function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('active');
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
  try {
    const response = await authFetch(`${API_URL}/empresa/painel/dashboard`);

    // Stats
    const stats = response.estatisticas || {};
    document.getElementById('statHoje').textContent = stats.hoje || 0;
    document.getElementById('statPendentes').textContent = stats.pendentes || 0;
    document.getElementById('statConfirmados').textContent = stats.confirmados || 0;
    document.getElementById('statFaturamento').textContent = formatCurrency(stats.faturamento_mes || 0);

    // Badge de pendentes na sidebar
    const badgePendentes = document.getElementById('badge-pendentes');
    if (badgePendentes) {
      const pendentes = stats.pendentes || 0;
      if (pendentes > 0) {
        badgePendentes.textContent = pendentes;
        badgePendentes.style.display = 'inline-flex';
      } else {
        badgePendentes.style.display = 'none';
      }
    }

    // Agendamentos de hoje
    renderAgendamentosHoje(response.agendamentos_hoje || []);

    // Proximos agendamentos
    renderProximosAgendamentos(response.proximos_agendamentos || []);

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    showToast('Erro ao carregar dados do dashboard', 'error');
  }
}

function renderAgendamentosHoje(agendamentos) {
  const tbody = document.getElementById('agendamentosHojeTable');

  if (agendamentos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
          Nenhum agendamento para hoje
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = agendamentos.map(ag => `
    <tr>
      <td>${ag.horario || '-'}</td>
      <td>${ag.nome_cliente || '-'}</td>
      <td>${formatPhone(ag.telefone)}</td>
      <td>${ag.placa || '-'}</td>
      <td>${ag.tipo_servico || 'Vistoria'}</td>
      <td>${formatCurrency(ag.valor || 0)}</td>
      <td><span class="status-badge status-${ag.status}">${ag.status}</span></td>
      <td>
        <button class="btn btn-small btn-secondary" onclick="verAgendamento(${ag.id})">
          Ver
        </button>
        ${ag.status === 'pendente' ? `
          <button class="btn btn-small btn-success" onclick="confirmarAgendamento(${ag.id})">
            Confirmar
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

function renderProximosAgendamentos(agendamentos) {
  const tbody = document.getElementById('proximosAgendamentosTable');

  if (agendamentos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
          Nenhum agendamento proximo
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = agendamentos.map(ag => `
    <tr>
      <td>${formatDate(ag.data_agendamento)}</td>
      <td>${ag.horario || '-'}</td>
      <td>${ag.nome_cliente || '-'}</td>
      <td>${ag.placa || '-'}</td>
      <td>${ag.tipo_servico || 'Vistoria'}</td>
      <td>${formatCurrency(ag.valor || 0)}</td>
      <td><span class="status-badge status-${ag.status}">${ag.status}</span></td>
    </tr>
  `).join('');
}

// ============================================
// AGENDAMENTOS
// ============================================
async function loadAgendamentos() {
  const tbody = document.getElementById('todosAgendamentosTable');
  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
        Carregando...
      </td>
    </tr>
  `;

  try {
    const filtroStatus = document.getElementById('filtroStatus')?.value || '';
    const filtroDataInicio = document.getElementById('filtroDataInicio')?.value || '';
    const filtroDataFim = document.getElementById('filtroDataFim')?.value || '';
    const filtroBusca = document.getElementById('filtroBusca')?.value || '';

    const params = new URLSearchParams();
    if (filtroStatus) params.append('status', filtroStatus);
    if (filtroDataInicio) params.append('data_inicio', filtroDataInicio);
    if (filtroDataFim) params.append('data_fim', filtroDataFim);
    if (filtroBusca) params.append('busca', filtroBusca);

    const url = `${API_URL}/empresa/painel/agendamentos${params.toString() ? '?' + params.toString() : ''}`;
    const response = await authFetch(url);
    const agendamentos = response.agendamentos || [];

    if (agendamentos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
            Nenhum agendamento encontrado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = agendamentos.map(ag => `
      <tr>
        <td>${formatDate(ag.data_agendamento)}</td>
        <td>${ag.horario || '-'}</td>
        <td>${ag.nome_cliente || '-'}</td>
        <td>${formatPhone(ag.telefone)}</td>
        <td>${ag.placa || '-'}</td>
        <td>${ag.tipo_servico || 'Vistoria'}</td>
        <td>${formatCurrency(ag.valor || 0)}</td>
        <td><span class="status-badge status-${ag.status}">${ag.status}</span></td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="verAgendamento(${ag.id})">
            Ver
          </button>
          ${ag.status === 'pendente' ? `
            <button class="btn btn-small btn-success" onclick="confirmarAgendamento(${ag.id})">
              Confirmar
            </button>
            <button class="btn btn-small btn-danger" onclick="cancelarAgendamento(${ag.id})">
              Cancelar
            </button>
          ` : ''}
          ${ag.status === 'confirmado' ? `
            <button class="btn btn-small btn-primary" onclick="concluirAgendamento(${ag.id})">
              Concluir
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Erro ao carregar agendamentos:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #dc2626;">
          Erro ao carregar agendamentos
        </td>
      </tr>
    `;
  }
}

async function verAgendamento(id) {
  try {
    const response = await authFetch(`${API_URL}/empresa/painel/agendamentos/${id}`);
    const ag = response;

    const modal = document.getElementById('agendamentoModal');
    const details = document.getElementById('agendamentoDetails');

    details.innerHTML = `
      <h2>Detalhes do Agendamento #${ag.id}</h2>
      <div class="detail-grid">
        <div class="detail-item">
          <strong>Data:</strong> ${formatDate(ag.data_agendamento)}
        </div>
        <div class="detail-item">
          <strong>Horario:</strong> ${ag.horario || '-'}
        </div>
        <div class="detail-item">
          <strong>Status:</strong> <span class="status-badge status-${ag.status}">${ag.status}</span>
        </div>
        <div class="detail-item">
          <strong>Cliente:</strong> ${ag.nome_cliente || '-'}
        </div>
        <div class="detail-item">
          <strong>Telefone:</strong> ${formatPhone(ag.telefone)}
        </div>
        <div class="detail-item">
          <strong>Email:</strong> ${ag.email || '-'}
        </div>
        <div class="detail-item">
          <strong>CPF:</strong> ${ag.cpf || '-'}
        </div>
        <div class="detail-item">
          <strong>Placa:</strong> ${ag.placa || '-'}
        </div>
        <div class="detail-item">
          <strong>Servico:</strong> ${ag.tipo_servico || 'Vistoria'}
        </div>
        <div class="detail-item">
          <strong>Valor:</strong> ${formatCurrency(ag.valor || 0)}
        </div>
        ${ag.observacoes ? `
          <div class="detail-item full">
            <strong>Observacoes:</strong> ${ag.observacoes}
          </div>
        ` : ''}
      </div>
      <div class="modal-actions" style="margin-top: 20px;">
        ${ag.status === 'pendente' ? `
          <button class="btn btn-success" onclick="confirmarAgendamento(${ag.id}); closeModal();">Confirmar</button>
          <button class="btn btn-danger" onclick="cancelarAgendamento(${ag.id}); closeModal();">Cancelar</button>
        ` : ''}
        ${ag.status === 'confirmado' ? `
          <button class="btn btn-primary" onclick="concluirAgendamento(${ag.id}); closeModal();">Concluir</button>
        ` : ''}
        <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
      </div>
    `;

    modal.style.display = 'flex';

  } catch (err) {
    showToast('Erro ao carregar detalhes do agendamento', 'error');
  }
}

async function confirmarAgendamento(id) {
  if (!confirm('Confirmar este agendamento?')) return;

  try {
    await authFetch(`${API_URL}/empresa/painel/agendamentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmado' })
    });

    showToast('Agendamento confirmado!', 'success');

    // Recarregar dados
    if (currentSection === 'dashboard') {
      loadDashboard();
    } else {
      loadAgendamentos();
    }

  } catch (err) {
    showToast('Erro ao confirmar agendamento', 'error');
  }
}

async function cancelarAgendamento(id) {
  if (!confirm('Cancelar este agendamento?')) return;

  try {
    await authFetch(`${API_URL}/empresa/painel/agendamentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelado' })
    });

    showToast('Agendamento cancelado', 'success');

    // Recarregar dados
    if (currentSection === 'dashboard') {
      loadDashboard();
    } else {
      loadAgendamentos();
    }

  } catch (err) {
    showToast('Erro ao cancelar agendamento', 'error');
  }
}

async function concluirAgendamento(id) {
  if (!confirm('Marcar este agendamento como concluido?')) return;

  try {
    await authFetch(`${API_URL}/empresa/painel/agendamentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'concluido' })
    });

    showToast('Agendamento concluido!', 'success');

    // Recarregar dados
    if (currentSection === 'dashboard') {
      loadDashboard();
    } else {
      loadAgendamentos();
    }

  } catch (err) {
    showToast('Erro ao concluir agendamento', 'error');
  }
}

function closeModal() {
  document.getElementById('agendamentoModal').style.display = 'none';
}

// ============================================
// CLIENTES
// ============================================
async function loadClientes() {
  const tbody = document.getElementById('clientesTable');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
        Carregando...
      </td>
    </tr>
  `;

  try {
    const response = await authFetch(`${API_URL}/empresa/painel/clientes`);
    const clientes = response.clientes || [];

    if (clientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
            Nenhum cliente encontrado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = clientes.map(c => `
      <tr>
        <td>${c.nome || '-'}</td>
        <td>${c.email || '-'}</td>
        <td>${formatPhone(c.telefone)}</td>
        <td>${c.cpf || '-'}</td>
        <td>${c.total_agendamentos || 0}</td>
        <td>${formatCurrency(c.valor_total || 0)}</td>
        <td>${formatDate(c.ultimo_agendamento)}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">
          Erro ao carregar clientes
        </td>
      </tr>
    `;
  }
}

// ============================================
// MINHA EMPRESA
// ============================================
async function loadEmpresaData() {
  try {
    const response = await authFetch(`${API_URL}/empresa/painel/minha-empresa`);
    const empresa = response;

    // Preencher formulario
    document.getElementById('empNome').value = empresa.nome || '';
    document.getElementById('empSlug').value = empresa.slug || '';
    document.getElementById('empSlugPreview').textContent = empresa.slug || '';
    document.getElementById('empEmail').value = empresa.email || '';
    document.getElementById('empTelefone').value = empresa.telefone || '';
    document.getElementById('empWhatsapp').value = empresa.whatsapp || '';
    document.getElementById('empDescricao').value = empresa.descricao || '';

    // Endereco
    document.getElementById('empCep').value = empresa.cep || '';
    document.getElementById('empEndereco').value = empresa.endereco || '';
    document.getElementById('empNumero').value = empresa.numero || '';
    document.getElementById('empComplemento').value = empresa.complemento || '';
    document.getElementById('empBairro').value = empresa.bairro || '';
    document.getElementById('empCidade').value = empresa.cidade || '';
    document.getElementById('empEstado').value = empresa.estado || '';

    // Horario
    document.getElementById('empHorario').value = empresa.horario_funcionamento || '';

    // Cores
    document.getElementById('empCorPrimaria').value = empresa.cor_primaria || '#3b82f6';
    document.getElementById('empCorSecundaria').value = empresa.cor_secundaria || '#1e40af';

    // Redes sociais
    document.getElementById('empFacebook').value = empresa.facebook_url || '';
    document.getElementById('empInstagram').value = empresa.instagram_url || '';
    document.getElementById('empSite').value = empresa.site_url || '';

  } catch (err) {
    console.error('Erro ao carregar dados da empresa:', err);
    showToast('Erro ao carregar dados da empresa', 'error');
  }
}

async function handleSaveEmpresa(e) {
  e.preventDefault();

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const dados = {
      telefone: document.getElementById('empTelefone').value,
      whatsapp: document.getElementById('empWhatsapp').value,
      descricao: document.getElementById('empDescricao').value,
      cep: document.getElementById('empCep').value,
      endereco: document.getElementById('empEndereco').value,
      numero: document.getElementById('empNumero').value,
      complemento: document.getElementById('empComplemento').value,
      bairro: document.getElementById('empBairro').value,
      cidade: document.getElementById('empCidade').value,
      estado: document.getElementById('empEstado').value,
      horario_funcionamento: document.getElementById('empHorario').value,
      cor_primaria: document.getElementById('empCorPrimaria').value,
      cor_secundaria: document.getElementById('empCorSecundaria').value,
      facebook_url: document.getElementById('empFacebook').value,
      instagram_url: document.getElementById('empInstagram').value,
      site_url: document.getElementById('empSite').value
    };

    await authFetch(`${API_URL}/empresa/painel/minha-empresa`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });

    showToast('Dados da empresa atualizados com sucesso!', 'success');

    // Atualizar dados locais
    currentEmpresa = { ...currentEmpresa, ...dados };
    localStorage.setItem('clienteEmpresa', JSON.stringify(currentEmpresa));
    updateUserInfo();

  } catch (err) {
    showToast(err.message || 'Erro ao salvar dados da empresa', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Alteracoes';
  }
}

async function buscarCep() {
  const cep = document.getElementById('empCep').value.replace(/\D/g, '');

  if (cep.length !== 8) {
    showToast('CEP invalido', 'error');
    return;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      showToast('CEP nao encontrado', 'error');
      return;
    }

    document.getElementById('empEndereco').value = data.logradouro || '';
    document.getElementById('empBairro').value = data.bairro || '';
    document.getElementById('empCidade').value = data.localidade || '';
    document.getElementById('empEstado').value = data.uf || '';

    showToast('Endereco preenchido!', 'success');

  } catch (err) {
    showToast('Erro ao buscar CEP', 'error');
  }
}

// ============================================
// CONFIGURACOES
// ============================================
async function loadConfiguracoes() {
  try {
    const response = await authFetch(`${API_URL}/empresa/painel/configuracoes/horarios`);

    document.getElementById('configHorarioInicio').value = response.horario_inicio || '08:00';
    document.getElementById('configHorarioFim').value = response.horario_fim || '18:00';
    document.getElementById('configIntervalo').value = response.intervalo_minutos || 60;

  } catch (err) {
    console.error('Erro ao carregar configuracoes:', err);
  }
}

async function handleSaveHorarios() {
  const btn = document.getElementById('btnSalvarHorarios');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const dados = {
      horario_inicio: document.getElementById('configHorarioInicio').value,
      horario_fim: document.getElementById('configHorarioFim').value,
      intervalo_minutos: parseInt(document.getElementById('configIntervalo').value)
    };

    await authFetch(`${API_URL}/empresa/painel/configuracoes/horarios`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });

    showToast('Horarios salvos com sucesso!', 'success');

  } catch (err) {
    showToast(err.message || 'Erro ao salvar horarios', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Horarios';
  }
}

async function handleAlterarSenha() {
  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;

  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
    showToast('Preencha todos os campos', 'error');
    return;
  }

  if (novaSenha !== confirmarNovaSenha) {
    showToast('As senhas nao conferem', 'error');
    return;
  }

  if (novaSenha.length < 6) {
    showToast('A nova senha deve ter no minimo 6 caracteres', 'error');
    return;
  }

  const btn = document.getElementById('btnAlterarSenha');
  btn.disabled = true;
  btn.textContent = 'Alterando...';

  try {
    await authFetch(`${API_URL}/empresa/auth/alterar-senha`, {
      method: 'POST',
      body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha })
    });

    showToast('Senha alterada com sucesso!', 'success');

    // Limpar campos
    document.getElementById('senhaAtual').value = '';
    document.getElementById('novaSenha').value = '';
    document.getElementById('confirmarNovaSenha').value = '';

  } catch (err) {
    showToast(err.message || 'Erro ao alterar senha', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Alterar Senha';
  }
}

// ============================================
// HELPERS
// ============================================
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('clienteToken');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers }
  });

  if (response.status === 401) {
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteUser');
    localStorage.removeItem('clienteEmpresa');
    showLoginScreen();
    throw new Error('Sessao expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisicao');
  }

  return data;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatPhone(phone) {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function showFieldError(el, message) {
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

function hideFieldError(el) {
  if (el) {
    el.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  // Remover toasts anteriores
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Animar entrada
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remover apos 4 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Expor funcoes globalmente para onclick handlers
window.verAgendamento = verAgendamento;
window.confirmarAgendamento = confirmarAgendamento;
window.cancelarAgendamento = cancelarAgendamento;
window.concluirAgendamento = concluirAgendamento;
window.closeModal = closeModal;
