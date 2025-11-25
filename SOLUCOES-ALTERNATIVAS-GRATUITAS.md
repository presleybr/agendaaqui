# 🆓 Soluções Alternativas Gratuitas para Multi-Tenant

## 🎯 Problema Atual

- Render plano free não suporta wildcard domains adequadamente
- Cloudflare dá erro 403/1000 com wildcard
- Subdomínios não funcionam

---

## ✅ SOLUÇÃO 1: Migrar Frontend para Vercel (RECOMENDADO)

### Por Que Vercel?

- ✅ **Wildcard domains nativamente suportado** (grátis!)
- ✅ **100% grátis** para projetos pessoais/comerciais
- ✅ **Deploy automático** via GitHub
- ✅ **CDN global** super rápido
- ✅ **SSL automático** para todos subdomínios
- ✅ **Zero configuração** para subdomínios

### Como Funciona

```
Frontend → Vercel (grátis, com wildcard)
Backend → Render (continua lá)
```

### Passo a Passo

#### 1. Criar Conta Vercel

1. Acesse: https://vercel.com
2. **Sign Up** com GitHub
3. Grátis para sempre

#### 2. Conectar Repositório

1. Dashboard Vercel → **Add New** → **Project**
2. **Import Git Repository**
3. Selecione: seu repositório `agendaaqui`
4. Configure:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
5. **Environment Variables:**
   ```
   VITE_API_URL = https://agendaaqui-backend.onrender.com/api
   ```
6. **Deploy**

#### 3. Adicionar Domínio Custom

1. Project Settings → **Domains**
2. **Add Domain**
3. Digite: `agendaaquivistorias.com.br`
4. Vercel vai pedir para configurar DNS

#### 4. Configurar DNS no Cloudflare

Vercel vai te dar instruções, mas basicamente:

```
Type:  CNAME
Name:  @
Target: cname.vercel-dns.com
Proxy: OFF (cinza)

Type:  CNAME
Name:  www
Target: cname.vercel-dns.com
Proxy: OFF (cinza)
```

#### 5. Adicionar Wildcard Domain

1. Project Settings → **Domains**
2. **Add Domain**
3. Digite: `*.agendaaquivistorias.com.br`
4. Vercel **aceita automaticamente!** ✅

#### 6. Configurar Wildcard DNS

```
Type:  CNAME
Name:  *
Target: cname.vercel-dns.com
Proxy: OFF (cinza)
```

#### 7. Pronto! 🎉

**Funciona imediatamente:**
- `https://agendaaquivistorias.com.br` ✅
- `https://empresa1.agendaaquivistorias.com.br` ✅
- `https://qualquercoisa.agendaaquivistorias.com.br` ✅

**Todos com:**
- SSL automático 🔒
- CDN global ⚡
- Zero configuração extra ✨

---

## ✅ SOLUÇÃO 2: Usar Railway ao invés de Render

### Por Que Railway?

- ✅ **Wildcard domains melhor suportado**
- ✅ **$5 crédito grátis/mês** (suficiente para seu projeto)
- ✅ **Deploy automático** via GitHub
- ✅ **PostgreSQL incluído**

### Migração

1. Acesse: https://railway.app
2. Sign up com GitHub
3. **New Project** → **Deploy from GitHub**
4. Selecione seu repo
5. Railway detecta automaticamente (Node.js)
6. Adicione variáveis de ambiente
7. **Deploy**

### Custom Domains

Railway aceita wildcard no plano free com créditos!

```
Settings → Domains
Add: agendaaquivistorias.com.br
Add: *.agendaaquivistorias.com.br
```

Funciona! ✅

---

## ✅ SOLUÇÃO 3: Cloudflare Workers (100% Gratuito)

### O Que É?

Workers = "mini servidor" JavaScript que roda no edge do Cloudflare.

### Como Funciona

```
Cliente → Cloudflare Workers (detecta subdomain)
           ↓
       Faz proxy para Render
           ↓
       Adiciona headers do tenant
           ↓
       Retorna resposta
```

