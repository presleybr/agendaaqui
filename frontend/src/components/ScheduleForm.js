import { scheduleService } from '../services/api.js';
import { validators, formatters, applyMask } from '../utils/validators.js';
import { format, addDays } from 'date-fns';
import { PaymentForm } from './PaymentForm.js';

export class ScheduleForm {
  constructor(containerOrId, options = {}) {
    // Aceita tanto um ID (string) quanto um elemento DOM
    if (typeof containerOrId === 'string') {
      this.container = document.getElementById(containerOrId);
    } else if (containerOrId instanceof HTMLElement) {
      this.container = containerOrId;
    } else {
      console.error('ScheduleForm: container inválido', containerOrId);
      return;
    }

    if (!this.container) {
      console.error('ScheduleForm: container não encontrado');
      return;
    }

    this.currentStep = 1;
    this.formData = {
      cliente: {},
      veiculo: {},
      tipo_vistoria: '',
      data: '',
      horario: '',
      endereco_vistoria: ''
    };
    this.prices = {};
    this.options = options; // { empresaId, precos }
    this.init();
  }

  async init() {
    try {
      console.log('🔄 Initializing schedule form...');

      // Check if a service was pre-selected from pricing table
      const selectedService = sessionStorage.getItem('selectedService');
      if (selectedService) {
        this.formData.tipo_vistoria = selectedService;
        console.log('📌 Pre-selected service:', selectedService);
        sessionStorage.removeItem('selectedService'); // Clear after using
      }

      // Se foi passado empresa_id nas opções, guardar para o agendamento
      if (this.options.empresaId) {
        this.formData.empresa_id = this.options.empresaId;
        console.log('🏢 Empresa ID:', this.options.empresaId);
      }

      // Se foram passados preços nas opções, usar eles (página de empresa)
      if (this.options.precos) {
        this.prices = {
          cautelar: { valor: this.options.precos.cautelar || 15000 },
          transferencia: { valor: this.options.precos.transferencia || 12000 },
          outros: { valor: this.options.precos.outros || 10000 }
        };
        console.log('💰 Using empresa prices:', this.prices);
      } else {
        // Senão, carregar da API (página principal)
        this.prices = await scheduleService.getPrices();
        console.log('✅ Prices loaded from API:', this.prices);
      }

      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('❌ Error initializing form:', error);
      console.error('Error details:', error.response || error.message);

      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';

      this.container.innerHTML = `
        <div class="alert alert-error" style="padding: 20px; background: #fee; border: 2px solid #f00; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #d00; margin-bottom: 10px;">⚠️ Erro ao carregar formulário</h3>
          <p style="margin-bottom: 10px;">Não foi possível conectar ao servidor.</p>
          <p style="font-size: 14px; color: #666;"><strong>Detalhes:</strong> ${errorMessage}</p>
          <p style="margin-top: 15px; font-size: 14px;">
            <strong>Verifique se:</strong><br>
            • O servidor backend está rodando<br>
            • A URL da API está correta<br>
            • Não há problemas de conexão
          </p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px;">
            Tentar Novamente
          </button>
        </div>
      `;
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="form-wizard">
        ${this.renderSteps()}
        <form id="scheduleFormElement" novalidate>
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
          ${this.renderStep5()}
        </form>
      </div>
    `;
  }

  renderSteps() {
    const steps = [
      { num: 1, label: 'Dados Pessoais', shortLabel: 'Pessoais' },
      { num: 2, label: 'Dados do Veículo', shortLabel: 'Veículo' },
      { num: 3, label: 'Data e Horário', shortLabel: 'Horário' },
      { num: 4, label: 'Confirmação', shortLabel: 'Confirmar' },
      { num: 5, label: 'Pagamento', shortLabel: 'Pagar' }
    ];

    const isMobile = window.innerWidth <= 768;

    // Build HTML for each step
    const stepsHtml = steps.map(step => {
      const isActive = step.num === this.currentStep;
      const isCompleted = step.num < this.currentStep;

      // Circle colors
      let circleBg = '#ffffff';
      let circleBorder = '#d1d5db';
      let circleColor = '#6b7280';

      if (isActive) {
        circleBg = '#3B82F6';
        circleBorder = '#3B82F6';
        circleColor = '#ffffff';
      } else if (isCompleted) {
        circleBg = '#22c55e';
        circleBorder = '#22c55e';
        circleColor = '#ffffff';
      }

      const labelColor = isActive ? '#3B82F6' : '#6b7280';
      const labelWeight = isActive ? '600' : '400';
      const displayLabel = isMobile ? step.shortLabel : step.label;

      return `
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; z-index: 1;">
          <div style="
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            border-radius: 50%;
            background-color: ${circleBg};
            border: 2px solid ${circleBorder};
            color: ${circleColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">${isCompleted ? '✓' : step.num}</div>
          <div style="
            margin-top: 8px;
            font-size: ${isMobile ? '9px' : '11px'};
            color: ${labelColor};
            font-weight: ${labelWeight};
            text-align: center;
            white-space: nowrap;
            max-width: 70px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${displayLabel}</div>
        </div>
      `;
    }).join('');

    return `
      <div style="
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
        padding: 16px 8px;
        margin-bottom: 24px;
        position: relative;
        background: #f8fafc;
        border-radius: 12px;
      ">
        <!-- Linha conectora -->
        <div style="
          position: absolute;
          top: 34px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: #e5e7eb;
          z-index: 0;
        "></div>
        ${stepsHtml}
      </div>
    `;
  }

  renderStep1() {
    return `
      <div class="form-step ${this.currentStep === 1 ? 'active' : ''}" data-step="1">
        <h3>Dados Pessoais</h3>
        <div class="form-group">
          <label for="nome">Nome Completo *</label>
          <input type="text" id="nome" name="nome" required value="${this.formData.cliente.nome || ''}">
          <div class="error-message">Nome é obrigatório</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="cpf">CPF *</label>
            <input type="text" id="cpf" name="cpf" required value="${this.formData.cliente.cpf || ''}" data-mask="cpf">
            <div class="error-message">CPF inválido</div>
          </div>

          <div class="form-group">
            <label for="telefone">Telefone *</label>
            <input type="text" id="telefone" name="telefone" required value="${this.formData.cliente.telefone || ''}" data-mask="phone">
            <div class="error-message">Telefone inválido</div>
          </div>
        </div>

        <div class="form-group">
          <label for="email">E-mail *</label>
          <input type="email" id="email" name="email" required value="${this.formData.cliente.email || ''}">
          <div class="error-message">E-mail inválido</div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" disabled>Voltar</button>
          <button type="button" class="btn btn-primary" data-next="1">Próximo</button>
        </div>
      </div>
    `;
  }

  renderStep2() {
    return `
      <div class="form-step ${this.currentStep === 2 ? 'active' : ''}" data-step="2">
        <h3>Dados do Veículo</h3>

        <div class="form-group">
          <label for="tipo_vistoria">Tipo de Vistoria *</label>
          <select id="tipo_vistoria" name="tipo_vistoria" required>
            <option value="">Selecione...</option>
            <option value="cautelar" ${this.formData.tipo_vistoria === 'cautelar' ? 'selected' : ''}>
              Vistoria Cautelar - ${formatters.currency(this.prices.cautelar?.valor || 15000)}
            </option>
            <option value="transferencia" ${this.formData.tipo_vistoria === 'transferencia' ? 'selected' : ''}>
              Vistoria Transferência - ${formatters.currency(this.prices.transferencia?.valor || 12000)}
            </option>
            <option value="outros" ${this.formData.tipo_vistoria === 'outros' ? 'selected' : ''}>
              Outros - ${formatters.currency(this.prices.outros?.valor || 10000)}
            </option>
          </select>
          <div class="error-message">Selecione o tipo de vistoria</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="placa">Placa *</label>
            <input type="text" id="placa" name="placa" required value="${this.formData.veiculo.placa || ''}" data-mask="placa">
            <div class="error-message">Placa inválida</div>
          </div>

          <div class="form-group">
            <label for="ano">Ano *</label>
            <input type="number" id="ano" name="ano" required min="1900" max="${new Date().getFullYear() + 1}" value="${this.formData.veiculo.ano || ''}">
            <div class="error-message">Ano inválido</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="marca">Marca *</label>
            <input type="text" id="marca" name="marca" required value="${this.formData.veiculo.marca || ''}">
            <div class="error-message">Marca é obrigatória</div>
          </div>

          <div class="form-group">
            <label for="modelo">Modelo *</label>
            <input type="text" id="modelo" name="modelo" required value="${this.formData.veiculo.modelo || ''}">
            <div class="error-message">Modelo é obrigatório</div>
          </div>
        </div>

        <div class="form-group">
          <label for="chassi">Chassi (opcional)</label>
          <input type="text" id="chassi" name="chassi" maxlength="17" value="${this.formData.veiculo.chassi || ''}">
        </div>

        <div class="form-group">
          <label for="endereco_vistoria">Endereço para Vistoria (opcional)</label>
          <textarea id="endereco_vistoria" name="endereco_vistoria" rows="2" placeholder="Se desejar vistoria no local">${this.formData.endereco_vistoria || ''}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-prev="2">Voltar</button>
          <button type="button" class="btn btn-primary" data-next="2">Próximo</button>
        </div>
      </div>
    `;
  }

  renderStep3() {
    return `
      <div class="form-step ${this.currentStep === 3 ? 'active' : ''}" data-step="3">
        <h3>Data e Horário</h3>

        <div class="form-group">
          <label for="data">Selecione a Data *</label>
          <input type="date" id="data" name="data" required
                 min="${format(new Date(), 'yyyy-MM-dd')}"
                 max="${format(addDays(new Date(), 30), 'yyyy-MM-dd')}"
                 value="${this.formData.data || ''}">
          <div class="error-message">Selecione uma data</div>
        </div>

        <div class="form-group">
          <label>Horários Disponíveis *</label>
          <div id="timeSlotsContainer">
            <p style="text-align: center; color: #666;">Selecione uma data para ver os horários disponíveis</p>
          </div>
          <div class="error-message">Selecione um horário</div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-prev="3">Voltar</button>
          <button type="button" class="btn btn-primary" data-next="3">Próximo</button>
        </div>
      </div>
    `;
  }

  renderStep4() {
    return `
      <div class="form-step ${this.currentStep === 4 ? 'active' : ''}" data-step="4">
        <h3>Confirmação dos Dados</h3>
        <div id="summaryContent"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-prev="4">Voltar</button>
          <button type="button" class="btn btn-primary btn-large" id="confirmAndPayBtn">Confirmar e Pagar</button>
        </div>
      </div>
    `;
  }

  renderStep5() {
    return `
      <div class="form-step ${this.currentStep === 5 ? 'active' : ''}" data-step="5">
        <div id="paymentContainer"></div>
      </div>
    `;
  }

  attachEventListeners() {
    // Mask inputs
    document.querySelectorAll('[data-mask]').forEach(input => {
      input.addEventListener('input', (e) => {
        applyMask(e.target, e.target.dataset.mask);
      });
    });

    // Next buttons
    document.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = parseInt(e.target.dataset.next);
        if (this.validateStep(step)) {
          this.saveStepData(step);
          this.nextStep();

          // Track with Facebook Pixel
          if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
              content_name: `Step ${step} Completed`,
              content_category: 'Agendamento'
            });
          }
        }
      });
    });

    // Previous buttons
    document.querySelectorAll('[data-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.prevStep();
      });
    });

    // Date change
    const dateInput = document.getElementById('data');
    if (dateInput) {
      dateInput.addEventListener('change', async (e) => {
        await this.loadTimeSlots(e.target.value);
      });
    }

    // Confirm and Pay button
    const confirmPayBtn = document.getElementById('confirmAndPayBtn');
    if (confirmPayBtn) {
      confirmPayBtn.addEventListener('click', async () => {
        await this.createAppointmentAndPay();
      });
    }
  }

  validateStep(step) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    const inputs = stepElement.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      const formGroup = input.closest('.form-group');
      formGroup.classList.remove('error');

      if (!validators.required(input.value)) {
        isValid = false;
        formGroup.classList.add('error');
        return;
      }

      // Specific validations
      if (input.name === 'cpf' && !validators.cpf(input.value)) {
        isValid = false;
        formGroup.classList.add('error');
      }
      if (input.name === 'email' && !validators.email(input.value)) {
        isValid = false;
        formGroup.classList.add('error');
      }
      if (input.name === 'telefone' && !validators.phone(input.value)) {
        isValid = false;
        formGroup.classList.add('error');
      }
      if (input.name === 'placa' && !validators.placa(input.value)) {
        isValid = false;
        formGroup.classList.add('error');
      }
      if (input.name === 'ano' && !validators.ano(input.value)) {
        isValid = false;
        formGroup.classList.add('error');
      }
    });

    // Special validation for step 3 (time slot)
    if (step === 3 && !this.formData.horario) {
      const timeSlotsGroup = document.getElementById('timeSlotsContainer').closest('.form-group');
      timeSlotsGroup.classList.add('error');
      isValid = false;
    }

    return isValid;
  }

  saveStepData(step) {
    if (step === 1) {
      this.formData.cliente = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value
      };
    } else if (step === 2) {
      this.formData.veiculo = {
        placa: document.getElementById('placa').value.toUpperCase(),
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        ano: parseInt(document.getElementById('ano').value),
        chassi: document.getElementById('chassi').value || null
      };
      this.formData.tipo_vistoria = document.getElementById('tipo_vistoria').value;
      this.formData.endereco_vistoria = document.getElementById('endereco_vistoria').value;
    } else if (step === 3) {
      this.formData.data = document.getElementById('data').value;
      // horario already saved when slot is clicked
    }
  }

  async loadTimeSlots(date) {
    const container = document.getElementById('timeSlotsContainer');
    container.innerHTML = '<div class="spinner"></div>';

    try {
      const response = await scheduleService.getAvailableSlots(date);
      console.log('📅 Response from getAvailableSlots:', response);
      console.log('📅 Response type:', typeof response);
      console.log('📅 Is Array?:', Array.isArray(response));

      // Handle both array response and object with slots property
      const slots = Array.isArray(response) ? response : (response.slots || []);
      console.log('📅 Slots after normalization:', slots);

      if (!Array.isArray(slots) || slots.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum horário disponível para esta data</p>';
        return;
      }

      container.innerHTML = `
        <div class="time-slots">
          ${slots.map(slot => `
            <div class="time-slot ${!slot.disponivel ? 'unavailable' : ''} ${this.formData.horario === slot.horario ? 'selected' : ''}"
                 data-time="${slot.horario}"
                 ${!slot.disponivel ? 'title="Indisponível"' : ''}>
              <div>${slot.horario}</div>
              <div class="time-slot-info">${slot.vagasDisponiveis}/${slot.vagasTotal} vagas</div>
            </div>
          `).join('')}
        </div>
      `;

      // Add click listeners to time slots
      container.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
        slot.addEventListener('click', () => {
          container.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
          slot.classList.add('selected');
          this.formData.horario = slot.dataset.time;

          // Remove error if present
          container.closest('.form-group').classList.remove('error');
        });
      });

    } catch (error) {
      console.error('Error loading time slots:', error);
      container.innerHTML = '<p style="text-align: center; color: #dc3545;">Erro ao carregar horários. Tente novamente.</p>';
    }
  }

  nextStep() {
    if (this.currentStep === 3) {
      this.renderSummary();
    }
    this.currentStep++;
    this.render();
    this.attachEventListeners();

    // Scroll to top
    this.container.scrollIntoView({ behavior: 'smooth' });
  }

  prevStep() {
    this.currentStep--;
    this.render();
    this.attachEventListeners();

    // If going back to step 3, reload time slots
    if (this.currentStep === 3 && this.formData.data) {
      this.loadTimeSlots(this.formData.data);
    }

    this.container.scrollIntoView({ behavior: 'smooth' });
  }

  renderSummary() {
    const priceKey = this.formData.tipo_vistoria;
    const price = this.prices[priceKey]?.valor || 0;
    const dataFormatada = new Date(this.formData.data + 'T00:00:00').toLocaleDateString('pt-BR');

    const summaryHtml = `
      <div class="summary-box">
        <h4>Dados Pessoais</h4>
        <p><strong>Nome:</strong> ${this.formData.cliente.nome}</p>
        <p><strong>CPF:</strong> ${this.formData.cliente.cpf}</p>
        <p><strong>Telefone:</strong> ${this.formData.cliente.telefone}</p>
        <p><strong>E-mail:</strong> ${this.formData.cliente.email}</p>
      </div>

      <div class="summary-box">
        <h4>Dados do Veículo</h4>
        <p><strong>Placa:</strong> ${this.formData.veiculo.placa}</p>
        <p><strong>Veículo:</strong> ${this.formData.veiculo.marca} ${this.formData.veiculo.modelo}</p>
        <p><strong>Ano:</strong> ${this.formData.veiculo.ano}</p>
        ${this.formData.veiculo.chassi ? `<p><strong>Chassi:</strong> ${this.formData.veiculo.chassi}</p>` : ''}
      </div>

      <div class="summary-box">
        <h4>Agendamento</h4>
        <p><strong>Tipo:</strong> ${this.formData.tipo_vistoria === 'cautelar' ? 'Vistoria Cautelar' : this.formData.tipo_vistoria === 'transferencia' ? 'Vistoria Transferência' : 'Outros'}</p>
        <p><strong>Data:</strong> ${dataFormatada}</p>
        <p><strong>Horário:</strong> ${this.formData.horario}</p>
        ${this.formData.endereco_vistoria ? `<p><strong>Local:</strong> ${this.formData.endereco_vistoria}</p>` : ''}
      </div>

      <div class="summary-box">
        <div class="summary-item">
          <span>Total a Pagar:</span>
          <span>${formatters.currency(price)}</span>
        </div>
      </div>
    `;

    // This will be inserted when step 4 is rendered
    setTimeout(() => {
      const summaryContent = document.getElementById('summaryContent');
      if (summaryContent) {
        summaryContent.innerHTML = summaryHtml;
      }
    }, 0);
  }

  async createAppointmentAndPay() {
    const confirmPayBtn = document.getElementById('confirmAndPayBtn');
    confirmPayBtn.disabled = true;
    confirmPayBtn.innerHTML = '<div class="spinner" style="margin: 0 auto; width: 20px; height: 20px;"></div>';

    console.log('📋 Form Data being sent:', JSON.stringify(this.formData, null, 2));

    try {
      const result = await scheduleService.createAppointment(this.formData);

      // Track conversion with Facebook Pixel
      if (typeof fbq !== 'undefined') {
        const priceValue = this.prices[this.formData.tipo_vistoria]?.valor || 0;
        fbq('track', 'InitiateCheckout', {
          value: priceValue / 100,
          currency: 'BRL',
          content_name: 'Vistoria Agendada',
          content_category: this.formData.tipo_vistoria
        });
      }

      // Store appointment result
      this.appointmentResult = result;

      // Go to payment step
      this.nextStep();
      await this.showPayment(result);

    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Erro ao criar agendamento. Por favor, tente novamente.');
      confirmPayBtn.disabled = false;
      confirmPayBtn.textContent = 'Confirmar e Pagar';
    }
  }

  async showPayment(appointmentData) {
    const paymentContainer = document.getElementById('paymentContainer');
    if (!paymentContainer) return;

    // Initialize payment form
    const paymentForm = new PaymentForm(appointmentData);
    await paymentForm.render('paymentContainer');
  }

  showSuccess(result) {
    this.container.innerHTML = `
      <div class="success-message">
        <div class="success-icon">✓</div>
        <h2>Agendamento Confirmado!</h2>
        <p>Seu agendamento foi realizado com sucesso.</p>

        <div class="protocolo-box">
          <p>Protocolo de Agendamento:</p>
          <div class="protocolo-number">${result.protocolo}</div>
          <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
            Guarde este número para consultas futuras
          </p>
        </div>

        <div class="alert alert-success">
          📧 Enviamos um e-mail de confirmação para <strong>${result.cliente_email}</strong> com todos os detalhes do agendamento.
        </div>

        <p style="margin-top: 20px;">
          <strong>Data:</strong> ${new Date(result.data + 'T00:00:00').toLocaleDateString('pt-BR')}<br>
          <strong>Horário:</strong> ${result.horario}<br>
          <strong>Veículo:</strong> ${result.veiculo_marca} ${result.veiculo_modelo} - ${result.veiculo_placa}
        </p>

        <div style="margin-top: 30px;">
          <a href="https://wa.me/5567999673464?text=Olá! Acabei de agendar uma vistoria. Protocolo: ${result.protocolo}"
             class="btn btn-success"
             target="_blank">
            Confirmar pelo WhatsApp
          </a>
          <button onclick="location.reload()" class="btn btn-secondary" style="margin-left: 10px;">
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    `;

    this.container.scrollIntoView({ behavior: 'smooth' });
  }
}
