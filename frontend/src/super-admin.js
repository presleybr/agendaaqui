// Super Admin Panel - Manages multi-tenant companies

const API_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000/api'
  : '/api';

class SuperAdmin {
  constructor() {
    this.token = localStorage.getItem('admin_token');
    this.currentSection = 'overview';
    this.init();
  }

  init() {
    if (this.token) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  async handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password })
      });

      if (!response.ok) {
        throw new Error('Credenciais inválidas');
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));

      this.showDashboard();
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  }

  showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';

    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    document.getElementById('userName').textContent = user.nome || 'Admin';

    this.setupNavigation();
    this.setupLogout();
    this.loadDashboard();
  }

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.navigateTo(section);
      });
    });
  }

  navigateTo(section) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.section === section) {
        item.classList.add('active');
      }
    });

    // Update sections
    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(`section-${section}`).classList.add('active');

    // Load section data
    this.currentSection = section;
    switch(section) {
      case 'overview':
        this.loadDashboard();
        break;
      case 'empresas':
        this.loadEmpresas();
        break;
      case 'transacoes':
        this.loadTransacoes();
        break;
      case 'mensalidades':
        this.loadMensalidades();
        break;
      case 'planos':
        this.loadPlanos();
        break;
      case 'config':
        this.loadConfig();
        break;
    }
  }

  setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.reload();
    });
  }

  async loadDashboard() {
    try {
      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar dashboard');

      const data = await response.json();

      // Update stats
      document.getElementById('statTotalEmpresas').textContent = data.totalEmpresas || '0';
      document.getElementById('statEmpresasAtivas').textContent = data.empresasAtivas || '0';
      document.getElementById('statReceitaMes').textContent = this.formatCurrency(data.receitaMes || 0);
      document.getElementById('statTaxaAcumulada').textContent = this.formatCurrency(data.taxaAcumulada || 0);

      // Load recent empresas
      await this.loadRecentEmpresas();
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  }

  async loadRecentEmpresas() {
    try {
      const response = await fetch(`${API_URL}/admin/empresas`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar empresas');

      const empresas = await response.json();
      const recent = empresas.slice(0, 5);

      const container = document.getElementById('recentEmpresasContent');

      if (recent.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhuma empresa cadastrada</p>';
        return;
      }

      container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            ${recent.map(emp => `
              <tr>
                <td>${emp.nome}</td>
                <td><code>${emp.slug}</code></td>
                <td>${emp.ativa ? '<span class="badge badge-success">Ativa</span>' : '<span class="badge badge-danger">Inativa</span>'}</td>
                <td>${this.formatDate(emp.data_cadastro)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (error) {
      console.error('Erro ao carregar empresas recentes:', error);
    }
  }

  async loadEmpresas() {
    const container = document.getElementById('empresasTableContainer');
    container.innerHTML = '<div class="spinner"></div>';

    try {
      const response = await fetch(`${API_URL}/admin/empresas`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar empresas');

      const empresas = await response.json();

      if (empresas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhuma empresa cadastrada</p>';
        return;
      }

      container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Slug</th>
              <th>E-mail</th>
              <th>PIX</th>
              <th>Status</th>
              <th>Dias Ativa</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${empresas.map(emp => `
              <tr>
                <td>#${emp.id}</td>
                <td>${emp.nome}</td>
                <td><code>${emp.slug}</code></td>
                <td>${emp.email}</td>
                <td>${emp.pix_key}</td>
                <td>${emp.ativa ? '<span class="badge badge-success">Ativa</span>' : '<span class="badge badge-danger">Inativa</span>'}</td>
                <td>${this.calcDaysActive(emp.data_inicio || emp.data_cadastro)}</td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-secondary" onclick="superAdmin.editEmpresa(${emp.id})">Editar</button>
                    <button class="btn btn-sm btn-secondary" onclick="superAdmin.viewEmpresaStats(${emp.id})">Stats</button>
                    <button class="btn btn-sm btn-secondary" style="color: var(--status-danger);" onclick="superAdmin.deleteEmpresa(${emp.id}, '${emp.nome}')">Excluir</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Setup nova empresa button
      this.setupEmpresaModal();
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      container.innerHTML = `<p style="text-align: center; color: var(--status-danger); padding: 40px;">Erro ao carregar empresas</p>`;
    }
  }

  setupEmpresaModal() {
    const btnNova = document.getElementById('btnNovaEmpresa');
    const modal = document.getElementById('empresaModal');
    const closeBtn = document.getElementById('closeEmpresaModal');
    const cancelBtn = document.getElementById('cancelEmpresa');
    const form = document.getElementById('empresaForm');

    btnNova.onclick = () => {
      document.getElementById('empresaModalTitle').textContent = 'Nova Empresa';
      form.reset();
      document.getElementById('empresaId').value = '';
      document.getElementById('empresaAtiva').checked = true;
      modal.classList.add('active');
    };

    closeBtn.onclick = () => modal.classList.remove('active');
    cancelBtn.onclick = () => modal.classList.remove('active');

    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.saveEmpresa();
    };

    // Auto-generate slug from name
    document.getElementById('empresaNome').addEventListener('input', (e) => {
      if (!document.getElementById('empresaId').value) {
        const slug = e.target.value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '')
          .replace(/(^-|-$)/g, '');
        document.getElementById('empresaSlug').value = slug;
      }
    });
  }

  async editEmpresa(id) {
    try {
      const response = await fetch(`${API_URL}/admin/empresas/${id}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar empresa');

      const empresa = await response.json();

      document.getElementById('empresaModalTitle').textContent = 'Editar Empresa';
      document.getElementById('empresaId').value = empresa.id;
      document.getElementById('empresaNome').value = empresa.nome;
      document.getElementById('empresaSlug').value = empresa.slug;
      document.getElementById('empresaEmail').value = empresa.email;
      document.getElementById('empresaTelefone').value = empresa.telefone || '';
      document.getElementById('empresaRazaoSocial').value = empresa.razao_social || '';
      document.getElementById('empresaCnpj').value = empresa.cnpj || '';
      document.getElementById('empresaPixKey').value = empresa.pix_key;
      document.getElementById('empresaPixType').value = empresa.pix_type;
      document.getElementById('empresaAtiva').checked = empresa.ativa;

      document.getElementById('empresaModal').classList.add('active');
    } catch (error) {
      alert('Erro ao carregar dados da empresa: ' + error.message);
    }
  }

  async saveEmpresa() {
    const id = document.getElementById('empresaId').value;
    const data = {
      nome: document.getElementById('empresaNome').value,
      slug: document.getElementById('empresaSlug').value,
      email: document.getElementById('empresaEmail').value,
      telefone: document.getElementById('empresaTelefone').value,
      razao_social: document.getElementById('empresaRazaoSocial').value,
      cnpj: document.getElementById('empresaCnpj').value,
      pix_key: document.getElementById('empresaPixKey').value,
      pix_type: document.getElementById('empresaPixType').value,
      ativa: document.getElementById('empresaAtiva').checked
    };

    const errorDiv = document.getElementById('empresaError');
    errorDiv.style.display = 'none';

    try {
      const url = id ? `${API_URL}/admin/empresas/${id}` : `${API_URL}/admin/empresas`;
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar empresa');
      }

      document.getElementById('empresaModal').classList.remove('active');
      this.loadEmpresas();
      this.loadDashboard();
      alert(id ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!');
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  }

  async deleteEmpresa(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${nome}"?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/empresas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Erro ao excluir empresa');

      this.loadEmpresas();
      this.loadDashboard();
      alert('Empresa excluída com sucesso!');
    } catch (error) {
      alert('Erro ao excluir empresa: ' + error.message);
    }
  }

  async viewEmpresaStats(id) {
    alert('Visualização de estatísticas em desenvolvimento');
  }

  async loadTransacoes() {
    const container = document.getElementById('transacoesTableContainer');
    container.innerHTML = '<div class="spinner"></div>';

    try {
      const response = await fetch(`${API_URL}/admin/transacoes`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar transações');

      const transacoes = await response.json();

      if (transacoes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhuma transação registrada</p>';
        return;
      }

      container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Método</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${transacoes.map(t => `
              <tr>
                <td>#${t.id}</td>
                <td>${t.empresa_nome || '-'}</td>
                <td><span class="badge ${t.tipo === 'taxa_sistema' ? 'badge-info' : 'badge-success'}">${this.formatTipoTransacao(t.tipo)}</span></td>
                <td>${this.formatCurrency(t.valor)}</td>
                <td><span class="badge badge-success">${t.status}</span></td>
                <td>${t.metodo_pagamento || '-'}</td>
                <td>${this.formatDateTime(t.data_transacao)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      container.innerHTML = `<p style="text-align: center; color: var(--status-danger); padding: 40px;">Erro ao carregar transações</p>`;
    }
  }

  async loadConfig() {
    try {
      const response = await fetch(`${API_URL}/admin/configuracoes`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar configurações');

      const config = await response.json();

      // Populate form
      document.getElementById('taxaInicial').value = (parseInt(config.taxa_inicial) / 100).toFixed(2);
      document.getElementById('diasTaxaInicial').value = config.dias_taxa_inicial;
      document.getElementById('taxaApos').value = (parseInt(config.taxa_apos_30_dias) / 100).toFixed(2);
      document.getElementById('pixSistema').value = config.pix_sistema || '';

      // Setup form
      document.getElementById('configForm').onsubmit = async (e) => {
        e.preventDefault();
        await this.saveConfig();
      };
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async saveConfig() {
    const data = {
      taxa_inicial: Math.round(parseFloat(document.getElementById('taxaInicial').value) * 100),
      dias_taxa_inicial: parseInt(document.getElementById('diasTaxaInicial').value),
      taxa_apos_30_dias: Math.round(parseFloat(document.getElementById('taxaApos').value) * 100),
      pix_sistema: document.getElementById('pixSistema').value
    };

    const errorDiv = document.getElementById('configError');
    const successDiv = document.getElementById('configSuccess');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    try {
      const response = await fetch(`${API_URL}/admin/configuracoes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Erro ao salvar configurações');

      successDiv.textContent = 'Configurações salvas com sucesso!';
      successDiv.style.display = 'block';
      setTimeout(() => successDiv.style.display = 'none', 3000);
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  }

  // Utility methods
  formatCurrency(cents) {
    const value = typeof cents === 'string' ? parseInt(cents) : cents;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }

  formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  }

  formatTipoTransacao(tipo) {
    const tipos = {
      'taxa_sistema': 'Taxa Sistema',
      'repasse_empresa': 'Repasse',
      'pagamento': 'Pagamento'
    };
    return tipos[tipo] || tipo;
  }

  calcDaysActive(dataInicio) {
    if (!dataInicio) return '-';
    const inicio = new Date(dataInicio);
    const hoje = new Date();
    const diff = hoje - inicio;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} dias`;
  }

  // ===== MENSALIDADES =====

  async saMensalidadesFetch(path, opts = {}) {
    const res = await fetch(`${API_URL}/super-admin${path}`, {
      ...opts,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisicao');
    return data;
  }

  formatCurrency(centavos) {
    return 'R$ ' + (Number(centavos || 0) / 100).toFixed(2).replace('.', ',');
  }

  formatDateBR(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  async loadMensalidades() {
    const container = document.getElementById('mensalidadesContainer');
    if (!container) return;
    container.innerHTML = '<p style="padding:20px;color:#666;">Carregando...</p>';
    try {
      const rows = await this.saMensalidadesFetch('/mensalidades/pendentes');

      document.getElementById('btnGerarMensalidadesMes').onclick = () => this.gerarMensalidadesMes();
      document.getElementById('btnMarcarAtrasadas').onclick = () => this.marcarAtrasadas();

      const badge = document.getElementById('badge-mensalidades');
      if (badge) {
        const count = rows.filter(r => r.status === 'aguardando_aprovacao').length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      }

      if (!rows.length) {
        container.innerHTML = '<p style="padding:20px;color:#666;">Nenhuma mensalidade pendente.</p>';
        return;
      }

      const statusBadge = (st) => {
        const map = {
          pendente: ['#ca8a04', '#fef9c3'],
          aguardando_aprovacao: ['#2563eb', '#dbeafe'],
          atrasada: ['#dc2626', '#fee2e2']
        };
        const [c, bg] = map[st] || ['#6b7280', '#f3f4f6'];
        return `<span style="padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;color:${c};background:${bg};">${st}</span>`;
      };

      container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Empresa</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Plano</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Competencia</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Valor</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Vencimento</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Status</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Comprovante</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Acoes</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${r.empresa_nome}<br><small style="color:#666;">${r.empresa_email || ''}</small></td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${r.plano_nome || '-'}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${r.competencia}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${this.formatCurrency(r.valor_centavos)}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${this.formatDateBR(r.data_vencimento)}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${statusBadge(r.status)}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${r.comprovante_url ? `<a href="${API_URL.replace(/\/api$/, '')}${r.comprovante_url}" target="_blank">Ver</a>` : '-'}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">
                  ${r.status === 'aguardando_aprovacao' ? `
                    <button class="btn btn-primary" style="padding:4px 10px;font-size:12px;" onclick="superAdmin.aprovarMensalidade(${r.id})">Aprovar</button>
                    <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;" onclick="superAdmin.rejeitarMensalidade(${r.id})">Rejeitar</button>
                  ` : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    } catch (err) {
      container.innerHTML = `<p style="padding:20px;color:#dc2626;">Erro: ${err.message}</p>`;
    }
  }

  async aprovarMensalidade(id) {
    if (!confirm('Confirmar aprovacao da mensalidade?')) return;
    try {
      await this.saMensalidadesFetch(`/mensalidades/${id}/aprovar`, { method: 'POST', body: '{}' });
      this.loadMensalidades();
    } catch (err) { alert(err.message); }
  }

  async rejeitarMensalidade(id) {
    const motivo = prompt('Motivo da rejeicao:');
    if (!motivo) return;
    try {
      await this.saMensalidadesFetch(`/mensalidades/${id}/rejeitar`, {
        method: 'POST',
        body: JSON.stringify({ motivo })
      });
      this.loadMensalidades();
    } catch (err) { alert(err.message); }
  }

  async gerarMensalidadesMes() {
    if (!confirm('Gerar mensalidades para todas as empresas ativas neste mes?')) return;
    try {
      const r = await this.saMensalidadesFetch('/mensalidades/gerar-todas', { method: 'POST', body: '{}' });
      alert(`Processadas ${r.total} empresas`);
      this.loadMensalidades();
    } catch (err) { alert(err.message); }
  }

  async marcarAtrasadas() {
    try {
      const r = await this.saMensalidadesFetch('/mensalidades/marcar-atrasadas', { method: 'POST', body: '{}' });
      alert(`${r.atualizadas} mensalidades marcadas como atrasadas`);
      this.loadMensalidades();
    } catch (err) { alert(err.message); }
  }

  // ===== PLANOS =====

  async loadPlanos() {
    const container = document.getElementById('planosContainer');
    if (!container) return;
    container.innerHTML = '<p style="padding:20px;color:#666;">Carregando...</p>';
    try {
      const planos = await this.saMensalidadesFetch('/planos');
      document.getElementById('btnNovoPlano').onclick = () => this.editarPlano(null);
      container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Nome</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Slug</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Preco</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Limite agend.</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Ativo</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Acoes</th>
            </tr>
          </thead>
          <tbody>
            ${planos.map(p => `
              <tr>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${p.nome}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${p.slug}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${this.formatCurrency(p.preco_centavos)}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${p.limite_agendamentos_mes || 'ilimitado'}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${p.ativo ? 'Sim' : 'Nao'}</td>
                <td style="padding:10px;border-bottom:1px solid #f0f0f0;">
                  <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;" onclick='superAdmin.editarPlano(${JSON.stringify(p)})'>Editar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    } catch (err) {
      container.innerHTML = `<p style="padding:20px;color:#dc2626;">Erro: ${err.message}</p>`;
    }
  }

  async editarPlano(plano) {
    const nome = prompt('Nome do plano:', plano?.nome || '');
    if (!nome) return;
    const precoReais = prompt('Preco (R$):', plano ? (plano.preco_centavos / 100).toFixed(2) : '49.90');
    if (!precoReais) return;
    const limite = prompt('Limite agend./mes (vazio = ilimitado):', plano?.limite_agendamentos_mes ?? '');
    const ativo = confirm('Plano ativo? (OK = sim, Cancelar = nao)');

    const payload = {
      nome,
      preco_centavos: Math.round(parseFloat(precoReais) * 100),
      limite_agendamentos_mes: limite === '' ? null : parseInt(limite),
      ativo
    };

    try {
      if (plano) {
        await this.saMensalidadesFetch(`/planos/${plano.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        const slug = prompt('Slug (identificador unico, ex: basic):');
        if (!slug) return;
        await this.saMensalidadesFetch('/planos', { method: 'POST', body: JSON.stringify({ ...payload, slug }) });
      }
      this.loadPlanos();
    } catch (err) { alert(err.message); }
  }
}

// Initialize on load
let superAdmin;
document.addEventListener('DOMContentLoaded', () => {
  superAdmin = new SuperAdmin();
});

// Make it globally accessible for onclick handlers
window.superAdmin = superAdmin;
