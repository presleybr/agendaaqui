# 🔧 Correção DNS - Cloudflare

## 🔴 Problemas Encontrados

Seus registros DNS estão com **erros críticos**:

1. ❌ **Wildcard `*`** aponta para URL do Google
2. ⚠️ **CNAME `api`** pode estar incompleto
3. ❌ **Falta registro raiz** `@` ou `agendaaquivistorias.com.br`

---

## ✅ Configuração CORRETA

### Deletar Registros Incorretos

No Cloudflare, **DELETE** estes registros:

1. ❌ `*` (Wildcard) → aquele que aponta para Google
2. ⚠️ Se `api` estiver incompleto, delete e recrie

---

## 📋 Registros DNS Necessários

Configure **exatamente** assim no Cloudflare:

### 1. Domínio Principal (Frontend)

```
Type:    CNAME
Name:    @
Target:  agendaaqui-frontend.onrender.com
Proxy:   ✅ Proxied (laranja)
TTL:     Auto
```

### 2. WWW (Frontend)

```
Type:    CNAME
Name:    www
Target:  agendaaqui-frontend.onrender.com
Proxy:   ✅ Proxied (laranja)
TTL:     Auto
```

✅ **Este você JÁ TEM!** Está correto.

### 3. API (Backend)

```
Type:    CNAME
Name:    api
Target:  agendaaqui-backend.onrender.com
Proxy:   ❌ DNS only (cinza) ← IMPORTANTE!
TTL:     Auto
```

⚠️ **ATENÇÃO:** O registro `api` deve ter **Proxy DESABILITADO** (DNS only)!

### 4. Wildcard (Subdomínios das Empresas)

```
Type:    CNAME
Name:    *
Target:  agendaaqui-frontend.onrender.com
Proxy:   ✅ Proxied (laranja)
TTL:     Auto
```

❗ **CRÍTICO:** Deve apontar para `agendaaqui-frontend.onrender.com` e NÃO para Google!

---

## 🎯 Configuração Final

Sua lista de registros DNS deve ficar assim:

| Type  | Name | Target                              | Proxy Status | TTL  |
|-------|------|-------------------------------------|--------------|------|
| CNAME | @    | agendaaqui-frontend.onrender.com    | ✅ Proxied   | Auto |
| CNAME | www  | agendaaqui-frontend.onrender.com    | ✅ Proxied   | Auto |
| CNAME | api  | agendaaqui-backend.onrender.com     | ❌ DNS only  | Auto |
| CNAME | *    | agendaaqui-frontend.onrender.com    | ✅ Proxied   | Auto |

**Pode deletar os outros registros:** `_acme-challenge` e `_cf-custom-hostname` (são gerados automaticamente pelo Cloudflare)

---

## 📝 Passo a Passo no Cloudflare

### 1. Acessar DNS

1. Login em: https://dash.cloudflare.com
2. Selecione: `agendaaquivistorias.com.br`
3. Menu lateral: **DNS** → **Records**

### 2. Deletar Wildcard Incorreto

1. Encontre o registro `*` (Wildcard)
2. Clique em **Edit** (ícone de lápis)
3. Verifique se está apontando para Google/link errado
4. Clique em **Delete** (ícone de lixeira)
5. **Confirm**

### 3. Criar Wildcard Correto

1. Clique em **Add record**
2. Preencha:
   ```
   Type:    CNAME
   Name:    *
   Target:  agendaaqui-frontend.onrender.com
   Proxy status: Proxied (✅ laranja)
   TTL:     Auto
   ```
3. **Save**

### 4. Verificar/Corrigir API

1. Encontre o registro `api`
2. Clique em **Edit**
3. Verifique:
   - **Target:** deve ser `agendaaqui-backend.onrender.com` (COMPLETO!)
   - **Proxy:** deve estar **DESABILITADO** (cinza, DNS only)
4. Se estiver errado, corrija
5. **Save**

### 5. Adicionar Registro @ (se não existir)

Se não tiver registro `@` ou `agendaaquivistorias.com.br`:

1. Clique em **Add record**
2. Preencha:
   ```
   Type:    CNAME
   Name:    @
   Target:  agendaaqui-frontend.onrender.com
   Proxy status: Proxied (✅ laranja)
   TTL:     Auto
   ```
3. **Save**

---

## ⚠️ IMPORTANTE: Proxy Settings

