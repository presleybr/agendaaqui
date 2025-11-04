# 🚀 Deploy Completo no Render.com

Guia completo e detalhado para fazer deploy do Sistema de Agendamento de Vistorias no Render.com.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Repositório](#preparação-do-repositório)
3. [Criação do Banco PostgreSQL](#criação-do-banco-postgresql)
4. [Deploy do Web Service](#deploy-do-web-service)
5. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
6. [Configuração do Mercado Pago](#configuração-do-mercado-pago)
7. [Verificação do Deploy](#verificação-do-deploy)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

Antes de começar, você precisa ter:

- ✅ Conta no [Render.com](https://render.com) (gratuita)
- ✅ Conta no [GitHub](https://github.com)
- ✅ Conta no [Mercado Pago](https://www.mercadopago.com.br/developers) (para pagamentos)
- ✅ Email Gmail ou outro SMTP para envio de notificações
- ✅ Código do projeto em um repositório GitHub

---

## 📦 Preparação do Repositório

### 1. Subir o código para o GitHub

Se ainda não subiu o código:

```bash
# Adicione as mudanças
git add .

# Faça commit
git commit -m "Preparando deploy para Render.com"

# Adicione o repositório remoto (se ainda não adicionou)
git remote add origin https://github.com/seu-usuario/sistema-agendamento.git

# Faça push
git push -u origin main
```

### 2. Verificar arquivos necessários

Certifique-se que esses arquivos estão no repositório:

- ✅ `build.sh` - Script de build
- ✅ `start.sh` - Script de inicialização
- ✅ `backend/.env.example` - Exemplo de variáveis
- ✅ `frontend/.env.example` - Exemplo de variáveis

---

## 🗄️ Criação do Banco PostgreSQL

### 1. Acessar Dashboard do Render

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** no canto superior direito
3. Selecione **"PostgreSQL"**

### 2. Configurar o Banco de Dados

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `agendamento-db` |
| **Database** | `agendamentos` |
| **User** | (gerado automaticamente) |
| **Region** | Escolha a mais próxima (ex: Oregon) |
| **PostgreSQL Version** | 15 |
| **Instance Type** | Free |

### 3. Criar o Banco

1. Clique em **"Create Database"**
2. Aguarde a criação (leva ~2 minutos)
3. **IMPORTANTE**: Anote as credenciais que aparecem:
   - Internal Database URL
   - External Database URL
   - Username
   - Password

⚠️ **Use sempre a "Internal Database URL"** - ela é mais rápida e não conta para limites de conexão externa.

---

## 🚀 Deploy do Web Service

### 1. Criar Novo Web Service

1. No Dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte sua conta GitHub se ainda não conectou
3. Selecione o repositório `sistema-agendamento`

### 2. Configurações Básicas

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `sistema-agendamento` (ou nome de preferência) |
| **Region** | **MESMA do banco de dados!** |
| **Branch** | `main` |
| **Root Directory** | (deixe em branco) |
| **Runtime** | `Node` |
| **Build Command** | `bash build.sh` |
| **Start Command** | `bash start.sh` |

### 3. Escolher o Plano

| Plano | Características |
|-------|----------------|
| **Free** | • Ideal para testes e baixo tráfego<br>• App "dorme" após 15min inativo<br>• 750h/mês grátis |
| **Starter ($7/mês)** | • Sempre ativo<br>• Melhor performance<br>• Recomendado para produção |

**Recomendação**: Comece com Free para testar, depois upgrade para Starter quando for ao vivo.

### 4. NÃO CLIQUE EM "CREATE" AINDA!

Primeiro, vamos configurar as variáveis de ambiente.

---

## ⚙️ Configuração de Variáveis de Ambiente

### 1. Acessar Configurações de Ambiente

Na página de criação do Web Service:
- Role até **"Environment Variables"**
- Clique em **"Add Environment Variable"**

### 2. Variáveis Obrigatórias

Adicione cada uma dessas variáveis (clique em "Add" após cada):

#### 🔧 Node e Servidor

```bash
NODE_ENV=production
PORT=3000
```

#### 🗄️ Banco de Dados

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

⚠️ **IMPORTANTE**:
- Substitua pela **Internal Database URL** do PostgreSQL que você criou
- Exemplo: `postgresql://agendamento_db_user:xyz123@dpg-abc123.oregon-postgres.render.com/agendamentos`

#### 🔐 Segurança (JWT)

```bash
JWT_SECRET=sua_chave_super_secreta_128_caracteres_minimo_mude_aqui
```

💡 **Como gerar uma chave forte**:
```bash
# No terminal Linux/Mac:
openssl rand -base64 64

# Ou use: https://randomkeygen.com/
```

#### 💳 Mercado Pago

```bash
MP_ACCESS_TOKEN=APP-XXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXX
MP_PUBLIC_KEY=APP_USR-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

📝 **Como obter**:
1. Acesse https://www.mercadopago.com.br/developers/panel/app
2. Se não tem app, clique em "Criar aplicação"
3. Vá em **"Credenciais de produção"** (não teste!)
4. Copie o **Access Token** e **Public Key**

#### 📧 Configuração de Email (Gmail)

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu.email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

📝 **Como configurar Gmail**:
1. Ative verificação em 2 etapas: https://myaccount.google.com/security
2. Gere senha de app: https://myaccount.google.com/apppasswords
3. Escolha "Email" e "Outro (nome personalizado)"
4. Copie a senha gerada (formato: xxxx xxxx xxxx xxxx)
5. Use essa senha em `EMAIL_PASS`

#### 🏢 Informações do Negócio

```bash
BUSINESS_NAME=Vistoria Veicular Express
BUSINESS_EMAIL=contato@suavistoria.com
BUSINESS_PHONE=(11) 99999-9999
BUSINESS_WHATSAPP=5511999999999
```

⚠️ **WHATSAPP**: Formato sem + e sem espaços (ex: 5511999999999)

#### 👤 Usuário Administrador

```bash
ADMIN_EMAIL=admin@suavistoria.com
ADMIN_PASSWORD=SenhaForte123!@#
ADMIN_NAME=Administrador
```

⚠️ **IMPORTANTE**: Altere a senha após primeiro login!

#### 🌐 URLs

```bash
FRONTEND_URL=https://seu-servico.onrender.com
```

⚠️ Você vai atualizar isso depois com a URL real do Render.

#### ⏰ Configurações de Agendamento

```bash
MIN_ADVANCE_HOURS=2
MAX_ADVANCE_DAYS=30
SLOT_DURATION_MINUTES=60
WORKING_HOURS_START=08:00
WORKING_HOURS_END=18:00
WORKING_DAYS=1,2,3,4,5,6
```

📝 **WORKING_DAYS**: 0=Domingo, 1=Segunda, ..., 6=Sábado

#### 💰 Preços (em centavos)

```bash
# Cautelar: R$ 350,00 = 35000 centavos
PRICE_CAUTELAR=35000
# Transferência: R$ 220,00 = 22000 centavos
PRICE_TRANSFERENCIA=22000
# Outros: R$ 100,00 = 10000 centavos
PRICE_OUTROS=10000
```

📝 **Exemplo**: 35000 centavos = R$ 350,00

#### 📊 Meta Pixel (Opcional)

```bash
META_PIXEL_ID=seu_pixel_id_aqui
```

📝 Como obter: https://business.facebook.com/events_manager

#### 🔧 Variável do Vite (Frontend) - OPCIONAL

```bash
VITE_API_URL=/api
```

⚠️ **NOTA**: Esta variável é opcional! O sistema detecta automaticamente:
- Em produção (Render): usa `/api` (caminho relativo)
- Em desenvolvimento: usa `http://localhost:3000/api`
- Se definir `VITE_API_URL`, essa será usada com prioridade

---

## 🎬 Finalizar Deploy

### 1. Criar o Web Service

1. Revise todas as variáveis de ambiente
2. Clique em **"Create Web Service"**
3. Aguarde o build (5-10 minutos)

### 2. Acompanhar o Build

Na tela do serviço:
- Vá na aba **"Logs"**
- Você verá o progresso do build
- Procure por mensagens de sucesso:
  ```
  ✅ Build concluído com sucesso!
  🚀 Servidor rodando na porta 3000
  ```

### 3. Copiar a URL do Serviço

Após deploy bem-sucedido:
1. No topo da página, copie a URL do serviço
   - Exemplo: `https://sistema-agendamento-abc123.onrender.com`
2. **Atualize a variável de ambiente**:
   - Vá em **"Environment"**
   - Edite `FRONTEND_URL` com essa URL
   - Clique em "Save Changes"
   - O serviço vai reiniciar automaticamente

---

## 💳 Configuração do Mercado Pago

### 1. Configurar Webhook

O webhook permite que o Mercado Pago notifique seu sistema quando um pagamento é aprovado.

1. Acesse https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **"Webhooks"**
4. Clique em **"Configurar notificações"**

### 2. URL do Webhook

Configure com sua URL do Render:

```
https://seu-servico.onrender.com/api/webhook/mercadopago
```

⚠️ **IMPORTANTE**: Substitua `seu-servico` pela URL real do Render!

### 3. Eventos

Marque apenas:
- ✅ **Pagamentos** (payments)

Desmarque outros eventos.

### 4. Testar Webhook

1. Clique em "Salvar"
2. Clique em "Testar" para enviar notificação de teste
3. Verifique os logs do Render para confirmar recebimento

---

## ✅ Verificação do Deploy

### 1. Testar Health Check

Abra no navegador:
```
https://seu-servico.onrender.com/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-01-04T...",
  "uptime": 123.45
}
```

### 2. Acessar Landing Page

Abra:
```
https://seu-servico.onrender.com
```

Você deve ver a página de agendamento.

### 3. Acessar Painel Admin

Abra:
```
https://seu-servico.onrender.com/admin.html
```

Faça login com:
- **Email**: O que você configurou em `ADMIN_EMAIL`
- **Senha**: O que você configurou em `ADMIN_PASSWORD`

### 4. Testar Agendamento Completo

1. Acesse a landing page
2. Preencha o formulário
3. Complete até a etapa de pagamento
4. Use cartão de teste (se ainda em homologação):
   ```
   Cartão: 5031 4332 1540 6351
   CVV: 123
   Validade: 11/25
   Nome: APRO
   ```
5. Verifique se o agendamento aparece no painel admin

---

## 🔧 Configurações Pós-Deploy

### 1. Alterar Senha do Admin

1. Acesse `/admin.html`
2. Faça login
3. Vá em "Configurações"
4. Altere a senha

### 2. Configurar Horários

No painel admin:
1. Vá em "Configurações"
2. Ajuste:
   - Horário de funcionamento
   - Dias da semana
   - Duração dos slots
   - Preços

### 3. Testar Envio de Emails

1. Faça um agendamento teste
2. Verifique se o email de confirmação chegou
3. Verifique os logs em caso de erro

---

## 🐛 Troubleshooting

### ❌ Build Failed

**Problema**: Build falha com erro de permissão

**Solução**:
```bash
# No seu repositório local, dê permissão aos scripts:
git update-index --chmod=+x build.sh
git update-index --chmod=+x start.sh
git commit -m "fix: permissões dos scripts"
git push
```

Depois, no Render:
- Vá em "Manual Deploy" → "Clear build cache & deploy"

---

### ❌ Erro de Conexão com Banco

**Problema**: `Error: getaddrinfo ENOTFOUND`

**Soluções**:
1. Verifique se `DATABASE_URL` está correta
2. Certifique-se de usar **Internal Database URL**
3. Confirme que banco e web service estão na **mesma região**
4. Espere 2-3 minutos após criar banco (ele pode estar inicializando)

---

### ❌ Site Lento ou "Dormindo"

**Problema**: Plano Free "dorme" após 15 minutos

**Soluções**:
1. **Upgrade para Starter** ($7/mês) - sempre ativo
2. Ou use um "pinger" gratuito:
   - https://uptimerobot.com (pinga seu site a cada 5 min)
   - Configure para pingar: `https://seu-servico.onrender.com/api/health`

---

### ❌ Webhook não Funciona

**Problema**: Pagamentos não atualizam status

**Diagnóstico**:
1. Teste a URL diretamente:
   ```
   https://seu-servico.onrender.com/api/health
   ```
2. Se funcionar, o problema é no Mercado Pago
3. Verifique os logs do Render:
   - Procure por `POST /api/webhook/mercadopago`
   - Veja se há erros

**Soluções**:
1. Confirme a URL do webhook no painel Mercado Pago
2. Certifique-se que usou credenciais de **PRODUÇÃO**
3. Teste com pagamento real (R$ 0,01 via Pix)

---

### ❌ Emails Não Enviam

**Problema**: Emails não chegam

**Diagnóstico**:
1. Verifique logs do Render: procure por "email" ou "nodemailer"
2. Teste SMTP manualmente

**Soluções Gmail**:
1. Ative verificação em 2 etapas
2. Gere nova senha de app: https://myaccount.google.com/apppasswords
3. Use a senha gerada em `EMAIL_PASS`
4. Formato correto: `xxxx xxxx xxxx xxxx` (com espaços)

**Alternativas ao Gmail**:
- SendGrid (grátis até 100 emails/dia)
- Mailgun (grátis até 5000 emails/mês)
- AWS SES (muito barato)

---

### ❌ Erro 401 no Admin

**Problema**: Login não funciona ou token expira

**Soluções**:
1. Verifique se `JWT_SECRET` está configurado
2. Limpe cache do navegador
3. Tente fazer login novamente
4. Se persistir, verifique logs do Render

---

### ❌ CSS ou JS Não Carregam

**Problema**: Página aparece sem estilo

**Soluções**:
1. Verifique se build do frontend foi executado:
   - Logs devem mostrar "Building frontend..."
2. Force rebuild: "Clear build cache & deploy"
3. Verifique se pasta `frontend/dist` foi criada

---

## 📊 Monitoramento

### Verificar Logs

1. No dashboard do serviço
2. Vá em **"Logs"**
3. Use filtros para buscar erros:
   - `error`
   - `failed`
   - `exception`

### Métricas

1. Vá em **"Metrics"**
2. Monitore:
   - CPU usage
   - Memory usage
   - Response time

### Alertas

Configure alertas de downtime:
1. Use https://uptimerobot.com (grátis)
2. Configure para checar a cada 5 minutos
3. Receba alertas por email/SMS

---

## 💾 Backup

### Backup do Banco de Dados

**Manual**:
1. No dashboard do PostgreSQL
2. Vá em "Backups"
3. Clique em "Create Backup"

**Automático**:
- Render faz backup diário automaticamente (plano Free)
- Retenção de 7 dias no Free, 30 dias no Starter

### Baixar Backup

```bash
# Instale pg_dump localmente
# No Windows: baixe PostgreSQL tools
# No Linux: sudo apt install postgresql-client

# Faça dump do banco
pg_dump -h hostname -U username -d database > backup.sql
```

---

## 🚀 Otimizações

### Performance

1. **Upgrade para Starter**: Sempre ativo, melhor CPU/RAM
2. **Use CDN**: Configure Cloudflare na frente
3. **Otimize imagens**: Comprima imagens da landing page
4. **Cache**: Já implementado no código

### Custos

| Item | Plano Free | Plano Starter |
|------|-----------|---------------|
| Web Service | Grátis (dorme) | $7/mês |
| PostgreSQL | Grátis | $7/mês |
| **Total** | **$0/mês** | **$14/mês** |

---

## 📈 Próximos Passos

Após deploy bem-sucedido:

1. ✅ Configure domínio personalizado
2. ✅ Configure Google Analytics
3. ✅ Configure Meta Pixel para anúncios
4. ✅ Teste completamente o fluxo
5. ✅ Configure backup automático
6. ✅ Configure alertas de monitoramento
7. ✅ Altere senha do admin
8. ✅ Configure WhatsApp Business

---

## 🆘 Suporte

### Documentação Oficial

- **Render**: https://render.com/docs
- **Mercado Pago**: https://www.mercadopago.com.br/developers
- **Node.js**: https://nodejs.org/docs

### Comunidade

- **Render Community**: https://community.render.com
- **Stack Overflow**: Tag `render.com`

---

## ✅ Checklist Final

Antes de ir ao vivo, confirme:

- [ ] Deploy bem-sucedido no Render
- [ ] Health check funcionando
- [ ] Landing page carregando
- [ ] Painel admin acessível
- [ ] Login do admin funcionando
- [ ] Banco de dados conectado
- [ ] Webhook Mercado Pago configurado
- [ ] Teste de pagamento concluído
- [ ] Emails sendo enviados
- [ ] Senha do admin alterada
- [ ] Horários configurados
- [ ] Preços ajustados
- [ ] WhatsApp configurado
- [ ] Backup configurado
- [ ] Monitoramento ativo

---

🎉 **Parabéns! Seu sistema está no ar!**

Agora é só divulgar e começar a receber agendamentos!

---

**Dúvidas?** Consulte este guia ou a documentação oficial do Render.

**Problemas?** Verifique a seção de Troubleshooting acima.
