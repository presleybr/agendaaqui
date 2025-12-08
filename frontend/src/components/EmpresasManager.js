import { scheduleService } from '../services/api.js';
import { empresasApi } from '../services/superAdminApi.js';

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
      console.log('🔗 Carregando empresas via Super Admin API...');

      // Usar o novo serviço de API que já gerencia autenticação
      const data = await empresasApi.listar();
      console.log('📦 Dados recebidos:', data);

      this.empresas = data.empresas || [];
      console.log('✅ Empresas carregadas:', this.empresas.length);
      this.renderLista();
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);

      // Fallback: tentar API antiga
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${scheduleService.API_URL}/admin/empresas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          this.empresas = data.empresas || data || [];
          this.renderLista();
          return;
        }
      } catch (fallbackError) {
        console.warn('⚠️ Fallback também falhou');
      }

      this.empresas = [];
      this.renderLista();
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

      // Usar dados já calculados pelo backend ou calcular localmente
      const diasDesdeInicio = empresa.dias_desde_inicio ?? Math.floor(
        (new Date() - new Date(empresa.data_inicio || empresa.created_at)) / (1000 * 60 * 60 * 24)
      );

      const temComissao = empresa.tem_comissao ?? (diasDesdeInicio <= 30);
      const diasRestantes = empresa.dias_restantes_comissao ?? (temComissao ? 30 - diasDesdeInicio : 0);

      // Métricas do banco de dados
      const totalAgendamentos = empresa.total_agendamentos || empresa.metricas?.total_agendamentos || 0;
      const receitaTotal = empresa.receita_total || empresa.metricas?.total_receita || 0;

      return `
        <tr>
          <td>
            <strong>${empresa.nome}</strong><br>
            <a href="https://agendaaquivistorias.com.br/${empresa.slug}" target="_blank" style="color: #3b82f6; text-decoration: none;">
              agendaaquivistorias.com.br/${empresa.slug}
            </a>
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
            <strong>${totalAgendamentos}</strong> agendamentos<br>
            <small style="color: #666;">R$ ${(receitaTotal / 100).toFixed(2)}</small>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-action btn-action-view" onclick="empresasManager.visualizar(${empresa.id})" title="Abrir página da empresa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </button>
              <button class="btn-action btn-action-edit" onclick="empresasManager.editar(${empresa.id})" title="Editar empresa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-action btn-action-delete" onclick="empresasManager.deletar(${empresa.id}, '${empresa.nome.replace(/'/g, "\\'")}')" title="Deletar empresa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
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

    // Resetar valores padrão de preços por tipo de veículo
    const campoMoto200 = document.getElementById('empresaPrecoMoto200');
    const campoAutomovel = document.getElementById('empresaPrecoAutomovel');
    const campoCamionete = document.getElementById('empresaPrecoCamionete');
    const campoVan = document.getElementById('empresaPrecoVan');
    const campoCaminhao = document.getElementById('empresaPrecoCaminhao');

    if (campoMoto200) campoMoto200.value = '190.00';
    if (campoAutomovel) campoAutomovel.value = '220.00';
    if (campoCamionete) campoCamionete.value = '230.00';
    if (campoVan) campoVan.value = '250.00';
    if (campoCaminhao) campoCaminhao.value = '280.00';
    document.getElementById('empresaHorarioInicio').value = '08:00';
    document.getElementById('empresaHorarioFim').value = '18:00';
    document.getElementById('empresaTaxaPlataforma').value = '5.00';

    // Habilitar edição do slug
    const slugInput = document.getElementById('empresaSlug');
    if (slugInput) slugInput.disabled = false;

    // Preview do slug
    const previewSlug = document.getElementById('previewSlug');
    if (previewSlug) previewSlug.textContent = '...';

    document.getElementById('modalEmpresa').style.display = 'flex';
  }

  visualizar(id) {
    // Encontrar empresa na lista carregada
    const empresa = this.empresas.find(e => e.id === id);
    if (empresa) {
      // Abrir página da empresa em nova aba com URL completa
      window.open(`https://agendaaquivistorias.com.br/${empresa.slug}`, '_blank');
    } else {
      alert('Empresa não encontrada');
    }
  }

  async editar(id) {
    try {
      // Usar a nova API que retorna dados completos
      const empresa = await empresasApi.buscarPorId(id);
      console.log('📦 Dados da empresa para edição:', empresa);
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

      // Preços por tipo de veículo (carregar do precos_vistoria se disponível, senão usar defaults)
      if (empresa.precos_vistoria && empresa.precos_vistoria.length > 0) {
        const precos = empresa.precos_vistoria;
        const getPreco = (cat) => {
          const p = precos.find(x => x.categoria === cat);
          return p ? (p.preco / 100).toFixed(2) : null;
        };
        this.setFieldValue('empresaPrecoMoto200', getPreco('moto_pequena') || '190.00');
        this.setFieldValue('empresaPrecoAutomovel', getPreco('moto_grande_automovel') || '220.00');
        this.setFieldValue('empresaPrecoCamionete', getPreco('camionete') || '230.00');
        this.setFieldValue('empresaPrecoVan', getPreco('van_microonibus') || '250.00');
        this.setFieldValue('empresaPrecoCaminhao', getPreco('caminhao_onibus') || '280.00');
      } else {
        // Valores padrão se não houver preços cadastrados
        this.setFieldValue('empresaPrecoMoto200', '190.00');
        this.setFieldValue('empresaPrecoAutomovel', '220.00');
        this.setFieldValue('empresaPrecoCamionete', '230.00');
        this.setFieldValue('empresaPrecoVan', '250.00');
        this.setFieldValue('empresaPrecoCaminhao', '280.00');
      }
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

      // Taxa da plataforma (convertendo de centavos para reais)
      const taxaEmReais = (empresa.percentual_plataforma || 500) / 100;
      this.setFieldValue('empresaTaxaPlataforma', taxaEmReais.toFixed(2));

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

        // Preços por tipo de veículo (convertendo para centavos)
        precos_vistoria: [
          {
            categoria: 'moto_pequena',
            nome_exibicao: 'Motos até 200cc',
            descricao: 'Motocicletas com cilindrada até 200cc',
            preco: Math.round(parseFloat(document.getElementById('empresaPrecoMoto200')?.value || 190) * 100),
            ordem: 1
          },
          {
            categoria: 'moto_grande_automovel',
            nome_exibicao: 'Motos +200cc / Automóveis',
            descricao: 'Motocicletas acima de 200cc e automóveis',
            preco: Math.round(parseFloat(document.getElementById('empresaPrecoAutomovel')?.value || 220) * 100),
            ordem: 2
          },
          {
            categoria: 'camionete',
            nome_exibicao: 'Camionetes / Camionetas',
            descricao: 'Picapes e SUVs',
            preco: Math.round(parseFloat(document.getElementById('empresaPrecoCamionete')?.value || 230) * 100),
            ordem: 3
          },
          {
            categoria: 'van_microonibus',
            nome_exibicao: 'Vans / Micro-ônibus',
            descricao: 'Vans, motorhomes e micro-ônibus',
            preco: Math.round(parseFloat(document.getElementById('empresaPrecoVan')?.value || 250) * 100),
            ordem: 4
          },
          {
            categoria: 'caminhao_onibus',
            nome_exibicao: 'Caminhões / Ônibus',
            descricao: 'Caminhões, carretas e ônibus',
            preco: Math.round(parseFloat(document.getElementById('empresaPrecoCaminhao')?.value || 280) * 100),
            ordem: 5
          }
        ],
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
        pix_type: document.getElementById('empresaTipoPix')?.value || 'cpf',

        // Taxa da plataforma (em centavos)
        percentual_plataforma: Math.round(parseFloat(document.getElementById('empresaTaxaPlataforma')?.value || 5) * 100)
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

      // Usar a nova API para salvar
      let data;
      if (this.empresaSelecionada) {
        data = await empresasApi.atualizar(this.empresaSelecionada.id, formData);
      } else {
        data = await empresasApi.criar(formData);
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
      const data = await empresasApi.deletar(id);
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
