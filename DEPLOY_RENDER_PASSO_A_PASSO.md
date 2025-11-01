# 🚀 Deploy no Render.com - Guia Passo a Passo com Imagens

## ⚠️ IMPORTANTE - Configuração Correta

O erro que você teve foi porque **não especificou o Root Directory**. O Render tentou buildar na raiz do projeto ao invés de entrar nas pastas `backend` ou `frontend`.

---

## 📋 Pré-requisitos

- ✅ Código no GitHub: https://github.com/helixaibrasil/agendamento
- ✅ Conta no Render.com (gratuita)
- ✅ Credenciais do Mercado Pago (produção)
- ✅ Email SMTP configurado

---

## 🗄️ PASSO 1: Criar Banco de Dados PostgreSQL

### 1.1 Acessar Render.com

1. Acesse: https://dashboard.render.com
2. Faça login ou crie uma conta
3. Clique em **"New +"** (botão azul no canto superior direito)
4. Selecione **"PostgreSQL"**

### 1.2 Configurar o Banco

Preencha o formulário:

```
┌─────────────────────────────────────────────┐
│  Name: agendamentos-db                      │
│  Database: agendamentos                     │
│  User: agendamentos_user                    │
│  Region: Oregon (US West)                   │
│  PostgreSQL Version: 16                     │
│  Datadog API Key: (deixe em branco)         │
│  Plan: Free                                 │
└─────────────────────────────────────────────┘
```

3. Clique em **"Create Database"**
4. **AGUARDE** ~2 minutos (vai aparecer "Creating...")
5. Quando aparecer "Available", clique no banco criado

### 1.3 Copiar a URL de Conexão

Na página do banco, role até encontrar:

```
┌─────────────────────────────────────────────┐
│  Connections                                │
├─────────────────────────────────────────────┤
│  Internal Database URL                      │
│  postgres://agendamentos_user:SENHA@...    │
│  [Copy] [Show]                              │
└─────────────────────────────────────────────┘
```

1. Clique em **"Copy"** ao lado de **"Internal Database URL"**
2. **COLE EM UM BLOCO DE NOTAS** - você vai precisar!

Exemplo da URL (não use esta, use a sua!):
```
postgres://agendamentos_user:abc123xyz@dpg-xxxxx-a.oregon-postgres.render.com/agendamentos
```

---

## 🔧 PASSO 2: Deploy do Backend

### 2.1 Criar Web Service

1. No Dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Clique em **"Connect GitHub"** (primeira vez) ou procure seu repositório
4. Selecione o repositório: **helixaibrasil/agendamento**
5. Clique em **"Connect"**

### 2.2 Configurar o Backend

**ATENÇÃO**: Preencha EXATAMENTE como abaixo:

```
┌──────────────────────────────────────────────────────────┐
│  Name: agendamentos-backend                              │
│  Region: Oregon (US West)                                │
│  Branch: main                                            │
│  Root Directory: backend          ⚠️ IMPORTANTE!         │
│  Runtime: Node                                           │
│  Build Command: npm install && npm run migrate:postgres  │
│  Start Command: npm start                                │
│  Plan: Free                                              │
└──────────────────────────────────────────────────────────┘
```

⚠️ **O MAIS IMPORTANTE**: Na linha **Root Directory**, digite: `backend`

Isso diz ao Render para entrar na pasta backend antes de buildar!

### 2.3 Adicionar Variáveis de Ambiente

Role até a seção **"Environment Variables"** e clique em **"Add Environment Variable"**.

Adicione TODAS estas variáveis (clique "+ Add Environment Variable" para cada):