### Código do Worker

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Extrair subdomínio
    const parts = hostname.split('.');
    let subdomain = null;

    if (parts.length > 3) {
      subdomain = parts[0];
    }

    // Fazer proxy para Render
    const renderUrl = 'https://agendaaqui-frontend.onrender.com';
    const proxyUrl = new URL(url.pathname + url.search, renderUrl);

    // Copiar request
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    // Adicionar header com subdomain
    if (subdomain) {
      modifiedRequest.headers.set('X-Tenant-Slug', subdomain);
    }

    // Fazer request
    const response = await fetch(modifiedRequest);

    return response;
  }
};
```

### Configuração

1. Cloudflare Dashboard → **Workers & Pages**
2. **Create Worker**
3. Cole o código acima
4. **Save and Deploy**
5. **Add Route:**
   ```
   Route: *.agendaaquivistorias.com.br/*
   Worker: seu-worker
   ```

### Atualizar Backend

Modifique `tenantMiddleware.js` para ler o header:

```javascript
function extractSubdomain(req) {
  // Se tem header X-Tenant-Slug (do Worker)
  if (req.headers['x-tenant-slug']) {
    return req.headers['x-tenant-slug'];
  }

  // Senão, extrai do host normalmente
  const host = req.get('host') || '';
  // ... resto do código
}
```

**Limite:** 100.000 requisições/dia grátis (suficiente!)

---

## ✅ SOLUÇÃO 4: Subdirectories ao Invés de Subdomínios

### Estrutura

```
❌ empresa1.agendaaquivistorias.com.br
✅ agendaaquivistorias.com.br/empresa1

❌ empresa2.agendaaquivistorias.com.br
✅ agendaaquivistorias.com.br/empresa2
```

### Vantagens

- ✅ **Funciona 100%** sem configuração DNS
- ✅ **Sem limite** de empresas
- ✅ **Grátis** total
- ✅ **Zero problemas** com Cloudflare

### Desvantagens

- ⚠️ Não é subdomínio (menos profissional)
- ⚠️ Precisa ajustar rotas do frontend

### Implementação

**Frontend:**

```javascript
// src/services/tenant.js
extractTenantFromPath() {
  const path = window.location.pathname;
  // /empresa1/... -> "empresa1"
  const match = path.match(/^\/([^\/]+)/);
  return match ? match[1] : null;
}

isTenant() {
  const slug = this.extractTenantFromPath();
  // Verificar se não é rota reservada
  const reserved = ['admin', 'api', 'login'];
  return slug && !reserved.includes(slug);
}
```

**Backend - Adicionar rota:**

```javascript
// src/server.js
app.get('/:tenant_slug/*', (req, res) => {
  // Servir frontend com tenant context
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

---

## ✅ SOLUÇÃO 5: Query Parameters (Temporário)

### Estrutura

```
https://agendaaquivistorias.com.br?empresa=empresa1
https://agendaaquivistorias.com.br?empresa=empresa2
```

### Implementação Rápida

```javascript
// src/services/tenant.js
extractTenantFromQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('empresa');
}

isTenant() {
  return !!this.extractTenantFromQuery();
}
```

### Vantagens

- ✅ Funciona **imediatamente**
- ✅ Zero configuração
- ✅ Pode testar agora mesmo!

### Desvantagens

- ❌ Não é profissional
- ❌ URL feia
- ❌ Apenas para testes/desenvolvimento

---

## 📊 Comparação de Soluções

| Solução | Custo | Facilidade | Profissional | Tempo Setup |
|---------|-------|------------|--------------|-------------|
| **Vercel** | Grátis | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 15 min |
| **Railway** | $5 créditos/mês | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 20 min |
| **CF Workers** | Grátis | ⭐⭐⭐ | ⭐⭐⭐⭐ | 30 min |
| **Subdirectories** | Grátis | ⭐⭐⭐⭐ | ⭐⭐⭐ | 15 min |
| **Query Params** | Grátis | ⭐⭐⭐⭐⭐ | ⭐⭐ | 5 min |

---

## 🏆 MINHA RECOMENDAÇÃO

### Opção 1: Migrar Frontend para Vercel

**Melhor solução long-term:**
- Frontend → **Vercel** (wildcard nativo, grátis)
- Backend → **Render** (continua lá)

**Por quê?**
- ✅ Funciona perfeitamente
- ✅ 100% grátis
- ✅ Wildcard domains nativamente
- ✅ Deploy automático
- ✅ CDN super rápido
- ✅ SSL automático

### Opção 2: Subdirectories (Solução Rápida)

Se não quiser migrar agora:
- Use `/empresa1` ao invés de `empresa1.domain.com`
- Funciona 100% no Render atual
- Pode migrar para subdomínios depois

---

## 🚀 Próximos Passos

### Opção A: Migrar para Vercel (Recomendado)

1. Crie conta Vercel
2. Conecte repositório GitHub
3. Deploy frontend
4. Configure domínios
5. Pronto! Funciona!

**Tempo:** 15-20 minutos
**Custo:** R$ 0,00
**Resultado:** Tudo funcionando perfeitamente ✅

### Opção B: Usar Subdirectories (Rápido)

1. Ajuste frontend para ler path
2. Ajuste backend para servir frontend com tenant
3. Teste: `domain.com/empresa1`
4. Pronto!

**Tempo:** 10-15 minutos
**Custo:** R$ 0,00
**Resultado:** Funciona, mas URLs menos profissionais

---

## 💡 Qual Escolher?

**Se você quer:**
- ✅ Melhor solução profissional → **Vercel**
- ✅ Solução mais rápida → **Subdirectories**
- ✅ Manter tudo no Render → **Subdirectories ou Query Params**
- ✅ Aprender algo novo → **Cloudflare Workers**

---

## 📞 Vamos Decidir?

Me diga:
1. Você prefere migrar o frontend para Vercel? (15 min)
2. Ou prefere usar subdirectories no Render atual? (10 min)

Ambos funcionam 100%, são gratuitos e posso te ajudar agora! 🚀
