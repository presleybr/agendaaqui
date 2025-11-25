# 🌐 Subdomínios no Render (.onrender.com)

## ✅ AGORA FUNCIONA!

Acabei de atualizar o código para **suportar subdomínios do Render**!

Agora você pode usar **AMBOS** ao mesmo tempo:
- ✅ `empresa1.agendaaqui-frontend.onrender.com` (Render)
- ✅ `empresa1.agendaaquivistorias.com.br` (Seu domínio)

---

## 🎯 Para Que Serve

**Usar subdomínios Render é perfeito para:**
- 🧪 **Testar** enquanto DNS próprio não propaga
- 🚀 **Demonstração** rápida para clientes
- 📱 **Compartilhar** links antes de configurar DNS
- 🔧 **Desenvolvimento** e homologação

---

## 🚀 Como Adicionar Subdomínios no Render

### 1. Acesse o Dashboard do Render

1. Login em: https://dashboard.render.com
2. Clique no serviço: **agendaaqui-frontend**

### 2. Vá em Custom Domains

1. Menu lateral: **Settings**
2. Role até: **Custom Domains**
3. Clique em: **Add Custom Domain**

### 3. Adicione o Subdomínio

Na caixa de texto, digite:
```
empresa1.agendaaqui-frontend.onrender.com
```

**Formato:**
```
[slug-empresa].agendaaqui-frontend.onrender.com
```

4. Clique em: **Add**

### 4. Aguarde Validação

- ⏱️ Render valida automaticamente (5-30 segundos)
- 🔒 SSL é gerado automaticamente (1-2 minutos)
- ✅ Quando aparecer "Verified" → pronto!

---

## 📋 Exemplos de Subdomínios

Você pode adicionar quantos quiser (limitado pelo plano):

```
vistoriaexpress.agendaaqui-frontend.onrender.com
autocheck.agendaaqui-frontend.onrender.com
vistoriams.agendaaqui-frontend.onrender.com
laudo360.agendaaqui-frontend.onrender.com
```

**Cada um vai funcionar como tenant independente!**

---

## 🏢 Cadastrar Empresa

### No Painel Admin

1. Acesse: `https://agendaaqui-frontend.onrender.com/admin`
2. Login
3. Menu **Empresas** → **+ Nova Empresa**
4. Preencha:
   ```
   Nome: Vistoria Express MS
   Slug: vistoriaexpress  ← IMPORTANTE! Deve ser igual ao subdomínio
   Email: contato@vistoriaexpress.com
   Telefone: (67) 99999-9999
   Chave PIX: contato@vistoriaexpress.com
   Status: Ativo
   ```
5. **Salvar**

### URLs que Funcionam

Após cadastrar a empresa `vistoriaexpress`:

✅ **Render (imediato):**
```
https://vistoriaexpress.agendaaqui-frontend.onrender.com
```

✅ **Seu domínio (após DNS propagar):**
```
https://vistoriaexpress.agendaaquivistorias.com.br
```

**AMBOS funcionam ao mesmo tempo!** 🎉

---

## 🔄 Como Funciona

### 1. Cliente Acessa URL

```
https://vistoriaexpress.agendaaqui-frontend.onrender.com
```

### 2. Render Roteia para Seu App

```
Host: vistoriaexpress.agendaaqui-frontend.onrender.com
```

### 3. Backend Detecta Subdomínio

```javascript
// backend/src/middleware/tenantMiddleware.js
const hostname = "vistoriaexpress.agendaaqui-frontend.onrender.com";
const parts = hostname.split('.'); // ['vistoriaexpress', 'agendaaqui-frontend', 'onrender', 'com']
const subdomain = parts[0]; // "vistoriaexpress"
```

### 4. Busca Empresa no Banco

```sql
SELECT * FROM empresas WHERE slug = 'vistoriaexpress'
```

### 5. Retorna Configurações

```json
{
  "nome": "Vistoria Express MS",
  "slug": "vistoriaexpress",
  "precos": {
    "cautelar": 15000,
    "transferencia": 12000
  },
  "horarios": {
    "inicio": "08:00",
    "fim": "18:00"
  },
  "chave_pix": "contato@vistoriaexpress.com"
}
```

### 6. Frontend Personaliza