```env
# Node
NODE_ENV=production

# Database (COLE A URL QUE VOCÊ COPIOU!)
DATABASE_URL=postgres://agendamentos_user:SENHA@dpg-xxxxx.oregon-postgres.render.com/agendamentos

# JWT (GERE UMA CHAVE ALEATÓRIA DE 32+ CARACTERES)
JWT_SECRET=mude_esta_chave_para_algo_muito_seguro_e_aleatorio_123456789

# Email SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_do_gmail

# Business
BUSINESS_NAME=Vistoria Veicular Express
BUSINESS_EMAIL=contato@seudominio.com
BUSINESS_PHONE=(11) 99999-9999
BUSINESS_WHATSAPP=5511999999999

# Frontend URL (AGUARDE - vamos configurar depois)
FRONTEND_URL=https://agendamentos-frontend.onrender.com

# Admin
ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=SuaSenhaSegura123!@#
ADMIN_NAME=Administrador

# Mercado Pago (SUAS CREDENCIAIS DE PRODUÇÃO)
MP_ACCESS_TOKEN=seu_access_token_de_producao_aqui
MP_PUBLIC_KEY=sua_public_key_de_producao_aqui

# Scheduling
MIN_ADVANCE_HOURS=2
MAX_ADVANCE_DAYS=30
SLOT_DURATION_MINUTES=60
WORKING_HOURS_START=08:00
WORKING_HOURS_END=18:00
WORKING_DAYS=1,2,3,4,5,6

# Prices (em centavos - não mude se não souber)
PRICE_CAUTELAR=15000
PRICE_TRANSFERENCIA=12000
PRICE_OUTROS=10000
```

### 2.4 Criar o Backend

1. Confira se **Root Directory = backend** ⚠️
2. Clique em **"Create Web Service"** (botão azul no final)
3. **AGUARDE** ~5-10 minutos (primeira vez demora mais)
4. Você verá os logs em tempo real

### 2.5 Verificar se Funcionou

Quando aparecer "Live" (bolinha verde):

1. Copie a URL que aparece no topo (ex: `https://agendamentos-backend.onrender.com`)
2. Abra em uma nova aba e adicione `/api/health` no final
3. Exemplo: `https://agendamentos-backend.onrender.com/api/health`
4. Deve retornar:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-01T..."
   }
   ```

✅ **Backend funcionando!**

---

## 🎨 PASSO 3: Deploy do Frontend

### 3.1 Criar Static Site

1. No Dashboard do Render, clique em **"New +"**
2. Selecione **"Static Site"**
3. Selecione o repositório: **helixaibrasil/agendamento**
4. Clique em **"Connect"**

### 3.2 Configurar o Frontend

```
┌────────────────────────────────────────────────┐
│  Name: agendamentos-frontend                   │
│  Branch: main                                  │
│  Root Directory: frontend      ⚠️ IMPORTANTE!  │
│  Build Command: npm install && npm run build   │
│  Publish Directory: dist                       │
└────────────────────────────────────────────────┘
```

⚠️ **IMPORTANTE**: Root Directory = `frontend`

### 3.3 Adicionar Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

```env
# Backend URL (USE A URL DO SEU BACKEND!)
VITE_API_URL=https://agendamentos-backend.onrender.com/api

# Mercado Pago Public Key (MESMA DO BACKEND)
VITE_MP_PUBLIC_KEY=sua_public_key_mercadopago
```

⚠️ **Substitua** `agendamentos-backend.onrender.com` pela URL real do seu backend!

### 3.4 Criar o Frontend

1. Confira se **Root Directory = frontend** ⚠️
2. Clique em **"Create Static Site"**
3. **AGUARDE** ~3-5 minutos
4. Quando aparecer "Live", copie a URL

### 3.5 Atualizar FRONTEND_URL no Backend

1. Volte para o serviço do **Backend**
2. Clique em **"Environment"** (menu lateral esquerdo)
3. Encontre a variável `FRONTEND_URL`
4. Clique em **"Edit"**
5. Cole a URL do frontend (ex: `https://agendamentos-frontend.onrender.com`)
6. Clique em **"Save Changes"**
7. O backend vai fazer redeploy automaticamente (~2 min)

---

## 🪝 PASSO 4: Configurar Webhooks do Mercado Pago

