# 🌐 Como Configurar Subdomínios Ilimitados (Wildcard DNS)

## ✅ SEU SISTEMA JÁ ESTÁ PRONTO!

O código **já detecta subdomínios automaticamente**. Você só precisa configurar 1 registro DNS e todos os subdomínios vão funcionar!

---

## 🎯 Situação Atual

Você tem no Render:
- ✅ `agendaaquivistorias.com.br` → configurado
- ✅ `www.agendaaquivistorias.com.br` → configurado

**Problema:** Não pode adicionar mais domínios no plano free.

**Solução:** Wildcard DNS! ⭐

---

## 🚀 Como Funciona

Com **1 único registro DNS** wildcard, TODOS os subdomínios funcionam:

```
✅ empresa1.agendaaquivistorias.com.br  → funciona automaticamente
✅ empresa2.agendaaquivistorias.com.br  → funciona automaticamente
✅ vistoriaexpress.agendaaquivistorias.com.br → funciona automaticamente
✅ qualquercoisa.agendaaquivistorias.com.br → funciona automaticamente
```

**TODOS apontam para o mesmo servidor, e o código detecta qual empresa é pelo subdomínio!**

---

## 📋 Configuração Passo a Passo

### Onde você registrou o domínio?

#### Opção 1: Registro.br

1. **Acesse:** https://registro.br
2. **Faça login** com sua conta
3. **Vá em:** "Meus Domínios"
4. **Clique em:** `agendaaquivistorias.com.br`
5. **Clique em:** "Editar zona" ou "DNS"

6. **Adicione este registro:**

```
Tipo:  CNAME
Nome:  *
Valor: agendaaquivistorias.com.br
TTL:   3600
```

7. **Salve** e aguarde 5-30 minutos

#### Opção 2: Cloudflare

1. **Acesse:** https://dash.cloudflare.com
2. **Selecione:** `agendaaquivistorias.com.br`
3. **Vá em:** DNS → Records
4. **Clique em:** "Add record"

```
Type:    CNAME
Name:    *
Target:  agendaaquivistorias.com.br
Proxy:   ✅ Proxied (laranja)
TTL:     Auto
```

5. **Save**

#### Opção 3: Outro provedor (GoDaddy, HostGator, etc)

O processo é similar:

```
Tipo:   CNAME
Host:   *
Aponta para: agendaaquivistorias.com.br
```

---

## ✅ Testar se Funcionou

### 1. Aguarde a Propagação (5-30 minutos)

### 2. Teste com nslookup/dig

**Windows (PowerShell):**
```powershell
nslookup empresa1.agendaaquivistorias.com.br
nslookup teste123.agendaaquivistorias.com.br
```

**Linux/Mac:**
```bash
dig empresa1.agendaaquivistorias.com.br
dig teste123.agendaaquivistorias.com.br
```

Ambos devem apontar para o mesmo IP do Render! ✅

### 3. Teste no Navegador

Abra: `https://empresa1.agendaaquivistorias.com.br`

**Comportamentos esperados:**

- ✅ **Se a empresa "empresa1" existe no banco:**
  - Carrega o site personalizado da empresa
  - Mostra nome, preços e horários específicos

- ⚠️ **Se a empresa NÃO existe:**
  - Mostra erro 404 "Empresa não encontrada"
  - É normal! Você precisa cadastrar a empresa primeiro

- ❌ **Se mostra erro de DNS/SSL:**
  - DNS ainda não propagou (aguarde mais)
  - Ou registro wildcard não foi configurado corretamente

---

## 📊 Como o Sistema Funciona

### 1. DNS Direciona Tudo

```
DNS Wildcard (*)
    ↓
Todos os subdomínios → agendaaquivistorias.com.br (Render)
```

### 2. Backend Detecta Subdomínio

```javascript
// backend/src/middleware/tenantMiddleware.js
const host = req.get('host'); // "empresa1.agendaaquivistorias.com.br"
const subdomain = extractSubdomain(host); // "empresa1"
const empresa = await Empresa.findBySlug(subdomain); // Busca no banco
```

### 3. Frontend Personaliza

```javascript
// frontend/src/services/tenant.js
const subdomain = extractSubdomain(); // "empresa1"
const config = await loadTenantConfig(); // Busca configurações
// Exibe nome, preços, horários personalizados
```

