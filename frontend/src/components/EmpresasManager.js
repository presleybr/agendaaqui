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
    this.setupTabs();
    this.setupColorPickers();
    this.setupCepSearch();
  }

  async loadEmpresas() {
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Token presente:', !!token);
      console.log('🔗 Fazendo request para:', `${scheduleService.API_URL}/admin/empresas`);

      const response = await fetch(`${scheduleService.API_URL}/admin/empresas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro da API:', errorData);

        if (response.status === 500 || errorData.error?.includes('empresas')) {
          console.warn('⚠️ Funcionalidade de empresas não disponível. Ignorando...');
          this.empresas = [];
          this.renderLista();
          return;
        }

        throw new Error(errorData.error || 'Erro ao carregar empresas');
      }

      const data = await response.json();
      this.empresas = data.empresas || data || [];
      console.log('✅ Empresas carregadas:', this.empresas.length);
      this.renderLista();
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      if (!error.message.includes('não disponível')) {
        console.warn('⚠️ Não foi possível carregar empresas. A funcionalidade pode não estar ativa.');
      }
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
            <small style="color: #666;">${empresa.chave_pix || empresa.pix_key || '-'}</small>
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

    const btnCancelar = document.getElementById('cancelarEmpresa');
    if (btnCancelar) {
      btnCancelar.addEventListener('click', () => this.fecharModal());
    }

    // Gerar slug automaticamente do nome
    const inputNome = document.getElementById('empresaNome');
    const inputSlug = document.getElementById('empresaSlug');
    const previewSlug = document.getElementById('previewSlug');

    if (inputNome && inputSlug) {
      inputNome.addEventListener('input', (e) => {
        if (!this.empresaSelecionada) { // Só gera slug automaticamente para nova empresa
          const slug = this.generateSlug(e.target.value);
          inputSlug.value = slug;
          if (previewSlug) {
            previewSlug.textContent = slug || '...';
          }
        }
      });

      inputSlug.addEventListener('input', (e) => {
        const slug = this.generateSlug(e.target.value);
        e.target.value = slug;
        if (previewSlug) {
          previewSlug.textContent = slug || '...';
        }
      });
    }
  }

  generateSlug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.empresa-tab');
    const contents = document.querySelectorAll('.empresa-tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // Remove active de todas as tabs
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        // Adiciona active na tab clicada
        tab.classList.add('active');
        const targetContent = document.getElementById(`tab-${targetTab}`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  setupColorPickers() {
    // Cor primária
    const corPrimaria = document.getElementById('empresaCorPrimaria');
    const corPrimariaText = document.getElementById('empresaCorPrimariaText');

    if (corPrimaria && corPrimariaText) {
      corPrimaria.addEventListener('input', (e) => {
        corPrimariaText.value = e.target.value;
        this.updateColorPreview();
      });

      corPrimariaText.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
          corPrimaria.value = e.target.value;
          this.updateColorPreview();
        }
      });
    }

    // Cor secundária
    const corSecundaria = document.getElementById('empresaCorSecundaria');
    const corSecundariaText = document.getElementById('empresaCorSecundariaText');

    if (corSecundaria && corSecundariaText) {
      corSecundaria.addEventListener('input', (e) => {
        corSecundariaText.value = e.target.value;
        this.updateColorPreview();
      });

      corSecundariaText.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
          corSecundaria.value = e.target.value;
          this.updateColorPreview();
        }
      });
    }
  }

  updateColorPreview() {
    const corPrimaria = document.getElementById('empresaCorPrimaria')?.value || '#2563eb';
    const corSecundaria = document.getElementById('empresaCorSecundaria')?.value || '#1e40af';

    const previewHeader = document.querySelector('.preview-header');
    const previewBtn = document.querySelector('.preview-btn');

    if (previewHeader) {
      previewHeader.style.background = `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`;
    }

    if (previewBtn) {
      previewBtn.style.background = corPrimaria;
    }
  }

  setupCepSearch() {
    const cepInput = document.getElementById('empresaCep');

    if (cepInput) {
      cepInput.addEventListener('blur', async (e) => {
        const cep = e.target.value.replace(/\D/g, '');

        if (cep.length === 8) {
          await this.buscarCep(cep);
        }
      });

      // Formatar CEP enquanto digita
      cepInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
          value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        e.target.value = value;
      });
    }
  }

  async buscarCep(cep) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        console.warn('CEP não encontrado');
        return;
      }

      // Preencher campos
      const endereco = document.getElementById('empresaEndereco');
      const bairro = document.getElementById('empresaBairro');
      const cidade = document.getElementById('empresaCidade');
      const estado = document.getElementById('empresaEstado');

      if (endereco) endereco.value = data.logradouro || '';
      if (bairro) bairro.value = data.bairro || '';
      if (cidade) cidade.value = data.localidade || '';
      if (estado) estado.value = data.uf || '';

      // Focar no campo número após preencher
      const numero = document.getElementById('empresaNumero');
      if (numero) numero.focus();

    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  }

  abrirModalNova() {
    this.empresaSelecionada = null;
    document.getElementById('modalEmpresaTitle').textContent = 'Nova Empresa';
    document.getElementById('formEmpresa').reset();

    // Reset tabs para primeira tab
    const tabs = document.querySelectorAll('.empresa-tab');
    const contents = document.querySelectorAll('.empresa-tab-content');
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tabs[0]?.classList.add('active');
    contents[0]?.classList.add('active');

    // Resetar preview de cores
    const corPrimaria = document.getElementById('empresaCorPrimaria');
    const corPrimariaText = document.getElementById('empresaCorPrimariaText');
    const corSecundaria = document.getElementById('empresaCorSecundaria');
    const corSecundariaText = document.getElementById('empresaCorSecundariaText');

    if (corPrimaria) corPrimaria.value = '#2563eb';
    if (corPrimariaText) corPrimariaText.value = '#2563eb';
    if (corSecundaria) corSecundaria.value = '#1e40af';
    if (corSecundariaText) corSecundariaText.value = '#1e40af';
    this.updateColorPreview();

    // Resetar valores padrão
    document.getElementById('empresaPrecoCautelar').value = '150.00';
    document.getElementById('empresaPrecoTransferencia').value = '120.00';
    document.getElementById('empresaPrecoOutros').value = '100.00';
    document.getElementById('empresaHorarioInicio').value = '08:00';
    document.getElementById('empresaHorarioFim').value = '18:00';

    // Habilitar edição do slug
    const slugInput = document.getElementById('empresaSlug');
    if (slugInput) slugInput.disabled = false;

    // Preview do slug
    const previewSlug = document.getElementById('previewSlug');
    if (previewSlug) previewSlug.textContent = '...';

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

      // Abrir página da empresa em nova aba
      const url = `/${empresa.slug}` || `/empresa.html?empresa=${empresa.slug}`;
      window.open(url, '_blank');

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

      // Preencher formulário - Dados Básicos
      document.getElementById('modalEmpresaTitle').textContent = 'Editar Empresa';
      this.setFieldValue('empresaNome', empresa.nome);
      this.setFieldValue('empresaSlug', empresa.slug);
      document.getElementById('empresaSlug').disabled = true; // Não pode alterar slug
      this.setFieldValue('empresaRazaoSocial', empresa.razao_social);
      this.setFieldValue('empresaCNPJ', empresa.cnpj);
      this.setFieldValue('empresaEmail', empresa.email);
      this.setFieldValue('empresaTelefone', empresa.telefone);
      this.setFieldValue('empresaDescricao', empresa.descricao);
      this.setFieldValue('empresaStatus', empresa.status);
      this.setFieldValue('empresaPlano', empresa.plano);

      // Preview do slug
      const previewSlug = document.getElementById('previewSlug');
      if (previewSlug) previewSlug.textContent = empresa.slug;

      // Localização
      this.setFieldValue('empresaCep', empresa.cep);
      this.setFieldValue('empresaEndereco', empresa.endereco);
      this.setFieldValue('empresaNumero', empresa.numero);
      this.setFieldValue('empresaComplemento', empresa.complemento);
      this.setFieldValue('empresaBairro', empresa.bairro);
      this.setFieldValue('empresaCidade', empresa.cidade);
      this.setFieldValue('empresaEstado', empresa.estado);
      this.setFieldValue('empresaLatitude', empresa.latitude);
      this.setFieldValue('empresaLongitude', empresa.longitude);

      // Preços (convertendo de centavos para reais)
      this.setFieldValue('empresaPrecoCautelar', (empresa.preco_cautelar / 100).toFixed(2));
      this.setFieldValue('empresaPrecoTransferencia', (empresa.preco_transferencia / 100).toFixed(2));
      this.setFieldValue('empresaPrecoOutros', (empresa.preco_outros / 100).toFixed(2));
      this.setFieldValue('empresaHorarioInicio', empresa.horario_inicio?.substring(0, 5) || '08:00');
      this.setFieldValue('empresaHorarioFim', empresa.horario_fim?.substring(0, 5) || '18:00');
      this.setFieldValue('empresaIntervalo', empresa.intervalo_minutos);
      this.setFieldValue('empresaHorarioTexto', empresa.horario_funcionamento);

      // Visual
      this.setFieldValue('empresaTemplate', empresa.template_id);

      const corPrimaria = empresa.cor_primaria || '#2563eb';
      const corSecundaria = empresa.cor_secundaria || '#1e40af';
      this.setFieldValue('empresaCorPrimaria', corPrimaria);
      this.setFieldValue('empresaCorPrimariaText', corPrimaria);
      this.setFieldValue('empresaCorSecundaria', corSecundaria);
      this.setFieldValue('empresaCorSecundariaText', corSecundaria);
      this.updateColorPreview();

      this.setFieldValue('empresaLogoUrl', empresa.logo_url);
      this.setFieldValue('empresaCapaUrl', empresa.foto_capa_url);
      this.setFieldValue('empresaPerfilUrl', empresa.foto_perfil_url);
      this.setFieldValue('empresaFaviconUrl', empresa.favicon_url);
      this.setFieldValue('empresaTituloPagina', empresa.titulo_pagina);
      this.setFieldValue('empresaMetaDescription', empresa.meta_description);

      // Redes sociais
      this.setFieldValue('empresaWhatsapp', empresa.whatsapp || empresa.whatsapp_numero);
      this.setFieldValue('empresaSite', empresa.site_url || empresa.website_url);
      this.setFieldValue('empresaFacebook', empresa.facebook_url);
      this.setFieldValue('empresaInstagram', empresa.instagram_url);

      const mostrarWhatsapp = document.getElementById('empresaMostrarWhatsapp');
      if (mostrarWhatsapp) mostrarWhatsapp.checked = empresa.mostrar_whatsapp_float !== false;

      const mostrarMarca = document.getElementById('empresaMostrarMarca');
      if (mostrarMarca) mostrarMarca.checked = empresa.mostrar_marca_propria !== false;

      // Pagamento
      this.setFieldValue('empresaChavePix', empresa.chave_pix || empresa.pix_key);
      this.setFieldValue('empresaTipoPix', empresa.pix_type || empresa.tipo_pix);

      // Reset tabs para primeira tab
      const tabs = document.querySelectorAll('.empresa-tab');
      const contents = document.querySelectorAll('.empresa-tab-content');
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tabs[0]?.classList.add('active');
      contents[0]?.classList.add('active');

      document.getElementById('modalEmpresa').style.display = 'flex';
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao carregar dados da empresa');
    }
  }

  setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field && value !== null && value !== undefined) {
      field.value = value;
    }
  }

  async salvar() {
    // Mostrar loading
    const btnText = document.getElementById('salvarEmpresaText');
    const btnLoading = document.getElementById('salvarEmpresaLoading');
    const btnSalvar = document.getElementById('salvarEmpresa');

    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    if (btnSalvar) btnSalvar.disabled = true;

    try {
      // Coletar todos os dados do formulário
      const formData = {
        // Dados básicos
        nome: document.getElementById('empresaNome')?.value || '',
        slug: document.getElementById('empresaSlug')?.value || '',
        razao_social: document.getElementById('empresaRazaoSocial')?.value || '',
        cnpj: document.getElementById('empresaCNPJ')?.value || '',
        email: document.getElementById('empresaEmail')?.value || '',
        telefone: document.getElementById('empresaTelefone')?.value || '',
        descricao: document.getElementById('empresaDescricao')?.value || '',
        status: document.getElementById('empresaStatus')?.value || 'ativo',
        plano: document.getElementById('empresaPlano')?.value || 'basico',

        // Localização
        cep: document.getElementById('empresaCep')?.value || '',
        endereco: document.getElementById('empresaEndereco')?.value || '',
        numero: document.getElementById('empresaNumero')?.value || '',
        complemento: document.getElementById('empresaComplemento')?.value || '',
        bairro: document.getElementById('empresaBairro')?.value || '',
        cidade: document.getElementById('empresaCidade')?.value || '',
        estado: document.getElementById('empresaEstado')?.value || '',
        latitude: document.getElementById('empresaLatitude')?.value || null,
        longitude: document.getElementById('empresaLongitude')?.value || null,

        // Preços (convertendo para centavos)
        preco_cautelar: Math.round(parseFloat(document.getElementById('empresaPrecoCautelar')?.value || 0) * 100),
        preco_transferencia: Math.round(parseFloat(document.getElementById('empresaPrecoTransferencia')?.value || 0) * 100),
        preco_outros: Math.round(parseFloat(document.getElementById('empresaPrecoOutros')?.value || 0) * 100),
        horario_inicio: document.getElementById('empresaHorarioInicio')?.value || '08:00',
        horario_fim: document.getElementById('empresaHorarioFim')?.value || '18:00',
        intervalo_minutos: parseInt(document.getElementById('empresaIntervalo')?.value) || 60,
        horario_funcionamento: document.getElementById('empresaHorarioTexto')?.value || '',

        // Visual
        template_id: document.getElementById('empresaTemplate')?.value || 'default',
        cor_primaria: document.getElementById('empresaCorPrimaria')?.value || '#2563eb',
        cor_secundaria: document.getElementById('empresaCorSecundaria')?.value || '#1e40af',
        logo_url: document.getElementById('empresaLogoUrl')?.value || '',
        foto_capa_url: document.getElementById('empresaCapaUrl')?.value || '',
        foto_perfil_url: document.getElementById('empresaPerfilUrl')?.value || '',
        favicon_url: document.getElementById('empresaFaviconUrl')?.value || '',
        titulo_pagina: document.getElementById('empresaTituloPagina')?.value || '',
        meta_description: document.getElementById('empresaMetaDescription')?.value || '',

        // Redes sociais
        whatsapp: document.getElementById('empresaWhatsapp')?.value || '',
        site_url: document.getElementById('empresaSite')?.value || '',
        facebook_url: document.getElementById('empresaFacebook')?.value || '',
        instagram_url: document.getElementById('empresaInstagram')?.value || '',
        mostrar_whatsapp_float: document.getElementById('empresaMostrarWhatsapp')?.checked ?? true,
        mostrar_marca_propria: document.getElementById('empresaMostrarMarca')?.checked ?? true,

        // Pagamento
        chave_pix: document.getElementById('empresaChavePix')?.value || '',
        tipo_pix: document.getElementById('empresaTipoPix')?.value || 'cpf'
      };

      // Validação básica
      if (!formData.nome) {
        alert('Nome da empresa é obrigatório');
        return;
      }
      if (!formData.slug) {
        alert('Subdomínio é obrigatório');
        return;
      }
      if (!formData.email) {
        alert('Email é obrigatório');
        return;
      }
      if (!formData.chave_pix) {
        alert('Chave PIX é obrigatória');
        return;
      }

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

      if (data.url && !this.empresaSelecionada) {
        const abrirPagina = confirm(`Empresa criada!\n\nDeseja abrir a página da empresa?\n${data.url}`);
        if (abrirPagina) {
          window.open(data.url, '_blank');
        }
      }

      this.fecharModal();
      await this.loadEmpresas();
    } catch (error) {
      console.error('Erro:', error);
      alert(error.message);
    } finally {
      // Esconder loading
      if (btnText) btnText.style.display = 'inline';
      if (btnLoading) btnLoading.style.display = 'none';
      if (btnSalvar) btnSalvar.disabled = false;
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
    this.empresaSelecionada = null;
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
