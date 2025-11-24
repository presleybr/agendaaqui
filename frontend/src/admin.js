import { authService } from './services/api.js';
import api from './services/api.js';
import { formatters } from './utils/validators.js';
import { format } from 'date-fns';
import { ReportsManager } from './components/ReportsManager.js';
import { EmpresasManager } from './components/EmpresasManager.js';

class AdminPanel {
  constructor() {
    this.currentFilters = {};
    this.appointments = [];
    this.currentCalendarDate = new Date();
    this.reportsManager = null; // Será inicializado após login
    this.empresasManager = null; // Será inicializado após login
    this.init();
  }

  init() {
    if (authService.isAuthenticated()) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';

    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    // Demo login button
    const demoBtn = document.getElementById('demoLoginBtn');
    if (demoBtn) {
      demoBtn.addEventListener('click', async () => {
        document.getElementById('loginEmail').value = 'admin@vistoria.com';
        document.getElementById('loginPassword').value = 'Admin123!@#';
        await this.handleLogin();
      });
    }
  }

  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
      await authService.login(email, password);
      this.showDashboard();
    } catch (error) {
      errorDiv.textContent = 'Credenciais inválidas';
      errorDiv.style.display = 'block';
    }
  }

  async showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';

    const user = authService.getUser();
    document.getElementById('sidebarUserName').textContent = user?.nome || 'Admin';

    // Load data
    await this.loadStats();
    await this.loadAppointments();

    // Initialize charts
    this.initCharts();

    // Initialize reports manager
    this.reportsManager = new ReportsManager();

    // Initialize empresas manager
    this.empresasManager = new EmpresasManager();

    // Setup empresas modal controls
    this.setupEmpresasModal();

    // Setup navigation
    this.setupNavigation();

    // Setup configuracoes buttons
    this.setupConfiguracoes();

    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', () => {
      authService.logout();
      location.reload();
    });

    document.getElementById('filterBtn').addEventListener('click', () => {
      this.applyFilters();
    });

    document.getElementById('clearFilterBtn').addEventListener('click', () => {
      this.clearFilters();
    });

    // Close modal
    const modal = document.getElementById('appointmentModal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // New Appointment Modal
    this.setupNewAppointmentModal();

    // New Cliente Modal
    this.setupNewClienteModal();

    // Setup Notifications
    this.setupNotifications();
  }

  setupNavigation() {
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const sectionId = item.dataset.section;

        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update active section
        sections.forEach(section => section.classList.remove('active'));
        const activeSection = document.getElementById(`section-${sectionId}`);
        if (activeSection) {
          activeSection.classList.add('active');
        }

        // Update page title
        const titles = {
          'dashboard': 'Dashboard',
          'agendamentos': 'Agendamentos',
          'clientes': 'Clientes',
          'calendario': 'Calendário',
          'relatorios': 'Relatórios',
          'configuracoes': 'Configurações'
        };
        pageTitle.textContent = titles[sectionId] || 'Dashboard';

        // Reload data when navigating to specific sections
        if (sectionId === 'agendamentos') {
          console.log('Navigating to Agendamentos - reloading data...');
          await this.loadAppointments();
        } else if (sectionId === 'dashboard') {
          console.log('Navigating to Dashboard - reloading data...');
          await this.loadStats();
          await this.loadAppointments();
        } else if (sectionId === 'clientes') {
          console.log('Navigating to Clientes - reloading data...');
          await this.loadClientes();
        } else if (sectionId === 'calendario') {
          console.log('Navigating to Calendario - rendering calendar...');
          await this.renderCalendar();
        } else if (sectionId === 'configuracoes') {
          console.log('Navigating to Configuracoes - loading settings...');
          await this.loadConfiguracoes();
        }
      });
    });

    // Menu toggle (mobile)
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
    }
  }

  async loadStats() {
    try {
      console.log('📊 Loading stats...');
      const today = format(new Date(), 'yyyy-MM-dd');
      const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      const lastDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');

      console.log('   Today:', today);
      console.log('   Month range:', firstDayOfMonth, 'to', lastDayOfMonth);

      const [todayData, monthData] = await Promise.all([
        api.get(`/agendamentos?data=${today}`),
        api.get(`/agendamentos/stats?data_inicio=${firstDayOfMonth}&data_fim=${lastDayOfMonth}`)
      ]);

      console.log('✅ Stats loaded:', { todayData, monthData });

      document.getElementById('statToday').textContent = todayData.total || 0;
      document.getElementById('statPending').textContent = monthData.pendentes || 0;
      document.getElementById('statConfirmed').textContent = monthData.confirmados || 0;
      document.getElementById('statRevenue').textContent = formatters.currency(monthData.receita_total || 0);

      console.log('✅ Stats rendered to DOM');
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      console.error('   Error details:', error.response?.data);
      console.error('   Error status:', error.response?.status);

      // Set fallback values
      document.getElementById('statToday').textContent = '0';
      document.getElementById('statPending').textContent = '0';
      document.getElementById('statConfirmed').textContent = '0';
      document.getElementById('statRevenue').textContent = 'R$ 0,00';
    }
  }

  async loadAppointments() {
    const dashboardTbody = document.getElementById('dashboardAppointmentsTable');
    const agendamentosTbody = document.getElementById('agendamentosAppointmentsTable');

    const loadingHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px;">
          <div class="spinner"></div>
          <p style="margin-top: 10px; color: #666;">Carregando agendamentos...</p>
        </td>
      </tr>
    `;

    try {
      // Show loading state in both tables
      if (dashboardTbody) dashboardTbody.innerHTML = loadingHTML;
      if (agendamentosTbody) agendamentosTbody.innerHTML = loadingHTML;

      const params = new URLSearchParams(this.currentFilters);
      console.log('📋 Loading appointments with params:', params.toString());

      const response = await api.get(`/agendamentos?${params.toString()}`);
      console.log('✅ Appointments loaded:', response);

      this.appointments = response.agendamentos || [];

      // Show total count
      const totalCount = response.total || this.appointments.length;
      console.log(`📊 Loaded ${this.appointments.length} appointments (total: ${totalCount})`);

      this.renderAppointments();
    } catch (error) {
      console.error('❌ Error loading appointments:', error);
      console.error('Error details:', error.response?.data);

      const errorHTML = `
        <tr><td colspan="9" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <svg style="width: 48px; height: 48px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao carregar agendamentos</p>
            <p style="font-size: 0.9rem; color: #666;">${error.response?.data?.error || error.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadAppointments()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;

      if (dashboardTbody) dashboardTbody.innerHTML = errorHTML;
      if (agendamentosTbody) agendamentosTbody.innerHTML = errorHTML;
    }
  }

  renderAppointments() {
    const dashboardTbody = document.getElementById('dashboardAppointmentsTable');
    const agendamentosTbody = document.getElementById('agendamentosAppointmentsTable');

    const emptyStateHTML = `
      <tr><td colspan="9" style="text-align: center; padding: 40px;">
        <div style="color: #666;">
          <svg style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p style="font-weight: 600; margin-bottom: 5px;">Nenhum agendamento encontrado</p>
          <p style="font-size: 0.9rem;">Use os filtros acima ou crie um novo agendamento</p>
        </div>
      </td></tr>
    `;

    if (!this.appointments || this.appointments.length === 0) {
      if (dashboardTbody) dashboardTbody.innerHTML = emptyStateHTML;
      if (agendamentosTbody) agendamentosTbody.innerHTML = emptyStateHTML;
      return;
    }

    console.log(`🎨 Rendering ${this.appointments.length} appointments`);

    try {
      const tableHTML = this.appointments.map(appointment => {
        // Parse date safely - handle both YYYY-MM-DD and full ISO formats
        const dateStr = appointment.data.includes('T') ? appointment.data.split('T')[0] : appointment.data;
        const [year, month, day] = dateStr.split('-').map(Number);
        const appointmentDate = new Date(year, month - 1, day);

        return `
      <tr>
        <td><strong>${appointment.protocolo}</strong></td>
        <td>
          ${appointment.cliente_nome}<br>
          <small style="color: #666;">${appointment.cliente_telefone || 'N/A'}</small>
        </td>
        <td>
          ${appointment.veiculo_marca} ${appointment.veiculo_modelo}<br>
          <small style="color: #666;">${appointment.veiculo_placa}</small>
        </td>
        <td>
          ${format(appointmentDate, 'dd/MM/yyyy')}<br>
          <small style="color: #666;">${appointment.horario}</small>
        </td>
        <td>${this.getTipoLabel(appointment.tipo_vistoria)}</td>
        <td>${formatters.currency(appointment.preco)}</td>
        <td>
          <span class="status-badge ${appointment.status}">${this.getStatusLabel(appointment.status)}</span>
        </td>
        <td>
          ${this.getPaymentStatusBadge(appointment)}
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-primary btn-small" onclick="adminPanel.viewDetails(${appointment.id})" title="Ver detalhes">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn btn-success btn-small" onclick="adminPanel.editAppointment(${appointment.id})" title="Editar">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            ${appointment.status !== 'cancelado' && appointment.status !== 'realizado' ? `
              <button class="btn btn-danger btn-small" onclick="adminPanel.deleteAppointment(${appointment.id})" title="Excluir">
                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
      }).join('');

      // Render in both tables
      if (dashboardTbody) dashboardTbody.innerHTML = tableHTML;
      if (agendamentosTbody) agendamentosTbody.innerHTML = tableHTML;

      console.log('✅ Table rendered successfully in both Dashboard and Agendamentos sections');
    } catch (error) {
      console.error('❌ Render error:', error);

      const errorHTML = `
        <tr><td colspan="9" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao renderizar agendamentos</p>
            <p style="font-size: 0.9rem; color: #666;">${error.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadAppointments()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;

      if (dashboardTbody) dashboardTbody.innerHTML = errorHTML;
      if (agendamentosTbody) agendamentosTbody.innerHTML = errorHTML;
    }
  }

  async viewDetails(id) {
    try {
      const response = await api.get(`/agendamentos/${id}`);
      const appointment = response.data;

      const modal = document.getElementById('appointmentModal');
      const detailsDiv = document.getElementById('appointmentDetails');

      detailsDiv.innerHTML = `
        <h2>Detalhes do Agendamento</h2>

        <div class="detail-section">
          <h3>Informações Gerais</h3>
          <div class="detail-row">
            <span class="detail-label">Protocolo:</span>
            <span class="detail-value"><strong>${appointment.protocolo}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
              <span class="status-badge ${appointment.status}">${this.getStatusLabel(appointment.status)}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data de Criação:</span>
            <span class="detail-value">${(() => {
              try {
                return format(new Date(appointment.created_at), 'dd/MM/yyyy HH:mm');
              } catch {
                return 'Data inválida';
              }
            })()}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Cliente</h3>
          <div class="detail-row">
            <span class="detail-label">Nome:</span>
            <span class="detail-value">${appointment.cliente_nome}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">CPF:</span>
            <span class="detail-value">${appointment.cliente_cpf}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Telefone:</span>
            <span class="detail-value">${appointment.cliente_telefone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">E-mail:</span>
            <span class="detail-value">${appointment.cliente_email}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Veículo</h3>
          <div class="detail-row">
            <span class="detail-label">Placa:</span>
            <span class="detail-value">${appointment.veiculo_placa}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Marca/Modelo:</span>
            <span class="detail-value">${appointment.veiculo_marca} ${appointment.veiculo_modelo}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ano:</span>
            <span class="detail-value">${appointment.veiculo_ano}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Agendamento</h3>
          <div class="detail-row">
            <span class="detail-label">Tipo:</span>
            <span class="detail-value">${this.getTipoLabel(appointment.tipo_vistoria)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data:</span>
            <span class="detail-value">${(() => {
              try {
                const dateStr = appointment.data.includes('T') ? appointment.data.split('T')[0] : appointment.data;
                const [year, month, day] = dateStr.split('-').map(Number);
                return format(new Date(year, month - 1, day), 'dd/MM/yyyy');
              } catch {
                return 'Data inválida';
              }
            })()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Horário:</span>
            <span class="detail-value">${appointment.horario}</span>
          </div>
          ${appointment.endereco_vistoria ? `
            <div class="detail-row">
              <span class="detail-label">Endereço:</span>
              <span class="detail-value">${appointment.endereco_vistoria}</span>
            </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Valor:</span>
            <span class="detail-value"><strong>${formatters.currency(appointment.preco)}</strong></span>
          </div>
        </div>

        ${appointment.observacoes ? `
          <div class="detail-section">
            <h3>Observações</h3>
            <p>${appointment.observacoes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
          ${appointment.status === 'pendente' ? `
            <button class="btn btn-success" onclick="adminPanel.updateStatus(${appointment.id}, 'confirmado'); adminPanel.closeModal();">
              Confirmar
            </button>
          ` : ''}
          ${appointment.status === 'confirmado' ? `
            <button class="btn btn-primary" onclick="adminPanel.updateStatus(${appointment.id}, 'realizado'); adminPanel.closeModal();">
              Marcar como Realizado
            </button>
          ` : ''}
          ${appointment.status !== 'cancelado' && appointment.status !== 'realizado' ? `
            <button class="btn btn-danger" onclick="adminPanel.updateStatus(${appointment.id}, 'cancelado'); adminPanel.closeModal();">
              Cancelar
            </button>
          ` : ''}
          <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Fechar</button>
        </div>
      `;

      modal.style.display = 'block';
    } catch (error) {
      console.error('Error loading appointment details:', error);
      alert('Erro ao carregar detalhes do agendamento');
    }
  }

  async updateStatus(id, status) {
    if (!confirm(`Confirmar alteração de status para "${this.getStatusLabel(status)}"?`)) {
      return;
    }

    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      await this.loadAppointments();
      await this.loadStats();
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  }

  applyFilters() {
    const date = document.getElementById('filterDate').value;
    const status = document.getElementById('filterStatus').value;
    const type = document.getElementById('filterType').value;

    this.currentFilters = {};

    if (date) this.currentFilters.data = date;
    if (status) this.currentFilters.status = status;
    if (type) this.currentFilters.tipo_vistoria = type;

    this.loadAppointments();
  }

  clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterType').value = '';
    this.currentFilters = {};
    this.loadAppointments();
  }

  closeModal() {
    document.getElementById('appointmentModal').style.display = 'none';
  }

  getStatusLabel(status) {
    const labels = {
      'pendente': 'Pendente',
      'confirmado': 'Confirmado',
      'realizado': 'Realizado',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  }

  getTipoLabel(tipo) {
    const labels = {
      'cautelar': 'Cautelar',
      'transferencia': 'Transferência',
      'outros': 'Outros'
    };
    return labels[tipo] || tipo;
  }

  getPaymentStatusBadge(appointment) {
    const paymentStatus = appointment.pagamento_status;
    const paymentConfirmed = appointment.pagamento_confirmado;

    if (paymentStatus === 'approved' || paymentConfirmed === 1) {
      return '<span class="payment-badge approved">✓ Pago</span>';
    } else if (paymentStatus === 'pending') {
      return '<span class="payment-badge pending">⏱ Pendente</span>';
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      return '<span class="payment-badge rejected">✗ Rejeitado</span>';
    } else {
      return '<span class="payment-badge none">− Sem Pagamento</span>';
    }
  }

  setupNewAppointmentModal() {
    const modal = document.getElementById('newAppointmentModal');
    const btnOpen = document.getElementById('btnNovoAgendamento');
    const btnClose = document.getElementById('closeNewAppointment');
    const btnCancel = document.getElementById('cancelNewAppointment');
    const form = document.getElementById('newAppointmentForm');
    const dateInput = document.getElementById('dataAgendamento');
    const horarioSelect = document.getElementById('horarioAgendamento');

    // Open modal
    btnOpen.addEventListener('click', () => {
      modal.style.display = 'block';
      this.resetNewAppointmentForm();
      // Set min date to today
      const today = format(new Date(), 'yyyy-MM-dd');
      dateInput.setAttribute('min', today);
    });

    // Close modal
    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    btnCancel.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Load available times when date changes
    dateInput.addEventListener('change', async () => {
      await this.loadAvailableTimes(dateInput.value);
    });

    // Apply masks
    this.applyInputMasks();

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleNewAppointment();
    });
  }

  applyInputMasks() {
    const cpfInput = document.getElementById('clienteCPF');
    const telefoneInput = document.getElementById('clienteTelefone');
    const placaInput = document.getElementById('veiculoPlaca');

    // CPF mask
    cpfInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = value;
    });

    // Telefone mask
    telefoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
      e.target.value = value;
    });

    // Placa mask (uppercase)
    placaInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  async loadAvailableTimes(date) {
    const horarioSelect = document.getElementById('horarioAgendamento');

    try {
      const response = await api.get(`/availability/${date}`);
      const slots = response.data.slots;

      horarioSelect.innerHTML = '<option value="">Selecione um horário...</option>';

      slots.forEach(slot => {
        if (slot.available) {
          const option = document.createElement('option');
          option.value = slot.time;
          option.textContent = `${slot.time} (${slot.available_slots} vaga${slot.available_slots > 1 ? 's' : ''} disponível)`;
          horarioSelect.appendChild(option);
        }
      });

      if (slots.filter(s => s.available).length === 0) {
        horarioSelect.innerHTML = '<option value="">Nenhum horário disponível nesta data</option>';
      }
    } catch (error) {
      console.error('Error loading available times:', error);
      horarioSelect.innerHTML = '<option value="">Erro ao carregar horários</option>';
    }
  }

  async handleNewAppointment() {
    const submitBtn = document.getElementById('submitNewAppointment');
    const submitText = document.getElementById('submitText');
    const submitLoading = document.getElementById('submitLoading');
    const errorDiv = document.getElementById('newAppointmentError');

    // Show loading
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-block';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
      const data = {
        cliente: {
          nome: document.getElementById('clienteNome').value,
          cpf: document.getElementById('clienteCPF').value.replace(/\D/g, ''),
          email: document.getElementById('clienteEmail').value,
          telefone: document.getElementById('clienteTelefone').value.replace(/\D/g, '')
        },
        veiculo: {
          placa: document.getElementById('veiculoPlaca').value,
          marca: document.getElementById('veiculoMarca').value,
          modelo: document.getElementById('veiculoModelo').value,
          ano: parseInt(document.getElementById('veiculoAno').value)
        },
        tipo_vistoria: document.getElementById('tipoVistoria').value,
        data: document.getElementById('dataAgendamento').value,
        horario: document.getElementById('horarioAgendamento').value,
        endereco_vistoria: document.getElementById('enderecoVistoria').value || null,
        observacoes: document.getElementById('observacoes').value || null
      };

      const response = await api.post('/agendamentos', data);

      // Success
      alert(`Agendamento criado com sucesso!\nProtocolo: ${response.data.protocolo}`);
      document.getElementById('newAppointmentModal').style.display = 'none';
      this.resetNewAppointmentForm();
      await this.loadAppointments();
      await this.loadStats();
    } catch (error) {
      console.error('Error creating appointment:', error);
      let errorMessage = 'Erro ao criar agendamento. Tente novamente.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
      }

      errorDiv.textContent = errorMessage;
      errorDiv.style.display = 'block';
    } finally {
      // Hide loading
      submitText.style.display = 'inline';
      submitLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  resetNewAppointmentForm() {
    document.getElementById('newAppointmentForm').reset();
    document.getElementById('newAppointmentError').style.display = 'none';
    document.getElementById('horarioAgendamento').innerHTML = '<option value="">Selecione primeiro a data...</option>';
  }

  // ==================== EDIT APPOINTMENT ====================

  async editAppointment(id) {
    try {
      const response = await api.get(`/agendamentos/${id}`);
      const appointment = response.data;

      // Open modal
      const modal = document.getElementById('editAppointmentModal');
      modal.style.display = 'block';

      // Fill form
      document.getElementById('editAppointmentId').value = appointment.id;
      document.getElementById('editStatus').value = appointment.status;
      document.getElementById('editAgendamentoClienteNome').value = appointment.cliente_nome;
      document.getElementById('editAgendamentoClienteCPF').value = this.formatCPF(appointment.cliente_cpf);
      document.getElementById('editAgendamentoClienteEmail').value = appointment.cliente_email;
      document.getElementById('editAgendamentoClienteTelefone').value = this.formatTelefone(appointment.cliente_telefone);
      document.getElementById('editVeiculoPlaca').value = appointment.veiculo_placa;
      document.getElementById('editVeiculoMarca').value = appointment.veiculo_marca;
      document.getElementById('editVeiculoModelo').value = appointment.veiculo_modelo;
      document.getElementById('editVeiculoAno').value = appointment.veiculo_ano;
      document.getElementById('editTipoVistoria').value = appointment.tipo_vistoria;
      document.getElementById('editDataAgendamento').value = appointment.data;
      document.getElementById('editHorarioAgendamento').value = appointment.horario;
      document.getElementById('editPreco').value = (appointment.preco / 100).toFixed(2);
      document.getElementById('editEnderecoVistoria').value = appointment.endereco_vistoria || '';
      document.getElementById('editObservacoes').value = appointment.observacoes || '';

      // Setup edit modal if not done yet
      if (!this.editModalSetup) {
        this.setupEditAppointmentModal();
        this.editModalSetup = true;
      }
    } catch (error) {
      console.error('Error loading appointment for edit:', error);
      alert('Erro ao carregar dados do agendamento');
    }
  }

  setupEditAppointmentModal() {
    const modal = document.getElementById('editAppointmentModal');
    const btnClose = document.getElementById('closeEditAppointment');
    const btnCancel = document.getElementById('cancelEditAppointment');
    const form = document.getElementById('editAppointmentForm');

    // Close modal
    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    btnCancel.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Apply masks to edit form
    this.applyEditInputMasks();

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleEditAppointment();
    });
  }

  applyEditInputMasks() {
    const cpfInput = document.getElementById('editAgendamentoClienteCPF');
    const telefoneInput = document.getElementById('editAgendamentoClienteTelefone');
    const placaInput = document.getElementById('editVeiculoPlaca');

    // CPF mask
    cpfInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = value;
    });

    // Telefone mask
    telefoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
      e.target.value = value;
    });

    // Placa mask (uppercase)
    placaInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  async handleEditAppointment() {
    const submitBtn = document.getElementById('submitEditAppointment');
    const submitText = document.getElementById('editSubmitText');
    const submitLoading = document.getElementById('editSubmitLoading');
    const errorDiv = document.getElementById('editAppointmentError');

    // Show loading
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-block';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
      const id = document.getElementById('editAppointmentId').value;

      const data = {
        status: document.getElementById('editStatus').value,
        cliente_nome: document.getElementById('editAgendamentoClienteNome').value,
        cliente_cpf: document.getElementById('editAgendamentoClienteCPF').value.replace(/\D/g, ''),
        cliente_email: document.getElementById('editAgendamentoClienteEmail').value,
        cliente_telefone: document.getElementById('editAgendamentoClienteTelefone').value.replace(/\D/g, ''),
        veiculo_placa: document.getElementById('editVeiculoPlaca').value,
        veiculo_marca: document.getElementById('editVeiculoMarca').value,
        veiculo_modelo: document.getElementById('editVeiculoModelo').value,
        veiculo_ano: parseInt(document.getElementById('editVeiculoAno').value),
        tipo_vistoria: document.getElementById('editTipoVistoria').value,
        data: document.getElementById('editDataAgendamento').value,
        horario: document.getElementById('editHorarioAgendamento').value,
        preco: Math.round(parseFloat(document.getElementById('editPreco').value) * 100),
        endereco_vistoria: document.getElementById('editEnderecoVistoria').value || null,
        observacoes: document.getElementById('editObservacoes').value || null
      };

      await api.put(`/agendamentos/${id}`, data);

      // Success
      alert('Agendamento atualizado com sucesso!');
      document.getElementById('editAppointmentModal').style.display = 'none';
      await this.loadAppointments();
      await this.loadStats();
    } catch (error) {
      console.error('Error updating appointment:', error);
      let errorMessage = 'Erro ao atualizar agendamento. Tente novamente.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
      }

      errorDiv.textContent = errorMessage;
      errorDiv.style.display = 'block';
    } finally {
      // Hide loading
      submitText.style.display = 'inline';
      submitLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  async deleteAppointment(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.delete(`/agendamentos/${id}`);
      alert('Agendamento excluído com sucesso!');
      await this.loadAppointments();
      await this.loadStats();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Erro ao excluir agendamento');
    }
  }

  formatCPF(cpf) {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatTelefone(telefone) {
    if (!telefone) return '';
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  // ==================== CLIENTES ====================

  async loadClientes() {
    const tbody = document.getElementById('clientesTable');

    const loadingHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="spinner"></div>
          <p style="margin-top: 10px; color: #666;">Carregando clientes...</p>
        </td>
      </tr>
    `;

    try {
      if (tbody) tbody.innerHTML = loadingHTML;

      console.log('📋 Loading clientes...');
      const data = await api.get('/clientes');
      console.log('✅ Clientes loaded:', data);

      this.clientes = data.clientes || [];
      console.log(`📊 Loaded ${this.clientes.length} clientes (total: ${data.total})`);

      this.renderClientes();
    } catch (error) {
      console.error('❌ Error loading clientes:', error);

      const errorHTML = `
        <tr><td colspan="6" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <svg style="width: 48px; height: 48px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao carregar clientes</p>
            <p style="font-size: 0.9rem; color: #666;">${error.response?.data?.error || error.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadClientes()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;

      if (tbody) tbody.innerHTML = errorHTML;
    }
  }

  renderClientes() {
    const tbody = document.getElementById('clientesTable');

    const emptyStateHTML = `
      <tr><td colspan="6" style="text-align: center; padding: 40px;">
        <div style="color: #666;">
          <svg style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <p style="font-weight: 600; margin-bottom: 5px;">Nenhum cliente encontrado</p>
          <p style="font-size: 0.9rem;">Clique em "Novo Cliente" para cadastrar</p>
        </div>
      </td></tr>
    `;

    if (!this.clientes || this.clientes.length === 0) {
      if (tbody) tbody.innerHTML = emptyStateHTML;
      return;
    }

    console.log(`🎨 Rendering ${this.clientes.length} clientes`);

    try {
      const tableHTML = this.clientes.map(cliente => `
        <tr>
          <td><strong>${cliente.nome}</strong></td>
          <td>${this.formatCPF(cliente.cpf)}</td>
          <td>${this.formatTelefone(cliente.telefone)}</td>
          <td>${cliente.email || '-'}</td>
          <td>${format(new Date(cliente.created_at), 'dd/MM/yyyy')}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-success btn-small" onclick="adminPanel.editCliente(${cliente.id})" title="Editar">
                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn btn-danger btn-small" onclick="adminPanel.deleteCliente(${cliente.id})" title="Excluir">
                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      if (tbody) tbody.innerHTML = tableHTML;
      console.log('✅ Clientes table rendered successfully');
    } catch (error) {
      console.error('❌ Render error:', error);

      const errorHTML = `
        <tr><td colspan="6" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao renderizar clientes</p>
            <p style="font-size: 0.9rem; color: #666;">${error.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadClientes()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;

      if (tbody) tbody.innerHTML = errorHTML;
    }
  }

  setupNewClienteModal() {
    const modal = document.getElementById('newClienteModal');
    const btnOpen = document.getElementById('btnNovoCliente');
    const btnClose = document.getElementById('closeNewCliente');
    const btnCancel = document.getElementById('cancelNewCliente');
    const form = document.getElementById('newClienteForm');

    // Open modal
    btnOpen.addEventListener('click', () => {
      modal.style.display = 'block';
      this.resetNewClienteForm();
    });

    // Close modal
    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    btnCancel.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Apply masks
    this.applyClienteMasks('new');

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleNewCliente();
    });
  }

  applyClienteMasks(prefix) {
    const cpfInput = document.getElementById(`${prefix}ClienteCPF`);
    const telefoneInput = document.getElementById(`${prefix}ClienteTelefone`);

    // CPF mask
    cpfInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = value;
    });

    // Telefone mask
    telefoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
      e.target.value = value;
    });
  }

  async handleNewCliente() {
    const submitBtn = document.getElementById('submitNewCliente');
    const submitText = document.getElementById('newClienteSubmitText');
    const submitLoading = document.getElementById('newClienteSubmitLoading');
    const errorDiv = document.getElementById('newClienteError');

    // Show loading
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-block';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
      const data = {
        nome: document.getElementById('newClienteNome').value,
        cpf: document.getElementById('newClienteCPF').value.replace(/\D/g, ''),
        telefone: document.getElementById('newClienteTelefone').value.replace(/\D/g, ''),
        email: document.getElementById('newClienteEmail').value || null
      };

      await api.post('/clientes', data);

      // Success
      alert('Cliente cadastrado com sucesso!');
      document.getElementById('newClienteModal').style.display = 'none';
      this.resetNewClienteForm();
      await this.loadClientes();
    } catch (error) {
      console.error('Error creating cliente:', error);
      let errorMessage = 'Erro ao cadastrar cliente. Tente novamente.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      errorDiv.textContent = errorMessage;
      errorDiv.style.display = 'block';
    } finally {
      // Hide loading
      submitText.style.display = 'inline';
      submitLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  resetNewClienteForm() {
    document.getElementById('newClienteForm').reset();
    document.getElementById('newClienteError').style.display = 'none';
  }

  async editCliente(id) {
    try {
      const response = await api.get(`/clientes/${id}`);
      const cliente = response.data;

      const modal = document.getElementById('editClienteModal');
      modal.style.display = 'block';

      // Fill form
      document.getElementById('editClienteId').value = cliente.id;
      document.getElementById('editClienteNome').value = cliente.nome;
      document.getElementById('editClienteCPF').value = this.formatCPF(cliente.cpf);
      document.getElementById('editClienteTelefone').value = this.formatTelefone(cliente.telefone);
      document.getElementById('editClienteEmail').value = cliente.email || '';

      // Setup modal if not done yet
      if (!this.editClienteModalSetup) {
        this.setupEditClienteModal();
        this.editClienteModalSetup = true;
      }
    } catch (error) {
      console.error('Error loading cliente for edit:', error);
      alert('Erro ao carregar dados do cliente');
    }
  }

  setupEditClienteModal() {
    const modal = document.getElementById('editClienteModal');
    const btnClose = document.getElementById('closeEditCliente');
    const btnCancel = document.getElementById('cancelEditCliente');
    const form = document.getElementById('editClienteForm');

    // Close modal
    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    btnCancel.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Apply masks
    this.applyClienteMasks('edit');

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleEditCliente();
    });
  }

  async handleEditCliente() {
    const submitBtn = document.getElementById('submitEditCliente');
    const submitText = document.getElementById('editClienteSubmitText');
    const submitLoading = document.getElementById('editClienteSubmitLoading');
    const errorDiv = document.getElementById('editClienteError');

    // Show loading
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-block';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
      const id = document.getElementById('editClienteId').value;

      const data = {
        nome: document.getElementById('editClienteNome').value,
        telefone: document.getElementById('editClienteTelefone').value.replace(/\D/g, ''),
        email: document.getElementById('editClienteEmail').value || null
      };

      await api.put(`/clientes/${id}`, data);

      // Success
      alert('Cliente atualizado com sucesso!');
      document.getElementById('editClienteModal').style.display = 'none';
      await this.loadClientes();
    } catch (error) {
      console.error('Error updating cliente:', error);
      let errorMessage = 'Erro ao atualizar cliente. Tente novamente.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      errorDiv.textContent = errorMessage;
      errorDiv.style.display = 'block';
    } finally {
      // Hide loading
      submitText.style.display = 'inline';
      submitLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  async deleteCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.delete(`/clientes/${id}`);
      alert('Cliente excluído com sucesso!');
      await this.loadClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
      alert('Erro ao excluir cliente');
    }
  }

  // ==================== CONFIGURACOES ====================

  async loadConfiguracoes() {
    try {
      console.log('📋 Loading configuracoes...');
      const response = await api.get('/config');
      console.log('✅ Configuracoes loaded:', response);

      // Horários (em formato HH:MM)
      const horarioInicio = response.horario_inicio || '08:00';
      const horarioFim = response.horario_fim || '18:00';
      document.getElementById('horarioInicio').value = horarioInicio;
      document.getElementById('horarioFim').value = horarioFim;

      // Preços (converter de centavos para reais)
      const precoCautelar = (parseInt(response.preco_cautelar || 15000) / 100).toFixed(2);
      const precoTransferencia = (parseInt(response.preco_transferencia || 12000) / 100).toFixed(2);
      const precoOutros = (parseInt(response.preco_outros || 10000) / 100).toFixed(2);
      document.getElementById('precoCautelar').value = precoCautelar;
      document.getElementById('precoTransferencia').value = precoTransferencia;
      document.getElementById('precoOutros').value = precoOutros;

      // Notificações (converter string "true"/"false" para boolean)
      const emailConfirmacao = response.notificacao_email_confirmacao === 'true' || response.notificacao_email_confirmacao === true;
      const lembrete24h = response.notificacao_lembrete_24h === 'true' || response.notificacao_lembrete_24h === true;
      document.getElementById('notifEmailConfirmacao').checked = emailConfirmacao;
      document.getElementById('notifLembrete24h').checked = lembrete24h;

      console.log('✅ Configuracoes preenchidas no formulário');
    } catch (error) {
      console.error('❌ Error loading configuracoes:', error);
      alert('Erro ao carregar configurações');
    }
  }

  setupConfiguracoes() {
    // Botão Salvar Horários
    const btnSalvarHorarios = document.getElementById('btnSalvarHorarios');
    if (btnSalvarHorarios) {
      btnSalvarHorarios.addEventListener('click', () => this.saveHorarios());
    }

    // Botão Salvar Preços
    const btnSalvarPrecos = document.getElementById('btnSalvarPrecos');
    if (btnSalvarPrecos) {
      btnSalvarPrecos.addEventListener('click', () => this.savePrecos());
    }

    // Botão Salvar Notificações
    const btnSalvarNotificacoes = document.getElementById('btnSalvarNotificacoes');
    if (btnSalvarNotificacoes) {
      btnSalvarNotificacoes.addEventListener('click', () => this.saveNotificacoes());
    }
  }

  async saveHorarios() {
    const horarioInicio = document.getElementById('horarioInicio').value;
    const horarioFim = document.getElementById('horarioFim').value;

    if (!horarioInicio || !horarioFim) {
      alert('Preencha todos os campos de horário');
      return;
    }

    try {
      const data = {
        horario_inicio: horarioInicio,
        horario_fim: horarioFim
      };

      console.log('💾 Salvando horários:', data);
      await api.put('/config', data);
      alert('Horários salvos com sucesso!');
    } catch (error) {
      console.error('❌ Error saving horarios:', error);
      alert('Erro ao salvar horários');
    }
  }

  async savePrecos() {
    const precoCautelar = parseFloat(document.getElementById('precoCautelar').value);
    const precoTransferencia = parseFloat(document.getElementById('precoTransferencia').value);
    const precoOutros = parseFloat(document.getElementById('precoOutros').value);

    if (isNaN(precoCautelar) || isNaN(precoTransferencia) || isNaN(precoOutros)) {
      alert('Preencha todos os campos de preço com valores válidos');
      return;
    }

    try {
      // Converter para centavos (multiplicar por 100)
      const data = {
        preco_cautelar: Math.round(precoCautelar * 100).toString(),
        preco_transferencia: Math.round(precoTransferencia * 100).toString(),
        preco_outros: Math.round(precoOutros * 100).toString()
      };

      console.log('💾 Salvando preços:', data);
      await api.put('/config', data);
      alert('Preços salvos com sucesso!');
    } catch (error) {
      console.error('❌ Error saving precos:', error);
      alert('Erro ao salvar preços');
    }
  }

  async saveNotificacoes() {
    const emailConfirmacao = document.getElementById('notifEmailConfirmacao').checked;
    const lembrete24h = document.getElementById('notifLembrete24h').checked;

    try {
      const data = {
        notificacao_email_confirmacao: emailConfirmacao.toString(),
        notificacao_lembrete_24h: lembrete24h.toString()
      };

      console.log('💾 Salvando notificações:', data);
      await api.put('/config', data);
      alert('Configurações de notificação salvadas com sucesso!');
    } catch (error) {
      console.error('❌ Error saving notificacoes:', error);
      alert('Erro ao salvar configurações de notificação');
    }
  }

  // ==================== CALENDAR ====================

  async setupCalendar() {
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.renderCalendar();
      });

      nextBtn.addEventListener('click', () => {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.renderCalendar();
      });
    }
  }

  async renderCalendar() {
    // Setup calendar controls if not done yet
    if (!this.calendarSetup) {
      await this.setupCalendar();
      this.calendarSetup = true;
    }

    // Load appointments for the month if needed
    if (!this.appointments || this.appointments.length === 0) {
      const firstDay = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), 1);
      const lastDay = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 0);

      try {
        const response = await api.get(`/agendamentos?data_inicio=${format(firstDay, 'yyyy-MM-dd')}&data_fim=${format(lastDay, 'yyyy-MM-dd')}`);
        this.appointments = response.data.agendamentos || [];
      } catch (error) {
        console.error('Error loading appointments for calendar:', error);
        this.appointments = [];
      }
    }

    // Update month label
    const monthLabel = document.getElementById('currentMonthLabel');
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    monthLabel.textContent = `${monthNames[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;

    // Get calendar grid
    const calendarGrid = document.getElementById('calendarGrid');

    // Clear existing days (keep headers)
    const headers = calendarGrid.querySelectorAll('.calendar-day-header');
    calendarGrid.innerHTML = '';
    headers.forEach(header => calendarGrid.appendChild(header));

    // Calculate calendar days
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = firstDayOfWeek;

    // Days for next month
    const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;
    const nextMonthDays = totalCells - (daysInMonth + firstDayOfWeek);

    // Today for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Render previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dayElement = this.createCalendarDay(day, true, new Date(year, month - 1, day));
      calendarGrid.appendChild(dayElement);
    }

    // Render current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      currentDate.setHours(0, 0, 0, 0);
      const isToday = currentDate.getTime() === today.getTime();
      const dayElement = this.createCalendarDay(day, false, currentDate, isToday);
      calendarGrid.appendChild(dayElement);
    }

    // Render next month days
    for (let day = 1; day <= nextMonthDays; day++) {
      const dayElement = this.createCalendarDay(day, true, new Date(year, month + 1, day));
      calendarGrid.appendChild(dayElement);
    }
  }

  createCalendarDay(dayNumber, isOtherMonth, date, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    if (isOtherMonth) {
      dayElement.classList.add('other-month');
    }

    if (isToday) {
      dayElement.classList.add('today');
    }

    // Day number
    const dayNumberElement = document.createElement('div');
    dayNumberElement.className = 'day-number';
    dayNumberElement.textContent = dayNumber;
    dayElement.appendChild(dayNumberElement);

    // Get appointments for this day
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAppointments = this.appointments.filter(apt => apt.data === dateStr);

    if (dayAppointments.length > 0 && !isOtherMonth) {
      dayElement.classList.add('has-appointments');

      // Appointment count badge
      if (dayAppointments.length > 3) {
        const countBadge = document.createElement('div');
        countBadge.className = 'appointment-count';
        countBadge.textContent = dayAppointments.length;
        dayElement.appendChild(countBadge);
      }

      // Appointments container
      const appointmentsContainer = document.createElement('div');
      appointmentsContainer.className = 'day-appointments';

      // Show max 3 appointments
      const visibleAppointments = dayAppointments.slice(0, 3);
      visibleAppointments.forEach(apt => {
        const aptElement = document.createElement('div');
        aptElement.className = `calendar-appointment ${apt.status}`;
        aptElement.textContent = `${apt.horario} - ${apt.cliente_nome.split(' ')[0]}`;
        aptElement.title = `${apt.horario} - ${apt.cliente_nome}\n${apt.veiculo_placa} - ${this.getStatusLabel(apt.status)}`;
        aptElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.viewDetails(apt.id);
        });
        appointmentsContainer.appendChild(aptElement);
      });

      dayElement.appendChild(appointmentsContainer);
    }

    // Click on day to create new appointment
    if (!isOtherMonth) {
      dayElement.addEventListener('click', () => {
        // Open new appointment modal with pre-filled date
        const modal = document.getElementById('newAppointmentModal');
        modal.style.display = 'block';
        this.resetNewAppointmentForm();
        document.getElementById('dataAgendamento').value = dateStr;
        document.getElementById('dataAgendamento').dispatchEvent(new Event('change'));

        // Set min date to today
        const today = format(new Date(), 'yyyy-MM-dd');
        document.getElementById('dataAgendamento').setAttribute('min', today);
      });
    }

    return dayElement;
  }

  // ==================== NOTIFICATIONS ====================

  setupNotifications() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    const closeNotifications = document.getElementById('closeNotifications');

    // Toggle dropdown
    notificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = notificationsDropdown.style.display === 'flex';

      if (!isVisible) {
        notificationsDropdown.style.display = 'flex';
        this.loadNotifications();
      } else {
        notificationsDropdown.style.display = 'none';
      }
    });

    // Close button
    closeNotifications.addEventListener('click', () => {
      notificationsDropdown.style.display = 'none';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!notificationsBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
        notificationsDropdown.style.display = 'none';
      }
    });

    // Load notification counts initially
    this.loadNotificationCounts();

    // Refresh counts every 30 seconds
    setInterval(() => {
      this.loadNotificationCounts();
    }, 30000);
  }

  async loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');

    notificationsList.innerHTML = `
      <div class="notifications-loading">
        <div class="spinner"></div>
        <p>Carregando notificações...</p>
      </div>
    `;

    try {
      const response = await api.get('/notifications');
      const { notifications, unreadCount } = response;

      // Update badge
      const badge = document.getElementById('notificationBadge');
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }

      // Render notifications
      if (notifications.length === 0) {
        notificationsList.innerHTML = `
          <div class="notifications-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>Nenhuma notificação</p>
          </div>
        `;
      } else {
        notificationsList.innerHTML = notifications.map(notif => `
          <div class="notification-item ${notif.read ? '' : 'unread'}" data-section="${notif.section}">
            <div class="notification-header">
              <span class="notification-title">${notif.title}</span>
              <span class="notification-time">${this.formatNotificationTime(notif.time)}</span>
            </div>
            <div class="notification-message">${notif.message}</div>
            <span class="notification-type-badge ${notif.type}">${this.getTypeLabel(notif.type)}</span>
          </div>
        `).join('');

        // Add click handlers to navigate to sections
        notificationsList.querySelectorAll('.notification-item').forEach(item => {
          item.addEventListener('click', () => {
            const section = item.dataset.section;
            notificationsDropdown.style.display = 'none';

            // Click on the nav item to navigate
            const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
            if (navItem) {
              navItem.click();
            }
          });
        });
      }

    } catch (error) {
      console.error('Error loading notifications:', error);
      notificationsList.innerHTML = `
        <div class="notifications-empty">
          <p style="color: var(--status-danger);">Erro ao carregar notificações</p>
        </div>
      `;
    }
  }

  async loadNotificationCounts() {
    try {
      const counts = await api.get('/notifications/counts');

      // Update sidebar badges
      Object.keys(counts).forEach(section => {
        const badge = document.getElementById(`badge-${section}`);
        if (badge) {
          const count = counts[section];
          if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
          }
        }
      });

      // Update header badge (total unread)
      const totalUnread = Object.values(counts).reduce((sum, count) => sum + count, 0);
      const headerBadge = document.getElementById('notificationBadge');
      if (totalUnread > 0) {
        headerBadge.textContent = totalUnread;
        headerBadge.style.display = 'block';
      } else {
        headerBadge.style.display = 'none';
      }

    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  }

  formatNotificationTime(timeStr) {
    const time = new Date(timeStr);
    const now = new Date();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;

    return format(time, 'dd/MM/yyyy');
  }

  getTypeLabel(type) {
    const labels = {
      'agendamento': 'Novo',
      'agendamento_hoje': 'Hoje',
      'novo_cliente': 'Cliente'
    };
    return labels[type] || type;
  }

  // ==================== CHARTS ====================

  initCharts() {
    this.createRevenueChart();
    this.createStatusChart();
  }

  async createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Get last 6 months data
    const months = [];
    const revenues = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = format(date, 'yyyy-MM-dd');
      const monthEnd = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd');

      months.push(format(date, 'MMM'));

      try {
        const stats = await api.get(`/agendamentos/stats?data_inicio=${monthStart}&data_fim=${monthEnd}`);
        revenues.push((stats.receita_realizada || 0) / 100);
      } catch (error) {
        revenues.push(0);
      }
    }

    // Destroy existing chart if it exists
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Receita (R$)',
          data: revenues,
          borderColor: '#ed6a2b',
          backgroundColor: 'rgba(237, 106, 43, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ed6a2b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#d85a1b',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: {
                size: 12,
                weight: '600',
                family: "'Inter', sans-serif"
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return 'R$ ' + context.parsed.y.toFixed(2);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toFixed(0);
              },
              font: {
                size: 11,
                weight: '500'
              },
              color: '#64748b'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            }
          },
          x: {
            ticks: {
              font: {
                size: 11,
                weight: '600'
              },
              color: '#475569'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  async createStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    // Get current month stats
    const today = new Date();
    const firstDay = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
    const lastDay = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');

    try {
      const stats = await api.get(`/agendamentos/stats?data_inicio=${firstDay}&data_fim=${lastDay}`);

      // Destroy existing chart if it exists
      if (this.statusChart) {
        this.statusChart.destroy();
      }

      this.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Pendentes', 'Confirmados', 'Realizados', 'Cancelados'],
          datasets: [{
            data: [
              stats.pendentes || 0,
              stats.confirmados || 0,
              stats.realizados || 0,
              stats.cancelados || 0
            ],
            backgroundColor: [
              'rgba(251, 191, 36, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              '#fbbf24',
              '#3b82f6',
              '#22c55e',
              '#ef4444'
            ],
            borderWidth: 2,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 12,
                  weight: '600',
                  family: "'Inter', sans-serif"
                },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              padding: 12,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return label + ': ' + value + ' (' + percentage + '%)';
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    } catch (error) {
      console.error('Error creating status chart:', error);
    }
  }

  // ==================== CHART DETAILS ====================

  showChartDetail(type) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    // Show the detail section
    const sectionId = type === 'revenue' ? 'revenue-detail' : 'status-detail';
    const activeSection = document.getElementById(`section-${sectionId}`);
    if (activeSection) {
      activeSection.classList.add('active');
    }

    // Render the appropriate detail
    if (type === 'revenue') {
      this.renderRevenueDetail();
    } else if (type === 'status') {
      this.renderStatusDetail();
    }
  }

  async renderRevenueDetail() {
    const container = document.getElementById('revenueDetailContent');
    if (!container) return;

    container.innerHTML = `
      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Receita Total (Últimos 6 meses)</div>
          <div class="stat-value" id="totalRevenue6m">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Média Mensal</div>
          <div class="stat-value" id="avgRevenueMonth">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Melhor Mês</div>
          <div class="stat-value" id="bestMonth">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Crescimento</div>
          <div class="stat-value" id="revenueGrowth">Carregando...</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px;">
        <!-- Revenue Trend Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Tendência de Receita (12 meses)</h3>
            <div class="chart-subtitle">Análise ano completo</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="revenueTrendChart"></canvas>
          </div>
        </div>

        <!-- Revenue by Type Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Receita por Tipo de Vistoria</h3>
            <div class="chart-subtitle">Distribuição por serviço</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="revenueByTypeChart"></canvas>
          </div>
        </div>

        <!-- Monthly Comparison Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Comparação Mensal</h3>
            <div class="chart-subtitle">Mês atual vs anterior</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="monthlyComparisonChart"></canvas>
          </div>
        </div>

        <!-- Daily Revenue Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Receita Diária (Mês Atual)</h3>
            <div class="chart-subtitle">Performance diária</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="dailyRevenueChart"></canvas>
          </div>
        </div>
      </div>
    `;

    // Load data and create charts
    await this.loadRevenueDetailCharts();
  }

  async loadRevenueDetailCharts() {
    const today = new Date();
    const months = [];
    const revenues = [];
    let totalRevenue = 0;
    let bestMonth = { name: '', value: 0 };

    // Get last 12 months data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = format(date, 'yyyy-MM-dd');
      const monthEnd = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd');

      months.push(format(date, 'MMM'));

      try {
        const stats = await api.get(`/agendamentos/stats?data_inicio=${monthStart}&data_fim=${monthEnd}`);
        const revenue = (stats.receita_realizada || 0) / 100;
        revenues.push(revenue);
        totalRevenue += revenue;

        if (revenue > bestMonth.value) {
          bestMonth = { name: format(date, 'MMM/yy'), value: revenue };
        }
      } catch (error) {
        revenues.push(0);
      }
    }

    // Update summary cards
    const last6MonthsRevenue = revenues.slice(-6).reduce((a, b) => a + b, 0);
    document.getElementById('totalRevenue6m').textContent = formatters.currency(last6MonthsRevenue * 100);
    document.getElementById('avgRevenueMonth').textContent = formatters.currency((last6MonthsRevenue / 6) * 100);
    document.getElementById('bestMonth').textContent = `${bestMonth.name} (${formatters.currency(bestMonth.value * 100)})`;

    const growth = revenues.length >= 2 ? ((revenues[revenues.length - 1] - revenues[revenues.length - 2]) / revenues[revenues.length - 2] * 100).toFixed(1) : 0;
    document.getElementById('revenueGrowth').textContent = `${growth > 0 ? '+' : ''}${growth}%`;

    // Create charts
    this.createRevenueTrendChart(months, revenues);
    this.createRevenueByTypeChart();
    this.createMonthlyComparisonChart();
    this.createDailyRevenueChart();
  }

  createRevenueTrendChart(months, revenues) {
    const ctx = document.getElementById('revenueTrendChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Receita (R$)',
          data: revenues,
          borderColor: '#ed6a2b',
          backgroundColor: 'rgba(237, 106, 43, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => 'R$ ' + context.parsed.y.toFixed(2)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => 'R$ ' + value.toFixed(0)
            }
          }
        }
      }
    });
  }

  async createRevenueByTypeChart() {
    const ctx = document.getElementById('revenueByTypeChart');
    if (!ctx) return;

    // Get data for current year
    const startOfYear = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
    const endOfYear = format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd');

    try {
      const appointments = await api.get(`/agendamentos?data_inicio=${startOfYear}&data_fim=${endOfYear}`);

      const revenueByType = {
        cautelar: 0,
        transferencia: 0,
        outros: 0
      };

      appointments.agendamentos.forEach(apt => {
        if (apt.status === 'realizado' && apt.preco) {
          revenueByType[apt.tipo_vistoria] = (revenueByType[apt.tipo_vistoria] || 0) + (apt.preco / 100);
        }
      });

      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Cautelar', 'Transferência', 'Outros'],
          datasets: [{
            data: [revenueByType.cautelar, revenueByType.transferencia, revenueByType.outros],
            backgroundColor: ['#ed6a2b', '#3b82f6', '#22c55e'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  return label + ': R$ ' + value.toFixed(2);
                }
              }
            }
          },
          cutout: '60%'
        }
      });
    } catch (error) {
      console.error('Error creating revenue by type chart:', error);
    }
  }

  async createMonthlyComparisonChart() {
    const ctx = document.getElementById('monthlyComparisonChart');
    if (!ctx) return;

    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    try {
      const [currentStats, lastStats] = await Promise.all([
        api.get(`/agendamentos/stats?data_inicio=${format(currentMonth, 'yyyy-MM-dd')}&data_fim=${format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd')}`),
        api.get(`/agendamentos/stats?data_inicio=${format(lastMonth, 'yyyy-MM-dd')}&data_fim=${format(new Date(today.getFullYear(), today.getMonth(), 0), 'yyyy-MM-dd')}`)
      ]);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Mês Anterior', 'Mês Atual'],
          datasets: [{
            label: 'Receita Realizada',
            data: [(lastStats.receita_realizada || 0) / 100, (currentStats.receita_realizada || 0) / 100],
            backgroundColor: ['#94a3b8', '#ed6a2b'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => 'R$ ' + context.parsed.y.toFixed(2)
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => 'R$ ' + value.toFixed(0)
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating monthly comparison chart:', error);
    }
  }

  async createDailyRevenueChart() {
    const ctx = document.getElementById('dailyRevenueChart');
    if (!ctx) return;

    const today = new Date();
    const startOfMonth = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
    const endOfMonth = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');

    try {
      const appointments = await api.get(`/agendamentos?data_inicio=${startOfMonth}&data_fim=${endOfMonth}`);

      const dailyRevenue = {};
      appointments.agendamentos.forEach(apt => {
        if (apt.status === 'realizado' && apt.preco) {
          dailyRevenue[apt.data] = (dailyRevenue[apt.data] || 0) + (apt.preco / 100);
        }
      });

      const days = Object.keys(dailyRevenue).sort();
      const revenues = days.map(day => dailyRevenue[day]);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: days.map(d => format(new Date(d + 'T00:00:00'), 'dd/MM')),
          datasets: [{
            label: 'Receita Diária (R$)',
            data: revenues,
            backgroundColor: '#ed6a2b',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: {
              callbacks: {
                label: (context) => 'R$ ' + context.parsed.y.toFixed(2)
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => 'R$ ' + value.toFixed(0)
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating daily revenue chart:', error);
    }
  }

  async renderStatusDetail() {
    const container = document.getElementById('statusDetailContent');
    if (!container) return;

    container.innerHTML = `
      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total Pendentes</div>
          <div class="stat-value" id="totalPendentes">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total Confirmados</div>
          <div class="stat-value" id="totalConfirmados">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total Realizados</div>
          <div class="stat-value" id="totalRealizados">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Taxa de Cancelamento</div>
          <div class="stat-value" id="taxaCancelamento">Carregando...</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px;">
        <!-- Status Evolution Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Evolução de Status (6 meses)</h3>
            <div class="chart-subtitle">Histórico mensal</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="statusEvolutionChart"></canvas>
          </div>
        </div>

        <!-- Completion Rate Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Taxa de Conclusão</h3>
            <div class="chart-subtitle">Realizados vs Total</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="completionRateChart"></canvas>
          </div>
        </div>

        <!-- Status by Type Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Status por Tipo de Vistoria</h3>
            <div class="chart-subtitle">Distribuição detalhada</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="statusByTypeChart"></canvas>
          </div>
        </div>

        <!-- Weekly Status Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Status da Semana</h3>
            <div class="chart-subtitle">Últimos 7 dias</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="weeklyStatusChart"></canvas>
          </div>
        </div>
      </div>
    `;

    // Load data and create charts
    await this.loadStatusDetailCharts();
  }

  async loadStatusDetailCharts() {
    const today = new Date();
    const startOfYear = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
    const endOfYear = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd');

    try {
      const appointments = await api.get(`/agendamentos?data_inicio=${startOfYear}&data_fim=${endOfYear}`);

      const statusCount = {
        pendente: 0,
        confirmado: 0,
        realizado: 0,
        cancelado: 0
      };

      appointments.agendamentos.forEach(apt => {
        statusCount[apt.status] = (statusCount[apt.status] || 0) + 1;
      });

      const total = appointments.total || 0;
      const taxaCancelamento = total > 0 ? ((statusCount.cancelado / total) * 100).toFixed(1) : 0;

      // Update summary cards
      document.getElementById('totalPendentes').textContent = statusCount.pendente;
      document.getElementById('totalConfirmados').textContent = statusCount.confirmado;
      document.getElementById('totalRealizados').textContent = statusCount.realizado;
      document.getElementById('taxaCancelamento').textContent = `${taxaCancelamento}%`;

      // Create charts
      this.createStatusEvolutionChart();
      this.createCompletionRateChart(statusCount, total);
      this.createStatusByTypeChart();
      this.createWeeklyStatusChart();
    } catch (error) {
      console.error('Error loading status detail charts:', error);
    }
  }

  async createStatusEvolutionChart() {
    const ctx = document.getElementById('statusEvolutionChart');
    if (!ctx) return;

    const today = new Date();
    const months = [];
    const pendentes = [];
    const confirmados = [];
    const realizados = [];
    const cancelados = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = format(date, 'yyyy-MM-dd');
      const monthEnd = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd');

      months.push(format(date, 'MMM'));

      try {
        const stats = await api.get(`/agendamentos/stats?data_inicio=${monthStart}&data_fim=${monthEnd}`);
        pendentes.push(stats.pendentes || 0);
        confirmados.push(stats.confirmados || 0);
        realizados.push(stats.realizados || 0);
        cancelados.push(stats.cancelados || 0);
      } catch (error) {
        pendentes.push(0);
        confirmados.push(0);
        realizados.push(0);
        cancelados.push(0);
      }
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Pendentes',
            data: pendentes,
            borderColor: '#fbbf24',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            tension: 0.4
          },
          {
            label: 'Confirmados',
            data: confirmados,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          },
          {
            label: 'Realizados',
            data: realizados,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4
          },
          {
            label: 'Cancelados',
            data: cancelados,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  createCompletionRateChart(statusCount, total) {
    const ctx = document.getElementById('completionRateChart');
    if (!ctx) return;

    const completionRate = total > 0 ? ((statusCount.realizado / total) * 100).toFixed(1) : 0;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Realizados', 'Não Realizados'],
        datasets: [{
          data: [statusCount.realizado, total - statusCount.realizado],
          backgroundColor: ['#22c55e', '#e5e7eb'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return label + ': ' + value + ' (' + percentage + '%)';
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  async createStatusByTypeChart() {
    const ctx = document.getElementById('statusByTypeChart');
    if (!ctx) return;

    const today = new Date();
    const startOfYear = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
    const endOfYear = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd');

    try {
      const appointments = await api.get(`/agendamentos?data_inicio=${startOfYear}&data_fim=${endOfYear}`);

      const data = {
        cautelar: { pendente: 0, confirmado: 0, realizado: 0, cancelado: 0 },
        transferencia: { pendente: 0, confirmado: 0, realizado: 0, cancelado: 0 },
        outros: { pendente: 0, confirmado: 0, realizado: 0, cancelado: 0 }
      };

      appointments.agendamentos.forEach(apt => {
        if (data[apt.tipo_vistoria]) {
          data[apt.tipo_vistoria][apt.status] = (data[apt.tipo_vistoria][apt.status] || 0) + 1;
        }
      });

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Cautelar', 'Transferência', 'Outros'],
          datasets: [
            { label: 'Pendentes', data: [data.cautelar.pendente, data.transferencia.pendente, data.outros.pendente], backgroundColor: '#fbbf24' },
            { label: 'Confirmados', data: [data.cautelar.confirmado, data.transferencia.confirmado, data.outros.confirmado], backgroundColor: '#3b82f6' },
            { label: 'Realizados', data: [data.cautelar.realizado, data.transferencia.realizado, data.outros.realizado], backgroundColor: '#22c55e' },
            { label: 'Cancelados', data: [data.cautelar.cancelado, data.transferencia.cancelado, data.outros.cancelado], backgroundColor: '#ef4444' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        }
      });
    } catch (error) {
      console.error('Error creating status by type chart:', error);
    }
  }

  async createWeeklyStatusChart() {
    const ctx = document.getElementById('weeklyStatusChart');
    if (!ctx) return;

    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const appointments = await api.get(`/agendamentos?data_inicio=${format(sevenDaysAgo, 'yyyy-MM-dd')}&data_fim=${format(today, 'yyyy-MM-dd')}`);

      const dailyStatus = {};
      for (let i = 0; i < 7; i++) {
        const date = format(new Date(today.getTime() - i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        dailyStatus[date] = { pendente: 0, confirmado: 0, realizado: 0, cancelado: 0 };
      }

      appointments.agendamentos.forEach(apt => {
        if (dailyStatus[apt.data]) {
          dailyStatus[apt.data][apt.status] = (dailyStatus[apt.data][apt.status] || 0) + 1;
        }
      });

      const days = Object.keys(dailyStatus).sort();

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: days.map(d => format(new Date(d + 'T00:00:00'), 'dd/MM')),
          datasets: [
            { label: 'Pendentes', data: days.map(d => dailyStatus[d].pendente), backgroundColor: '#fbbf24' },
            { label: 'Confirmados', data: days.map(d => dailyStatus[d].confirmado), backgroundColor: '#3b82f6' },
            { label: 'Realizados', data: days.map(d => dailyStatus[d].realizado), backgroundColor: '#22c55e' },
            { label: 'Cancelados', data: days.map(d => dailyStatus[d].cancelado), backgroundColor: '#ef4444' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    } catch (error) {
      console.error('Error creating weekly status chart:', error);
    }
  }

  // Export functions
  async exportChart(type) {
    const elementId = type === 'revenue' ? 'revenueChart' : 'statusChart';
    const canvas = document.getElementById(elementId);
    if (!canvas) return;

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 15, 15, 270, 150);
      pdf.save(`${type}-chart-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error exporting chart:', error);
      alert('Erro ao exportar gráfico. Tente novamente.');
    }
  }

  async exportChartDetail(type) {
    const elementId = type === 'revenue' ? 'revenueDetailContent' : 'statusDetailContent';
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#f8fafc',
        logging: false
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 190;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 190;
      }

      pdf.save(`${type}-detail-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error exporting chart detail:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  }

  setupEmpresasModal() {
    // Preview do slug
    const empresaSlugInput = document.getElementById('empresaSlug');
    const previewSlug = document.getElementById('previewSlug');

    if (empresaSlugInput && previewSlug) {
      empresaSlugInput.addEventListener('input', (e) => {
        previewSlug.textContent = e.target.value || '...';
      });
    }

    // Cancelar modal
    const cancelarBtn = document.getElementById('cancelarEmpresa');
    if (cancelarBtn) {
      cancelarBtn.addEventListener('click', () => {
        const modal = document.getElementById('modalEmpresa');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    // Fechar modal com X
    const fecharBtn = document.getElementById('fecharModalEmpresa');
    if (fecharBtn) {
      fecharBtn.addEventListener('click', () => {
        const modal = document.getElementById('modalEmpresa');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    // Fechar modal clicando fora
    const modal = document.getElementById('modalEmpresa');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  }
}

// Initialize admin panel
window.adminPanel = new AdminPanel();

// Make empresasManager globally accessible for onclick handlers
window.empresasManager = window.adminPanel.empresasManager;
