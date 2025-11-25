# Sistema de Transferências PIX Automáticas

Este documento explica como funciona o sistema de transferências PIX automáticas para os vendedores (empresas).

## Visão Geral

O sistema realiza o split de pagamento de cada transação:
- **R$ 5,00** para a plataforma (comissão fixa)
- **Valor restante** para a empresa vendedora

As transferências podem ser processadas:
1. **Automaticamente** - via CRON job
2. **Manualmente** - via painel admin

## Como Funciona

### 1. Fluxo de Pagamento

```
Cliente faz pagamento
       ↓
Sistema recebe R$ 100,00
       ↓
Split automático:
  - R$ 5,00 → Plataforma
  - R$ 95,00 → Empresa
       ↓
Registro criado na tabela `pagamento_splits`
  status: 'pendente'
```

### 2. Processamento de Repasses

Os repasses pendentes podem ser processados de 3 formas:

#### A. CRON Job Automático (Recomendado)

Configure um CRON job para chamar o endpoint automaticamente:

```bash
# Processar repasses a cada 1 hora
0 * * * * curl -X POST https://seu-dominio.com/api/repasses/cron \
  -H "x-cron-token: SEU_TOKEN_SECRETO"
```

**Variáveis de Ambiente Necessárias:**
```env
CRON_TOKEN=seu_token_secreto_aqui
MP_ACCESS_TOKEN=seu_access_token_mercado_pago
```