- ✅ Nome da empresa no header
- ✅ Preços personalizados
- ✅ Horários de funcionamento
- ✅ PIX direto para empresa

---

## ⚠️ Limitações do Plano Free

### Render Free Tier

**Custom Domains:**
- ✅ 1 domínio principal: `agendaaquivistorias.com.br`
- ✅ Wildcard funciona via DNS
- ❌ Limite de subdomínios `.onrender.com` customizados

**Solução:**
- Use subdomínios Render apenas para **testes/demonstração**
- Use domínio próprio com **wildcard DNS** para **produção**
- Ilimitados subdomínios com wildcard DNS! 🚀

---

## 🎯 Estratégia Recomendada

### Fase 1: Testes com Render (Agora)

```
✅ vistoriaexpress.agendaaqui-frontend.onrender.com
✅ empresa2.agendaaqui-frontend.onrender.com
```

**Vantagens:**
- Funciona imediatamente
- SSL automático
- Perfeito para testes

### Fase 2: Produção com Domínio Próprio (Depois)

```
✅ vistoriaexpress.agendaaquivistorias.com.br
✅ empresa2.agendaaquivistorias.com.br
✅ qualquercoisa.agendaaquivistorias.com.br
```

**Vantagens:**
- Ilimitados subdomínios (wildcard DNS)
- Mais profissional
- Branding melhor

### Ambos Funcionam Simultaneamente! 🎉

```
Cliente pode usar:
https://vistoriaexpress.agendaaqui-frontend.onrender.com
OU
https://vistoriaexpress.agendaaquivistorias.com.br

Ambos mostram o mesmo site da empresa!
```

---

## 🧪 Testar Agora

### 1. Adicione 1 Subdomínio no Render

```
teste.agendaaqui-frontend.onrender.com
```

### 2. Cadastre Empresa "teste"

No admin:
- Nome: Empresa Teste
- Slug: `teste`
- Status: Ativo

### 3. Acesse

```
https://teste.agendaaqui-frontend.onrender.com
```

**Deve carregar o site personalizado da empresa!** ✅

---

## 🐛 Troubleshooting

### "Custom domain not found"

**Causa:** Render ainda não validou o domínio.

**Solução:** Aguarde 1-2 minutos.

### "Empresa não encontrada"

**Causa:** Slug no banco é diferente do subdomínio.

**Solução:**
- Acesse admin → Empresas
- Verifique se slug é exatamente: `teste` (sem maiúsculas)
- Edite se necessário

### "Certificate error"

**Causa:** SSL ainda não foi gerado.

**Solução:** Aguarde 5-10 minutos após adicionar domínio.

### Mostra site principal ao invés do tenant

**Causa:** Código ainda não foi atualizado no Render.

**Solução:**
- Faça push das mudanças (já fiz!)
- Aguarde rebuild do Render (5-10 minutos)
- Ou force rebuild: Dashboard → Manual Deploy

---

## 📊 Comparação

| Recurso | Subdomínio Render | Domínio Próprio |
|---------|-------------------|-----------------|
| **Velocidade** | ⚡ Imediato | ⏱️ 5-30min (DNS) |
| **SSL** | ✅ Automático | ✅ Automático |
| **Quantidade** | ⚠️ Limitado* | ✅ Ilimitado |
| **Profissional** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Custo** | 💰 Grátis | 💰 Grátis |
| **Branding** | ❌ `.onrender.com` | ✅ Seu domínio |

*Limitado no plano free, mas suficiente para testes.

---

## 🎉 Resumo

1. ✅ Código atualizado (suporta subdomínios Render)
2. ✅ Adicione subdomínios no Dashboard Render
3. ✅ Cadastre empresas com mesmo slug
4. ✅ Funciona imediatamente
5. ✅ Use para testes enquanto DNS propaga
6. ✅ Depois migre para domínio próprio (ambos funcionam!)

---

## 🚀 Próximos Passos

1. **Agora:** Faça push do código (já fiz!)
2. **Aguarde:** Render fazer rebuild (5-10min)
3. **Adicione:** 1 subdomínio de teste no Render
4. **Cadastre:** Empresa com mesmo slug
5. **Teste:** Acesse a URL!
6. **Configure:** DNS wildcard do seu domínio
7. **Use:** Ambos simultaneamente! 🎊

**Seu sistema multi-tenant está quase pronto!** 🔥
