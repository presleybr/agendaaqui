/**
 * Wizard de Cadastro de Empresa
 *
 * Controla o fluxo de cadastro por etapas
 */

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://agendaaquivistorias.com.br/api';

// Estado do wizard
const state = {
  currentStep: 1,
  totalSteps: 7,
  formData: {},
  slugTimeout: null,
  emailTimeout: null
};

// Elementos do DOM
let elements = {};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initEventListeners();
  initMasks();
  initMobileNav();
  updateProgress();
  updateHorariosPreview();
});

/**
 * Labels das etapas
 */
const stepLabels = [
  'Dados',
  'Endereço',
  'PIX',
  'Visual',
  'Preços',
  'Horários',
  'Confirmar'
];

/**
 * Inicializa referências aos elementos do DOM
 */
function initElements() {
  elements = {
    form: document.getElementById('cadastroForm'),
    steps: document.querySelectorAll('.form-step'),
    stepDots: document.querySelectorAll('.step-dot'),
    progressFill: document.getElementById('progressFill'),
    btnVoltar: document.getElementById('btnVoltar'),
    btnAvancar: document.getElementById('btnAvancar'),
    btnFinalizar: document.getElementById('btnFinalizar'),
    successModal: document.getElementById('successModal'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    resumoContainer: document.getElementById('resumoContainer'),
    horariosPreview: document.getElementById('horariosPreview'),
    previewBtn: document.getElementById('previewBtn')
  };
}

/**
 * Inicializa event listeners
 */
function initEventListeners() {
  // Navegação
  elements.btnVoltar.addEventListener('click', voltarStep);
  elements.btnAvancar.addEventListener('click', avancarStep);
  elements.form.addEventListener('submit', handleSubmit);

  // Slug - verificação em tempo real
  const slugInput = document.getElementById('slug');
  const nomeInput = document.getElementById('nome');

  nomeInput.addEventListener('input', (e) => {
    const valor = e.target.value;
    const errorEl = nomeInput.parentElement.querySelector('.error-message');

    // Verificar se parece endereço
    if (pareceEndereco(valor)) {
      nomeInput.classList.add('error');
      if (errorEl) {
        errorEl.textContent = 'Isso parece um endereço. Digite o nome da sua empresa (ex: Vistoria Express)';
      }
      slugInput.value = '';
      return;
    } else {
      nomeInput.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
    }

    // Auto-gerar slug baseado no nome
    const slug = gerarSlug(valor);
    slugInput.value = slug;
    verificarSlug(slug);
  });

  slugInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    verificarSlug(e.target.value);
  });

  // Email - verificação
  const emailInput = document.getElementById('email');
  emailInput.addEventListener('blur', () => verificarEmail(emailInput.value));

  // CEP - busca automática
  const cepInput = document.getElementById('cep');
  cepInput.addEventListener('blur', () => buscarCep(cepInput.value));

  // Cores - sincronização
  setupColorPickers();

  // Descrição - contador
  const descricaoInput = document.getElementById('descricao');
  descricaoInput.addEventListener('input', (e) => {
    document.getElementById('descricaoCount').textContent = e.target.value.length;
  });

  // Horários - preview
  document.getElementById('horario_inicio').addEventListener('change', updateHorariosPreview);
  document.getElementById('horario_fim').addEventListener('change', updateHorariosPreview);
  document.getElementById('intervalo_minutos').addEventListener('change', updateHorariosPreview);

  // Adicionar preço
  document.getElementById('btnAddPreco').addEventListener('click', adicionarPreco);

  // Step dots - navegação direta (apenas para steps completados)
  elements.stepDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetStep = parseInt(dot.dataset.step);
      if (targetStep < state.currentStep) {
        goToStep(targetStep);
      }
    });
  });
}

/**
 * Inicializa máscaras de input
 */
