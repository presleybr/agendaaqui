/**
 * Painel da Empresa - JavaScript
 * Sistema de gerenciamento para empresas parceiras
 */

// API Base URL
const API_URL = import.meta.env?.VITE_API_URL || 'https://agendaaqui-backend.onrender.com/api';

// Backend URL para imagens (remove /api do final)
const BACKEND_URL = API_URL.replace(/\/api$/, '');

/**
 * Converte URLs de imagem relativas para absolutas do backend
 * @param {string} url - URL da imagem (pode ser relativa ou absoluta)
 * @returns {string} URL absoluta da imagem
 */
function getImageUrl(url) {
  if (!url) return null;

  // Se ja eh uma URL absoluta (http/https), retorna como esta
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Se eh uma URL relativa, adiciona o backend URL
  // Remove barra inicial se existir para evitar duplicacao
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return `${BACKEND_URL}/${cleanUrl}`;
}

/**
 * Classe principal do Painel da Empresa
 */
class PainelEmpresa {
  constructor() {
    this.token = null;
    this.usuario = null;
    this.empresa = null;
    this.currentSection = 'dashboard';
    this.charts = {};
    this.calendarDate = new Date();
    this.calendarAppointments = [];

    this.init();
  }

  // ============================================
  // INICIALIZACAO
  // ============================================