### 4.1 Obter URL do Webhook

Sua URL de webhook será:
```
https://agendamentos-backend.onrender.com/api/webhook/mercadopago
```

Substitua `agendamentos-backend` pelo nome do SEU backend!

### 4.2 Configurar no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Clique em **"Suas aplicações"**
3. Selecione sua aplicação (ou crie uma nova)
4. No menu lateral, clique em **"Webhooks"**
5. Clique em **"Configurar webhooks"**

Preencha:
```
┌─────────────────────────────────────────────────┐
│  URL de produção:                               │
│  https://agendamentos-backend.onrender.com/...  │
│  /api/webhook/mercadopago                       │
│                                                 │
│  Eventos:                                       │
│  ☑ Pagamentos                                   │
│  ☐ Planos                                       │
│  ☐ Assinaturas                                  │
│  ☐ Faturas                                      │
│                                                 │
│  Modo: Produção                                 │
└─────────────────────────────────────────────────┘
```

6. Clique em **"Salvar"**

### 4.3 Testar Webhook

1. No painel do Mercado Pago, clique em **"Simular notificação"**
2. Selecione: **Pagamento**
3. Clique em **"Enviar"**
4. No Render, vá nos **Logs** do backend
5. Você deve ver: `📨 Webhook recebido...`

---

## ✅ PASSO 5: Testar Sistema Completo

### 5.1 Acessar o Sistema

Abra a URL do frontend:
```
https://agendamentos-frontend.onrender.com
```

### 5.2 Testar Landing Page

- ✅ Página carrega
- ✅ Vídeo background funciona
- ✅ Botões CTA funcionam
- ✅ WhatsApp flutuante aparece

### 5.3 Testar Agendamento

1. Clique em **"Agendar Agora"**
2. Preencha:
   - Nome, telefone, email, CPF
   - Dados do veículo
   - Selecione data e horário
   - Escolha tipo de vistoria
3. Prossiga para pagamento
4. **Teste com PIX**:
   - Escolha PIX
   - QR Code deve aparecer
   - Use o app do Mercado Pago para pagar (ambiente de teste)
5. Webhook deve atualizar o status automaticamente

### 5.4 Testar Painel Admin

Acesse:
```
https://agendamentos-frontend.onrender.com/admin.html
```

Login:
- Email: (o que você configurou em ADMIN_EMAIL)
- Senha: (o que você configurou em ADMIN_PASSWORD)

Teste:
- ✅ Dashboard carrega com gráficos
- ✅ Menu Clientes mostra clientes
- ✅ Menu Agendamentos lista agendamentos
- ✅ Menu Relatórios funciona
- ✅ Exportação PDF funciona
- ✅ Configurações salvam corretamente

---

## 🐛 Solução de Problemas

### ❌ Erro: "Build failed - Command 'build' not found"

**Causa**: Root Directory não foi especificado

**Solução**:
1. Vá em **Settings** do serviço
2. Procure **"Root Directory"**
3. Digite `backend` (para backend) ou `frontend` (para frontend)
4. Clique em **"Save Changes"**
5. O serviço vai fazer redeploy automaticamente

### ❌ Erro: "Cannot connect to database"

**Causa**: DATABASE_URL incorreta ou banco não criado

**Solução**:
1. Verifique se o PostgreSQL foi criado
2. Copie a URL correta (Internal Database URL)
3. Atualize a variável DATABASE_URL no backend
4. Aguarde redeploy

### ❌ Erro: "CORS policy"

**Causa**: FRONTEND_URL não está configurada ou está errada

**Solução**:
1. No backend, vá em Environment
2. Atualize FRONTEND_URL com a URL correta do frontend
3. Salve e aguarde redeploy

### ❌ Frontend mostra "API Error"

**Causa**: VITE_API_URL está errado

**Solução**:
1. No frontend, vá em Environment
2. Atualize VITE_API_URL:
   ```
   https://SEU-BACKEND.onrender.com/api
   ```
