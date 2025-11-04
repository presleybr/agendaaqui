# 💳 Integração Mercado Pago - Guia Completo

## 📋 Visão Geral

O sistema está 100% integrado com a API do Mercado Pago para processamento de pagamentos via:
- **PIX** - Pagamento instantâneo com QR Code
- **Cartão de Crédito** - Pagamento direto (sem redirecionamento)

---

## 🔐 Credenciais Necessárias

### 1. Obter Credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie uma aplicação (se ainda não tiver)
3. Acesse **"Credenciais"**

### 2. Tipos de Credenciais

#### **Teste (Sandbox)**
Para desenvolvimento e testes:
```
Access Token: TEST-XXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXX
Public Key: TEST-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

#### **Produção**
Para ambiente real:
```
Access Token: APP-XXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXX
Public Key: APP_USR-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

---

## ⚙️ Configuração

### Backend (.env ou Render Environment Variables)

```bash
# Mercado Pago - Use credenciais de TESTE ou PRODUÇÃO
MP_ACCESS_TOKEN=TEST-XXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXX
MP_PUBLIC_KEY=TEST-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

### Frontend (.env)

```bash
# Mercado Pago Public Key - Mesma do backend
VITE_MP_PUBLIC_KEY=TEST-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

---

## 🧪 Testando Pagamentos

### 💰 Testar PIX

#### **Credenciais de Teste:**
Use uma conta de teste do Mercado Pago:
- Email: `test_user_XXXXXXXXX@testuser.com`
- CPF: Qualquer CPF válido

#### **Fluxo de Teste:**

1. **Gerar QR Code**
   - Faça um agendamento no sistema
   - Clique em "Gerar QR Code PIX"
   - O sistema retorna QR Code e código Pix Copia e Cola

2. **Simular Pagamento (Sandbox)**
   - **Opção A**: Use o botão "✅ Simular Pagamento Aprovado"
   - **Opção B**: Use a API de teste do MP para aprovar manualmente:
     ```bash
     curl -X PUT \
       https://api.mercadopago.com/v1/payments/{payment_id} \
       -H 'Authorization: Bearer TEST-ACCESS-TOKEN' \
       -H 'Content-Type: application/json' \
       -d '{"status": "approved"}'
     ```

3. **Verificar Confirmação**
   - O webhook recebe notificação
   - Agendamento muda para "Confirmado"
   - Cliente recebe email de confirmação

---

### 💳 Testar Cartão de Crédito

#### **Cartões de Teste**

Use estes cartões que sempre retornam status específicos:

```
✅ APROVADO - Mastercard
Número: 5031 4332 1540 6351
CVV: 123
Validade: 11/25
Nome: APRO (importante!)

✅ APROVADO - Visa
Número: 4235 6477 2802 5682
CVV: 123
Validade: 11/25
Nome: APRO

❌ REJEITADO - Funds Insufficientes
Número: 5031 4332 1540 6351
Nome: OTHE

❌ REJEITADO - Call for Authorize
Número: 5031 4332 1540 6351
Nome: CALL
```

#### **CPF e Email**
- CPF: Qualquer CPF válido
- Email: Qualquer email válido

#### **Fluxo de Teste:**

1. **Preencher Formulário**
   - Número do cartão
   - Data de vencimento (MM/AA)
   - CVV
   - Nome no cartão: **"APRO"** (para aprovar)
   - CPF do titular
   - Email do titular

2. **Processar Pagamento**
   - Clique em "Pagar"
   - SDK do Mercado Pago tokeniza o cartão
   - Backend cria pagamento na API do MP
   - Retorna status imediatamente

3. **Verificar Confirmação**
   - Se aprovado: Agendamento confirmado automaticamente
   - Se rejeitado: Mensagem de erro explicativa

---

## 🔗 Endpoints da API

### **POST** `/api/payment/pix`
Cria pagamento PIX

**Body:**
```json
{
  "transaction_amount": 350.00,
  "description": "Vistoria Cautelar",
  "payer_email": "cliente@email.com",
  "payer_first_name": "João",
  "payer_last_name": "Silva",
  "payer_identification_type": "CPF",
  "payer_identification_number": "12345678900",
  "agendamento_id": 123
}
```

**Response:**
```json
{
  "payment_id": "1234567890",
  "status": "pending",
  "qr_code": "00020126....",
  "qr_code_base64": "iVBORw0KGgo...",
  "ticket_url": "https://www.mercadopago.com.br/..."
}
```

---

### **POST** `/api/payment/card`
Cria pagamento com cartão

**Body:**
```json
{
  "transaction_amount": 350.00,
  "token": "abc123def456",
  "description": "Vistoria Cautelar",
  "installments": 1,
  "payment_method_id": "master",
  "payer_email": "cliente@email.com",
  "payer_first_name": "João",
  "payer_last_name": "Silva",
  "payer_identification_type": "CPF",
  "payer_identification_number": "12345678900",
  "agendamento_id": 123
}
```

**Response:**
```json
{
  "payment_id": "1234567890",
  "status": "approved",
  "status_detail": "accredited",
  "installments": 1,
  "transaction_amount": 350.00
}
```

---

### **GET** `/api/payment/status/:paymentId`
Consulta status de um pagamento

**Response:**
```json
{
  "payment_id": "1234567890",
  "status": "approved",
  "status_detail": "accredited"
}
```

