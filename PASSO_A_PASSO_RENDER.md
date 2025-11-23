# 🚀 GUIA COMPLETO DE DEPLOY NO RENDER.COM

## 1️⃣ CRIAR NOVO WEB SERVICE

1. Acesse https://render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: `presleybr/agendaaqui`
4. Configure:
   - **Name**: `agendaaqui-backend` (ou o nome que preferir)
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)` ou mais próximo do Brasil
   - **Branch**: `main`
   - **Root Directory**: deixe vazio (ou `backend` se preferir)

---

## 2️⃣ CONFIGURAR COMANDOS

### Build Command:
```bash
cd backend && npm install && node src/setup.js
```

### Start Command:
```bash
cd backend && node src/server.js
```

---

## 3️⃣ CRIAR BANCO DE DADOS POSTGRESQL

1. No menu do Render, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `agendaaqui-db`
   - **Database**: `agendamentos_9udt`
   - **User**: será criado automaticamente
   - **Region**: mesma do Web Service
   - **Plan**: Free (para começar)
3. Clique em **"Create Database"**

4. Após criar, **copie a "Internal Database URL"**:
   ```
   postgresql://agendamentos_9udt_user:izmIfyl9S6WJhLCdyqT52j6idIMm44yM@dpg-d451beq4d50c73esktm0-a/agendamentos_9udt
   ```

---

## 4️⃣ ADICIONAR VARIÁVEIS DE AMBIENTE

No seu Web Service, vá em **"Environment"** e adicione:

```bash
# ============ DATABASE ============
DATABASE_URL=postgresql://agendamentos_9udt_user:izmIfyl9S6WJhLCdyqT52j6idIMm44yM@dpg-d451beq4d50c73esktm0-a/agendamentos_9udt

# ============ AMBIENTE ============
NODE_ENV=production

# ============ ADMIN ============
JWT_SECRET_ADMIN=1657victOr@@_
ADMIN_EMAIL=automacoesvon@gmail.com
ADMIN_PASSWORD=1657victOr@
ADMIN_NAME=Victor

# ============ MERCADO PAGO ============
MP_ACCESS_TOKEN=TEST-727307920606410-110100-b65a7008e2bd0221e134d9b2ec1abc9a-17728094
MP_PUBLIC_KEY=TEST-62c37382-077f-4b94-80c7-cd027cce815a

# ============ FRONTEND ============
FRONTEND_URL=https://agendaaquivistorias.com.br
```

### Como adicionar:

**Opção 1: Uma por uma (mais fácil)**
- Clique em "Add Environment Variable"
- Key: `DATABASE_URL`
- Value: `postgresql://...`
- Repita para todas

**Opção 2: Múltiplas de uma vez**
- Clique em "Add from .env"
- Cole todo o conteúdo acima
- Clique em "Add Variables"

---

## 5️⃣ CONFIGURAR DOMÍNIO PERSONALIZADO

1. No Web Service, vá em **"Settings"** → **"Custom Domain"**
2. Adicione: `agendaaquivistorias.com.br`
3. O Render vai te dar um registro CNAME para adicionar no seu DNS:
   ```
   CNAME @ agendaaqui-backend.onrender.com
   ```
4. Adicione também o wildcard para subdomínios:
   ```
   CNAME * agendaaqui-backend.onrender.com
   ```

### No seu provedor de DNS (GoDaddy, Cloudflare, etc):
```
Tipo: CNAME
Nome: @
Valor: agendaaqui-backend.onrender.com

Tipo: CNAME
Nome: *
Valor: agendaaqui-backend.onrender.com
```

---

## 6️⃣ FAZER O DEPLOY

1. Clique em **"Create Web Service"**
2. O Render vai:
   - Clonar seu repositório
   - Instalar dependências (`npm install`)
   - Executar setup (`node src/setup.js`)
   - Criar tabelas no PostgreSQL
   - Criar usuário admin
   - Iniciar servidor

3. **Acompanhe os logs** e procure por:
   ```
   🚀 Iniciando setup do sistema multi-tenant...
   📦 Executando migrations...
   ✅ Migrations executadas com sucesso!

   📝 CREDENCIAIS DO ADMIN:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Email: automacoesvon@gmail.com
      Senha: 1657victOr@
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🚀 Servidor rodando na porta 10000
   ```