function initMasks() {
  // CNPJ
  const cnpjInput = document.getElementById('cnpj');
  cnpjInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    e.target.value = value;
  });

  // Telefone
  const telefoneInputs = document.querySelectorAll('input[type="tel"]');
  telefoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        if (value.length > 2) {
          value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
        }
        if (value.length > 10) {
          value = value.substring(0, 10) + '-' + value.substring(10);
        }
      }
      e.target.value = value;
    });
  });

  // CEP
  const cepInput = document.getElementById('cep');
  cepInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    e.target.value = value;
  });
}

/**
 * Verifica se o texto parece ser um endereço
 */
function pareceEndereco(texto) {
  const padroesEndereco = [
    /^rua\s/i,
    /^av\.?\s/i,
    /^avenida\s/i,
    /^travessa\s/i,
    /^alameda\s/i,
    /^estrada\s/i,
    /^rodovia\s/i,
    /^praça\s/i,
    /^largo\s/i,
    /\d{5}-?\d{3}/, // CEP
    /,\s*\d+/, // número após vírgula
  ];
  return padroesEndereco.some(pattern => pattern.test(texto));
}

/**
 * Gera slug a partir do nome
 */
function gerarSlug(nome) {
  // Se parecer endereço, não gerar slug automaticamente
  if (pareceEndereco(nome)) {
    return '';
  }

  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços viram hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, '') // Remove hífens no início/fim
    .substring(0, 50);
}

/**
 * Verifica disponibilidade do slug
 */
async function verificarSlug(slug) {
  const statusEl = document.querySelector('.slug-status');

  if (!slug || slug.length < 3) {
    statusEl.textContent = '';
    statusEl.className = 'slug-status';
    return;
  }

  clearTimeout(state.slugTimeout);

  state.slugTimeout = setTimeout(async () => {
    statusEl.textContent = 'Verificando...';
    statusEl.className = 'slug-status verificando';

    try {
      const response = await fetch(`${API_URL}/registro/verificar-slug/${slug}`);
      const data = await response.json();

      if (data.disponivel) {
        statusEl.innerHTML = '✓ Disponível: ' + data.url_preview;
        statusEl.className = 'slug-status disponivel';
        document.getElementById('slug').classList.remove('error');
        document.getElementById('slug').classList.add('success');
      } else {
        statusEl.innerHTML = '✗ ' + (data.erro || 'Já está em uso');
        statusEl.className = 'slug-status indisponivel';
        document.getElementById('slug').classList.add('error');
        document.getElementById('slug').classList.remove('success');
      }
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
      statusEl.textContent = '';
    }
  }, 500);
}

/**
 * Verifica disponibilidade do email
 */
async function verificarEmail(email) {
  const statusEl = document.querySelector('.email-status');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    statusEl.textContent = '';
    return;
  }

  statusEl.textContent = 'Verificando...';
  statusEl.className = 'email-status verificando';

  try {
    const response = await fetch(`${API_URL}/registro/verificar-email/${email}`);
    const data = await response.json();

    if (data.disponivel) {
      statusEl.innerHTML = '✓ Email disponível';
      statusEl.className = 'email-status disponivel';
      document.getElementById('email').classList.remove('error');
    } else {
      statusEl.innerHTML = '✗ Email já cadastrado';
      statusEl.className = 'email-status indisponivel';
      document.getElementById('email').classList.add('error');
    }
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    statusEl.textContent = '';
  }
}

/**
 * Busca endereço pelo CEP
 */
