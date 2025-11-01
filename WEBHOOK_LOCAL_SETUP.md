# 🔗 Configuração do Webhook Local - Guia Completo

## 📋 O que é o Webhook e Por Que Preciso?

O webhook do Mercado Pago é essencial para que o sistema seja notificado **automaticamente** quando um pagamento é aprovado, recusado ou tem qualquer mudança de status.

**Sem webhook configurado:**
- ❌ Você precisa atualizar manualmente o status dos agendamentos
- ❌ Clientes não recebem confirmação automática
- ❌ Sistema não atualiza em tempo real

**Com webhook configurado:**
- ✅ Status atualizado automaticamente
- ✅ E-mails de confirmação enviados
- ✅ Cliente vê atualização em tempo real
- ✅ Tudo funciona perfeitamente!

---

## 🎯 Objetivo Deste Guia

Configurar um **subdomínio fixo** no LocalTunnel para que a URL do webhook **não mude** toda vez que você reiniciar o servidor. Isso permite configurar uma única vez no Mercado Pago e esquecer!

---

## ⚙️ PASSO 1: Configurar Subdomínio Fixo no Backend

### 1.1 Abrir arquivo .env

Navegue até: `backend/.env`

Se o arquivo não existir, copie de: `backend/.env.example`

### 1.2 Localizar Seção LocalTunnel

Procure pelas linhas:

```env
# LocalTunnel Configuration (for webhooks in development)
ENABLE_TUNNEL=true
TUNNEL_SUBDOMAIN=agendamentos-dev
```

### 1.3 Personalizar Subdomínio

**IMPORTANTE:** Escolha um subdomínio único e memorável!

```env
# ✅ RECOMENDADO: Use seu nome ou da empresa
TUNNEL_SUBDOMAIN=agendamentos-dev-joao
TUNNEL_SUBDOMAIN=agendamentos-vistoria-express
TUNNEL_SUBDOMAIN=agendamentos-helix

# ❌ EVITE subdomínios muito comuns (podem estar ocupados)
TUNNEL_SUBDOMAIN=test
TUNNEL_SUBDOMAIN=localhost
TUNNEL_SUBDOMAIN=api
```

**Dica:** Use letras minúsculas, números e hífens. Sem espaços, acentos ou caracteres especiais.

### 1.4 Certificar que o Tunnel está Habilitado

```env
ENABLE_TUNNEL=true
```

Se estiver `false`, mude para `true`.

---

## 🚀 PASSO 2: Iniciar o Sistema

### 2.1 Executar start-dev.bat

Na raiz do projeto, execute:

```bash
start-dev.bat
```

Ou manualmente:

```bash
# Backend (em um terminal)
cd backend
npm run dev:tunnel

# Frontend (em outro terminal)
cd frontend
npm run dev
```

### 2.2 Verificar URL do Tunnel

Na janela do **Backend**, você verá algo como:

```
🌐 LocalTunnel iniciado com sucesso!
📡 URL pública: https://agendamentos-dev-joao.loca.lt
⚠️  Configure esta URL no Mercado Pago como webhook!

🔗 URL do Webhook:
   https://agendamentos-dev-joao.loca.lt/api/webhook/mercadopago
```

**COPIE** essa URL completa do webhook! Você vai precisar dela no próximo passo.

### 2.3 Primeira Vez? Clique no Link

Se for a primeira vez usando este subdomínio:

1. Abra a URL do tunnel no navegador (ex: `https://agendamentos-dev-joao.loca.lt`)
2. Clique em **"Click to Continue"**
3. Pronto! Agora está liberado.

**Obs:** Você só precisa fazer isso uma vez por subdomínio.

---

## 💳 PASSO 3: Configurar no Mercado Pago

### 3.1 Acessar Painel de Desenvolvedores

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login com sua conta Mercado Pago

### 3.2 Selecionar sua Aplicação