---

## 7️⃣ CONFIGURAR WEBHOOK DO MERCADO PAGO

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação de teste
3. Vá em **"Webhooks"**
4. Clique em **"Configurar notificações"**
5. Adicione a URL:
   ```
   https://agendaaquivistorias.com.br/api/webhook/mercadopago
   ```
6. Selecione os eventos:
   - ✅ **Pagamentos** (payment)
7. Clique em **"Salvar"**

---

## 8️⃣ TESTAR O SISTEMA

### 1. Testar API Health Check
```bash
curl https://agendaaquivistorias.com.br/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T...",
  "uptime": 123.456
}
```

### 2. Fazer Login no Admin
```bash
curl -X POST https://agendaaquivistorias.com.br/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "automacoesvon@gmail.com",
    "senha": "1657victOr@"
  }'
```

Deve retornar:
```json
{
  "token": "eyJhbGc...",
  "admin": {
    "id": 1,
    "nome": "Victor",
    "email": "automacoesvon@gmail.com",
    "role": "super_admin"
  }
}
```

### 3. Criar Primeira Empresa
```bash
curl -X POST https://agendaaquivistorias.com.br/api/admin/empresas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Vistoria Express",
    "slug": "vistoriaexpress",
    "email": "contato@vistoriaexpress.com",
    "telefone": "(67) 99999-9999",
    "pix_key": "contato@vistoriaexpress.com",
    "pix_type": "email",
    "razao_social": "Vistoria Express LTDA",
    "cnpj": "12.345.678/0001-90"
  }'
```

### 4. Acessar Subdomínio da Empresa
```
https://vistoriaexpress.agendaaquivistorias.com.br
```

---

## 9️⃣ MONITORAR LOGS

No Render, vá em **"Logs"** para ver:

- ✅ Requisições recebidas
- ✅ Webhooks do Mercado Pago
- ✅ Splits de pagamento processados
- ✅ Erros e warnings

Quando um pagamento for aprovado, você verá:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 SPLIT DE PAGAMENTO REALIZADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Pagamento: #1 (MP: 45678)
   Valor Total: R$ 350.00
   Taxa Sistema: R$ 5.00
   Valor Empresa: R$ 345.00
   Empresa: Vistoria Express
   PIX: contato@vistoriaexpress.com
   Transação Repasse: #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔟 TROUBLESHOOTING

### Erro: "Cannot find module"
- Verifique se o Build Command está correto
- Certifique-se que está executando `npm install`

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Confirme que o PostgreSQL foi criado
- Use a **Internal URL**, não a External

### Erro: "Unauthorized" ao fazer login
- Verifique se o setup rodou com sucesso
- Confira as credenciais no `.env`
- Veja os logs do build

### Webhook não está funcionando
- Verifique se a URL está correta no Mercado Pago
- Confirme que selecionou o evento "payment"
- Veja os logs no Render quando fizer um teste de pagamento

---

## ✅ CHECKLIST FINAL

- [ ] PostgreSQL criado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] Build e Start commands configurados
- [ ] Deploy realizado com sucesso
- [ ] Migrations executadas (verificar logs)
- [ ] Usuário admin criado (verificar logs)
- [ ] Domínio personalizado configurado
- [ ] DNS configurado com CNAME
- [ ] Webhook configurado no Mercado Pago
- [ ] Teste de login funcionando
- [ ] Primeira empresa criada
- [ ] Teste de pagamento realizado

---

## 📞 SUPORTE

Se tiver problemas:
1. Verifique os logs no Render
2. Teste as APIs com curl ou Postman
3. Verifique se todas as variáveis de ambiente estão corretas
4. Confirme que o webhook está configurado no Mercado Pago

---

## 🎉 PRONTO!

Seu sistema multi-tenant está no ar e funcionando!

**Próximos passos:**
1. Cadastre suas empresas
2. Configure os PIX de cada empresa
3. Teste pagamentos
4. Monitore os splits nos logs
5. Acompanhe as transações no painel admin

**URLs importantes:**
- Site principal: `https://agendaaquivistorias.com.br`
- API: `https://agendaaquivistorias.com.br/api`
- Webhook: `https://agendaaquivistorias.com.br/api/webhook/mercadopago`
- Health check: `https://agendaaquivistorias.com.br/api/health`
