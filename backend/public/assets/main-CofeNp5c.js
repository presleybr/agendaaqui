import{t as F,c as N,a as _,s as D,f as E,b as k,d as R,v as h}from"./format-BlW7tm3V.js";function H(i,e){const t=F(i);return isNaN(e)?N(i,NaN):(t.setDate(t.getDate()+e),t)}class z{constructor(e){this.agendamentoData=e,this.mp=null,this.cardForm=null,this.publicKey=void 0,this.sdkReady=!1}async init(){try{typeof MercadoPago>"u"&&(console.log("Aguardando SDK do Mercado Pago..."),await this.waitForMercadoPagoSDK()),console.log("Inicializando Mercado Pago com Public Key:",this.publicKey),this.mp=new MercadoPago(this.publicKey,{locale:"pt-BR"}),this.sdkReady=!0,console.log("Mercado Pago SDK inicializado com sucesso")}catch(e){console.error("Erro ao inicializar Mercado Pago SDK:",e),alert("Erro ao carregar sistema de pagamento. Recarregue a página.")}}async waitForMercadoPagoSDK(){return new Promise((e,t)=>{let o=0;const r=50,a=setInterval(()=>{o++,typeof MercadoPago<"u"?(clearInterval(a),e()):o>=r&&(clearInterval(a),t(new Error("MercadoPago SDK não carregou")))},100)})}async render(e){const t=document.getElementById(e);t&&(this.sdkReady||await this.init(),t.innerHTML=`
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
            <span style="color: var(--brand-primary);">R$ ${(this.agendamentoData.preco/100).toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Method Selection -->
        <div class="payment-methods" style="margin-bottom: var(--spacing-6);">
          <h3 style="margin-bottom: var(--spacing-4);">Escolha a forma de pagamento</h3>
          <div class="payment-method-tabs" style="display: flex; gap: var(--spacing-4); margin-bottom: var(--spacing-6);">
            <button class="payment-tab active" data-method="pix" style="flex: 1; padding: var(--spacing-4); border: 2px solid var(--brand-primary); background: var(--brand-primary); color: white; border-radius: var(--radius-md); cursor: pointer; font-weight: var(--font-semibold); transition: all var(--transition-fast);">
              <span style="font-size: var(--text-lg);">💳</span> PIX
            </button>
            <button class="payment-tab" data-method="card" style="flex: 1; padding: var(--spacing-4); border: 2px solid var(--border-medium); background: white; color: var(--text-primary); border-radius: var(--radius-md); cursor: pointer; font-weight: var(--font-semibold); transition: all var(--transition-fast);">
              <span style="font-size: var(--text-lg);">💳</span> Cartão
            </button>
          </div>
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

        <!-- Card Payment -->
        <div id="cardPayment" class="payment-section" style="display: none;">
          <!-- Auto-fill Test Button -->
          <div style="background: #E3F2FD; border: 2px solid #2196F3; padding: var(--spacing-4); margin-bottom: var(--spacing-6); border-radius: var(--radius-md); text-align: center;">
            <button type="button" id="autoFillTestData" class="btn btn-secondary" style="background: #2196F3; border-color: #2196F3; color: white; padding: var(--spacing-3) var(--spacing-6);">
              🧪 Preencher com Dados de Teste
            </button>
            <p style="margin: var(--spacing-2) 0 0 0; font-size: var(--text-sm); color: #1976D2;">
              Clique para usar cartão de teste do Mercado Pago
            </p>
          </div>

          <form id="cardPaymentForm">
            <div style="margin-bottom: var(--spacing-5);">
              <label style="display: block; margin-bottom: var(--spacing-2); font-weight: var(--font-medium);">
                Número do Cartão *
                <span id="cardNumberHint" style="font-weight: normal; color: #2196F3; font-size: var(--text-sm); display: none;">
                  (Teste: 5031 4332 1540 6351)
                </span>
              </label>
              <div id="form-checkout__cardNumber" class="mp-input" style="min-height: 48px;">
                <div class="mp-loading" style="padding: var(--spacing-3); color: var(--text-tertiary);">Carregando...</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-4); margin-bottom: var(--spacing-5);">
              <div>
                <label style="display: block; margin-bottom: var(--spacing-2); font-weight: var(--font-medium);">
                  Vencimento *
                  <span id="expiryHint" style="font-weight: normal; color: #2196F3; font-size: var(--text-sm); display: none;">
                    (Teste: 11/30)
                  </span>
                </label>
                <div id="form-checkout__expirationDate" class="mp-input" style="min-height: 48px;">
                  <div class="mp-loading" style="padding: var(--spacing-3); color: var(--text-tertiary);">Carregando...</div>
                </div>
              </div>
              <div>
                <label style="display: block; margin-bottom: var(--spacing-2); font-weight: var(--font-medium);">
                  CVV *
                  <span id="cvvHint" style="font-weight: normal; color: #2196F3; font-size: var(--text-sm); display: none;">
                    (Teste: 123)
                  </span>
                </label>
                <div id="form-checkout__securityCode" class="mp-input" style="min-height: 48px;">
                  <div class="mp-loading" style="padding: var(--spacing-3); color: var(--text-tertiary);">Carregando...</div>
                </div>
              </div>
            </div>

            <div style="margin-bottom: var(--spacing-5);">
              <label style="display: block; margin-bottom: var(--spacing-2); font-weight: var(--font-medium);">Nome no Cartão *</label>
              <input type="text" id="form-checkout__cardholderName" class="form-input" style="width: 100%; padding: var(--spacing-3); border: 1px solid var(--border-medium); border-radius: var(--radius-md);" placeholder="Como está escrito no cartão" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-4); margin-bottom: var(--spacing-5);">
              <div>
                <label style="display: block; margin-bottom: var(--spacing-2); font-weight: var(--font-medium);">CPF do Titular *</label>
                <input type="text" id="form-checkout__identificationNumber" class="form-input" style="width: 100%; padding: var(--spacing-3); border: 1px solid var(--border-medium); border-radius: var(--radius-md);" placeholder="000.000.000-00" maxlength="14" required>
              </div>
              <div>
                <label style="display: block; margin-bottom: var(--spacing-2); font-weight: var(--font-medium);">Email do Titular *</label>
                <input type="email" id="form-checkout__cardholderEmail" class="form-input" style="width: 100%; padding: var(--spacing-3); border: 1px solid var(--border-medium); border-radius: var(--radius-md);" placeholder="email@exemplo.com" required>
              </div>
            </div>

            <input type="hidden" id="form-checkout__identificationType" value="CPF">
            <input type="hidden" id="form-checkout__installments" value="1">

            <div id="cardPaymentError" class="alert alert-error" style="display: none; margin-bottom: var(--spacing-5);"></div>

            <button type="submit" id="cardPaymentBtn" class="btn btn-primary btn-large" style="width: 100%; margin-bottom: var(--spacing-4);">
              Pagar à Vista - R$ ${(this.agendamentoData.preco/100).toFixed(2)}
            </button>

            <div style="margin-top: var(--spacing-4); padding-top: var(--spacing-4); border-top: 1px solid var(--border-light); text-align: center;">
              <p style="margin-bottom: var(--spacing-3); color: var(--text-tertiary); font-size: var(--text-sm);">
                🧪 Modo de Teste
              </p>
              <button type="button" id="simulateCardApprovedBtn" class="btn btn-secondary" style="width: 100%;">
                ✅ Simular Pagamento Aprovado
              </button>
            </div>
          </form>
        </div>

        <div style="text-align: center; margin-top: var(--spacing-6);">
          <img src="https://imgmp.mlstatic.com/org-img/banners/br/medios/online/468X60.jpg" alt="Mercado Pago" style="max-width: 100%; height: auto;">
        </div>
      </div>
    `,this.setupEventListeners(),this.setupCardForm())}setupEventListeners(){document.querySelectorAll(".payment-tab").forEach(s=>{s.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation();const p=l.currentTarget.dataset.method;this.switchPaymentMethod(p)})});const e=document.getElementById("generatePixBtn");e&&e.addEventListener("click",s=>{s.preventDefault(),this.generatePix()});const t=document.getElementById("copyPixBtn");t&&t.addEventListener("click",s=>{s.preventDefault(),this.copyPixCode()});const o=document.getElementById("form-checkout__identificationNumber");o&&o.addEventListener("input",s=>{let l=s.target.value.replace(/\D/g,"");l.length>11&&(l=l.slice(0,11)),l.length>9?l=l.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,"$1.$2.$3-$4"):l.length>6?l=l.replace(/(\d{3})(\d{3})(\d{0,3})/,"$1.$2.$3"):l.length>3&&(l=l.replace(/(\d{3})(\d{0,3})/,"$1.$2")),s.target.value=l});const r=document.getElementById("autoFillTestData");r&&r.addEventListener("click",s=>{s.preventDefault(),this.autoFillTestData()});const a=document.getElementById("simulatePixApprovedBtn");a&&a.addEventListener("click",s=>{s.preventDefault(),this.simulatePaymentApproved()});const n=document.getElementById("simulateCardApprovedBtn");n&&n.addEventListener("click",s=>{s.preventDefault(),this.simulatePaymentApproved()})}simulatePaymentApproved(){console.log("🧪 Simulando pagamento aprovado..."),this.showPaymentSuccess()}autoFillTestData(){const e=document.getElementById("form-checkout__cardholderName"),t=document.getElementById("form-checkout__identificationNumber"),o=document.getElementById("form-checkout__cardholderEmail");e&&(e.value="APRO"),t&&(t.value="123.456.789-09"),o&&(o.value="test@test.com");const r=document.getElementById("cardNumberHint"),a=document.getElementById("expiryHint"),n=document.getElementById("cvvHint");r&&(r.style.display="inline"),a&&(a.style.display="inline"),n&&(n.style.display="inline");const s=document.getElementById("autoFillTestData"),l=s.textContent;s.textContent="✅ Dados preenchidos! Preencha o cartão manualmente",s.style.background="#4CAF50",setTimeout(()=>{s.textContent=l,s.style.background="#2196F3"},3e3)}async setupCardForm(){try{if(console.log("Iniciando setup do formulário de cartão..."),!this.mp)throw console.error("MP SDK não inicializado"),new Error("SDK do Mercado Pago não está pronto");this.cardForm=await this.mp.cardForm({amount:(this.agendamentoData.preco/100).toString(),iframe:!0,form:{id:"cardPaymentForm",cardNumber:{id:"form-checkout__cardNumber",placeholder:"0000 0000 0000 0000"},expirationDate:{id:"form-checkout__expirationDate",placeholder:"MM/AA"},securityCode:{id:"form-checkout__securityCode",placeholder:"123"},cardholderName:{id:"form-checkout__cardholderName",placeholder:"Nome como está no cartão"},cardholderEmail:{id:"form-checkout__cardholderEmail",placeholder:"email@exemplo.com"},identificationType:{id:"form-checkout__identificationType"},identificationNumber:{id:"form-checkout__identificationNumber",placeholder:"000.000.000-00"},installments:{id:"form-checkout__installments"}},callbacks:{onFormMounted:e=>{if(e){console.error("Erro ao montar formulário:",e);return}console.log("✅ Formulário de cartão montado com sucesso"),setTimeout(()=>{document.querySelectorAll(".mp-loading").forEach(o=>o.remove())},100)},onSubmit:e=>{e.preventDefault();const t=this.cardForm.getCardFormData();console.log("Card form data before processing:",t),this.processCardPayment(t)}}}),console.log("✅ CardForm criado com sucesso")}catch(e){console.error("❌ Erro ao configurar formulário de cartão:",e),document.querySelectorAll(".mp-loading").forEach(o=>{o.innerHTML='<span style="color: red;">Erro ao carregar formulário. Recarregue a página.</span>'})}}switchPaymentMethod(e){document.querySelectorAll(".payment-tab").forEach(t=>{t.dataset.method===e?(t.classList.add("active"),t.style.background="var(--brand-primary)",t.style.color="white",t.style.borderColor="var(--brand-primary)"):(t.classList.remove("active"),t.style.background="white",t.style.color="var(--text-primary)",t.style.borderColor="var(--border-medium)")}),document.getElementById("pixPayment").style.display=e==="pix"?"block":"none",document.getElementById("cardPayment").style.display=e==="card"?"block":"none"}async generatePix(){var t,o;const e=document.getElementById("generatePixBtn");e.disabled=!0,e.textContent="Gerando QR Code...";try{const r=await _.post("/payment/pix",{transaction_amount:this.agendamentoData.preco/100,description:`Vistoria ${this.getTipoVistoriaLabel(this.agendamentoData.tipo_vistoria)} - ${this.agendamentoData.protocolo}`,payer_email:this.agendamentoData.cliente_email,payer_first_name:this.agendamentoData.cliente_nome.split(" ")[0],payer_last_name:this.agendamentoData.cliente_nome.split(" ").slice(1).join(" ")||"Silva",payer_identification_type:"CPF",payer_identification_number:this.agendamentoData.cliente_cpf.replace(/\D/g,""),agendamento_id:this.agendamentoData.id});if(console.log("PIX Response:",r),!r.payment_id||!r.qr_code_base64)throw new Error("Resposta inválida do servidor");document.getElementById("pixQrCode").style.display="block",document.getElementById("qrCodeImage").innerHTML=`
        <img src="data:image/png;base64,${r.qr_code_base64}" alt="QR Code PIX" style="max-width: 300px; width: 100%;">
      `,document.getElementById("pixCode").value=r.qr_code,e.style.display="none",this.startPaymentPolling(r.payment_id)}catch(r){console.error("Error generating PIX:",r);const a=((o=(t=r.response)==null?void 0:t.data)==null?void 0:o.error)||r.message||"Erro ao gerar QR Code PIX";alert(a+`
Tente novamente.`),e.disabled=!1,e.textContent="Gerar QR Code PIX"}}copyPixCode(){document.getElementById("pixCode").select(),document.execCommand("copy");const t=document.getElementById("copyPixBtn"),o=t.textContent;t.textContent="Copiado!",setTimeout(()=>{t.textContent=o},2e3)}async handleCardPayment(e){e.preventDefault()}async processCardPayment(e){var r,a;const t=document.getElementById("cardPaymentBtn"),o=document.getElementById("cardPaymentError");t.disabled=!0,t.textContent="Processando pagamento...",o.style.display="none";try{console.log("Card form data received:",e);const n=document.getElementById("form-checkout__cardholderEmail").value,s=document.getElementById("form-checkout__identificationNumber").value.replace(/\D/g,""),p=(e.cardholderName||document.getElementById("form-checkout__cardholderName").value).trim().split(" "),b=p[0],x=p.slice(1).join(" ")||"Silva",u={transaction_amount:this.agendamentoData.preco/100,token:e.token,description:`Vistoria ${this.getTipoVistoriaLabel(this.agendamentoData.tipo_vistoria)} - ${this.agendamentoData.protocolo}`,installments:1,payment_method_id:e.payment_method_id,payer_email:n,payer_first_name:b,payer_last_name:x,payer_identification_type:"CPF",payer_identification_number:s,agendamento_id:this.agendamentoData.id};console.log("Sending payment data:",u);const v=await _.post("/payment/card",u);if(console.log("Payment response:",v),v.status==="approved")this.showPaymentSuccess();else if(v.status==="pending")this.showPaymentPending();else throw new Error(v.status_detail||"Pagamento não aprovado")}catch(n){console.error("Error processing card payment:",n);const s=((a=(r=n.response)==null?void 0:r.data)==null?void 0:a.error)||n.message||"Erro ao processar pagamento";o.textContent=`${s}. Verifique os dados do cartão e tente novamente.`,o.style.display="block",t.disabled=!1,t.textContent=`Pagar à Vista - R$ ${(this.agendamentoData.preco/100).toFixed(2)}`}}async startPaymentPolling(e){const t=async()=>{try{const n=await _.get(`/payment/status/${e}`);return n.status==="approved"?(this.showPaymentSuccess(),!0):n.status==="rejected"||n.status==="cancelled"?(alert("Pagamento não foi aprovado. Tente novamente."),location.reload(),!0):!1}catch(n){return console.error("Error checking payment:",n),!1}};let r=0;const a=setInterval(async()=>{r++,(await t()||r>=100)&&clearInterval(a)},3e3)}showPaymentSuccess(){const e=document.querySelector(".payment-container");e.innerHTML=`
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
            <span style="color: var(--status-success); font-weight: bold;">R$ ${(this.agendamentoData.preco/100).toFixed(2)}</span>
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

          ${this.agendamentoData.veiculo_placa?`
          <div style="margin-top: var(--spacing-4); padding-top: var(--spacing-4); border-top: 1px solid var(--border-light);">
            <h4 style="margin-bottom: var(--spacing-3); font-size: var(--text-base);">🚗 Veículo</h4>
            <div style="margin-bottom: var(--spacing-2);">
              <strong style="color: var(--text-tertiary);">Placa:</strong>
              <span>${this.agendamentoData.veiculo_placa}</span>
            </div>
            ${this.agendamentoData.veiculo_modelo?`
            <div style="margin-bottom: var(--spacing-2);">
              <strong style="color: var(--text-tertiary);">Modelo:</strong>
              <span>${this.agendamentoData.veiculo_modelo}</span>
            </div>
            `:""}
          </div>
          `:""}
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
    `}showPaymentPending(){alert("Pagamento pendente. Aguardando confirmação do banco.")}getTipoVistoriaLabel(e){return{cautelar:"Vistoria Cautelar",transferencia:"Vistoria de Transferência",outros:"Outros Serviços"}[e]||e}formatDate(e){return new Date(e+"T00:00:00").toLocaleDateString("pt-BR")}}class O{constructor(e){this.container=document.getElementById(e),this.currentStep=1,this.formData={cliente:{},veiculo:{},tipo_vistoria:"",data:"",horario:"",endereco_vistoria:""},this.prices={},this.init()}async init(){var e,t;try{console.log("🔄 Initializing schedule form...");const o=sessionStorage.getItem("selectedService");o&&(this.formData.tipo_vistoria=o,console.log("📌 Pre-selected service:",o),sessionStorage.removeItem("selectedService")),this.prices=await D.getPrices(),console.log("✅ Prices loaded:",this.prices),this.render(),this.attachEventListeners()}catch(o){console.error("❌ Error initializing form:",o),console.error("Error details:",o.response||o.message);const r=((t=(e=o.response)==null?void 0:e.data)==null?void 0:t.error)||o.message||"Erro desconhecido";this.container.innerHTML=`
        <div class="alert alert-error" style="padding: 20px; background: #fee; border: 2px solid #f00; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #d00; margin-bottom: 10px;">⚠️ Erro ao carregar formulário</h3>
          <p style="margin-bottom: 10px;">Não foi possível conectar ao servidor.</p>
          <p style="font-size: 14px; color: #666;"><strong>Detalhes:</strong> ${r}</p>
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
      `}}render(){this.container.innerHTML=`
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
    `}renderSteps(){return`
      <div class="steps-indicator">
        ${[{num:1,label:"Dados Pessoais"},{num:2,label:"Dados do Veículo"},{num:3,label:"Data e Horário"},{num:4,label:"Confirmação"},{num:5,label:"Pagamento"}].map(t=>`
          <div class="step ${t.num===this.currentStep?"active":""} ${t.num<this.currentStep?"completed":""}">
            <div class="step-number">${t.num}</div>
            <div class="step-label">${t.label}</div>
          </div>
        `).join("")}
      </div>
    `}renderStep1(){return`
      <div class="form-step ${this.currentStep===1?"active":""}" data-step="1">
        <h3>Dados Pessoais</h3>
        <div class="form-group">
          <label for="nome">Nome Completo *</label>
          <input type="text" id="nome" name="nome" required value="${this.formData.cliente.nome||""}">
          <div class="error-message">Nome é obrigatório</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="cpf">CPF *</label>
            <input type="text" id="cpf" name="cpf" required value="${this.formData.cliente.cpf||""}" data-mask="cpf">
            <div class="error-message">CPF inválido</div>
          </div>

          <div class="form-group">
            <label for="telefone">Telefone *</label>
            <input type="text" id="telefone" name="telefone" required value="${this.formData.cliente.telefone||""}" data-mask="phone">
            <div class="error-message">Telefone inválido</div>
          </div>
        </div>

        <div class="form-group">
          <label for="email">E-mail *</label>
          <input type="email" id="email" name="email" required value="${this.formData.cliente.email||""}">
          <div class="error-message">E-mail inválido</div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" disabled>Voltar</button>
          <button type="button" class="btn btn-primary" data-next="1">Próximo</button>
        </div>
      </div>
    `}renderStep2(){var e,t,o;return`
      <div class="form-step ${this.currentStep===2?"active":""}" data-step="2">
        <h3>Dados do Veículo</h3>

        <div class="form-group">
          <label for="tipo_vistoria">Tipo de Vistoria *</label>
          <select id="tipo_vistoria" name="tipo_vistoria" required>
            <option value="">Selecione...</option>
            <option value="cautelar" ${this.formData.tipo_vistoria==="cautelar"?"selected":""}>
              Vistoria Cautelar - ${E.currency(((e=this.prices.cautelar)==null?void 0:e.valor)||15e3)}
            </option>
            <option value="transferencia" ${this.formData.tipo_vistoria==="transferencia"?"selected":""}>
              Vistoria Transferência - ${E.currency(((t=this.prices.transferencia)==null?void 0:t.valor)||12e3)}
            </option>
            <option value="outros" ${this.formData.tipo_vistoria==="outros"?"selected":""}>
              Outros - ${E.currency(((o=this.prices.outros)==null?void 0:o.valor)||1e4)}
            </option>
          </select>
          <div class="error-message">Selecione o tipo de vistoria</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="placa">Placa *</label>
            <input type="text" id="placa" name="placa" required value="${this.formData.veiculo.placa||""}" data-mask="placa">
            <div class="error-message">Placa inválida</div>
          </div>

          <div class="form-group">
            <label for="ano">Ano *</label>
            <input type="number" id="ano" name="ano" required min="1900" max="${new Date().getFullYear()+1}" value="${this.formData.veiculo.ano||""}">
            <div class="error-message">Ano inválido</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="marca">Marca *</label>
            <input type="text" id="marca" name="marca" required value="${this.formData.veiculo.marca||""}">
            <div class="error-message">Marca é obrigatória</div>
          </div>

          <div class="form-group">
            <label for="modelo">Modelo *</label>
            <input type="text" id="modelo" name="modelo" required value="${this.formData.veiculo.modelo||""}">
            <div class="error-message">Modelo é obrigatório</div>
          </div>
        </div>

        <div class="form-group">
          <label for="chassi">Chassi (opcional)</label>
          <input type="text" id="chassi" name="chassi" maxlength="17" value="${this.formData.veiculo.chassi||""}">
        </div>

        <div class="form-group">
          <label for="endereco_vistoria">Endereço para Vistoria (opcional)</label>
          <textarea id="endereco_vistoria" name="endereco_vistoria" rows="2" placeholder="Se desejar vistoria no local">${this.formData.endereco_vistoria||""}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-prev="2">Voltar</button>
          <button type="button" class="btn btn-primary" data-next="2">Próximo</button>
        </div>
      </div>
    `}renderStep3(){return`
      <div class="form-step ${this.currentStep===3?"active":""}" data-step="3">
        <h3>Data e Horário</h3>

        <div class="form-group">
          <label for="data">Selecione a Data *</label>
          <input type="date" id="data" name="data" required
                 min="${k(new Date,"yyyy-MM-dd")}"
                 max="${k(H(new Date,30),"yyyy-MM-dd")}"
                 value="${this.formData.data||""}">
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
    `}renderStep4(){return`
      <div class="form-step ${this.currentStep===4?"active":""}" data-step="4">
        <h3>Confirmação dos Dados</h3>
        <div id="summaryContent"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-prev="4">Voltar</button>
          <button type="button" class="btn btn-primary btn-large" id="confirmAndPayBtn">Confirmar e Pagar</button>
        </div>
      </div>
    `}renderStep5(){return`
      <div class="form-step ${this.currentStep===5?"active":""}" data-step="5">
        <div id="paymentContainer"></div>
      </div>
    `}attachEventListeners(){document.querySelectorAll("[data-mask]").forEach(o=>{o.addEventListener("input",r=>{R(r.target,r.target.dataset.mask)})}),document.querySelectorAll("[data-next]").forEach(o=>{o.addEventListener("click",r=>{const a=parseInt(r.target.dataset.next);this.validateStep(a)&&(this.saveStepData(a),this.nextStep(),typeof fbq<"u"&&fbq("track","Lead",{content_name:`Step ${a} Completed`,content_category:"Agendamento"}))})}),document.querySelectorAll("[data-prev]").forEach(o=>{o.addEventListener("click",()=>{this.prevStep()})});const e=document.getElementById("data");e&&e.addEventListener("change",async o=>{await this.loadTimeSlots(o.target.value)});const t=document.getElementById("confirmAndPayBtn");t&&t.addEventListener("click",async()=>{await this.createAppointmentAndPay()})}validateStep(e){const o=document.querySelector(`[data-step="${e}"]`).querySelectorAll("input[required], select[required]");let r=!0;return o.forEach(a=>{const n=a.closest(".form-group");if(n.classList.remove("error"),!h.required(a.value)){r=!1,n.classList.add("error");return}a.name==="cpf"&&!h.cpf(a.value)&&(r=!1,n.classList.add("error")),a.name==="email"&&!h.email(a.value)&&(r=!1,n.classList.add("error")),a.name==="telefone"&&!h.phone(a.value)&&(r=!1,n.classList.add("error")),a.name==="placa"&&!h.placa(a.value)&&(r=!1,n.classList.add("error")),a.name==="ano"&&!h.ano(a.value)&&(r=!1,n.classList.add("error"))}),e===3&&!this.formData.horario&&(document.getElementById("timeSlotsContainer").closest(".form-group").classList.add("error"),r=!1),r}saveStepData(e){e===1?this.formData.cliente={nome:document.getElementById("nome").value,cpf:document.getElementById("cpf").value,telefone:document.getElementById("telefone").value,email:document.getElementById("email").value}:e===2?(this.formData.veiculo={placa:document.getElementById("placa").value.toUpperCase(),marca:document.getElementById("marca").value,modelo:document.getElementById("modelo").value,ano:parseInt(document.getElementById("ano").value),chassi:document.getElementById("chassi").value||null},this.formData.tipo_vistoria=document.getElementById("tipo_vistoria").value,this.formData.endereco_vistoria=document.getElementById("endereco_vistoria").value):e===3&&(this.formData.data=document.getElementById("data").value)}async loadTimeSlots(e){const t=document.getElementById("timeSlotsContainer");t.innerHTML='<div class="spinner"></div>';try{const o=await D.getAvailableSlots(e);console.log("📅 Response from getAvailableSlots:",o),console.log("📅 Response type:",typeof o),console.log("📅 Is Array?:",Array.isArray(o));const r=Array.isArray(o)?o:o.slots||[];if(console.log("📅 Slots after normalization:",r),!Array.isArray(r)||r.length===0){t.innerHTML='<p style="text-align: center; color: #666;">Nenhum horário disponível para esta data</p>';return}t.innerHTML=`
        <div class="time-slots">
          ${r.map(a=>`
            <div class="time-slot ${a.disponivel?"":"unavailable"} ${this.formData.horario===a.horario?"selected":""}"
                 data-time="${a.horario}"
                 ${a.disponivel?"":'title="Indisponível"'}>
              <div>${a.horario}</div>
              <div class="time-slot-info">${a.vagasDisponiveis}/${a.vagasTotal} vagas</div>
            </div>
          `).join("")}
        </div>
      `,t.querySelectorAll(".time-slot:not(.unavailable)").forEach(a=>{a.addEventListener("click",()=>{t.querySelectorAll(".time-slot").forEach(n=>n.classList.remove("selected")),a.classList.add("selected"),this.formData.horario=a.dataset.time,t.closest(".form-group").classList.remove("error")})})}catch(o){console.error("Error loading time slots:",o),t.innerHTML='<p style="text-align: center; color: #dc3545;">Erro ao carregar horários. Tente novamente.</p>'}}nextStep(){this.currentStep===3&&this.renderSummary(),this.currentStep++,this.render(),this.attachEventListeners(),this.container.scrollIntoView({behavior:"smooth"})}prevStep(){this.currentStep--,this.render(),this.attachEventListeners(),this.currentStep===3&&this.formData.data&&this.loadTimeSlots(this.formData.data),this.container.scrollIntoView({behavior:"smooth"})}renderSummary(){var a;const e=this.formData.tipo_vistoria,t=((a=this.prices[e])==null?void 0:a.valor)||0,o=new Date(this.formData.data+"T00:00:00").toLocaleDateString("pt-BR"),r=`
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
        ${this.formData.veiculo.chassi?`<p><strong>Chassi:</strong> ${this.formData.veiculo.chassi}</p>`:""}
      </div>

      <div class="summary-box">
        <h4>Agendamento</h4>
        <p><strong>Tipo:</strong> ${this.formData.tipo_vistoria==="cautelar"?"Vistoria Cautelar":this.formData.tipo_vistoria==="transferencia"?"Vistoria Transferência":"Outros"}</p>
        <p><strong>Data:</strong> ${o}</p>
        <p><strong>Horário:</strong> ${this.formData.horario}</p>
        ${this.formData.endereco_vistoria?`<p><strong>Local:</strong> ${this.formData.endereco_vistoria}</p>`:""}
      </div>

      <div class="summary-box">
        <div class="summary-item">
          <span>Total a Pagar:</span>
          <span>${E.currency(t)}</span>
        </div>
      </div>
    `;setTimeout(()=>{const n=document.getElementById("summaryContent");n&&(n.innerHTML=r)},0)}async createAppointmentAndPay(){var t;const e=document.getElementById("confirmAndPayBtn");e.disabled=!0,e.innerHTML='<div class="spinner" style="margin: 0 auto; width: 20px; height: 20px;"></div>',console.log("📋 Form Data being sent:",JSON.stringify(this.formData,null,2));try{const o=await D.createAppointment(this.formData);if(typeof fbq<"u"){const r=((t=this.prices[this.formData.tipo_vistoria])==null?void 0:t.valor)||0;fbq("track","InitiateCheckout",{value:r/100,currency:"BRL",content_name:"Vistoria Agendada",content_category:this.formData.tipo_vistoria})}this.appointmentResult=o,this.nextStep(),await this.showPayment(o)}catch(o){console.error("Error creating appointment:",o),alert("Erro ao criar agendamento. Por favor, tente novamente."),e.disabled=!1,e.textContent="Confirmar e Pagar"}}async showPayment(e){if(!document.getElementById("paymentContainer"))return;await new z(e).render("paymentContainer")}showSuccess(e){this.container.innerHTML=`
      <div class="success-message">
        <div class="success-icon">✓</div>
        <h2>Agendamento Confirmado!</h2>
        <p>Seu agendamento foi realizado com sucesso.</p>

        <div class="protocolo-box">
          <p>Protocolo de Agendamento:</p>
          <div class="protocolo-number">${e.protocolo}</div>
          <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
            Guarde este número para consultas futuras
          </p>
        </div>

        <div class="alert alert-success">
          📧 Enviamos um e-mail de confirmação para <strong>${e.cliente_email}</strong> com todos os detalhes do agendamento.
        </div>

        <p style="margin-top: 20px;">
          <strong>Data:</strong> ${new Date(e.data+"T00:00:00").toLocaleDateString("pt-BR")}<br>
          <strong>Horário:</strong> ${e.horario}<br>
          <strong>Veículo:</strong> ${e.veiculo_marca} ${e.veiculo_modelo} - ${e.veiculo_placa}
        </p>

        <div style="margin-top: 30px;">
          <a href="https://wa.me/5567999673464?text=Olá! Acabei de agendar uma vistoria. Protocolo: ${e.protocolo}"
             class="btn btn-success"
             target="_blank">
            Confirmar pelo WhatsApp
          </a>
          <button onclick="location.reload()" class="btn btn-secondary" style="margin-left: 10px;">
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    `,this.container.scrollIntoView({behavior:"smooth"})}}let S,y;function X(){S=new YT.Player("heroVideoPlayer",{videoId:"h00jrLVISGo",playerVars:{autoplay:1,controls:0,showinfo:0,modestbranding:1,loop:1,fs:0,cc_load_policy:0,iv_load_policy:3,autohide:1,mute:1,playsinline:1,rel:0},events:{onReady:j,onStateChange:K}}),y=new YT.Player("bottomVideoPlayer",{videoId:"h00jrLVISGo",playerVars:{autoplay:0,controls:0,showinfo:0,modestbranding:1,loop:1,fs:0,cc_load_policy:0,iv_load_policy:3,autohide:1,mute:1,playsinline:1,rel:0},events:{onReady:G,onStateChange:Y}})}function j(i){i.target.mute(),i.target.playVideo()}function K(i){i.data===YT.PlayerState.ENDED&&(S.seekTo(0),S.playVideo())}function G(i){i.target.mute()}function Y(i){i.data===YT.PlayerState.ENDED&&(y.seekTo(0),y.playVideo())}if(!window.YT){const i=document.createElement("script");i.src="https://www.youtube.com/iframe_api";const e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(i,e)}window.onYouTubeIframeAPIReady=X;document.addEventListener("DOMContentLoaded",async()=>{console.log("🚀 DOM Content Loaded - Initializing app..."),new O("scheduleApp"),await J(),setTimeout(A,100),Q(),U(),W(),document.querySelectorAll('a[href^="#"]').forEach(i=>{i.addEventListener("click",function(e){e.preventDefault();const t=document.querySelector(this.getAttribute("href"));t&&t.scrollIntoView({behavior:"smooth",block:"start"})})}),console.log("✅ App initialization complete")});function A(){const i={root:null,rootMargin:"0px",threshold:.1},e=new IntersectionObserver(t=>{t.forEach(o=>{o.isIntersecting&&o.target.classList.add("active")})},i);document.querySelectorAll(".reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale").forEach(t=>{e.observe(t)}),document.querySelectorAll(".stagger-container").forEach(t=>{t.querySelectorAll(".stagger-item").forEach((r,a)=>{setTimeout(()=>{new IntersectionObserver(s=>{s.forEach(l=>{l.isIntersecting&&l.target.classList.add("active")})},i).observe(r)},a*100)})})}function Q(){const i=document.getElementById("siteHeader"),e=document.getElementById("mobileMenuToggle"),t=document.querySelector(".main-nav");window.addEventListener("scroll",()=>{window.scrollY>10?i.classList.add("scrolled"):i.classList.remove("scrolled")}),e&&e.addEventListener("click",()=>{e.classList.toggle("active"),t.classList.toggle("active")});const o=document.querySelectorAll("section[id]"),r=document.querySelectorAll(".nav-link");window.addEventListener("scroll",()=>{let a="";o.forEach(n=>{const s=n.offsetTop;n.clientHeight,scrollY>=s-200&&(a=n.getAttribute("id"))}),r.forEach(n=>{n.classList.remove("active"),n.getAttribute("href")===`#${a}`&&n.classList.add("active")})})}function W(){const i=document.getElementById("bottomVideoBg"),e=document.getElementById("agendamento");if(!i||!e)return;let t=!1;window.addEventListener("scroll",()=>{const o=e.offsetTop;window.scrollY+window.innerHeight>=o+200?i.classList.contains("visible")||(i.classList.add("visible"),y&&!t&&(y.playVideo(),t=!0)):i.classList.contains("visible")&&(i.classList.remove("visible"),y&&t&&(y.pauseVideo(),t=!1))})}function U(){const i=document.querySelector(".reviews-carousel-track"),e=document.querySelectorAll(".carousel-item"),t=document.querySelector(".carousel-prev"),o=document.querySelector(".carousel-next"),r=document.querySelector(".carousel-dots");if(!i||e.length===0)return;let a=0,n=v(),s=!1,l=0,p=0,b=0,x=0;i.style.userSelect="none",i.style.webkitUserSelect="none",i.style.msUserSelect="none";const u=Math.ceil(e.length/n);for(let d=0;d<u;d++){const c=document.createElement("button");c.classList.add("carousel-dot"),d===0&&c.classList.add("active"),c.addEventListener("click",()=>w(d)),r.appendChild(c)}function v(){return window.innerWidth<=768?1:window.innerWidth<=1024?2:3}function f(d=!0){const c=e[0].offsetWidth,g=parseInt(getComputedStyle(i).gap)||24,m=-(a*n*(c+g));d?i.style.transition="transform 0.3s ease-out":i.style.transition="none",i.style.transform=`translateX(${m}px)`,p=m,b=m,r.querySelectorAll(".carousel-dot").forEach((M,q)=>{M.classList.toggle("active",q===a)}),t.disabled=!1,o.disabled=!1}function w(d){a=d,f()}function B(){a>=u-1?a=0:a++,f()}function V(){a<=0?a=u-1:a--,f()}t.addEventListener("click",V),o.addEventListener("click",B),i.addEventListener("touchstart",$),i.addEventListener("touchend",P),i.addEventListener("touchmove",C),i.addEventListener("mousedown",$),i.addEventListener("mouseup",P),i.addEventListener("mouseleave",P),i.addEventListener("mousemove",C);function $(d){s=!0,l=I(d),x=requestAnimationFrame(L),i.style.cursor="grabbing"}function P(){s=!1,cancelAnimationFrame(x),i.style.cursor="grab";const d=p-b;d<-100&&a<u-1?a++:d>100&&a>0?a--:d<-100&&a>=u-1?a=0:d>100&&a<=0&&(a=u-1),f()}function C(d){if(s){const c=I(d);p=b+c-l}}function I(d){return d.type.includes("mouse")?d.pageX:d.touches[0].clientX}function L(){s&&(i.style.transition="none",i.style.transform=`translateX(${p}px)`,requestAnimationFrame(L))}e.forEach(d=>{d.querySelectorAll("img").forEach(g=>{g.addEventListener("dragstart",m=>m.preventDefault())})});let T;window.addEventListener("resize",()=>{clearTimeout(T),T=setTimeout(()=>{const d=v();if(d!==n){n=d,a=0,r.innerHTML="";const c=Math.ceil(e.length/n);for(let g=0;g<c;g++){const m=document.createElement("button");m.classList.add("carousel-dot"),g===0&&m.classList.add("active"),m.addEventListener("click",()=>w(g)),r.appendChild(m)}f()}},250)}),i.style.cursor="grab",f()}async function J(){try{const i=await D.getPrices(),e=document.getElementById("pricingGrid");if(!e)return;e.innerHTML=`
      <div class="pricing-card featured stagger-item">
        <div class="discount-badge">Mais Popular</div>
        <h3>Vistoria Cautelar</h3>
        <div class="price">${i.cautelar.valorFormatado}</div>
        <div class="price-detail">Proteção completa após a venda</div>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Laudo completo</li>
          <li style="padding: 8px 0;">✓ Validade jurídica</li>
          <li style="padding: 8px 0;">✓ Proteção contra multas</li>
          <li style="padding: 8px 0;">✓ Atendimento em 24h</li>
        </ul>
        <a href="#agendamento" class="btn btn-primary btn-select-service" data-service="cautelar" style="width: 100%;">Agendar</a>
      </div>

      <div class="pricing-card stagger-item">
        <h3>Vistoria Transferência</h3>
        <div class="price">${i.transferencia.valorFormatado}</div>
        <div class="price-detail">Para transferência de propriedade</div>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Laudo técnico</li>
          <li style="padding: 8px 0;">✓ Documentação completa</li>
          <li style="padding: 8px 0;">✓ Reconhecido DETRAN</li>
          <li style="padding: 8px 0;">✓ Processo rápido</li>
        </ul>
        <a href="#agendamento" class="btn btn-secondary btn-select-service" data-service="transferencia" style="width: 100%;">Agendar</a>
      </div>

      <div class="pricing-card stagger-item">
        <h3>Outros Serviços</h3>
        <div class="price">A partir de ${i.outros.valorFormatado}</div>
        <div class="price-detail">Consulte-nos para outros tipos</div>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Pré Cautelar</li>
          <li style="padding: 8px 0;">✓ Vistoria periódica</li>
          <li style="padding: 8px 0;">✓ Laudo para seguro</li>
          <li style="padding: 8px 0;">✓ Outros laudos</li>
        </ul>
        <a href="#agendamento" class="btn btn-secondary btn-select-service" data-service="outros" style="width: 100%;">Agendar</a>
      </div>
    `,setTimeout(()=>{document.querySelectorAll(".btn-select-service").forEach(t=>{t.addEventListener("click",o=>{o.preventDefault();const r=t.dataset.service;sessionStorage.setItem("selectedService",r);const a=document.getElementById("tipo_vistoria");a&&(a.value=r,a.dispatchEvent(new Event("change",{bubbles:!0})));const n=document.getElementById("agendamento");n&&n.scrollIntoView({behavior:"smooth",block:"start"})})})},150),setTimeout(A,100)}catch(i){console.error("Error loading pricing:",i)}}
