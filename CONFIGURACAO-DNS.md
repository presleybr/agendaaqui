# 🌐 Guia de Configuração DNS - Sistema Multi-Tenant

## 📋 O que você precisa

1. **Domínio principal:** `agendaaquivistorias.com.br`
2. **Acesso ao painel DNS** (Registro.br, Cloudflare, etc)
3. **Backend rodando:** `agendaaqui-backend.onrender.com`
4. **Frontend rodando:** `agendaaquivistorias.com.br`

---

## 🔧 Configuração Atual

### Backend (API)
- **Hospedado em:** Render
- **URL:** `https://agendaaqui-backend.onrender.com`
- **Função:** API + Banco de Dados PostgreSQL

### Frontend (Site Principal)
- **Hospedado em:** ?
- **URL:** `https://agendaaquivistorias.com.br`
- **Função:** Site principal de agendamento

---

## 🏢 Como Funciona o Multi-Tenant

```
Cliente acessa subdomínio específico:
├── empresa1.agendaaquivistorias.com.br
│   └── Mostra site personalizado da Empresa 1
│
├── empresa2.agendaaquivistorias.com.br
│   └── Mostra site personalizado da Empresa 2
│
└── agendaaquivistorias.com.br (sem subdomínio)
    └── Site principal / Admin
```

**O que acontece:**
1. DNS direciona TODOS os subdomínios `*.agendaaquivistorias.com.br` para o mesmo servidor
2. Backend detecta o subdomínio (`empresa1`, `empresa2`)
3. Busca configurações específicas da empresa no banco
4. Frontend personaliza a página com dados da empresa

---

## 🔨 Configuração DNS Necessária

### Opção 1: Frontend e Backend Separados (Recomendado)

**No seu provedor DNS (Registro.br, Cloudflare, etc):**

```
# Site principal
A     @                         →  [IP do servidor frontend]
A     www                       →  [IP do servidor frontend]

# Backend API
CNAME api                       →  agendaaqui-backend.onrender.com

# Wildcard para todos os tenants (empresas)
CNAME *                         →  [servidor do frontend]
```

**Explicação:**
- `agendaaquivistorias.com.br` → Site principal
- `api.agendaaquivistorias.com.br` → Backend (API)
- `empresa1.agendaaquivistorias.com.br` → Frontend com configs da empresa1
- `empresa2.agendaaquivistorias.com.br` → Frontend com configs da empresa2

### Opção 2: Tudo no Render (Mais Simples)

Se hospedar o frontend também no Render:

```
# No Render, crie um serviço para o frontend
Frontend: agendaaquivistorias.com.br

# DNS Config:
A     @                         →  IP do Render (fornecido por eles)
CNAME www                       →  agendaaquivistorias.com.br
CNAME *                         →  agendaaquivistorias.com.br
CNAME api                       →  agendaaqui-backend.onrender.com
```

---

## 📝 Passo a Passo: Registro.br

1. **Acesse:** https://registro.br
2. **Login** com sua conta
3. **Vá em:** Meus Domínios → agendaaquivistorias.com.br → DNS
4. **Adicione os registros:**

```
Tipo    Nome    Dados                           TTL
----    ----    -----                           ---
A       @       [IP do frontend]                3600
A       www     [IP do frontend]                3600
CNAME   api     agendaaqui-backend.onrender.com 3600
CNAME   *       agendaaquivistorias.com.br      3600
```

5. **Salve** e aguarde 5-30 minutos para propagar

---

## 📝 Passo a Passo: Cloudflare (Se usar)

1. **Acesse:** https://dash.cloudflare.com
2. **Selecione** o domínio `agendaaquivistorias.com.br`
3. **Vá em:** DNS → Records
4. **Add record:**

| Type  | Name | Content                           | Proxy |
|-------|------|-----------------------------------|-------|
| A     | @    | [IP frontend]                     | ✅     |
| A     | www  | [IP frontend]                     | ✅     |
| CNAME | api  | agendaaqui-backend.onrender.com   | ❌     |
| CNAME | *    | agendaaquivistorias.com.br        | ✅     |

