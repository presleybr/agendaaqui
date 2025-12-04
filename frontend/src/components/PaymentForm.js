import api from '../services/api.js';

export class PaymentForm {
  constructor(agendamentoData) {
    // Normalizar dados do agendamento para compatibilidade
    this.agendamentoData = this.normalizeData(agendamentoData);
    console.log('💳 PaymentForm data:', this.agendamentoData);
  }

  normalizeData(data) {
    console.log('🔄 Normalizando dados do agendamento:', data);

    // Extrair data e horário de data_hora se necessário
    let dataAgendamento = data.data_agendamento || data.data;
    let horarioAgendamento = data.horario_agendamento || data.horario;

    if (data.data_hora && (!dataAgendamento || !horarioAgendamento)) {
      const dataHora = new Date(data.data_hora);
      dataAgendamento = dataHora.toISOString().split('T')[0];
      horarioAgendamento = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    const normalized = {
      ...data,
      // Campos de data/hora
      data_agendamento: dataAgendamento,
      horario_agendamento: horarioAgendamento,
      // Valor (pode vir como 'valor' ou 'preco')
      preco: data.preco || data.valor || 0,
      // Dados do cliente (podem vir com prefixo 'cliente_')
      cliente_nome: data.cliente_nome || data.nome,
      cliente_email: data.cliente_email || data.email,
      cliente_telefone: data.cliente_telefone || data.telefone,
      cliente_cpf: data.cliente_cpf || data.cpf,
      // Dados do veículo (podem vir com prefixo 'veiculo_')
      veiculo_placa: data.veiculo_placa || data.placa,
      veiculo_marca: data.veiculo_marca || data.marca,
      veiculo_modelo: data.veiculo_modelo || data.modelo
    };

    console.log('✅ Dados normalizados:', normalized);
    return normalized;
  }

  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="payment-container">
        <h2 style="text-align: center; color: var(--brand-primary); margin-bottom: var(--spacing-6);">
          Finalize seu Pagamento
        </h2>

        <div class="payment-summary" style="background: var(--bg-secondary); padding: var(--spacing-6); border-radius: var(--radius-lg); margin-bottom: var(--spacing-8);">
          <h3 style="margin-bottom: var(--spacing-4);">Resumo do Agendamento</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-3);">
            <span><strong>Tipo:</strong></span>
            <span>${this.getTipoVistoriaLabel(this.agendamentoData.tipo_vistoria)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-3);">
            <span><strong>Data:</strong></span>
            <span>${this.formatDate(this.agendamentoData.data_agendamento)} às ${this.agendamentoData.horario_agendamento}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-3);">
            <span><strong>Cliente:</strong></span>
            <span>${this.agendamentoData.cliente_nome}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: var(--spacing-4); border-top: 2px solid var(--border-medium); font-size: var(--text-xl); font-weight: var(--font-bold);">
            <span>Total:</span>
            <span style="color: var(--brand-primary);">R$ ${(this.agendamentoData.preco / 100).toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="payment-methods" style="margin-bottom: var(--spacing-6);">
          <h3 style="margin-bottom: var(--spacing-4); text-align: center;">💰 Pagamento via PIX</h3>
          <p style="text-align: center; color: var(--text-secondary); margin-bottom: var(--spacing-4);">
            Pague de forma rápida e segura usando PIX
          </p>
        </div>

        <!-- PIX Payment -->
        <div id="pixPayment" class="payment-section active">
          <div style="text-align: center; padding: var(--spacing-8); background: var(--bg-secondary); border-radius: var(--radius-lg);">
            <p style="margin-bottom: var(--spacing-6); color: var(--text-secondary);">
              Pague com PIX de forma rápida e segura
            </p>
            <button id="generatePixBtn" class="btn btn-primary btn-large" style="width: 100%; max-width: 400px; margin-bottom: var(--spacing-4);">
              Gerar QR Code PIX
            </button>

            <div style="margin-top: var(--spacing-6); padding-top: var(--spacing-6); border-top: 1px solid var(--border-light);">
              <p style="margin-bottom: var(--spacing-3); color: var(--text-tertiary); font-size: var(--text-sm);">
                🧪 Modo de Teste
              </p>
              <button id="simulatePixApprovedBtn" class="btn btn-secondary" style="width: 100%; max-width: 400px;">
                ✅ Simular Pagamento Aprovado
              </button>
            </div>
          </div>

          <div id="pixQrCode" style="display: none; text-align: center; padding: var(--spacing-8); background: white; border-radius: var(--radius-lg); border: 2px solid var(--brand-primary); margin-top: var(--spacing-6);">
            <h3 style="margin-bottom: var(--spacing-4);">Escaneie o QR Code</h3>
            <div id="qrCodeImage" style="margin: var(--spacing-6) auto;"></div>
            <div style="background: var(--bg-secondary); padding: var(--spacing-4); border-radius: var(--radius-md); margin-top: var(--spacing-4);">
              <p style="font-size: var(--text-sm); color: var(--text-tertiary); margin-bottom: var(--spacing-2);">
                Ou copie o código PIX:
              </p>
              <div style="display: flex; gap: var(--spacing-3); align-items: center;">
                <input type="text" id="pixCode" readonly style="flex: 1; padding: var(--spacing-3); border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-family: monospace; font-size: var(--text-sm);">
                <button id="copyPixBtn" class="btn btn-secondary">Copiar</button>
              </div>
            </div>
            <p style="margin-top: var(--spacing-6); color: var(--text-secondary); font-size: var(--text-sm);">
              ⏱️ Aguardando pagamento...
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: var(--spacing-6);">
          <img src="https://imgmp.mlstatic.com/org-img/banners/br/medios/online/468X60.jpg" alt="Mercado Pago" style="max-width: 100%; height: auto;">
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // PIX payment
    const pixBtn = document.getElementById('generatePixBtn');
    if (pixBtn) {
      pixBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.generatePix();
      });
    }

    // Copy PIX code
    const copyBtn = document.getElementById('copyPixBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.copyPixCode();
      });
    }

    // Simulate PIX approved button
    const simulatePixBtn = document.getElementById('simulatePixApprovedBtn');
    if (simulatePixBtn) {
      simulatePixBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.simulatePaymentApproved();
      });
    }
  }

  simulatePaymentApproved() {
    // Simulate approved payment and go directly to success screen
    console.log('🧪 Simulando pagamento aprovado...');
    this.showPaymentSuccess();
  }

  async generatePix() {
    const btn = document.getElementById('generatePixBtn');
    btn.disabled = true;
    btn.textContent = 'Gerando QR Code...';

    try {
      const response = await api.post('/payment/pix', {
        transaction_amount: this.agendamentoData.preco / 100,
        description: `Vistoria ${this.getTipoVistoriaLabel(this.agendamentoData.tipo_vistoria)} - ${this.agendamentoData.protocolo}`,
        payer_email: this.agendamentoData.cliente_email,
        payer_first_name: this.agendamentoData.cliente_nome.split(' ')[0],
        payer_last_name: this.agendamentoData.cliente_nome.split(' ').slice(1).join(' ') || 'Silva',
        payer_identification_type: 'CPF',
        payer_identification_number: this.agendamentoData.cliente_cpf.replace(/\D/g, ''),
        agendamento_id: this.agendamentoData.id
      });

      console.log('PIX Response:', response);

      if (!response.payment_id || !response.qr_code_base64) {
        throw new Error('Resposta inválida do servidor');
      }

      // Show QR Code
      document.getElementById('pixQrCode').style.display = 'block';
      document.getElementById('qrCodeImage').innerHTML = `
        <img src="data:image/png;base64,${response.qr_code_base64}" alt="QR Code PIX" style="max-width: 300px; width: 100%;">
      `;
      document.getElementById('pixCode').value = response.qr_code;

      btn.style.display = 'none';

      // Start polling for payment status
      this.startPaymentPolling(response.payment_id);

    } catch (error) {
      console.error('Error generating PIX:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao gerar QR Code PIX';
      alert(errorMessage + '\nTente novamente.');
      btn.disabled = false;
      btn.textContent = 'Gerar QR Code PIX';
    }
  }

  copyPixCode() {
    const pixCodeInput = document.getElementById('pixCode');
    pixCodeInput.select();
    document.execCommand('copy');

    const btn = document.getElementById('copyPixBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Copiado!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  }

  async startPaymentPolling(paymentId) {
    console.log('🔄 Starting payment polling for ID:', paymentId);

    const checkPayment = async () => {
      try {
        console.log(`📡 Checking payment status for: ${paymentId}`);
        const response = await api.get(`/payment/status/${paymentId}`);
        console.log('📦 Payment status response:', response);

        if (response.status === 'approved') {
          console.log('✅ Payment approved!');
          this.showPaymentSuccess();
          return true;
        } else if (response.status === 'rejected' || response.status === 'cancelled') {
          console.log('❌ Payment rejected/cancelled:', response.status);
          alert('Pagamento não foi aprovado. Tente novamente.');
          location.reload();
          return true;
        }

        console.log('⏳ Payment still pending:', response.status);
        return false;
      } catch (error) {
        console.error('❌ Error checking payment:', error);

        // Se o pagamento não foi encontrado (404), pode ser que ainda não tenha sido criado no MP
        // ou foi removido. Continuar tentando por algumas vezes antes de desistir
        if (error.response?.status === 404) {
          console.log('⚠️ Payment not found yet, will retry...');
          return false;
        }

        // Para outros erros, também continuar tentando
        return false;
      }
    };

    // Check every 3 seconds for up to 5 minutes
    const maxAttempts = 100;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}`);
      const completed = await checkPayment();

      if (completed) {
        console.log('✅ Payment completed, stopping polling');
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.log('⚠️ Max attempts reached, stopping polling');
        clearInterval(interval);
        alert('Tempo limite excedido. Verifique seu extrato bancário ou tente novamente.');
      }
    }, 3000);
  }

  showPaymentSuccess() {
    const container = document.querySelector('.payment-container');
    container.innerHTML = `
      <div style="text-align: center; padding: var(--spacing-12);">
        <div style="font-size: 64px; margin-bottom: var(--spacing-6);">✅</div>
        <h2 style="color: var(--status-success); margin-bottom: var(--spacing-4);">Pagamento Confirmado!</h2>
        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-8);">
          Seu agendamento foi confirmado e o pagamento foi aprovado.
        </p>

        <!-- Dados do Agendamento -->
        <div style="background: var(--bg-secondary); padding: var(--spacing-6); border-radius: var(--radius-lg); margin-bottom: var(--spacing-6); text-align: left;">
          <h3 style="margin-bottom: var(--spacing-4); text-align: center;">📋 Dados do Agendamento</h3>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Protocolo:</strong>
            <span style="color: var(--brand-primary); font-weight: bold; font-size: var(--text-lg);">${this.agendamentoData.protocolo}</span>
          </div>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Tipo de Vistoria:</strong>
            <span>${this.getTipoVistoriaLabel(this.agendamentoData.tipo_vistoria)}</span>
          </div>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Data e Horário:</strong>
            <span>${this.formatDate(this.agendamentoData.data_agendamento)} às ${this.agendamentoData.horario_agendamento}</span>
          </div>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Valor:</strong>
            <span style="color: var(--status-success); font-weight: bold;">R$ ${(this.agendamentoData.preco / 100).toFixed(2)}</span>
          </div>
        </div>

        <!-- Dados do Cliente -->
        <div style="background: var(--bg-secondary); padding: var(--spacing-6); border-radius: var(--radius-lg); margin-bottom: var(--spacing-6); text-align: left;">
          <h3 style="margin-bottom: var(--spacing-4); text-align: center;">👤 Dados do Cliente</h3>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Nome:</strong>
            <span>${this.agendamentoData.cliente_nome}</span>
          </div>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Email:</strong>
            <span>${this.agendamentoData.cliente_email}</span>
          </div>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Telefone:</strong>
            <span>${this.agendamentoData.cliente_telefone}</span>
          </div>

          ${this.agendamentoData.veiculo_placa ? `
          <div style="margin-top: var(--spacing-4); padding-top: var(--spacing-4); border-top: 1px solid var(--border-light);">
            <h4 style="margin-bottom: var(--spacing-3); font-size: var(--text-base);">🚗 Veículo</h4>
            <div style="margin-bottom: var(--spacing-2);">
              <strong style="color: var(--text-tertiary);">Placa:</strong>
              <span>${this.agendamentoData.veiculo_placa}</span>
            </div>
            ${this.agendamentoData.veiculo_modelo ? `
            <div style="margin-bottom: var(--spacing-2);">
              <strong style="color: var(--text-tertiary);">Modelo:</strong>
              <span>${this.agendamentoData.veiculo_modelo}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}
        </div>

        <!-- Botões de Ação -->
        <div style="display: flex; gap: var(--spacing-3); justify-content: center; flex-wrap: wrap;">
          <a href="https://wa.me/5567999673464?text=Olá! Acabei de realizar o pagamento. Protocolo: ${this.agendamentoData.protocolo}" class="btn btn-success" target="_blank">
            💬 Confirmar pelo WhatsApp
          </a>
          <button onclick="window.print()" class="btn btn-secondary">
            🖨️ Imprimir Comprovante
          </button>
          <button onclick="location.reload()" class="btn btn-secondary">
            🔄 Novo Agendamento
          </button>
        </div>
      </div>
    `;
  }

  showPaymentPending() {
    alert('Pagamento pendente. Aguardando confirmação do banco.');
  }

  getTipoVistoriaLabel(tipo) {
    const labels = {
      'cautelar': 'Vistoria Cautelar',
      'transferencia': 'Vistoria de Transferência',
      'outros': 'Outros Serviços'
    };
    return labels[tipo] || tipo;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  }
}