async function buscarCep(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  const statusEl = document.querySelector('.cep-status');

  if (cepLimpo.length !== 8) {
    return;
  }

  statusEl.textContent = 'Buscando...';
  statusEl.className = 'cep-status buscando';

  try {
    const response = await fetch(`${API_URL}/registro/buscar-cep/${cepLimpo}`);
    const data = await response.json();

    if (data.endereco) {
      document.getElementById('endereco').value = data.endereco;
      document.getElementById('bairro').value = data.bairro || '';
      document.getElementById('cidade').value = data.cidade;
      document.getElementById('estado').value = data.estado;
      statusEl.textContent = '✓ Endereço encontrado';
      statusEl.className = 'cep-status disponivel';
    } else {
      statusEl.textContent = 'CEP não encontrado';
      statusEl.className = 'cep-status indisponivel';
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    statusEl.textContent = '';
  }
}

/**
 * Setup dos color pickers
 */
function setupColorPickers() {
  const corPrimaria = document.getElementById('cor_primaria');
  const corPrimariaText = document.getElementById('cor_primaria_text');
  const corSecundaria = document.getElementById('cor_secundaria');
  const corSecundariaText = document.getElementById('cor_secundaria_text');

  // Sincronizar color picker com texto
  corPrimaria.addEventListener('input', (e) => {
    corPrimariaText.value = e.target.value.toUpperCase();
    updatePreviewButton();
  });

  corPrimariaText.addEventListener('input', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      corPrimaria.value = e.target.value;
      updatePreviewButton();
    }
  });

  corSecundaria.addEventListener('input', (e) => {
    corSecundariaText.value = e.target.value.toUpperCase();
    updatePreviewButton();
  });

  corSecundariaText.addEventListener('input', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      corSecundaria.value = e.target.value;
      updatePreviewButton();
    }
  });

  updatePreviewButton();
}

/**
 * Atualiza botão de preview com as cores selecionadas
 */
function updatePreviewButton() {
  const corPrimaria = document.getElementById('cor_primaria').value;
  const corSecundaria = document.getElementById('cor_secundaria').value;

  if (elements.previewBtn) {
    elements.previewBtn.style.background = `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`;
  }
}

/**
 * Atualiza preview dos horários
 */
function updateHorariosPreview() {
  const inicio = document.getElementById('horario_inicio').value;
  const fim = document.getElementById('horario_fim').value;
  const intervalo = parseInt(document.getElementById('intervalo_minutos').value);

  if (!inicio || !fim || !intervalo) return;

  const slots = [];
  let [horaAtual, minutoAtual] = inicio.split(':').map(Number);
  const [horaFim, minutoFim] = fim.split(':').map(Number);

  while (horaAtual < horaFim || (horaAtual === horaFim && minutoAtual < minutoFim)) {
    const horaFormatada = `${String(horaAtual).padStart(2, '0')}:${String(minutoAtual).padStart(2, '0')}`;
    slots.push(horaFormatada);

    minutoAtual += intervalo;
    if (minutoAtual >= 60) {
      horaAtual += Math.floor(minutoAtual / 60);
      minutoAtual = minutoAtual % 60;
    }

    if (slots.length >= 12) break; // Limita preview
  }

  if (elements.horariosPreview) {
    elements.horariosPreview.innerHTML = slots
      .map(slot => `<span class="slot-preview">${slot}</span>`)
      .join('') + (slots.length >= 12 ? '<span class="slot-preview">...</span>' : '');
  }
}

/**
 * Adiciona novo campo de preço
 */
function adicionarPreco() {
  const container = document.getElementById('precosContainer');
  const count = container.querySelectorAll('.preco-item').length + 1;
  const categoria = `custom_${count}`;

  const item = document.createElement('div');
  item.className = 'preco-item';
  item.innerHTML = `
    <div class="preco-header">
      <input type="text" class="preco-nome" value="Serviço ${count}" data-categoria="${categoria}">
      <div class="preco-valor">
        <span>R$</span>
        <input type="number" class="preco-input" value="100" min="0" step="0.01" data-categoria="${categoria}">
      </div>
      <button type="button" class="btn-remove-preco" onclick="this.closest('.preco-item').remove()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <input type="text" class="preco-descricao" placeholder="Descrição (opcional)" data-categoria="${categoria}">
  `;

  container.appendChild(item);
}

/**
 * Valida os campos do step atual
 */