### API deve ter Proxy DESABILITADO

**Por quê?**
- O proxy do Cloudflare pode causar problemas com:
  - WebSockets
  - Timeouts longos
  - Headers personalizados
  - CORS

**Como desabilitar:**
1. Edite o registro `api`
2. Clique no ícone de nuvem laranja (☁️)
3. Deve ficar cinza (DNS only)
4. Save

### Frontend pode ter Proxy HABILITADO

- Melhora performance
- CDN grátis
- Proteção DDoS
- SSL automático

---

## ✅ Testar Configuração

### 1. Aguarde Propagação (5-30 minutos)

### 2. Teste API

Abra no navegador:
```
https://api.agendaaquivistorias.com.br/api/health
```

**Deve retornar:**
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "type": "postgres"
  }
}
```

### 3. Teste Frontend

```
https://agendaaquivistorias.com.br
```

Deve abrir o site de agendamento.

### 4. Teste Wildcard

```
https://teste123.agendaaquivistorias.com.br
```

- Se empresa não existe: **404** (normal!)
- Se carrega: **DNS funcionando!** ✅

### 5. Teste com nslookup

**Windows PowerShell:**
```powershell
nslookup api.agendaaquivistorias.com.br
nslookup empresa1.agendaaquivistorias.com.br
```

**Deve resolver para IPs do Cloudflare (se proxy habilitado) ou Render (se DNS only)**

---

## 🐛 Troubleshooting

### API retorna "Not Found"

**Causa:** Rota `/api/health` não existe no backend.

**Teste direto no Render:**
```
https://agendaaqui-backend.onrender.com/api/health
```

Se funcionar aqui mas não em `api.agendaaquivistorias.com.br`:
- DNS ainda não propagou
- CNAME api está errado

### "ERR_TOO_MANY_REDIRECTS"

**Causa:** Loop de redirect entre Cloudflare e Render.

**Solução:**
1. Cloudflare → SSL/TLS
2. Selecione: **Full** ou **Full (strict)**
3. Nunca use: "Flexible"

### Subdomínios não funcionam

**Causa:** Wildcard `*` está incorreto.

**Solução:**
- Verifique se `*` aponta para `agendaaqui-frontend.onrender.com`
- NÃO deve apontar para Google, agendaaquivistorias.com.br diretamente, etc.

### "This site can't be reached"

**Causa:** Target do CNAME está errado.

**Verifique:**
- Target deve terminar em `.onrender.com`
- Sem `https://` no início
- Sem `/` no final

---

## 📊 Estrutura Final

```
┌─────────────────────────────────────────┐
│         Cloudflare DNS                  │
├─────────────────────────────────────────┤
│ @ → agendaaqui-frontend.onrender.com    │ ← Site principal
│ www → agendaaqui-frontend.onrender.com  │ ← www
│ api → agendaaqui-backend.onrender.com   │ ← Backend (DNS only!)
│ * → agendaaqui-frontend.onrender.com    │ ← Todos subdomínios
└─────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   Render (Servidor)   │
        ├──────────────────────┤
        │  Frontend            │ ← index.html, admin.html
        │  Backend + PostgreSQL│ ← API + Banco
        └──────────────────────┘
```

---

## 🎉 Checklist Final

Antes de testar, confirme:

- [ ] Wildcard `*` aponta para `agendaaqui-frontend.onrender.com`
- [ ] Wildcard `*` tem proxy **HABILITADO** (laranja)
- [ ] CNAME `api` aponta para `agendaaqui-backend.onrender.com` (completo!)
- [ ] CNAME `api` tem proxy **DESABILITADO** (cinza, DNS only)
- [ ] CNAME `@` ou `agendaaquivistorias.com.br` existe
- [ ] CNAME `www` existe
- [ ] Aguardou 5-30 minutos para propagar
- [ ] Testou `https://api.agendaaquivistorias.com.br/api/health`
- [ ] Testou `https://agendaaquivistorias.com.br`

---

## 📞 Próximos Passos

1. ✅ Corrija os DNS agora
2. ⏱️ Aguarde 5-30 minutos
3. 🧪 Teste as URLs
4. 🏢 Cadastre primeira empresa no admin
5. 🎉 Acesse `empresa1.agendaaquivistorias.com.br`

**Tudo vai funcionar!** 🚀
