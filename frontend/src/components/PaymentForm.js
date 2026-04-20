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

        <h3 style="margin-bottom: var(--spacing-4); text-align: center;">Pagamento via PIX</h3>

        <!-- PIX Manual (Copia e Cola, chave da empresa) -->
        <div id="pixManualPayment" class="payment-section">
          <div style="text-align: center; padding: var(--spacing-6); background: var(--bg-secondary); border-radius: var(--radius-lg);">
            <p style="margin-bottom: var(--spacing-4); color: var(--text-secondary);">
              Gere o codigo PIX e pague direto na chave da empresa. Depois envie o comprovante aqui.
            </p>
            <button id="generatePixManualBtn" class="btn btn-primary btn-large" style="width: 100%; max-width: 400px;">
              Gerar PIX Copia e Cola
            </button>
          </div>

          <div id="pixManualResult" style="display:none; margin-top: var(--spacing-6); padding: var(--spacing-6); background: white; border-radius: var(--radius-lg); border: 2px solid var(--brand-primary);">
            <h3 style="margin-bottom: var(--spacing-4); text-align: center;">Pague com PIX</h3>
            <div id="pixManualQr" style="text-align:center; margin-bottom: var(--spacing-4);"></div>
            <div style="background: var(--bg-secondary); padding: var(--spacing-4); border-radius: var(--radius-md);">
              <p style="font-size: var(--text-sm); color: var(--text-tertiary); margin-bottom: var(--spacing-2);">
                Codigo PIX (copia e cola):
              </p>
              <div style="display: flex; gap: var(--spacing-3); align-items: center;">
                <input type="text" id="pixManualCode" readonly style="flex: 1; padding: var(--spacing-3); border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-family: monospace; font-size: var(--text-sm);">
                <button id="copyPixManualBtn" class="btn btn-secondary">Copiar</button>
              </div>
            </div>

            <div style="margin-top: var(--spacing-6); padding-top: var(--spacing-4); border-top: 1px solid var(--border-light);">
              <p style="margin-bottom: var(--spacing-3); font-weight: bold;">Ja pagou? Envie o comprovante:</p>
              <input type="file" id="comprovanteInput" accept="image/*,application/pdf" style="width:100%; padding: var(--spacing-3); border: 1px dashed var(--border-medium); border-radius: var(--radius-md); margin-bottom: var(--spacing-3);">
              <button id="uploadComprovanteBtn" class="btn btn-primary" style="width:100%;">
                Enviar Comprovante
              </button>
              <p id="comprovanteStatus" style="margin-top: var(--spacing-3); font-size: var(--text-sm); color: var(--text-tertiary);"></p>
            </div>
          </div>
        </div>

      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const genManualBtn = document.getElementById('generatePixManualBtn');
    if (genManualBtn) {
      genManualBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.generatePixManual();
      });
    }

    const copyManualBtn = document.getElementById('copyPixManualBtn');
    if (copyManualBtn) {
      copyManualBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.getElementById('pixManualCode');
        input.select();
        document.execCommand('copy');
        copyManualBtn.textContent = 'Copiado!';
        setTimeout(() => { copyManualBtn.textContent = 'Copiar'; }, 2000);
      });
    }

    const uploadBtn = document.getElementById('uploadComprovanteBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.uploadComprovante();
      });
    }
  }

  async generatePixManual() {
    const btn = document.getElementById('generatePixManualBtn');
    btn.disabled = true;
    btn.textContent = 'Gerando...';
    try {
      const response = await api.post('/payment/pix-manual/gerar', {
        agendamento_id: this.agendamentoData.id
      });
      this.pixManualPagamentoId = response.pagamento_id;
      document.getElementById('pixManualResult').style.display = 'block';
      document.getElementById('pixManualQr').innerHTML =
        `<img src="${response.qr_code_base64}" alt="QR Code PIX" style="max-width:280px; width:100%;">`;
      document.getElementById('pixManualCode').value = response.br_code;
      btn.style.display = 'none';
    } catch (err) {
      console.error('Erro gerar PIX manual:', err);
      alert((err.response?.data?.error) || err.message || 'Erro ao gerar PIX');
      btn.disabled = false;
      btn.textContent = 'Gerar PIX Copia e Cola';
    }
  }

  async uploadComprovante() {
    const input = document.getElementById('comprovanteInput');
    const statusEl = document.getElementById('comprovanteStatus');
    const btn = document.getElementById('uploadComprovanteBtn');
    if (!input.files || !input.files[0]) {
      alert('Selecione o arquivo do comprovante');
      return;
    }
    if (!this.pixManualPagamentoId) {
      alert('Gere o PIX primeiro');
      return;
    }
    const fd = new FormData();
    fd.append('comprovante', input.files[0]);
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      await api.post(`/payment/pix-manual/${this.pixManualPagamentoId}/comprovante`, fd, {
        headers: { 'Content-Type': undefined }
      });
      this.showComprovanteRecebido();
      return;
    } catch (err) {
      console.error('Erro upload comprovante:', err);
      statusEl.style.color = 'var(--status-error, #dc2626)';
      statusEl.textContent = (err.response?.data?.error) || err.message || 'Erro no envio';
      btn.disabled = false;
      btn.textContent = 'Enviar Comprovante';
    }
  }

  showPaymentPending() {
    alert('Pagamento pendente. Aguardando confirmação do banco.');
  }

  showComprovanteRecebido() {
    const container = document.querySelector('.payment-container');
    container.innerHTML = `
      <div style="text-align: center; padding: var(--spacing-12);">
        <div style="font-size: 64px; margin-bottom: var(--spacing-6);">📩</div>
        <h2 style="color: var(--brand-primary); margin-bottom: var(--spacing-4);">Comprovante recebido!</h2>
        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-8);">
          Seu agendamento está <strong>aguardando confirmação</strong> da empresa.
          Assim que o pagamento for validado, você receberá um contato.
        </p>

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
            <span style="color: var(--brand-primary); font-weight: bold;">R$ ${(this.agendamentoData.preco / 100).toFixed(2)}</span>
          </div>

          <div style="margin-bottom: var(--spacing-3);">
            <strong style="color: var(--text-tertiary);">Status do Pagamento:</strong>
            <span style="color: #d97706; font-weight: bold;">⏳ Aguardando confirmação</span>
          </div>
        </div>

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

        <div style="display: flex; gap: var(--spacing-3); justify-content: center; flex-wrap: wrap;">
          <a href="https://wa.me/5567999673464?text=Olá! Acabei de enviar o comprovante. Protocolo: ${this.agendamentoData.protocolo}" class="btn btn-success" target="_blank">
            💬 Falar pelo WhatsApp
          </a>
          <button id="printReceiptBtn" class="btn btn-secondary">
            🖨️ Imprimir Comprovante
          </button>
          <button onclick="location.reload()" class="btn btn-secondary">
            🔄 Novo Agendamento
          </button>
        </div>
      </div>
    `;

    const printBtn = document.getElementById('printReceiptBtn');
    if (printBtn) {
      printBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.printReceipt();
      });
    }
  }

  async getEmpresa() {
    if (window.empresaData) return window.empresaData;
    const slug = window.empresaSlug || window.location.pathname.split('/').filter(Boolean)[0];
    if (!slug) return null;
    try {
      const data = await api.get(`/empresas/${slug}`);
      window.empresaData = data;
      return data;
    } catch { return null; }
  }

  async printReceipt() {
    const empresa = (await this.getEmpresa()) || {};
    const a = this.agendamentoData;
    const valor = `R$ ${((a.preco || 0) / 100).toFixed(2).replace('.', ',')}`;
    const dataEmissao = new Date().toLocaleString('pt-BR');
    const dataVistoria = `${this.formatDate(a.data_agendamento)} as ${a.horario_agendamento || ''}`;
    const enderecoEmpresa = [empresa.endereco, empresa.numero, empresa.bairro, empresa.cidade && `${empresa.cidade}/${empresa.estado || ''}`, empresa.cep]
      .filter(Boolean).join(', ');
    const veiculo = [a.veiculo_placa, a.veiculo_marca, a.veiculo_modelo].filter(Boolean).join(' - ');
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Comprovante - ${esc(a.protocolo || '')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 32px; background: #fff; font-size: 13px; line-height: 1.5; }
  .receipt { max-width: 720px; margin: 0 auto; border: 1px solid #ddd; padding: 28px 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
  .empresa-nome { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
  .empresa-info { font-size: 12px; color: #333; }
  .doc-title { text-align: right; }
  .doc-title h2 { margin: 0 0 6px; font-size: 16px; }
  .doc-title .proto { font-family: monospace; font-size: 13px; color: #555; }
  .section { margin: 18px 0; }
  .section h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  .row { display: flex; padding: 4px 0; }
  .row .label { flex: 0 0 160px; color: #555; }
  .row .value { flex: 1; color: #111; word-break: break-word; }
  .total { margin-top: 20px; padding: 14px 16px; background: #f5f5f5; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 16px; }
  .total .label { font-weight: 600; }
  .total .value { font-weight: 700; color: #0a7a33; font-size: 18px; }
  .status-pendente { display: inline-block; padding: 4px 10px; background: #fff7ed; color: #b45309; border: 1px solid #fbbf24; border-radius: 4px; font-size: 12px; font-weight: 600; }
  .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #eee; font-size: 11px; color: #777; text-align: center; }
  .noprint { text-align: center; margin-top: 20px; }
  .noprint button { padding: 10px 18px; font-size: 14px; cursor: pointer; border: none; border-radius: 6px; background: #111; color: #fff; }
  @media print { .noprint { display: none; } body { padding: 0; } .receipt { border: none; } }
</style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div>
        <h1 class="empresa-nome">${esc(empresa.razao_social || empresa.nome || 'Empresa')}</h1>
        <div class="empresa-info">
          ${empresa.nome && empresa.razao_social && empresa.nome !== empresa.razao_social ? `Nome fantasia: ${esc(empresa.nome)}<br>` : ''}
          ${empresa.cnpj ? `CNPJ: ${esc(empresa.cnpj)}<br>` : ''}
          ${enderecoEmpresa ? `${esc(enderecoEmpresa)}<br>` : ''}
          ${empresa.telefone ? `Tel: ${esc(empresa.telefone)}` : ''}
          ${empresa.email ? ` · ${esc(empresa.email)}` : ''}
        </div>
      </div>
      <div class="doc-title">
        <h2>Comprovante de Agendamento</h2>
        <div class="proto">Protocolo: ${esc(a.protocolo || '')}</div>
        <div class="proto">Emissao: ${esc(dataEmissao)}</div>
      </div>
    </div>

    <div class="section">
      <h3>Dados do Cliente</h3>
      <div class="row"><div class="label">Nome</div><div class="value">${esc(a.cliente_nome || '')}</div></div>
      ${a.cliente_cpf ? `<div class="row"><div class="label">CPF</div><div class="value">${esc(a.cliente_cpf)}</div></div>` : ''}
      ${a.cliente_email ? `<div class="row"><div class="label">E-mail</div><div class="value">${esc(a.cliente_email)}</div></div>` : ''}
      ${a.cliente_telefone ? `<div class="row"><div class="label">Telefone</div><div class="value">${esc(a.cliente_telefone)}</div></div>` : ''}
    </div>

    <div class="section">
      <h3>Servico Contratado</h3>
      <div class="row"><div class="label">Tipo</div><div class="value">${esc(this.getTipoVistoriaLabel(a.tipo_vistoria))}</div></div>
      <div class="row"><div class="label">Data/Hora</div><div class="value">${esc(dataVistoria)}</div></div>
      ${veiculo ? `<div class="row"><div class="label">Veiculo</div><div class="value">${esc(veiculo)}</div></div>` : ''}
      <div class="row"><div class="label">Status pagamento</div><div class="value"><span class="status-pendente">Aguardando confirmacao</span></div></div>
    </div>

    <div class="total">
      <div class="label">Valor total</div>
      <div class="value">${esc(valor)}</div>
    </div>

    <div class="footer">
      Este documento e um comprovante de agendamento. A confirmacao do pagamento sera validada pela empresa apos verificacao do comprovante PIX enviado.
    </div>

    <div class="noprint">
      <button onclick="window.print()">Imprimir / Salvar em PDF</button>
    </div>
  </div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 300); });<\/script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) {
      alert('Desbloqueie pop-ups para imprimir o comprovante.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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