---

### **POST** `/api/webhook/mercadopago`
Webhook para receber notificações do MP

**Body (enviado pelo Mercado Pago):**
```json
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "1234567890"
  }
}
```

---

## 🎯 Configurar Webhook no Mercado Pago

### 1. Acessar Painel

1. Vá em: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Clique em **"Webhooks"**

### 2. Configurar URL

**Produção (Render):**
```
https://agendaaquivistorias.com.br/api/webhook/mercadopago
```

Ou se ainda não configurou domínio:
```
https://sistema-agendamento-xj12.onrender.com/api/webhook/mercadopago
```

**Desenvolvimento Local (com LocalTunnel):**
```bash
# Iniciar com LocalTunnel
npm run dev:tunnel

# URL será algo como:
https://agendamentos-dev.loca.lt/api/webhook/mercadopago
```

### 3. Selecionar Eventos

Marque apenas:
- ✅ **Pagamentos** (payments)

### 4. Testar Webhook

1. Clique em **"Testar"** no painel do MP
2. Verifique os logs do servidor
3. Deve aparecer: `📥 Webhook received`

---

## 🔍 Debug e Troubleshooting

### Logs do Backend

O sistema loga todas as operações:

```
📥 Webhook received: {"type":"payment","action":"payment.updated","data":{"id":"123"}}
💳 Payment status: approved
✅ Payment updated in database
✅ Agendamento confirmed: AGD-2025-001
```

### Problemas Comuns

#### ❌ "Credenciais inválidas"

**Causa**: Access Token incorreto ou expirado

**Solução**:
1. Verifique `MP_ACCESS_TOKEN` no `.env` ou Render
2. Confirme que está usando credenciais corretas (teste ou produção)
3. Regere as credenciais no painel do MP se necessário

---

#### ❌ "Webhook não recebe notificações"

**Causa**: URL incorreta ou servidor inacessível

**Solução**:
1. Teste a URL manualmente: `https://seu-dominio.com/api/health`
2. Verifique se a URL do webhook no MP está correta
3. Em desenvolvimento, use LocalTunnel ou ngrok
4. Certifique-se que a porta está aberta

---

#### ❌ "Payment not found in database"

**Causa**: Pagamento não foi salvo no BD antes do webhook chegar

**Solução**:
1. Verifique se `Pagamento.create()` foi chamado com sucesso
2. Olhe os logs do servidor no momento da criação do pagamento
3. Pode ser race condition - webhook chegou muito rápido

---

#### ❌ "Cartão rejeitado"

**Causa**: Cartão de teste incorreto ou nome errado

**Solução**:
1. Use cartões de teste listados acima
2. Nome do titular deve ser **"APRO"** para aprovar
3. Use **"OTHE"** para testar rejeição
4. Verifique CVV e validade

---

## 📊 Fluxo Completo do Pagamento

### PIX

```
1. Cliente faz agendamento
   ↓
2. Frontend chama POST /api/payment/pix
   ↓
3. Backend cria pagamento no MP
   ↓
4. MP retorna QR Code
   ↓
5. Cliente escaneia QR Code e paga
   ↓
6. MP envia webhook para /api/webhook/mercadopago
   ↓
7. Backend atualiza status do pagamento
   ↓
8. Agendamento confirmado automaticamente
   ↓
9. Cliente recebe email de confirmação
```

### Cartão de Crédito

```
1. Cliente faz agendamento
   ↓
2. Cliente preenche dados do cartão
   ↓
3. SDK do MP tokeniza o cartão (no browser)
   ↓
4. Frontend envia token para POST /api/payment/card
   ↓
5. Backend cria pagamento no MP
   ↓
6. MP processa e retorna status imediatamente
   ↓
7. Se aprovado: Agendamento confirmado na hora
   ↓
8. Cliente recebe email de confirmação
```

---

## 🔒 Segurança

### ✅ Boas Práticas Implementadas

1. **Token do cartão nunca passa pelo backend**
   - SDK do MP tokeniza no browser
   - Backend recebe apenas o token

2. **Validação de webhook**
   - Verifica se pagamento existe no MP
   - Valida dados antes de confirmar agendamento

3. **Logs completos**
   - Todas as operações são logadas
   - Facilita auditoria e debug

4. **Idempotência**
   - Webhooks podem ser recebidos múltiplas vezes
   - Sistema não duplica confirmações

5. **Tratamento de erros**
   - Erros são logados mas não expostos ao cliente
   - Mensagens genéricas para o usuário

---

## 📝 Checklist de Produção

Antes de ir ao vivo:

- [ ] Trocar credenciais de TESTE por PRODUÇÃO
- [ ] Configurar webhook com URL de produção
- [ ] Testar webhook em produção
- [ ] Testar pagamento PIX real (valor baixo)
- [ ] Testar pagamento com cartão real
- [ ] Verificar se emails de confirmação estão chegando
- [ ] Monitorar logs por 24h após lançamento
- [ ] Configurar alertas para erros de pagamento

---

## 🆘 Suporte

**Documentação Oficial:**
- PIX: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/integrate-with-pix
- Cartão: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/web-integration
- Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

**Suporte do Mercado Pago:**
- https://www.mercadopago.com.br/developers/pt/support

---

✅ **Sistema 100% funcional e pronto para produção!**