3. Salve e aguarde rebuild

### ❌ Webhooks não funcionam

**Causa**: URL do webhook incorreta no Mercado Pago

**Solução**:
1. Verifique a URL no painel do Mercado Pago
2. Deve ser: `https://SEU-BACKEND.onrender.com/api/webhook/mercadopago`
3. Teste enviando uma notificação simulada
4. Veja os logs do backend no Render

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

1. No Render, clique no serviço (backend ou frontend)
2. Clique em **"Logs"** (menu lateral)
3. Logs aparecem em tempo real
4. Use Ctrl+F para buscar

### Métricas

1. Clique em **"Metrics"** (menu lateral)
2. Veja:
   - CPU usage
   - Memory usage
   - Request count
   - Response time

---

## 💰 Planos e Custos

### Plano Free (Atual)

**PostgreSQL Free**:
- 256 MB RAM
- 1 GB Storage
- ⚠️ Expira após 90 dias
- Recria gratuitamente (mas perde dados)

**Web Service Free**:
- 512 MB RAM
- Dorme após 15 min sem requisições
- Acorda em ~30 segundos
- 750 horas/mês grátis

**Static Site**:
- 100% grátis
- 100 GB bandwidth/mês
- CDN global

### Upgrade para Produção

Se quiser produção profissional:

**PostgreSQL Starter - $7/mês**:
- Nunca expira
- Backups automáticos
- Melhor performance

**Web Service Starter - $7/mês**:
- Sempre ativo (sem sleep)
- Melhor performance
- 400 horas/mês

Total: ~$14/mês (~R$ 70/mês)

---

## 🎯 Checklist Final

Antes de usar em produção:

- [ ] Backend está "Live" e `/api/health` retorna OK
- [ ] Frontend está "Live" e landing page abre
- [ ] Login no admin funciona
- [ ] Agendamentos aparecem no painel
- [ ] Pagamento PIX gera QR Code
- [ ] Pagamento cartão funciona
- [ ] Webhook atualiza status automaticamente
- [ ] Relatórios funcionam
- [ ] Exportação PDF funciona
- [ ] Configurações salvam
- [ ] Emails são enviados
- [ ] Domínio personalizado configurado (opcional)
- [ ] SSL/HTTPS ativo (automático no Render)
- [ ] Backup do banco configurado

---

## 🌐 Configurar Domínio Personalizado (Opcional)

### Frontend

1. No serviço frontend, clique em **"Settings"**
2. Role até **"Custom Domain"**
3. Clique em **"Add Custom Domain"**
4. Digite: `agendamentos.seudominio.com`
5. Siga as instruções para configurar DNS:

No seu provedor de DNS (Cloudflare, GoDaddy, etc.):
```
Type: CNAME
Name: agendamentos
Target: agendamentos-frontend.onrender.com
```

6. Aguarde propagação (~10 min a 48h)
7. Render vai gerar certificado SSL automaticamente

### Backend

Mesmo processo, use:
```
Type: CNAME
Name: api
Target: agendamentos-backend.onrender.com
```

Depois atualize:
- FRONTEND_URL no backend
- VITE_API_URL no frontend
- Webhook URL no Mercado Pago

---

## ✅ Pronto!

Seu sistema está no ar! 🎉

**URLs de Acesso:**
- Frontend: https://agendamentos-frontend.onrender.com
- Backend API: https://agendamentos-backend.onrender.com
- Admin: https://agendamentos-frontend.onrender.com/admin.html

**Documentação:**
- README.md - Visão geral
- DEPLOY_RENDER.md - Guia técnico completo
- Este arquivo - Passo a passo visual

**Próximos passos:**
1. Teste tudo
2. Configure domínio personalizado
3. Faça upgrade para plano pago (produção)
4. Configure backups
5. Monitore logs

---

**Precisa de ajuda?** Consulte os logs do Render ou abra uma issue no GitHub.

🚀 **Boa sorte com seu sistema!**