1. Clique em **"Suas aplicações"** no menu lateral
2. Selecione a aplicação que você criou (ou crie uma nova)
3. Se não tiver aplicação, clique em **"Criar aplicação"**:
   - Nome: "Sistema de Agendamentos"
   - Tipo: Pagamentos online
   - Modelo de negócio: Marketplace ou E-commerce

### 3.3 Configurar Webhooks

1. No menu lateral da aplicação, clique em **"Webhooks"**
2. Clique em **"Configurar notificações"** ou **"Adicionar URL"**

Preencha o formulário:

```
┌─────────────────────────────────────────────────────────────┐
│  URL de notificação (webhook):                              │
│  https://agendamentos-dev-joao.loca.lt/api/webhook/...      │
│  .../mercadopago                                            │
│                                                             │
│  Eventos a notificar:                                       │
│  ☑ Pagamentos                     ⬅️ MARQUE ESTE!          │
│  ☐ Planos de assinatura                                    │
│  ☐ Assinaturas                                              │
│  ☐ Faturas                                                  │
│  ☐ Reembolsos                                               │
│                                                             │
│  Modo: Produção                                             │
└─────────────────────────────────────────────────────────────┘
```

**IMPORTANTE:**
- ✅ Cole a URL **COMPLETA** que você copiou do terminal
- ✅ Marque **APENAS** o evento "Pagamentos"
- ✅ Deixe no modo **Produção** (ou Teste, se estiver testando)

4. Clique em **"Salvar"**

### 3.4 Testar Webhook (Opcional mas Recomendado)

Ainda na tela de Webhooks:

1. Procure por **"Simular notificação"** ou **"Testar webhook"**
2. Selecione: **Pagamento**
3. Clique em **"Enviar teste"**

Volte para a janela do **Backend** no terminal. Você deve ver:

```
📨 Webhook recebido do Mercado Pago
📝 Tipo: payment
🆔 ID: 123456789
✅ Processado com sucesso!
```

Se aparecer isso, **está funcionando perfeitamente!** ✅

---

## 🔍 PASSO 4: Testar na Prática

### 4.1 Criar Agendamento de Teste

1. Abra: http://localhost:5173
2. Clique em **"Agendar Agora"**
3. Preencha os dados:
   - Use CPF de teste: `123.456.789-00`
   - Email de teste: `teste@email.com`
4. Selecione data, horário e tipo de vistoria
5. Prossiga para pagamento

### 4.2 Fazer Pagamento PIX (Teste)

1. Escolha **PIX**
2. QR Code será exibido
3. Use o **app do Mercado Pago** em modo teste
4. Escaneie o QR Code
5. Confirme o pagamento

### 4.3 Verificar Atualização Automática

**No terminal do Backend**, você verá:

```
📨 Webhook recebido: payment.updated
🔄 Status do pagamento: approved
✅ Agendamento VST-2025-001 atualizado para: confirmado
📧 E-mail de confirmação enviado para teste@email.com
```

