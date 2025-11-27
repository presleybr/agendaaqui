/**
 * Painel CRM da Empresa
 * Gerenciamento de agendamentos, clientes e configurações
 */

// API URL - usar a mesma lógica do resto do sistema
const API_URL = import.meta.env.VITE_API_URL || 'https://api.agendaaquivistorias.com.br/api';

// Estado global
let state = {
  token: null,
  usuario: null,
  empresa: null,
  currentPage: 'dashboard'
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Painel da Empresa - Inicializando...');
  console.log('API URL:', API_URL);

  // Verificar se já está logado
  const token = localStorage.getItem('empresa_token');
  if (token) {
    state.token = token;
    verificarToken();
  } else {
    mostrarLogin();
  }

  // Event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Login
  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  // Logout
  document.getElementById('btnLogout').addEventListener('click', handleLogout);

  // Navegação
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      navegarPara(page);
    });
  });

  // Filtros de agendamentos
  document.getElementById('btnFiltrar').addEventListener('click', carregarAgendamentos);

  // Alterar senha
  document.getElementById('formAlterarSenha').addEventListener('submit', handleAlterarSenha);

  // Primeiro acesso
  document.getElementById('formPrimeiroAcesso').addEventListener('submit', handlePrimeiroAcesso);
}

// ============================================
// AUTENTICAÇÃO
// ============================================

async function verificarToken() {
  try {
    const response = await fetch(`${API_URL}/empresa/auth/me`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Token inválido');
    }

    const data = await response.json();
    state.usuario = data.usuario;
    state.empresa = data.empresa;

    // Verificar primeiro acesso
    if (data.usuario.primeiro_acesso) {
      mostrarPainel();
      document.getElementById('modalPrimeiroAcesso').classList.add('active');
    } else {
      mostrarPainel();
      carregarDashboard();
    }

  } catch (err) {
    console.error('Erro ao verificar token:', err);
    localStorage.removeItem('empresa_token');
    state.token = null;
    mostrarLogin();
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const btnLogin = document.getElementById('btnLogin');
  const btnText = document.getElementById('btnLoginText');
  const btnLoading = document.getElementById('btnLoginLoading');
  const errorDiv = document.getElementById('loginError');

  // Loading state
  btnLogin.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  errorDiv.classList.remove('show');

  try {
    const response = await fetch(`${API_URL}/empresa/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao fazer login');
    }

    // Salvar token e dados
    state.token = data.token;
    state.usuario = data.usuario;
    state.empresa = data.empresa;
    localStorage.setItem('empresa_token', data.token);

    console.log('Login bem-sucedido:', data.usuario.email);

    // Verificar primeiro acesso
    if (data.usuario.primeiro_acesso) {
      mostrarPainel();
      document.getElementById('modalPrimeiroAcesso').classList.add('active');
    } else {
      mostrarPainel();
      carregarDashboard();
    }

  } catch (err) {
    console.error('Erro no login:', err);
    errorDiv.textContent = err.message;
    errorDiv.classList.add('show');
  } finally {
    btnLogin.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

function handleLogout() {
  // Chamar API de logout (opcional, para log)
  fetch(`${API_URL}/empresa/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  }).catch(() => {});

  // Limpar estado local
  localStorage.removeItem('empresa_token');
  state.token = null;
  state.usuario = null;
  state.empresa = null;

  mostrarLogin();
}

async function handleAlterarSenha(e) {
  e.preventDefault();

  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;

  if (novaSenha !== confirmarSenha) {
    alert('As senhas não coincidem!');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/empresa/auth/alterar-senha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao alterar senha');
    }

    alert('Senha alterada com sucesso!');
    document.getElementById('formAlterarSenha').reset();

  } catch (err) {
    alert(err.message);
  }
}