**Serviços de CRON gratuitos:**
- [cron-job.org](https://cron-job.org) - Gratuito, confiável
- [EasyCron](https://www.easycron.com) - Plano gratuito disponível
- GitHub Actions (se usar GitHub)

#### B. Processamento Manual

Via painel admin:
```
POST /api/repasses/processar
Authorization: Bearer {admin-token}
```

Ou processar um repasse específico:
```
POST /api/repasses/processar/:id
Authorization: Bearer {admin-token}
```

#### C. Webhook do Mercado Pago

Processar automaticamente após confirmação de pagamento:
```javascript
// No webhook do Mercado Pago
if (payment.status === 'approved') {
  await PaymentSplitService.processarPagamento(
    payment.id,
    empresaId,
    payment.transaction_amount * 100
  );
}
```

## Endpoints da API

### Listar Repasses Pendentes
```http
GET /api/repasses/pendentes
Authorization: Bearer {super-admin-token}
```

**Resposta:**
```json
{
  "total": 5,
  "repasses": [
    {
      "id": 1,
      "empresa_id": 2,
      "empresa_nome": "Vistoria ABC",
      "chave_pix": "12345678901",
      "valor_total": 10000,
      "valor_empresa": 9500,
      "valor_plataforma": 500,
      "status_repasse": "pendente",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Processar Todos os Repasses
```http
POST /api/repasses/processar
Authorization: Bearer {super-admin-token}
```

**Resposta:**
```json
{
  "mensagem": "Processamento concluído",
  "resultado": {
    "total": 5,
    "processados": 5,
    "sucesso": 4,
    "erros": 1
  }
}
```

### CRON Job Endpoint
```http
POST /api/repasses/cron?token={CRON_TOKEN}
```

ou

```http
POST /api/repasses/cron
Headers:
  x-cron-token: {CRON_TOKEN}
```

### Resumo por Empresa
```http
GET /api/repasses/empresa/:empresaId
Authorization: Bearer {super-admin-token}
```

## Integração com PIX Real

### Status Atual
Por padrão, o sistema está configurado em **modo simulado**. As transferências são registradas mas não executadas.

### Para Ativar Transferências Reais

Escolha uma das opções abaixo:

#### Opção 1: Mercado Pago Split Payment (Recomendado)

1. **Cadastre-se como Marketplace no Mercado Pago**
   - Acesse: https://www.mercadopago.com.br/developers/pt/docs/split-payments
   - Solicite aprovação como Marketplace
   - Aguarde aprovação (3-5 dias úteis)

2. **Configure os Sellers (Empresas)**
   - Cada empresa precisa ter uma conta Mercado Pago
   - Cadastre as empresas como sellers no seu marketplace

3. **Use Advanced Payments com Split**
   ```javascript
   const payment = await mercadopago.advancedPayments.create({
     payments: [{
       payment_method_id: 'pix',
       transaction_amount: 100.00,
       split_payments: [
         {
           amount: 5.00,
           collector: { id: 'PLATFORM_ID' }
         },
         {
           amount: 95.00,
           collector: { id: 'SELLER_ID' }
         }
       ]
     }]
   });
   ```

#### Opção 2: Asaas (API Simples)

1. **Crie conta no Asaas**
   - Site: https://www.asaas.com
   - Planos a partir de R$ 0 (cobram % por transação)

2. **Configure no código**
   ```javascript
   // Em PixTransferService.js
   const asaas = require('asaas');

   async transferirPix(dados) {
     const result = await asaas.transfers.create({
       value: dados.valor / 100,
       pixAddressKey: dados.chave_pix
     });
     return result;
   }
   ```

3. **Variáveis de Ambiente**
   ```env
   ASAAS_API_KEY=sua_api_key_aqui
   ```

#### Opção 3: PagBank (PagSeguro)

Similar ao Mercado Pago, oferece Split Payment:
- Documentação: https://dev.pagbank.uol.com.br

## Monitoramento

### Logs

O sistema gera logs detalhados:
```
💰 Calculando split para empresa 2, valor: R$ 100.00
✅ Split: R$ 5.0 plataforma + R$ 95.0 empresa (Comissão fixa de R$ 5,00)
📝 Registrando split no banco: Pagamento 123
✅ Split registrado e métricas atualizadas

🚀 Iniciando processamento de repasses pendentes...
📌 Processando split #1...
💸 Iniciando transferência PIX
   Para: Vistoria ABC (12345678901)
   Valor: R$ 95.0
   Split ID: 1
✅ Repasse 1 concluído: PIX-1234567890
```

### Métricas por Empresa

Acesse via API:
```http
GET /api/repasses/empresa/:id
```

Retorna:
- Total de agendamentos
- Total de receita
- Total de comissões pagas à plataforma
- Total de repasses realizados
- Dias desde o cadastro

## Segurança

1. **Tokens**
   - Use tokens fortes e diferentes em produção
   - Nunca commite tokens no git

2. **HTTPS**
   - Use sempre HTTPS em produção
   - Certificado SSL/TLS válido

3. **Rate Limiting**
   - Já configurado no servidor
   - Limite de requisições por IP

4. **Validações**
   - Chaves PIX são validadas antes de processar
   - Valores são verificados

## Troubleshooting

### Erro: "MP_ACCESS_TOKEN não configurado"
**Solução:** Configure a variável de ambiente `MP_ACCESS_TOKEN`

### Erro: "Chave PIX inválida"
**Solução:** Verifique o formato da chave PIX no cadastro da empresa

### Repasses não processam automaticamente
**Solução:**
1. Verifique se o CRON job está rodando
2. Confirme que o token está correto
3. Veja os logs do servidor

### Transferências em modo simulado
**Solução:** Configure uma das integrações PIX reais (ver seção acima)

## Próximos Passos

1. [ ] Configurar conta Marketplace no Mercado Pago
2. [ ] Cadastrar empresas como sellers
3. [ ] Configurar CRON job automático
4. [ ] Testar transferências em sandbox
5. [ ] Ativar em produção
6. [ ] Monitorar primeiras transferências

## Suporte

Para dúvidas sobre:
- **Mercado Pago:** https://www.mercadopago.com.br/developers/pt/support
- **Asaas:** suporte@asaas.com
- **PagBank:** https://dev.pagbank.uol.com.br/docs/suporte