---

## 🏢 Cadastrar Nova Empresa

### No Painel Admin

1. Acesse: `https://agendaaquivistorias.com.br/admin`
2. Login
3. Menu "Empresas" → "+ Nova Empresa"
4. Preencha:
   - **Nome:** Vistoria Express MS
   - **Slug:** `vistoriaexpressms` (será o subdomínio!)
   - **Email:** contato@vistoriaexpress.com
   - **Status:** Ativo
   - **Preços personalizados** (opcional)

5. **Salvar**

### Acessar Site da Empresa

Imediatamente após salvar:
- URL: `https://vistoriaexpressms.agendaaquivistorias.com.br`
- Mostra site personalizado com dados da empresa!

---

## ⚠️ Subdomínios Reservados

Estes NÃO funcionam como tenant (são reservados):

- ❌ `www.agendaaquivistorias.com.br` → site principal
- ❌ `admin.agendaaquivistorias.com.br` → painel admin
- ❌ `agendaaqui-backend.onrender.com` → API (se configurar)
- ❌ `app.agendaaquivistorias.com.br` → reservado

**Qualquer outro** funciona como tenant! ✅

---

## 🐛 Problemas Comuns

### "Não consigo acessar empresa1.dominio.com.br"

**Possíveis causas:**

1. **DNS não propagou ainda**
   - Solução: Aguarde até 48h (normalmente 5-30min)
   - Teste: `nslookup empresa1.agendaaquivistorias.com.br`

2. **Registro wildcard não configurado**
   - Verifique no painel DNS se existe registro `*`
   - Deve apontar para `agendaaquivistorias.com.br`

3. **Empresa não existe no banco**
   - Cadastre a empresa no painel admin
   - Slug deve ser exatamente igual ao subdomínio

### "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

- Render demora alguns minutos para gerar certificado SSL para wildcard
- Aguarde 10-20 minutos após configurar DNS

### "Mostra o site principal ao invés do tenant"

- Verifique o slug da empresa no banco
- Deve ser exatamente igual ao subdomínio (sem www, sem https)

---

## 📱 Exemplo Completo

### 1. Configurar DNS

```
Registro.br:
Tipo:  CNAME
Nome:  *
Valor: agendaaquivistorias.com.br
```

### 2. Cadastrar Empresa

```
Painel Admin → Empresas → Nova:
Nome: Vistoria MS Centro
Slug: vistoriamscentro
Email: centro@vistoriams.com.br
Status: Ativo
Preços:
  - Cautelar: R$ 150,00
  - Transferência: R$ 120,00
```

### 3. Cliente Acessa

```
URL: https://vistoriamscentro.agendaaquivistorias.com.br

O que acontece:
1. DNS redireciona para Render
2. Backend detecta slug "vistoriamscentro"
3. Busca empresa no banco
4. Retorna configurações
5. Frontend mostra:
   - Nome: "Vistoria MS Centro"
   - Preços personalizados
   - Horários personalizados
   - Chave PIX da empresa
```

### 4. Cliente Agenda

```
Cliente preenche formulário
    ↓
Gera QR Code PIX
    ↓
PIX vai direto para conta da empresa
    ↓
Sistema detecta pagamento (webhook Mercado Pago)
    ↓
Confirma agendamento automaticamente
```

---

## 💰 Sem Custos Extras!

✅ **Plano Free do Render:**
- 1 domínio custom (seu principal)
- Wildcard funciona automaticamente via DNS
- Subdomínios ilimitados
- SSL automático para todos

✅ **Sem limite de empresas:**
- Cadastre quantas quiser no banco
- Cada uma tem seu subdomínio
- Todas funcionam com 1 registro DNS

---

## 🎉 Resumo

1. ✅ Código já pronto (não precisa alterar nada!)
2. ✅ Adicione 1 registro DNS wildcard `*`
3. ✅ Aguarde propagação (5-30min)
4. ✅ Cadastre empresas no painel admin
5. ✅ Cada empresa tem sua URL automática!

---

## 📞 Dúvidas?

Se tiver problemas:
1. Verifique se DNS propagou: https://www.whatsmydns.net
2. Teste com `nslookup`
3. Verifique logs do navegador (F12 → Console)
4. Verifique se empresa existe no banco

**O sistema está 100% pronto! Só falta o DNS.** 🚀