**No painel admin** (http://localhost:5173/admin):

1. Faça login
2. Vá em **Agendamentos**
3. O agendamento aparece com status **"Confirmado"** ✅
4. Automaticamente, sem você fazer nada!

---

## ✅ Checklist de Verificação

Antes de considerar tudo configurado, verifique:

- [ ] `.env` tem `ENABLE_TUNNEL=true`
- [ ] `.env` tem `TUNNEL_SUBDOMAIN=seu-subdominio-fixo`
- [ ] Servidor backend iniciado e mostrando URL do tunnel
- [ ] URL do tunnel abre no navegador (após clicar "Continue")
- [ ] Webhook configurado no painel do Mercado Pago
- [ ] Teste de webhook enviado e recebido no terminal
- [ ] Pagamento de teste realizado com sucesso
- [ ] Status atualizado automaticamente no admin
- [ ] E-mail de confirmação enviado

---

## 🐛 Solução de Problemas

### ❌ Erro: "Subdomain already in use"

**Causa:** Alguém já está usando este subdomínio.

**Solução:**
1. Escolha outro subdomínio mais único
2. Exemplo: adicione números ou sua empresa
   - `agendamentos-dev-123`
   - `vistoria-express-webhook`
3. Atualize no `.env` e reinicie o backend

### ❌ Webhook não está chegando no backend

**Causa 1:** URL não configurada corretamente no Mercado Pago

**Solução:**
1. Verifique se a URL no painel MP está **exatamente igual** à URL do terminal
2. Certifique-se de que termina com `/api/webhook/mercadopago`

**Causa 2:** Backend não está rodando

**Solução:**
1. Verifique se o backend está rodando (`npm run dev:tunnel`)
2. Verifique se não há erros no terminal

**Causa 3:** Firewall ou antivírus bloqueando

**Solução:**
1. Temporariamente, desabilite o firewall/antivírus
2. Teste novamente
3. Se funcionar, adicione exceção para Node.js

### ❌ Tunnel URL muda toda vez

**Causa:** `TUNNEL_SUBDOMAIN` não está configurado ou está vazio

**Solução:**
1. Abra `backend/.env`
2. Verifique: `TUNNEL_SUBDOMAIN=seu-subdominio` (não pode estar vazio!)
3. Reinicie o backend

### ❌ Erro 502 ao acessar URL do tunnel

**Causa:** Backend não está rodando na porta 3000

**Solução:**
1. Verifique se o backend iniciou sem erros
2. Teste: http://localhost:3000/api/health
3. Deve retornar: `{"status": "ok"}`

### ❌ "Invalid tunnel credentials" ou erro de autenticação

**Causa:** LocalTunnel está com problemas de autenticação

**Solução:**
1. Aguarde alguns minutos e tente novamente
2. Ou use outro subdomínio
3. LocalTunnel gratuito pode ter limitações temporárias

---

## 💡 Dicas Importantes

### 1. Reiniciou o Backend? Nenhum Problema!

Com `TUNNEL_SUBDOMAIN` configurado, **a URL será sempre a mesma**. Você não precisa reconfigurar no Mercado Pago!

### 2. Trabalhando de Outro Local?

Se você trabalhar de casa, escritório, etc., a URL **continua a mesma**! Desde que o backend esteja rodando, o webhook funciona.

### 3. Produção = Webhook Diferente!

Quando fizer deploy no Render.com ou outro servidor, configure um webhook **diferente** para produção:

```
# Desenvolvimento:
https://agendamentos-dev.loca.lt/api/webhook/mercadopago

# Produção:
https://agendamentos-backend.onrender.com/api/webhook/mercadopago
```

No Mercado Pago, você pode ter **dois webhooks**: um para teste/desenvolvimento e outro para produção.

### 4. Logs São Seus Amigos!

Sempre monitore a janela do **Backend** para ver se os webhooks estão chegando. Facilita muito o debug!

---

## 🔐 Segurança

O LocalTunnel expõe seu backend localmente para a internet. Por isso:

- ✅ Use **APENAS em desenvolvimento**
- ✅ Nunca exponha dados sensíveis
- ✅ Use `.env` para credenciais (nunca hardcode)
- ✅ Em produção, use HTTPS e domínio próprio
- ✅ O webhook do MP valida assinaturas (implementado no código)

---

## 📚 Recursos Adicionais

**Documentação Relacionada:**
- `MERCADOPAGO_SETUP.md` - Setup completo do Mercado Pago
- `DEPLOY_RENDER_PASSO_A_PASSO.md` - Deploy em produção
- `QUICK_START.md` - Guia rápido do projeto

**Links Externos:**
- Mercado Pago Developers: https://www.mercadopago.com.br/developers
- LocalTunnel Docs: https://theboroer.github.io/localtunnel-www/
- Webhooks MP Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

## ✅ Pronto!

Agora você tem um webhook **estável e funcional** para desenvolvimento local!

**Próximos passos:**
1. Teste fazendo vários pagamentos
2. Verifique os logs do webhook
3. Quando estiver pronto, faça deploy em produção
4. Configure webhook de produção no Mercado Pago

---

**Precisa de ajuda?** Consulte os logs do terminal ou revise este guia passo a passo.

🚀 **Bom desenvolvimento!**