async function handlePrimeiroAcesso(e) {
  e.preventDefault();

  const novaSenha = document.getElementById('novaSenhaPrimeiro').value;
  const confirmarSenha = document.getElementById('confirmarSenhaPrimeiro').value;

  if (novaSenha !== confirmarSenha) {
    alert('As senhas não coincidem!');
    return;
  }

  try {
    // No primeiro acesso, usamos a senha temporária como senha atual
    const response = await fetch(`${API_URL}/empresa/auth/alterar-senha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        senha_atual: document.getElementById('senha').value, // Senha que usou no login
        nova_senha: novaSenha
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao alterar senha');
    }

    document.getElementById('modalPrimeiroAcesso').classList.remove('active');
    state.usuario.primeiro_acesso = false;
    carregarDashboard();

  } catch (err) {
    alert(err.message);
  }
}

// ============================================
// UI HELPERS
// ============================================

function mostrarLogin() {
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('painelContainer').classList.remove('active');
}

function mostrarPainel() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('painelContainer').classList.add('active');

  // Atualizar header com dados da empresa
  if (state.empresa) {
    document.getElementById('empresaNome').textContent = state.empresa.nome;
    if (state.empresa.logo) {
      document.getElementById('empresaLogo').src = state.empresa.logo;
    }
    // Aplicar cores da empresa
    if (state.empresa.cor_primaria) {
      document.documentElement.style.setProperty('--primary', state.empresa.cor_primaria);
    }
  }

  if (state.usuario) {
    document.getElementById('usuarioNome').textContent = state.usuario.nome;
  }
}

function navegarPara(page) {
  state.currentPage = page;

  // Atualizar navegação
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Mostrar página correta
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.toggle('active', section.id === `page-${page}`);
  });

  // Carregar dados da página
  switch (page) {
    case 'dashboard':
      carregarDashboard();
      break;
    case 'agendamentos':
      carregarAgendamentos();
      break;
    case 'clientes':
      carregarClientes();
      break;
    case 'minha-empresa':
      carregarMinhaEmpresa();
      break;
    case 'configuracoes':
      carregarConfiguracoes();
      break;
  }
}

function formatarMoeda(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR');
}

function formatarDataHora(dataStr) {
  if (!dataStr) return '-';
  const data = new Date(dataStr);
  return data.toLocaleString('pt-BR');
}

// ============================================
// DASHBOARD
// ============================================

async function carregarDashboard() {
  try {
    const response = await fetch(`${API_URL}/empresa/painel/dashboard`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar dashboard');

    const data = await response.json();

    // Renderizar estatísticas
    const stats = data.estatisticas;
    document.getElementById('dashboardStats').innerHTML = `
      <div class="stat-card">
        <h3>Hoje</h3>
        <div class="value primary">${stats.hoje || 0}</div>
        <div class="subtext">agendamentos</div>
      </div>
      <div class="stat-card">
        <h3>Amanhã</h3>
        <div class="value">${stats.amanha || 0}</div>
        <div class="subtext">agendamentos</div>
      </div>
      <div class="stat-card">
        <h3>Pendentes</h3>
        <div class="value warning">${stats.pendentes || 0}</div>
        <div class="subtext">aguardando</div>
      </div>
      <div class="stat-card">
        <h3>Faturamento do Mês</h3>
        <div class="value success">${formatarMoeda(stats.faturamento_mes || 0)}</div>
        <div class="subtext">confirmados + concluídos</div>
      </div>
    `;

    // Agendamentos de hoje
    renderizarAgendamentosHoje(data.agendamentos_hoje);

    // Próximos agendamentos
    renderizarProximosAgendamentos(data.proximos_agendamentos);

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    document.getElementById('dashboardStats').innerHTML = `
      <div style="color: red; padding: 1rem;">Erro ao carregar dados. Tente novamente.</div>
    `;
  }
}

function renderizarAgendamentosHoje(agendamentos) {
  const container = document.getElementById('agendamentosHoje');

  if (!agendamentos || agendamentos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum agendamento para hoje</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Horário</th>
          <th>Cliente</th>
          <th>Placa</th>
          <th>Serviço</th>
          <th>Valor</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${agendamentos.map(ag => `
          <tr>
            <td><strong>${ag.horario || '-'}</strong></td>
            <td>${ag.nome_cliente || '-'}</td>
            <td>${ag.placa || '-'}</td>
            <td>${ag.tipo_servico || '-'}</td>
            <td>${formatarMoeda(ag.valor || 0)}</td>
            <td><span class="badge badge-${ag.status}">${ag.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderizarProximosAgendamentos(agendamentos) {
  const container = document.getElementById('proximosAgendamentos');

  if (!agendamentos || agendamentos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum agendamento futuro</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Horário</th>
          <th>Cliente</th>
          <th>Telefone</th>
          <th>Serviço</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${agendamentos.map(ag => `
          <tr>
            <td>${formatarData(ag.data_agendamento)}</td>
            <td>${ag.horario || '-'}</td>
            <td>${ag.nome_cliente || '-'}</td>
            <td>${ag.telefone || '-'}</td>
            <td>${ag.tipo_servico || '-'}</td>
            <td><span class="badge badge-${ag.status}">${ag.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================
// AGENDAMENTOS
// ============================================

async function carregarAgendamentos() {
  const container = document.getElementById('listaAgendamentos');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const status = document.getElementById('filtroStatus').value;
  const dataInicio = document.getElementById('filtroDataInicio').value;
  const dataFim = document.getElementById('filtroDataFim').value;
  const busca = document.getElementById('filtroBusca').value;

  let url = `${API_URL}/empresa/painel/agendamentos?`;
  if (status && status !== 'todos') url += `status=${status}&`;
  if (dataInicio) url += `data_inicio=${dataInicio}&`;
  if (dataFim) url += `data_fim=${dataFim}&`;
  if (busca) url += `busca=${encodeURIComponent(busca)}&`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar agendamentos');

    const data = await response.json();

    if (!data.agendamentos || data.agendamentos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhum agendamento encontrado</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Horário</th>
            <th>Cliente</th>
            <th>Telefone</th>
            <th>Placa</th>
            <th>Serviço</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${data.agendamentos.map(ag => `
            <tr>
              <td>#${ag.id}</td>
              <td>${formatarData(ag.data_agendamento)}</td>
              <td>${ag.horario || '-'}</td>
              <td>${ag.nome_cliente || '-'}</td>
              <td>${ag.telefone || '-'}</td>
              <td>${ag.placa || '-'}</td>
              <td>${ag.tipo_servico || '-'}</td>
              <td>${formatarMoeda(ag.valor || 0)}</td>
              <td><span class="badge badge-${ag.status}">${ag.status}</span></td>
              <td>
                <select onchange="alterarStatus(${ag.id}, this.value)" style="padding: 0.25rem;">
                  <option value="">Alterar...</option>
                  <option value="confirmado" ${ag.status === 'confirmado' ? 'disabled' : ''}>Confirmar</option>
                  <option value="concluido" ${ag.status === 'concluido' ? 'disabled' : ''}>Concluir</option>
                  <option value="cancelado" ${ag.status === 'cancelado' ? 'disabled' : ''}>Cancelar</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 1rem; color: var(--gray-500);">
        Total: ${data.pagination.total} agendamentos
      </p>
    `;

  } catch (err) {
    console.error('Erro ao carregar agendamentos:', err);
    container.innerHTML = '<div style="color: red;">Erro ao carregar agendamentos</div>';
  }
}

// Função global para alterar status
window.alterarStatus = async function(id, novoStatus) {
  if (!novoStatus) return;

  if (!confirm(`Deseja alterar o status para "${novoStatus}"?`)) {
    carregarAgendamentos(); // Recarregar para resetar select
    return;
  }

  try {
    const response = await fetch(`${API_URL}/empresa/painel/agendamentos/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ status: novoStatus })
    });

    if (!response.ok) throw new Error('Erro ao alterar status');

    carregarAgendamentos();

  } catch (err) {
    alert(err.message);
    carregarAgendamentos();
  }
};

// ============================================
// CLIENTES
// ============================================

async function carregarClientes() {
  const container = document.getElementById('listaClientes');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`${API_URL}/empresa/painel/clientes`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar clientes');

    const data = await response.json();

    if (!data.clientes || data.clientes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhum cliente encontrado</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Agendamentos</th>
            <th>Último Agendamento</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.clientes.map(c => `
            <tr>
              <td>${c.nome || '-'}</td>
              <td>${c.email || '-'}</td>
              <td>${c.telefone || '-'}</td>
              <td>${c.total_agendamentos}</td>
              <td>${formatarData(c.ultimo_agendamento)}</td>
              <td>${formatarMoeda(c.valor_total || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 1rem; color: var(--gray-500);">
        Total: ${data.total} clientes
      </p>
    `;

  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
    container.innerHTML = '<div style="color: red;">Erro ao carregar clientes</div>';
  }
}

// ============================================
// MINHA EMPRESA
// ============================================

async function carregarMinhaEmpresa() {
  const container = document.getElementById('dadosEmpresa');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`${API_URL}/empresa/painel/minha-empresa`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar dados da empresa');

    const empresa = await response.json();

    container.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Nome da Empresa</label>
          <input type="text" value="${empresa.nome || ''}" disabled>
        </div>
        <div class="form-group">
          <label>Slug (URL)</label>
          <input type="text" value="${empresa.slug || ''}" disabled>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input type="email" value="${empresa.email || ''}" disabled>
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="text" id="empresaTelefone" value="${empresa.telefone || ''}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>WhatsApp</label>
          <input type="text" id="empresaWhatsapp" value="${empresa.whatsapp || ''}">
        </div>
        <div class="form-group">
          <label>Chave PIX</label>
          <input type="text" value="${empresa.chave_pix_masked || '****'}" disabled>
        </div>
      </div>

      <div class="form-group">
        <label>Endereco</label>
        <input type="text" id="empresaEndereco" value="${empresa.endereco || ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Cidade</label>
          <input type="text" id="empresaCidade" value="${empresa.cidade || ''}">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <input type="text" id="empresaEstado" value="${empresa.estado || ''}">
        </div>
      </div>

      <div class="form-group">
        <label>Descrição</label>
        <textarea id="empresaDescricao" rows="3" style="width: 100%; padding: 0.75rem; border: 2px solid var(--gray-200); border-radius: 8px;">${empresa.descricao || ''}</textarea>
      </div>

      <div class="form-group">
        <label>Horário de Funcionamento</label>
        <input type="text" id="empresaHorario" value="${empresa.horario_funcionamento || ''}" placeholder="Ex: Seg-Sex 8h-18h, Sáb 8h-12h">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Cor Primária</label>
          <input type="color" id="empresaCorPrimaria" value="${empresa.cor_primaria || '#f97316'}">
        </div>
        <div class="form-group">
          <label>Cor Secundária</label>
          <input type="color" id="empresaCorSecundaria" value="${empresa.cor_secundaria || '#ea580c'}">
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarDadosEmpresa()">Salvar Alterações</button>
      </div>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid var(--gray-200);">

      <h3 style="margin-bottom: 1rem;">Informações do Sistema</h3>
      <p><strong>Status:</strong> <span class="badge badge-${empresa.status === 'ativo' ? 'concluido' : 'cancelado'}">${empresa.status}</span></p>
      <p><strong>URL da Página:</strong> <a href="https://agendaaquivistorias.com.br/${empresa.slug}" target="_blank">agendaaquivistorias.com.br/${empresa.slug}</a></p>
      <p><strong>Data de Cadastro:</strong> ${formatarData(empresa.created_at)}</p>
    `;

  } catch (err) {
    console.error('Erro ao carregar empresa:', err);
    container.innerHTML = '<div style="color: red;">Erro ao carregar dados da empresa</div>';
  }
}

// Função global para salvar dados da empresa
window.salvarDadosEmpresa = async function() {
  const dados = {
    telefone: document.getElementById('empresaTelefone').value,
    whatsapp: document.getElementById('empresaWhatsapp').value,
    endereco: document.getElementById('empresaEndereco').value,
    cidade: document.getElementById('empresaCidade').value,
    estado: document.getElementById('empresaEstado').value,
    descricao: document.getElementById('empresaDescricao').value,
    horario_funcionamento: document.getElementById('empresaHorario').value,
    cor_primaria: document.getElementById('empresaCorPrimaria').value,
    cor_secundaria: document.getElementById('empresaCorSecundaria').value
  };

  try {
    const response = await fetch(`${API_URL}/empresa/painel/minha-empresa`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) throw new Error('Erro ao salvar dados');

    alert('Dados salvos com sucesso!');

  } catch (err) {
    alert(err.message);
  }
};

// ============================================
// CONFIGURAÇÕES
// ============================================

async function carregarConfiguracoes() {
  const container = document.getElementById('configHorarios');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`${API_URL}/empresa/painel/configuracoes/horarios`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar configurações');

    const config = await response.json();

    container.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Horário de Início</label>
          <input type="time" id="configHorarioInicio" value="${config.horario_inicio || '08:00'}">
        </div>
        <div class="form-group">
          <label>Horário de Fim</label>
          <input type="time" id="configHorarioFim" value="${config.horario_fim || '18:00'}">
        </div>
        <div class="form-group">
          <label>Intervalo (minutos)</label>
          <input type="number" id="configIntervalo" value="${config.intervalo_minutos || 60}" min="15" step="15">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarHorarios()">Salvar Horários</button>
      </div>
    `;

  } catch (err) {
    console.error('Erro ao carregar configurações:', err);
    container.innerHTML = '<div style="color: red;">Erro ao carregar configurações</div>';
  }
}

// Função global para salvar horários
window.salvarHorarios = async function() {
  const dados = {
    horario_inicio: document.getElementById('configHorarioInicio').value,
    horario_fim: document.getElementById('configHorarioFim').value,
    intervalo_minutos: parseInt(document.getElementById('configIntervalo').value)
  };

  try {
    const response = await fetch(`${API_URL}/empresa/painel/configuracoes/horarios`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) throw new Error('Erro ao salvar horários');

    alert('Horários salvos com sucesso!');

  } catch (err) {
    alert(err.message);
  }
};