  init() {
    console.log('Painel da Empresa - Inicializando...');
    console.log('API URL:', API_URL);

    // Verificar token existente
    const savedToken = localStorage.getItem('empresa_token');
    if (savedToken) {
      this.token = savedToken;
      this.verifyToken();
    } else {
      this.showLogin();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login
    document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

    // Menu Toggle
    document.getElementById('menuToggle')?.addEventListener('click', () => this.toggleSidebar());

    // Navegacao
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        if (section) this.showSection(section);
      });
    });

    // Filtros de agendamentos
    document.getElementById('filterBtn')?.addEventListener('click', () => this.loadAgendamentos());
    document.getElementById('clearFilterBtn')?.addEventListener('click', () => this.clearFilters());

    // Calendario
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => this.changeMonth(1));

    // Relatorios
    document.getElementById('generateReportBtn')?.addEventListener('click', () => this.generateReport());
    document.getElementById('setCurrentMonthBtn')?.addEventListener('click', () => this.setCurrentMonth());
    document.getElementById('setLastMonthBtn')?.addEventListener('click', () => this.setLastMonth());
    document.getElementById('exportReportPDF')?.addEventListener('click', () => this.exportReportPDF());

    // Alterar senha
    document.getElementById('formAlterarSenha')?.addEventListener('submit', (e) => this.handleChangePassword(e));

    // Primeiro acesso
    document.getElementById('formPrimeiroAcesso')?.addEventListener('submit', (e) => this.handleFirstAccess(e));

    // Modal fechar
    document.getElementById('closeAppointmentModal')?.addEventListener('click', () => this.closeModal('appointmentModal'));

    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    // Busca global
    document.getElementById('globalSearch')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.globalSearch(e.target.value);
    });
  }

  // ============================================
  // AUTENTICACAO
  // ============================================

  async verifyToken() {
    try {
      const response = await this.apiGet('/empresa/auth/me');
      this.usuario = response.usuario;
      this.empresa = response.empresa;

      if (response.usuario.primeiro_acesso) {
        this.showDashboard();
        document.getElementById('modalPrimeiroAcesso').classList.add('active');
      } else {
        this.showDashboard();
        this.loadDashboard();
      }
    } catch (err) {
      console.error('Token invalido:', err);
      localStorage.removeItem('empresa_token');
      this.token = null;
      this.showLogin();
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnLoginText');
    const btnLoading = document.getElementById('btnLoginLoading');
    const errorDiv = document.getElementById('loginError');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    errorDiv.style.display = 'none';

    try {
      const response = await fetch(`${API_URL}/empresa/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      this.token = data.token;
      this.usuario = data.usuario;
      this.empresa = data.empresa;
      localStorage.setItem('empresa_token', data.token);

      if (data.usuario.primeiro_acesso) {
        this.showDashboard();
        document.getElementById('modalPrimeiroAcesso').classList.add('active');
      } else {
        this.showDashboard();
        this.loadDashboard();
      }
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  handleLogout() {
    this.apiPost('/empresa/auth/logout', {}).catch(() => {});
    localStorage.removeItem('empresa_token');
    this.token = null;
    this.usuario = null;
    this.empresa = null;
    this.showLogin();
  }

  async handleChangePassword(e) {
    e.preventDefault();

    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (novaSenha !== confirmarSenha) {
      alert('As senhas nao coincidem!');
      return;
    }

    try {
      await this.apiPost('/empresa/auth/alterar-senha', {
        senha_atual: senhaAtual,
        nova_senha: novaSenha
      });

      alert('Senha alterada com sucesso!');
      document.getElementById('formAlterarSenha').reset();
    } catch (err) {
      alert(err.message);
    }
  }

  async handleFirstAccess(e) {
    e.preventDefault();

    const novaSenha = document.getElementById('novaSenhaPrimeiro').value;
    const confirmarSenha = document.getElementById('confirmarSenhaPrimeiro').value;

    if (novaSenha !== confirmarSenha) {
      alert('As senhas nao coincidem!');
      return;
    }

    try {
      await this.apiPost('/empresa/auth/alterar-senha', {
        senha_atual: document.getElementById('loginPassword').value,
        nova_senha: novaSenha
      });

      document.getElementById('modalPrimeiroAcesso').classList.remove('active');
      this.usuario.primeiro_acesso = false;
      this.loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  // ============================================
  // UI HELPERS
  // ============================================

  showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainDashboard').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'flex';

    // Atualizar header
    if (this.empresa) {
      document.getElementById('sidebarEmpresaNome').textContent = this.empresa.nome || 'Minha Empresa';

      // Logo da empresa (verificar logo_url ou logo)
      const logoUrl = getImageUrl(this.empresa.logo_url || this.empresa.logo);
      if (logoUrl) {
        const logo = document.getElementById('sidebarLogo');
        logo.src = logoUrl;
        logo.style.display = 'block';
      }

      // Aplicar cores da empresa
      if (this.empresa.cor_primaria) {
        document.documentElement.style.setProperty('--brand-primary', this.empresa.cor_primaria);
      }

      // Atualizar avatar do usuário com foto de perfil da empresa
      const userAvatarImg = document.getElementById('userAvatarImg');
      const userAvatarPlaceholder = document.getElementById('userAvatarPlaceholder');
      const fotoPerfilUrl = getImageUrl(this.empresa.foto_perfil_url || this.empresa.logo_url);

      if (userAvatarImg && fotoPerfilUrl) {
        userAvatarImg.src = fotoPerfilUrl;
        userAvatarImg.style.display = 'block';
        if (userAvatarPlaceholder) userAvatarPlaceholder.style.display = 'none';
      }
    }

    if (this.usuario) {
      document.getElementById('sidebarUserName').textContent = this.usuario.nome || 'Usuario';
      // Traduzir role para portugues
      const roleLabels = {
        'admin': 'Administrador',
        'gerente': 'Gerente',
        'atendente': 'Atendente',
        'funcionario': 'Funcionario'
      };
      document.getElementById('sidebarUserRole').textContent = roleLabels[this.usuario.role] || this.usuario.role || 'Usuario';
    }
  }

  showSection(section) {
    this.currentSection = section;

    // Atualizar navegacao
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Mostrar secao
    document.querySelectorAll('.content-section').forEach(s => {
      s.classList.toggle('active', s.id === `section-${section}`);
    });

    // Atualizar titulo
    const titles = {
      'dashboard': 'Dashboard',
      'agendamentos': 'Agendamentos',
      'clientes': 'Clientes',
      'calendario': 'Calendario',
      'relatorios': 'Relatorios',
      'minha-empresa': 'Minha Empresa',
      'configuracoes': 'Configuracoes'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Carregar dados
    this.loadSectionData(section);
  }

  loadSectionData(section) {
    switch (section) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'agendamentos':
        this.loadAgendamentos();
        break;
      case 'clientes':
        this.loadClientes();
        break;
      case 'calendario':
        this.loadCalendar();
        break;
      case 'relatorios':
        this.initReportDates();
        break;
      case 'minha-empresa':
        this.loadMinhaEmpresa();
        break;
      case 'configuracoes':
        this.loadConfiguracoes();
        break;
    }
  }

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('sidebar').classList.toggle('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async loadDashboard() {
    try {
      const data = await this.apiGet('/empresa/painel/dashboard');

      // Stats
      const stats = data.estatisticas || {};
      document.getElementById('statToday').textContent = stats.hoje || 0;
      document.getElementById('statPending').textContent = stats.pendentes || 0;
      document.getElementById('statConfirmed').textContent = stats.confirmados || 0;
      document.getElementById('statRevenue').textContent = this.formatCurrency(stats.faturamento_mes || 0);

      // Badge de pendentes
      const badge = document.getElementById('badge-agendamentos');
      if (stats.pendentes > 0) {
        badge.textContent = stats.pendentes;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }

      // Tabela de hoje
      this.renderTodayAppointments(data.agendamentos_hoje || []);

      // Charts
      this.initCharts(data);

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  }

  renderTodayAppointments(appointments) {
    const tbody = document.getElementById('todayAppointmentsTable');

    if (!appointments.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5; margin-bottom: 10px;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <br>Nenhum agendamento para hoje
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = appointments.map(ap => `
      <tr>
        <td><strong>${ap.horario || '-'}</strong></td>
        <td>${ap.nome_cliente || '-'}</td>
        <td>${ap.telefone || '-'}</td>
        <td>${ap.placa || '-'}</td>
        <td>${ap.tipo_servico || '-'}</td>
        <td>${this.formatCurrency(ap.valor || 0)}</td>
        <td><span class="status-badge ${ap.status}">${ap.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-action-view" onclick="painel.viewAppointment(${ap.id})" title="Ver detalhes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            ${ap.status === 'pendente' ? `
              <button class="btn-action btn-action-success" onclick="painel.updateStatus(${ap.id}, 'confirmado')" title="Confirmar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            ` : ''}
            ${ap.status === 'confirmado' ? `
              <button class="btn-action btn-action-success" onclick="painel.updateStatus(${ap.id}, 'realizado')" title="Concluir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ============================================
  // CHARTS
  // ============================================

  async initCharts(dashboardData) {
    // Buscar dados para graficos
    try {
      const revenueData = await this.getRevenueChartData();
      const statusData = await this.getStatusChartData();

      this.createRevenueChart(revenueData);
      this.createStatusChart(statusData);
    } catch (err) {
      console.error('Erro ao inicializar graficos:', err);
    }
  }

  async getRevenueChartData() {
    // Ultimos 6 meses
    const months = [];
    const values = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      months.push(start.toLocaleString('pt-BR', { month: 'short' }));

      try {
        const data = await this.apiGet(`/empresa/painel/relatorios/resumo?data_inicio=${this.formatDateISO(start)}&data_fim=${this.formatDateISO(end)}`);
        values.push((data.receita_total || 0) / 100);
      } catch {
        values.push(0);
      }
    }

    return { labels: months, values };
  }

  async getStatusChartData() {
    try {
      const data = await this.apiGet('/empresa/painel/dashboard');
      const stats = data.estatisticas || {};
      return {
        labels: ['Pendentes', 'Confirmados', 'Concluidos', 'Cancelados'],
        values: [
          stats.pendentes || 0,
          stats.confirmados || 0,
          stats.concluidos || 0,
          stats.cancelados || 0
        ]
      };
    } catch {
      return { labels: [], values: [] };
    }
  }

  createRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (this.charts.revenue) this.charts.revenue.destroy();

    this.charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Faturamento',
          data: data.values,
          borderColor: 'rgb(237, 106, 43)',
          backgroundColor: 'rgba(237, 106, 43, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
            }
          }
        }
      }
    });
  }

  createStatusChart(data) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    if (this.charts.status) this.charts.status.destroy();

    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: [
            '#f59e0b', // pendente
            '#ed6a2b', // confirmado
            '#22c55e', // concluido
            '#ef4444'  // cancelado
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // ============================================
  // AGENDAMENTOS
  // ============================================

  async loadAgendamentos() {
    const tbody = document.getElementById('agendamentosTable');
    tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px;"><div class="spinner"></div></td></tr>';

    const status = document.getElementById('filterStatus')?.value || '';
    const dataInicio = document.getElementById('filterDateStart')?.value || '';
    const dataFim = document.getElementById('filterDateEnd')?.value || '';
    const busca = document.getElementById('filterSearch')?.value || '';

    let url = '/empresa/painel/agendamentos?';
    if (status) url += `status=${status}&`;
    if (dataInicio) url += `data_inicio=${dataInicio}&`;
    if (dataFim) url += `data_fim=${dataFim}&`;
    if (busca) url += `busca=${encodeURIComponent(busca)}&`;

    try {
      const data = await this.apiGet(url);
      const appointments = data.agendamentos || [];

      if (!appointments.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
              Nenhum agendamento encontrado
            </td>
          </tr>
        `;
        document.getElementById('paginationInfo').textContent = '';
        return;
      }

      tbody.innerHTML = appointments.map(ap => `
        <tr>
          <td>#${ap.id}</td>
          <td>${this.formatDate(ap.data_hora)}</td>
          <td>${ap.horario || '-'}</td>
          <td>${ap.nome_cliente || '-'}</td>
          <td>${ap.telefone || '-'}</td>
          <td>${ap.placa || '-'}</td>
          <td>${ap.tipo_servico || '-'}</td>
          <td>${this.formatCurrency(ap.valor || 0)}</td>
          <td><span class="payment-badge ${this.getPaymentClass(ap.status_pagamento)}">${this.getPaymentLabel(ap.status_pagamento)}</span></td>
          <td><span class="status-badge ${ap.status}">${ap.status}</span></td>
          <td>
            <div class="action-buttons">
              <button class="btn-action btn-action-view" onclick="painel.viewAppointment(${ap.id})" title="Ver">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <select onchange="painel.updateStatus(${ap.id}, this.value); this.value='';" style="padding: 4px; border-radius: 4px; border: 1px solid var(--border-light);">
                <option value="">Status...</option>
                <option value="pendente" ${ap.status === 'pendente' ? 'disabled' : ''}>Pendente</option>
                <option value="confirmado" ${ap.status === 'confirmado' ? 'disabled' : ''}>Confirmado</option>
                <option value="realizado" ${ap.status === 'realizado' ? 'disabled' : ''}>Realizado</option>
                <option value="cancelado" ${ap.status === 'cancelado' ? 'disabled' : ''}>Cancelado</option>
              </select>
            </div>
          </td>
        </tr>
      `).join('');

      document.getElementById('paginationInfo').textContent = `Total: ${data.pagination?.total || appointments.length} agendamentos`;

    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: var(--status-danger);">Erro ao carregar agendamentos</td></tr>';
    }
  }

  clearFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDateStart').value = '';
    document.getElementById('filterDateEnd').value = '';
    document.getElementById('filterSearch').value = '';
    this.loadAgendamentos();
  }

  async viewAppointment(id) {
    try {
      const ap = await this.apiGet(`/empresa/painel/agendamentos/${id}`);

      const details = document.getElementById('appointmentDetails');
      details.innerHTML = `
        <div class="detail-section">
          <h3>Informacoes do Agendamento</h3>
          <div class="detail-row">
            <span class="detail-label">ID</span>
            <span class="detail-value">#${ap.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data</span>
            <span class="detail-value">${this.formatDate(ap.data_hora)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Horario</span>
            <span class="detail-value">${ap.horario || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Servico</span>
            <span class="detail-value">${ap.tipo_servico || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Valor</span>
            <span class="detail-value">${this.formatCurrency(ap.valor || 0)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="status-badge ${ap.status}">${ap.status}</span></span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Dados do Cliente</h3>
          <div class="detail-row">
            <span class="detail-label">Nome</span>
            <span class="detail-value">${ap.nome_cliente || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Telefone</span>
            <span class="detail-value">${ap.telefone || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${ap.email || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">CPF</span>
            <span class="detail-value">${ap.cpf || '-'}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Dados do Veiculo</h3>
          <div class="detail-row">
            <span class="detail-label">Placa</span>
            <span class="detail-value">${ap.placa || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Marca/Modelo</span>
            <span class="detail-value">${ap.marca || ''} ${ap.modelo || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ano</span>
            <span class="detail-value">${ap.ano || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Cor</span>
            <span class="detail-value">${ap.cor || '-'}</span>
          </div>
        </div>

        ${ap.observacoes ? `
          <div class="detail-section">
            <h3>Observacoes</h3>
            <p style="color: var(--text-secondary);">${ap.observacoes}</p>
          </div>
        ` : ''}
      `;

      document.getElementById('appointmentModal').classList.add('active');
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      alert('Erro ao carregar detalhes do agendamento');
    }
  }

  async updateStatus(id, newStatus) {
    if (!newStatus) return;

    if (!confirm(`Alterar status para "${newStatus}"?`)) {
      return;
    }

    try {
      await this.apiPatch(`/empresa/painel/agendamentos/${id}/status`, { status: newStatus });

      // Recarregar dados
      if (this.currentSection === 'dashboard') {
        this.loadDashboard();
      } else if (this.currentSection === 'agendamentos') {
        this.loadAgendamentos();
      } else if (this.currentSection === 'calendario') {
        this.loadCalendar();
      }
    } catch (err) {
      alert(err.message || 'Erro ao alterar status');
    }
  }

  // ============================================
  // CLIENTES
  // ============================================

  async loadClientes() {
    const tbody = document.getElementById('clientesTable');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;"><div class="spinner"></div></td></tr>';

    try {
      const data = await this.apiGet('/empresa/painel/clientes');
      const clientes = data.clientes || [];

      if (!clientes.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
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
          <td>${c.telefone || '-'}</td>
          <td>${c.total_agendamentos || 0}</td>
          <td>${this.formatDate(c.ultimo_agendamento)}</td>
          <td>${this.formatCurrency(c.valor_total || 0)}</td>
        </tr>
      `).join('');

    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--status-danger);">Erro ao carregar clientes</td></tr>';
    }
  }

  // ============================================
  // CALENDARIO
  // ============================================

  async loadCalendar() {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    // Atualizar label
    const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('currentMonthLabel').textContent = `${monthNames[month]} ${year}`;

    // Buscar agendamentos do mes
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    try {
      const data = await this.apiGet(`/empresa/painel/agendamentos?data_inicio=${this.formatDateISO(startDate)}&data_fim=${this.formatDateISO(endDate)}&limit=1000`);
      this.calendarAppointments = data.agendamentos || [];
    } catch {
      this.calendarAppointments = [];
    }

    this.renderCalendar();
  }

  renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const today = new Date();

    // Limpar dias anteriores (manter headers)
    const headers = grid.querySelectorAll('.calendar-day-header');
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    // Primeiro dia do mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();

    // Dias do mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'calendar-day other-month';
      dayDiv.innerHTML = `<div class="day-number">${prevMonthLastDay - i}</div>`;
      grid.appendChild(dayDiv);
    }

    // Dias do mes atual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDateISO(date);
      const isToday = date.toDateString() === today.toDateString();

      // Filtrar agendamentos do dia
      const dayAppointments = this.calendarAppointments.filter(ap => {
        try {
          // Usar data_hora (campo do banco) ou data_agendamento como fallback
          const dateField = ap.data_hora || ap.data_agendamento;
          if (!dateField) return false;
          const apDate = new Date(dateField);
          if (isNaN(apDate.getTime())) return false;
          return apDate.toISOString().split('T')[0] === dateStr;
        } catch {
          return false;
        }
      });

      const dayDiv = document.createElement('div');
      dayDiv.className = `calendar-day${isToday ? ' today' : ''}${dayAppointments.length ? ' has-appointments' : ''}`;

      let appointmentsHtml = '';
      if (dayAppointments.length > 0) {
        appointmentsHtml = `<div class="day-appointments">`;
        dayAppointments.slice(0, 3).forEach(ap => {
          appointmentsHtml += `<div class="calendar-appointment ${ap.status}">${ap.horario || ''} ${ap.nome_cliente?.split(' ')[0] || ''}</div>`;
        });
        if (dayAppointments.length > 3) {
          appointmentsHtml += `<div class="calendar-appointment" style="background: var(--text-tertiary);">+${dayAppointments.length - 3} mais</div>`;
        }
        appointmentsHtml += '</div>';
      }

      dayDiv.innerHTML = `
        <div class="day-number">${day}</div>
        ${appointmentsHtml}
      `;

      dayDiv.addEventListener('click', () => {
        // Filtrar agendamentos deste dia
        document.getElementById('filterDateStart').value = dateStr;
        document.getElementById('filterDateEnd').value = dateStr;
        this.showSection('agendamentos');
      });

      grid.appendChild(dayDiv);
    }

    // Dias do proximo mes
    const totalCells = startingDay + lastDay.getDate();
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'calendar-day other-month';
      dayDiv.innerHTML = `<div class="day-number">${i}</div>`;
      grid.appendChild(dayDiv);
    }
  }

  changeMonth(delta) {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + delta);
    this.loadCalendar();
  }

  // ============================================
  // RELATORIOS
  // ============================================

  initReportDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    document.getElementById('reportStartDate').value = this.formatDateISO(firstDay);
    document.getElementById('reportEndDate').value = this.formatDateISO(today);
  }

  setCurrentMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById('reportStartDate').value = this.formatDateISO(firstDay);
    document.getElementById('reportEndDate').value = this.formatDateISO(lastDay);
    this.generateReport();
  }

  setLastMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

    document.getElementById('reportStartDate').value = this.formatDateISO(firstDay);
    document.getElementById('reportEndDate').value = this.formatDateISO(lastDay);
    this.generateReport();
  }

  async generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
      alert('Selecione o periodo do relatorio');
      return;
    }

    try {
      // Resumo
      const resumo = await this.apiGet(`/empresa/painel/relatorios/resumo?data_inicio=${startDate}&data_fim=${endDate}`);

      document.getElementById('reportTotalAppointments').textContent = resumo.total_agendamentos || 0;
      document.getElementById('reportTotalRevenue').textContent = this.formatCurrency(resumo.receita_total || 0);
      document.getElementById('reportNewClients').textContent = resumo.novos_clientes || 0;
      document.getElementById('reportConfirmationRate').textContent = `${Math.round(resumo.taxa_confirmacao || 0)}%`;

      // Servicos
      const servicos = await this.apiGet(`/empresa/painel/relatorios/servicos?data_inicio=${startDate}&data_fim=${endDate}`);
      this.renderTopServices(servicos.servicos || []);

      // Graficos
      this.createReportCharts(resumo, startDate, endDate);

    } catch (err) {
      console.error('Erro ao gerar relatorio:', err);
      alert('Erro ao gerar relatorio');
    }
  }

  renderTopServices(services) {
    const tbody = document.getElementById('topServicesTable');

    if (!services.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-tertiary);">Nenhum servico no periodo</td></tr>';
      return;
    }

    tbody.innerHTML = services.slice(0, 5).map((s, i) => `
      <tr>
        <td style="font-weight: bold; color: ${i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-primary)'}">${i + 1}o</td>
        <td>${s.tipo_servico || '-'}</td>
        <td>${s.quantidade || 0}</td>
        <td>${this.formatCurrency(s.receita_total || 0)}</td>
        <td>${this.formatCurrency(s.ticket_medio || 0)}</td>
      </tr>
    `).join('');
  }

  async createReportCharts(resumo, startDate, endDate) {
    // Grafico de receita
    const ctx1 = document.getElementById('reportRevenueChart');
    if (this.charts.reportRevenue) this.charts.reportRevenue.destroy();

    // Simular dados diarios
    const start = new Date(startDate);
    const end = new Date(endDate);
    const labels = [];
    const values = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      values.push(Math.random() * ((resumo.receita_total || 0) / 100 / 10)); // Simulado
    }

    this.charts.reportRevenue = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Receita',
          data: values,
          backgroundColor: 'rgba(237, 106, 43, 0.7)',
          borderColor: 'rgb(237, 106, 43)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => 'R$ ' + v.toLocaleString('pt-BR') }
          }
        }
      }
    });

    // Grafico de status
    const ctx2 = document.getElementById('reportStatusChart');
    if (this.charts.reportStatus) this.charts.reportStatus.destroy();

    this.charts.reportStatus = new Chart(ctx2, {
      type: 'pie',
      data: {
        labels: ['Pendentes', 'Confirmados', 'Concluidos', 'Cancelados'],
        datasets: [{
          data: [
            resumo.por_status?.pendente || 0,
            resumo.por_status?.confirmado || 0,
            resumo.por_status?.concluido || 0,
            resumo.por_status?.cancelado || 0
          ],
          backgroundColor: ['#f59e0b', '#ed6a2b', '#22c55e', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  async exportReportPDF() {
    alert('Funcao de exportar PDF em desenvolvimento');
  }

  // ============================================
  // MINHA EMPRESA
  // ============================================

  async loadMinhaEmpresa() {
    const container = document.getElementById('empresaDataContainer');
    container.innerHTML = '<div class="loading" style="padding: 40px; text-align: center;"><div class="spinner"></div></div>';

    try {
      const empresa = await this.apiGet('/empresa/painel/minha-empresa');

      container.innerHTML = `
        <form id="formMinhaEmpresa" style="display: grid; gap: 20px;">

          <!-- Imagens da Empresa -->
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; padding: 20px; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-light);">
            <!-- Logo -->
            <div style="text-align: center;">
              <label style="display: block; margin-bottom: 10px; font-weight: 600;">Logo da Empresa</label>
              <div id="logoPreview" style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--border-medium); margin: 0 auto 10px; overflow: hidden; background: white; display: flex; align-items: center; justify-content: center;">
                ${empresa.logo_url ? `<img src="${getImageUrl(empresa.logo_url)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`}
              </div>
              <input type="file" id="logoInput" accept="image/*" style="display: none;" onchange="painel.uploadImagem('logo')">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('logoInput').click()" style="font-size: 0.85rem; padding: 6px 12px;">
                <svg style="width: 14px; height: 14px; margin-right: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Alterar Logo
              </button>
            </div>

            <!-- Capa -->
            <div>
              <label style="display: block; margin-bottom: 10px; font-weight: 600;">Foto de Capa (aparece no marketplace)</label>
              <div id="capaPreview" style="width: 100%; height: 140px; border-radius: 12px; border: 2px dashed var(--border-medium); overflow: hidden; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                ${empresa.foto_capa_url ? `<img src="${getImageUrl(empresa.foto_capa_url)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="text-align: center; color: var(--text-tertiary);"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><p style="font-size: 0.85rem; margin-top: 8px;">Recomendado: 800x400px</p></div>`}
              </div>
              <input type="file" id="capaInput" accept="image/*" style="display: none;" onchange="painel.uploadImagem('capa')">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('capaInput').click()" style="font-size: 0.85rem; padding: 6px 12px;">
                <svg style="width: 14px; height: 14px; margin-right: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Alterar Capa
              </button>
              <small style="display: block; margin-top: 8px; color: var(--text-tertiary);">Esta imagem aparece nos cards da sua empresa no marketplace</small>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Nome da Empresa</label>
              <input type="text" value="${empresa.nome || ''}" disabled>
            </div>
            <div class="form-group">
              <label>Slug (URL)</label>
              <input type="text" value="${empresa.slug || ''}" disabled>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Email</label>
              <input type="email" value="${empresa.email || ''}" disabled>
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" id="empTelefone" value="${empresa.telefone || ''}">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>WhatsApp</label>
              <input type="text" id="empWhatsapp" value="${empresa.whatsapp || ''}">
            </div>
            <div class="form-group">
              <label>Chave PIX</label>
              <input type="text" value="${empresa.chave_pix_masked || '****'}" disabled>
              <small style="color: var(--text-tertiary);">Para alterar, entre em contato com o suporte</small>
            </div>
          </div>

          <div class="form-group">
            <label>Endereco</label>
            <input type="text" id="empEndereco" value="${empresa.endereco || ''}">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Cidade</label>
              <input type="text" id="empCidade" value="${empresa.cidade || ''}">
            </div>
            <div class="form-group">
              <label>Estado</label>
              <input type="text" id="empEstado" value="${empresa.estado || ''}">
            </div>
          </div>

          <div class="form-group">
            <label>Descricao</label>
            <textarea id="empDescricao" rows="3" style="width: 100%; padding: 10px; border: 1px solid var(--border-light); border-radius: 8px;">${empresa.descricao || ''}</textarea>
          </div>

          <div class="form-group">
            <label>Horario de Funcionamento</label>
            <input type="text" id="empHorario" value="${empresa.horario_funcionamento || ''}" placeholder="Ex: Seg-Sex 8h-18h, Sab 8h-12h">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>Cor Primaria</label>
              <input type="color" id="empCorPrimaria" value="${empresa.cor_primaria || '#ed6a2b'}">
            </div>
            <div class="form-group">
              <label>Cor Secundaria</label>
              <input type="color" id="empCorSecundaria" value="${empresa.cor_secundaria || '#ea580c'}">
            </div>
          </div>

          <div style="margin-top: 10px;">
            <button type="button" class="btn btn-primary" onclick="painel.saveEmpresaData()">Salvar Alteracoes</button>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-light);">

          <div>
            <h4 style="margin-bottom: 10px;">Informacoes do Sistema</h4>
            <p><strong>Status:</strong> <span class="status-badge ${empresa.status === 'ativo' ? 'concluido' : 'cancelado'}">${empresa.status}</span></p>
            <p><strong>URL da Pagina:</strong> <a href="https://agendaaquivistorias.com.br/${empresa.slug}" target="_blank" style="color: var(--brand-primary);">agendaaquivistorias.com.br/${empresa.slug}</a></p>
            <p><strong>Data de Cadastro:</strong> ${this.formatDate(empresa.created_at)}</p>
          </div>
        </form>
      `;

    } catch (err) {
      console.error('Erro ao carregar empresa:', err);
      container.innerHTML = '<div style="color: var(--status-danger); padding: 20px;">Erro ao carregar dados da empresa</div>';
    }
  }

  async uploadImagem(tipo) {
    const inputId = tipo === 'logo' ? 'logoInput' : 'capaInput';
    const previewId = tipo === 'logo' ? 'logoPreview' : 'capaPreview';
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input.files || !input.files[0]) {
      return;
    }

    const file = input.files[0];

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Maximo 5MB.');
      return;
    }

    // Mostrar loading
    preview.innerHTML = '<div class="spinner"></div>';

    try {
      const formData = new FormData();
      formData.append('imagem', file);
      formData.append('tipo', tipo);

      const response = await fetch(`${API_URL}/empresa/painel/upload-imagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no upload');
      }

      // Converter URL para absoluta se necessario
      const imageUrl = getImageUrl(data.url);

      // Atualizar preview
      preview.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;

      // Atualizar dados da empresa em memória
      if (tipo === 'logo') {
        this.empresa.logo_url = data.url;
        // Atualizar logo na sidebar
        const sidebarLogo = document.getElementById('sidebarLogo');
        if (sidebarLogo) {
          sidebarLogo.src = imageUrl;
          sidebarLogo.style.display = 'block';
        }
      } else if (tipo === 'capa') {
        this.empresa.foto_capa_url = data.url;
      } else if (tipo === 'perfil') {
        this.empresa.foto_perfil_url = data.url;
        // Atualizar avatar na sidebar
        const userAvatarImg = document.getElementById('userAvatarImg');
        if (userAvatarImg) {
          userAvatarImg.src = imageUrl;
          userAvatarImg.style.display = 'block';
        }
      }

      alert('Imagem enviada com sucesso!');

    } catch (err) {
      console.error('Erro no upload:', err);
      alert(err.message || 'Erro ao enviar imagem');
      // Restaurar preview
      this.loadMinhaEmpresa();
    }
  }

  async saveEmpresaData() {
    const dados = {
      telefone: document.getElementById('empTelefone')?.value,
      whatsapp: document.getElementById('empWhatsapp')?.value,
      endereco: document.getElementById('empEndereco')?.value,
      cidade: document.getElementById('empCidade')?.value,
      estado: document.getElementById('empEstado')?.value,
      descricao: document.getElementById('empDescricao')?.value,
      horario_funcionamento: document.getElementById('empHorario')?.value,
      cor_primaria: document.getElementById('empCorPrimaria')?.value,
      cor_secundaria: document.getElementById('empCorSecundaria')?.value
    };

    try {
      await this.apiPut('/empresa/painel/minha-empresa', dados);
      alert('Dados salvos com sucesso!');

      // Atualizar cores
      if (dados.cor_primaria) {
        document.documentElement.style.setProperty('--brand-primary', dados.cor_primaria);
      }
    } catch (err) {
      alert(err.message || 'Erro ao salvar dados');
    }
  }

  // ============================================
  // CONFIGURACOES
  // ============================================

  async loadConfiguracoes() {
    const container = document.getElementById('configHorariosContainer');
    container.innerHTML = '<div class="loading" style="padding: 40px; text-align: center;"><div class="spinner"></div></div>';

    try {
      const config = await this.apiGet('/empresa/painel/configuracoes/horarios');

      container.innerHTML = `
        <form id="formHorarios">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div class="form-group">
              <label>Horario de Inicio</label>
              <input type="time" id="configHorarioInicio" value="${config.horario_inicio || '08:00'}">
            </div>
            <div class="form-group">
              <label>Horario de Fim</label>
              <input type="time" id="configHorarioFim" value="${config.horario_fim || '18:00'}">
            </div>
            <div class="form-group">
              <label>Intervalo (min)</label>
              <input type="number" id="configIntervalo" value="${config.intervalo_minutos || 60}" min="15" step="15">
            </div>
          </div>
          <button type="button" class="btn btn-primary" onclick="painel.saveHorarios()">Salvar Horarios</button>
        </form>
      `;

    } catch (err) {
      console.error('Erro ao carregar configuracoes:', err);
      container.innerHTML = '<div style="color: var(--status-danger);">Erro ao carregar configuracoes</div>';
    }
  }

  async saveHorarios() {
    const dados = {
      horario_inicio: document.getElementById('configHorarioInicio')?.value,
      horario_fim: document.getElementById('configHorarioFim')?.value,
      intervalo_minutos: parseInt(document.getElementById('configIntervalo')?.value) || 60
    };

    try {
      await this.apiPut('/empresa/painel/configuracoes/horarios', dados);
      alert('Horarios salvos com sucesso!');
    } catch (err) {
      alert(err.message || 'Erro ao salvar horarios');
    }
  }

  // ============================================
  // BUSCA GLOBAL
  // ============================================

  globalSearch(term) {
    if (!term.trim()) return;

    document.getElementById('filterSearch').value = term;
    this.showSection('agendamentos');
  }

  // ============================================
  // API HELPERS
  // ============================================

  async apiGet(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisicao');
    }

    return data;
  }

  async apiPost(endpoint, body) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisicao');
    }

    return data;
  }

  async apiPut(endpoint, body) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisicao');
    }

    return data;
  }

  async apiPatch(endpoint, body) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisicao');
    }

    return data;
  }

  // ============================================
  // FORMATTERS
  // ============================================

  formatCurrency(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }

  formatDateISO(date) {
    return date.toISOString().split('T')[0];
  }

  getPaymentClass(status) {
    const classes = {
      'aprovado': 'approved',
      'pendente': 'pending',
      'recusado': 'rejected',
      'estornado': 'rejected'
    };
    return classes[status] || 'none';
  }

  getPaymentLabel(status) {
    const labels = {
      'aprovado': 'Pago',
      'pendente': 'Pendente',
      'recusado': 'Recusado',
      'estornado': 'Estornado'
    };
    return labels[status] || 'N/A';
  }
}

// Instanciar painel
const painel = new PainelEmpresa();

// Expor globalmente para eventos onclick
window.painel = painel;
