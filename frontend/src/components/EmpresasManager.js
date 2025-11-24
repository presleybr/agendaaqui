import { scheduleService } from '../services/api.js';

export class EmpresasManager {
  constructor() {
    this.empresas = [];
    this.empresaSelecionada = null;
    this.init();
  }

  async init() {
    await this.loadEmpresas();
    this.attachEventListeners();
  }

  async loadEmpresas() {
    try {
      const response = await fetch(`${scheduleService.API_URL}/admin/empresas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar empresas');
      }

      this.empresas = await response.json();
      this.renderLista();
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      alert('Erro ao carregar empresas');
    }
  }

  renderLista() {
    const tbody = document.getElementById('empresasTableBody');

    if (!tbody) {
      console.error('Elemento empresasTableBody não encontrado');
      return;
    }

    if (this.empresas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
            <p style="font-size: 1.1em; margin-bottom: 10px;">📭 Nenhuma empresa cadastrada ainda</p>
            <p style="font-size: 0.9em;">Clique em "+ Nova Empresa" para começar</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.empresas.map(empresa => {
      const statusClass = {
        'ativo': 'success',
        'inativo': 'secondary',
        'suspenso': 'danger',
        'trial': 'warning'
      }[empresa.status] || 'secondary';

      const diasCadastro = Math.floor(
        (new Date() - new Date(empresa.data_inicio)) / (1000 * 60 * 60 * 24)
      );

      const temComissao = diasCadastro <= 30;
      const diasRestantes = temComissao ? 30 - diasCadastro : 0;

      return `
        <tr>
          <td>
            <strong>${empresa.nome}</strong><br>
            <small style="color: #666;">${empresa.slug}.agendaaquivistorias.com.br</small>
          </td>
          <td>${empresa.email}</td>
          <td>${empresa.telefone || '-'}</td>
          <td>
            <small style="color: #666;">${empresa.chave_pix}</small>
          </td>
          <td>
            ${temComissao
              ? `<span class="badge badge-warning">R$ 5,00 (${diasRestantes}d)</span>`
              : `<span class="badge badge-success">R$ 0,00</span>`
            }
          </td>
          <td>
            <span class="badge badge-${statusClass}">${empresa.status}</span>
          </td>
          <td>
            <strong>${empresa.metricas?.total_agendamentos || 0}</strong> agendamentos<br>
            <small style="color: #666;">R$ ${((empresa.metricas?.total_receita || 0) / 100).toFixed(2)}</small>
          </td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm btn-secondary" onclick="empresasManager.visualizar(${empresa.id})" title="Visualizar">
                👁️
              </button>
              <button class="btn btn-sm btn-primary" onclick="empresasManager.editar(${empresa.id})" title="Editar">
                ✏️
              </button>
              <button class="btn btn-sm btn-danger" onclick="empresasManager.deletar(${empresa.id}, '${empresa.nome}')" title="Deletar">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  attachEventListeners() {
    const btnNova = document.getElementById('btnNovaEmpresa');
    if (btnNova) {
      btnNova.addEventListener('click', () => this.abrirModalNova());
    }

    const btnSalvar = document.getElementById('salvarEmpresa');
    if (btnSalvar) {
      btnSalvar.addEventListener('click', () => this.salvar());
    }

    const btnFechar = document.getElementById('fecharModalEmpresa');
    if (btnFechar) {
      btnFechar.addEventListener('click', () => this.fecharModal());
    }

    // Gerar slug automaticamente do nome
    const inputNome = document.getElementById('empresaNome');
    const inputSlug = document.getElementById('empresaSlug');

    if (inputNome && inputSlug) {
      inputNome.addEventListener('input', (e) => {
        const slug = e.target.value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
          .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim

        inputSlug.value = slug;
      });
    }
  }

  abrirModalNova() {
    this.empresaSelecionada = null;
    document.getElementById('modalEmpresaTitle').textContent = 'Nova Empresa';
    document.getElementById('formEmpresa').reset();
    document.getElementById('modalEmpresa').style.display = 'flex';
  }

  async visualizar(id) {
    try {
      const response = await fetch(`${scheduleService.API_URL}/admin/empresas/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar empresa');
      }

      const empresa = await response.json();

      // Mostrar modal de visualização
      alert(`
        Empresa: ${empresa.nome}
        Subdomínio: ${empresa.slug}.agendaaquivistorias.com.br
        Email: ${empresa.email}
        Status: ${empresa.status}
        PIX: ${empresa.chave_pix}

        Métricas últimos 6 meses:
        ${empresa.metricas?.map(m =>
          `${m.mes}/${m.ano}: ${m.total_agendamentos || 0} agendamentos, R$ ${((m.total_receita || 0) / 100).toFixed(2)}`
        ).join('\n')}
      `);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao visualizar empresa');
    }
  }

  async editar(id) {
    try {
      const response = await fetch(`${scheduleService.API_URL}/admin/empresas/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar empresa');
      }

      const empresa = await response.json();
      this.empresaSelecionada = empresa;

      // Preencher formulário
      document.getElementById('modalEmpresaTitle').textContent = 'Editar Empresa';
      document.getElementById('empresaNome').value = empresa.nome;
      document.getElementById('empresaSlug').value = empresa.slug;
      document.getElementById('empresaSlug').disabled = true; // Não pode alterar slug
      document.getElementById('empresaEmail').value = empresa.email;
      document.getElementById('empresaTelefone').value = empresa.telefone || '';
      document.getElementById('empresaCNPJ').value = empresa.cnpj || '';
      document.getElementById('empresaChavePix').value = empresa.chave_pix;
      document.getElementById('empresaStatus').value = empresa.status;
      document.getElementById('empresaPlano').value = empresa.plano;

      // Preços
      document.getElementById('empresaPrecoCautelar').value = empresa.preco_cautelar / 100;
      document.getElementById('empresaPrecoTransferencia').value = empresa.preco_transferencia / 100;
      document.getElementById('empresaPrecoOutros').value = empresa.preco_outros / 100;

      // Horários
      document.getElementById('empresaHorarioInicio').value = empresa.horario_inicio;
      document.getElementById('empresaHorarioFim').value = empresa.horario_fim;

      document.getElementById('modalEmpresa').style.display = 'flex';
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao carregar dados da empresa');
    }
  }

  async salvar() {
    const formData = {
      nome: document.getElementById('empresaNome').value,
      slug: document.getElementById('empresaSlug').value,
      email: document.getElementById('empresaEmail').value,
      telefone: document.getElementById('empresaTelefone').value,
      cnpj: document.getElementById('empresaCNPJ').value,
      chave_pix: document.getElementById('empresaChavePix').value,
      status: document.getElementById('empresaStatus').value,
      plano: document.getElementById('empresaPlano').value,
      preco_cautelar: Math.round(parseFloat(document.getElementById('empresaPrecoCautelar').value) * 100),
      preco_transferencia: Math.round(parseFloat(document.getElementById('empresaPrecoTransferencia').value) * 100),
      preco_outros: Math.round(parseFloat(document.getElementById('empresaPrecoOutros').value) * 100),
      horario_inicio: document.getElementById('empresaHorarioInicio').value,
      horario_fim: document.getElementById('empresaHorarioFim').value
    };

    try {
      const url = this.empresaSelecionada
        ? `${scheduleService.API_URL}/admin/empresas/${this.empresaSelecionada.id}`
        : `${scheduleService.API_URL}/admin/empresas`;

      const method = this.empresaSelecionada ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar empresa');
      }

      alert(data.mensagem || 'Empresa salva com sucesso!');

      if (data.url) {
        alert(`Empresa disponível em:\n${data.url}`);
      }

      this.fecharModal();
      await this.loadEmpresas();
    } catch (error) {
      console.error('Erro:', error);
      alert(error.message);
    }
  }

  async deletar(id, nome) {
    if (!confirm(`Tem certeza que deseja deletar a empresa "${nome}"?\n\nISSO VAI DELETAR TODOS OS DADOS (agendamentos, clientes, etc.)!`)) {
      return;
    }

    if (!confirm('ÚLTIMA CONFIRMAÇÃO: Esta ação é IRREVERSÍVEL!')) {
      return;
    }

    try {
      const response = await fetch(`${scheduleService.API_URL}/admin/empresas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar empresa');
      }

      alert(data.mensagem || 'Empresa deletada com sucesso');
      await this.loadEmpresas();
    } catch (error) {
      console.error('Erro:', error);
      alert(error.message);
    }
  }

  fecharModal() {
    document.getElementById('modalEmpresa').style.display = 'none';
    document.getElementById('empresaSlug').disabled = false;
  }
}

// Instância global
let empresasManager;

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('section-empresas')) {
      empresasManager = new EmpresasManager();
    }
  });
} else {
  if (document.getElementById('section-empresas')) {
    empresasManager = new EmpresasManager();
  }
}

export default EmpresasManager;