5. **Save**

⚠️ **IMPORTANTE:** Desative proxy (☁️) no registro `api` para evitar problemas com WebSockets/API

---

## 🚀 Configurar Frontend para Subdomínios

### Opção 1: Vercel (Recomendado para Vite)

1. **Deploy no Vercel:**
```bash
cd frontend
vercel --prod
```

2. **Adicione domínio customizado:**
   - Dashboard Vercel → Settings → Domains
   - Add: `agendaaquivistorias.com.br`
   - Add: `*.agendaaquivistorias.com.br`

3. **DNS será configurado automaticamente**

### Opção 2: Render (Static Site)

1. **Crie novo serviço no Render:**
   - Type: Static Site
   - Repository: seu repo do frontend
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

2. **Custom Domain:**
   - Settings → Custom Domain
   - Add: `agendaaquivistorias.com.br`
   - Render fornecerá o IP/CNAME

3. **Configure DNS** com valores fornecidos

### Opção 3: Netlify

Similar ao Vercel:
1. Deploy no Netlify
2. Add custom domain
3. Configure DNS automático

---

## ✅ Testar Configuração

### 1. Teste DNS Propagação
```bash
# Linux/Mac
dig empresa1.agendaaquivistorias.com.br
dig api.agendaaquivistorias.com.br

# Windows (PowerShell)
nslookup empresa1.agendaaquivistorias.com.br
nslookup api.agendaaquivistorias.com.br
```

### 2. Teste API
```bash
curl https://api.agendaaquivistorias.com.br/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "database": {
    "connected": true
  }
}
```

### 3. Teste Tenant
```bash
curl -H "Host: empresa1.agendaaquivistorias.com.br" \
     https://api.agendaaquivistorias.com.br/api/tenant/config
```

Deve retornar os dados da empresa ou erro 404 (se não existir).

---

## 🐛 Troubleshooting

### "ERR_NAME_NOT_RESOLVED"
- DNS ainda não propagou (aguarde até 48h)
- Registros DNS incorretos

### "404 Not Found"
- Empresa não cadastrada no banco
- Slug incorreto

### "CORS Error"
- Backend precisa permitir o domínio
- Verificar `backend/src/server.js` → `corsOptions`

### Subdomínio não funciona
- Faltou adicionar registro wildcard `*`
- DNS ainda propagando

---

## 📊 Arquitetura Recomendada

```
┌─────────────────────────────────────────────┐
│          DNS (Registro.br/Cloudflare)       │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼────┐         ┌────▼────┐
   │Frontend │         │ Backend │
   │ (Vercel)│◄────────┤ (Render)│
   └────┬────┘  API    └────┬────┘
        │               │
        │               ▼
   [Subdomínios]   [PostgreSQL]
   empresa1.domain    └─ Empresas
   empresa2.domain    └─ Configs
   empresa3.domain    └─ Preços
```

**Vantagens:**
- ✅ Frontend em CDN (Vercel/Netlify) = RÁPIDO
- ✅ Backend no Render = PostgreSQL incluso
- ✅ Subdomínios funcionam automaticamente
- ✅ SSL gratuito em tudo

---

## 💡 Dicas

1. **Use Cloudflare** como DNS (grátis + rápido)
2. **Vercel** é ótimo para frontend Vite/React
3. **Render** ótimo para backend Node.js + PostgreSQL
4. **Sempre teste** com `curl` antes de testar no navegador
5. **DNS demora** - tenha paciência (5min a 48h)

---

## 🔗 Links Úteis

- [Cloudflare DNS](https://dash.cloudflare.com)
- [Vercel](https://vercel.com)
- [Render](https://render.com)
- [Netlify](https://netlify.com)
- [DNS Propagation Checker](https://www.whatsmydns.net/)

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas sobre:
- Qual opção escolher
- Como configurar no seu provedor específico
- Problemas de DNS/CORS

Me avise! Posso ajudar com mais detalhes.