function validarStep(step) {
  const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
  const requiredInputs = stepEl.querySelectorAll('input[required], select[required]');
  let isValid = true;

  requiredInputs.forEach(input => {
    const errorEl = input.parentElement.querySelector('.error-message');

    if (!input.value.trim()) {
      input.classList.add('error');
      if (errorEl) errorEl.textContent = 'Campo obrigatório';
      isValid = false;
    } else {
      input.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
    }
  });

  // Validações específicas por step
  if (step === 1) {
    const slug = document.getElementById('slug');
    const slugStatus = document.querySelector('.slug-status');

    if (slugStatus && slugStatus.classList.contains('indisponivel')) {
      isValid = false;
    }

    const email = document.getElementById('email');
    const emailStatus = document.querySelector('.email-status');

    if (emailStatus && emailStatus.classList.contains('indisponivel')) {
      isValid = false;
    }
  }

  if (step === 7) {
    const aceite = document.getElementById('aceiteTermos');
    if (!aceite.checked) {
      alert('Você precisa aceitar os termos de uso para continuar.');
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Coleta dados do formulário
 */
function coletarDados() {
  const form = elements.form;
  const formData = new FormData(form);
  const dados = {};

  // Dados básicos
  dados.nome = formData.get('nome');
  dados.slug = formData.get('slug');
  dados.cnpj = formData.get('cnpj');
  dados.email = formData.get('email');
  dados.telefone = formData.get('telefone');

  // Endereço
  dados.cep = formData.get('cep');
  dados.endereco = formData.get('endereco');
  dados.numero = formData.get('numero');
  dados.complemento = formData.get('complemento');
  dados.bairro = formData.get('bairro');
  dados.cidade = formData.get('cidade');
  dados.estado = formData.get('estado');

  // PIX
  dados.chave_pix = formData.get('chave_pix');
  dados.tipo_chave_pix = formData.get('tipo_chave_pix');

  // Personalização
  dados.descricao = formData.get('descricao');
  dados.cor_primaria = formData.get('cor_primaria');
  dados.cor_secundaria = formData.get('cor_secundaria');
  dados.logo_url = formData.get('logo_url');
  dados.whatsapp = formData.get('whatsapp');
  dados.instagram_url = formData.get('instagram_url');

  // Horários
  dados.horario_inicio = formData.get('horario_inicio');
  dados.horario_fim = formData.get('horario_fim');
  dados.intervalo_minutos = parseInt(formData.get('intervalo_minutos'));

  // Dias de trabalho
  const diasCheckboxes = form.querySelectorAll('input[name="dias_trabalho"]:checked');
  dados.dias_trabalho = Array.from(diasCheckboxes).map(cb => cb.value).join(',');

  // Preços
  dados.precos_vistoria = [];
  const precoItems = document.querySelectorAll('.preco-item');

  precoItems.forEach((item, index) => {
    const nomeInput = item.querySelector('.preco-nome');
    const precoInput = item.querySelector('.preco-input');
    const descInput = item.querySelector('.preco-descricao');

    if (nomeInput && precoInput) {
      dados.precos_vistoria.push({
        categoria: nomeInput.dataset.categoria || `item_${index}`,
        nome_exibicao: nomeInput.value,
        preco: Math.round(parseFloat(precoInput.value || 0) * 100), // Converter para centavos
        descricao: descInput ? descInput.value : '',
        ordem: index + 1
      });
    }
  });

  return dados;
}

/**
 * Gera resumo dos dados para confirmação
 */
function gerarResumo() {
  const dados = coletarDados();

  const diasMap = {
    '0': 'Dom', '1': 'Seg', '2': 'Ter', '3': 'Qua',
    '4': 'Qui', '5': 'Sex', '6': 'Sáb'
  };

  const diasFormatados = dados.dias_trabalho
    .split(',')
    .map(d => diasMap[d])
    .join(', ');

  elements.resumoContainer.innerHTML = `
    <div class="resumo-section">
      <h4>Dados da Empresa</h4>
      <div class="resumo-item">
        <span class="label">Nome:</span>
        <span class="value">${dados.nome}</span>
      </div>
      <div class="resumo-item">
        <span class="label">URL:</span>
        <span class="value">agendaaquivistorias.com.br/${dados.slug}</span>
      </div>
      <div class="resumo-item">
        <span class="label">Email:</span>
        <span class="value">${dados.email}</span>
      </div>
      ${dados.cnpj ? `
      <div class="resumo-item">
        <span class="label">CNPJ:</span>
        <span class="value">${dados.cnpj}</span>
      </div>
      ` : ''}
    </div>

    <div class="resumo-section">
      <h4>Endereço</h4>
      ${dados.endereco ? `
      <div class="resumo-item">
        <span class="label">Endereço:</span>
        <span class="value">${dados.endereco}${dados.numero ? ', ' + dados.numero : ''}</span>
      </div>
      ` : '<p style="color: #6b7280;">Não informado</p>'}
      ${dados.cidade ? `
      <div class="resumo-item">
        <span class="label">Cidade:</span>
        <span class="value">${dados.cidade}/${dados.estado}</span>
      </div>
      ` : ''}
    </div>

    <div class="resumo-section">
      <h4>Chave PIX</h4>
      <div class="resumo-item">
        <span class="label">Chave:</span>
        <span class="value">${dados.chave_pix}</span>
      </div>
    </div>

    <div class="resumo-section">
      <h4>Preços</h4>
      ${dados.precos_vistoria.map(p => `
      <div class="resumo-item">
        <span class="label">${p.nome_exibicao}:</span>
        <span class="value">R$ ${(p.preco / 100).toFixed(2)}</span>
      </div>
      `).join('')}
    </div>

    <div class="resumo-section">
      <h4>Horários</h4>
      <div class="resumo-item">
        <span class="label">Funcionamento:</span>
        <span class="value">${dados.horario_inicio} às ${dados.horario_fim}</span>
      </div>
      <div class="resumo-item">
        <span class="label">Dias:</span>
        <span class="value">${diasFormatados}</span>
      </div>
    </div>
  `;
}

/**
 * Avança para o próximo step
 */
function avancarStep() {
  if (!validarStep(state.currentStep)) {
    return;
  }

  if (state.currentStep < state.totalSteps) {
    state.currentStep++;
    updateStep();

    // Gera resumo no último step
    if (state.currentStep === state.totalSteps) {
      gerarResumo();
    }
  }
}

/**
 * Volta para o step anterior
 */
function voltarStep() {
  if (state.currentStep > 1) {
    state.currentStep--;
    updateStep();
  }
}

/**
 * Vai para um step específico
 */
function goToStep(step) {
  if (step >= 1 && step <= state.totalSteps) {
    state.currentStep = step;
    updateStep();
  }
}

/**
 * Atualiza a interface do step atual
 */
function updateStep() {
  // Atualiza steps
  elements.steps.forEach(step => {
    step.classList.remove('active');
    if (parseInt(step.dataset.step) === state.currentStep) {
      step.classList.add('active');
    }
  });

  // Atualiza dots
  elements.stepDots.forEach(dot => {
    const stepNum = parseInt(dot.dataset.step);
    dot.classList.remove('active', 'completed');

    if (stepNum === state.currentStep) {
      dot.classList.add('active');
    } else if (stepNum < state.currentStep) {
      dot.classList.add('completed');
    }
  });

  // Atualiza botões
  elements.btnVoltar.style.display = state.currentStep > 1 ? 'flex' : 'none';
  elements.btnAvancar.style.display = state.currentStep < state.totalSteps ? 'flex' : 'none';
  elements.btnFinalizar.style.display = state.currentStep === state.totalSteps ? 'flex' : 'none';

  updateProgress();
  updateMobileNav();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Atualiza barra de progresso
 */
function updateProgress() {
  const progress = (state.currentStep / state.totalSteps) * 100;
  elements.progressFill.style.width = `${progress}%`;
}

/**
 * Mostra loading
 */
function showLoading() {
  elements.loadingOverlay.classList.add('active');
}

/**
 * Esconde loading
 */
function hideLoading() {
  elements.loadingOverlay.classList.remove('active');
}

/**
 * Mostra modal de sucesso
 */
function showSuccessModal(data) {
  const successInfo = document.getElementById('successInfo');
  const btnAcessarPagina = document.getElementById('btnAcessarPagina');

  successInfo.innerHTML = `
    <p><strong>Sua página:</strong></p>
    <div class="url">${data.urls.pagina_publica}</div>
    <p style="margin-top: 16px;"><strong>Acesso ao Painel:</strong></p>
    <p>Email: ${data.acesso.email}</p>
    <p>Senha: ${data.acesso.senha_temporaria}</p>
    <p style="color: #d97706; font-size: 0.9em; margin-top: 8px;">
      ⚠️ Altere sua senha no primeiro acesso
    </p>
  `;

  btnAcessarPagina.href = data.urls.pagina_publica;

  elements.successModal.classList.add('active');
}

/**
 * Submete o formulário
 */
async function handleSubmit(e) {
  e.preventDefault();

  if (!validarStep(state.currentStep)) {
    return;
  }

  const dados = coletarDados();

  showLoading();

  try {
    const response = await fetch(`${API_URL}/registro/empresa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    const result = await response.json();

    hideLoading();

    if (response.ok && result.success) {
      showSuccessModal(result);
    } else {
      // Mostrar erro
      alert(result.error || 'Erro ao cadastrar empresa. Tente novamente.');

      // Se o erro for de um campo específico, voltar para o step correspondente
      if (result.campo) {
        const campoStepMap = {
          'nome': 1, 'slug': 1, 'email': 1, 'cnpj': 1,
          'chave_pix': 3
        };

        if (campoStepMap[result.campo]) {
          goToStep(campoStepMap[result.campo]);
          const input = document.getElementById(result.campo);
          if (input) {
            input.classList.add('error');
            input.focus();
          }
        }
      }
    }

  } catch (error) {
    hideLoading();
    console.error('Erro ao enviar cadastro:', error);
    alert('Erro de conexão. Verifique sua internet e tente novamente.');
  }
}

/**
 * Inicializa navegação mobile inferior
 */
function initMobileNav() {
  // Criar container da navegação mobile
  const mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-bottom-nav';
  mobileNav.id = 'mobileBottomNav';

  // Ícones SVG para cada etapa
  const stepIcons = [
    // 1. Dados
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>`,
    // 2. Endereço
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>`,
    // 3. PIX
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>`,
    // 4. Visual
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9"/>
      <path d="M12 2v20"/>
    </svg>`,
    // 5. Preços
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`,
    // 6. Horários
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`,
    // 7. Confirmar
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`
  ];

  // Criar itens de navegação
  let navHTML = '';
  for (let i = 1; i <= state.totalSteps; i++) {
    const isActive = i === state.currentStep;
    const isCompleted = i < state.currentStep;
    const label = stepLabels[i - 1];

    navHTML += `
      <div class="mobile-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
           data-step="${i}"
           role="button"
           tabindex="0"
           aria-label="Etapa ${i}: ${label}">
        <div class="nav-icon">
          ${isCompleted ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : stepIcons[i - 1]}
        </div>
        <span class="nav-label">${label}</span>
      </div>
    `;
  }

  mobileNav.innerHTML = navHTML;

  // Adicionar ao body
  document.body.appendChild(mobileNav);

  // Event listeners para navegação
  mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetStep = parseInt(item.dataset.step);
      // Só permite ir para steps anteriores (completados)
      if (targetStep < state.currentStep) {
        goToStep(targetStep);
      }
    });

    // Suporte a teclado
    item.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
}

/**
 * Atualiza navegação mobile quando step muda
 */
function updateMobileNav() {
  const mobileNav = document.getElementById('mobileBottomNav');
  if (!mobileNav) return;

  const stepIcons = [
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9"/>
      <path d="M12 2v20"/>
    </svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`
  ];

  const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;

  mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
    const stepNum = parseInt(item.dataset.step);
    const navIcon = item.querySelector('.nav-icon');

    item.classList.remove('active', 'completed');

    if (stepNum === state.currentStep) {
      item.classList.add('active');
      navIcon.innerHTML = stepIcons[stepNum - 1];
    } else if (stepNum < state.currentStep) {
      item.classList.add('completed');
      navIcon.innerHTML = checkIcon;
    } else {
      navIcon.innerHTML = stepIcons[stepNum - 1];
    }
  });
}
