# 🚨 Resolver Erro 500 ao Criar Empresa

## Problema
Ao tentar criar uma empresa no painel admin (`https://agendaaquivistorias.com.br/admin`), aparece erro 500.

**Causa:** A migration 006 não foi aplicada ainda. O banco não tem os novos campos de personalização.

---

## ✅ Solução Rápida (3 opções)

### Opção 1: Via Shell do Render (RECOMENDADO) ⚡

**1. Acesse o Dashboard do Render:**
- Entre em: https://dashboard.render.com
- Selecione seu **Web Service** (backend)
- Clique na aba **"Shell"**

**2. Execute este comando:**
```bash
cd backend && npm run setup:complete
```

**3. Aguarde a mensagem:**
```
✅ Migration 006 aplicada com sucesso!
✅ Empresa criada/atualizada: vistoriapremium
🎉 Sistema pronto para uso!
```

---

### Opção 2: Via psql (Direto no banco) 🗄️

**1. Conecte ao banco PostgreSQL:**

No Render Dashboard:
- Vá para seu **PostgreSQL database**
- Clique em **"Connect"** → **"External Connection"**
- Copie a connection string

**2. Execute a migration:**

```bash
# Via linha de comando
psql "postgresql://usuario:senha@host/database" < backend/src/migrations/006_fix_and_customization.sql
```

Ou use um cliente SQL visual (DBeaver, pgAdmin, etc) e execute o conteúdo do arquivo:
`backend/src/migrations/006_fix_and_customization.sql`

---

### Opção 3: Via Node.js local (se tiver DATABASE_URL) 💻

**1. Configure .env local com DATABASE_URL do Render:**
```env
DATABASE_URL=postgresql://usuario:senha@dpg-xxx.oregon-postgres.render.com/database
```

**2. Execute:**
```bash
cd backend
node setup-complete.js
```

---

## 🔍 Verificar se Foi Aplicado

Execute este SQL no banco:

```sql
-- Verificar se os novos campos existem
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'empresas'
AND column_name IN ('logo_url', 'banner_url', 'cor_primaria', 'titulo_hero');
```

Deve retornar 4 linhas. Se retornar vazio, a migration não foi aplicada.

---

## 📋 Após Aplicar a Migration

**1. Teste criar empresa novamente:**
```
https://agendaaquivistorias.com.br/admin
```

**2. Preencha (mínimo obrigatório):**
- Nome: `Criar Vistorias`
- Slug: `criar` (lowercase, sem espaços!)
- Email: `contato@criar.com`
- Chave PIX: `contato@criar.com`
- Telefone: `(67) 99999-9999`

**3. Campos opcionais (personalizações):**
```json
{
  "cor_primaria": "#FF5722",
  "titulo_hero": "Criar Vistorias - Agende Agora!",
  "whatsapp_numero": "5567999999999",
  "google_rating": 4.9,
  "meta_pixel_id": "SEU_PIXEL_ID"
}
```

**4. Deve aparecer a mensagem:**
```
✅ Empresa criada com sucesso!
🌐 Disponível em: https://agendaaquivistorias.com.br/criar
```

---

## 🔧 Se o Erro Persistir

### Verificar Logs do Render

**1. No Render Dashboard:**
- Selecione o Web Service
- Clique em **"Logs"**
- Procure por mensagens de erro

**Erros comuns:**

**A. "column X does not exist"**
```
ERROR: column "logo_url" of relation "empresas" does not exist
```
**Solução:** Migration não foi aplicada. Execute Opção 1 ou 2 acima.

**B. "null value in column X violates not-null constraint"**
```
ERROR: null value in column "chave_pix" violates not-null constraint
```
**Solução:** Preencha o campo obrigatório no formulário.

**C. "duplicate key value violates unique constraint"**
```
ERROR: duplicate key value violates unique constraint "empresas_slug_key"
```
**Solução:** O slug já existe. Use outro slug.

---

## 🎨 Criar Empresas com Personalização Completa

Após aplicar a migration, você pode criar empresas com TODOS os campos:

```bash
curl -X POST https://api.agendaaquivistorias.com.br/api/admin/empresas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "nome": "Criar Vistorias Premium",
    "slug": "criar",
    "email": "contato@criar.com",
    "telefone": "(67) 99999-9999",
    "chave_pix": "contato@criar.com",

    "preco_cautelar": 15000,
    "preco_transferencia": 12000,
    "preco_outros": 10000,

    "horario_inicio": "08:00:00",
    "horario_fim": "18:00:00",
    "intervalo_minutos": 60,

    "logo_url": "https://exemplo.com/logo.png",
    "banner_url": "https://exemplo.com/banner.jpg",
    "cor_primaria": "#FF5722",
    "cor_secundaria": "#212121",

    "titulo_hero": "Criar Vistorias - Excelência Garantida",
    "subtitulo_hero": "Agende sua vistoria agora mesmo!",

    "whatsapp_numero": "5567999999999",
    "facebook_url": "https://facebook.com/criar",
    "instagram_url": "https://instagram.com/criar",

    "google_rating": 4.9,
    "google_reviews_count": 250,

    "meta_pixel_id": "123456789",
    "google_analytics_id": "G-XXXXXXX"
  }'
```

---

## 🌐 URLs Corretas

**Frontend:**
- Principal: https://agendaaquivistorias.com.br/
- Admin: https://agendaaquivistorias.com.br/admin
- Empresa (path): https://agendaaquivistorias.com.br/criar
- Empresa (subdomain): https://criar.agendaaquivistorias.com.br

**Backend (API):**
- API Base: https://api.agendaaquivistorias.com.br/api
- Tenant config: https://api.agendaaquivistorias.com.br/api/tenant/config?slug=criar
- Admin empresas: https://api.agendaaquivistorias.com.br/api/admin/empresas

---

## ✅ Checklist Final

- [ ] Migration 006 aplicada (`npm run setup:complete`)
- [ ] Campos verificados no banco (SQL acima)
- [ ] Servidor reiniciado (deploy automático no Render)
- [ ] Empresa teste criada com sucesso
- [ ] Página da empresa carregando: `/criar`
- [ ] Personalização visual funcionando

---

## 🆘 Ainda com Problema?

**1. Cole os logs do Render aqui** (últimas 50 linhas)

**2. Verifique se a migration foi aplicada:**
```sql
SELECT COUNT(*) as campos_novos
FROM information_schema.columns
WHERE table_name = 'empresas'
AND column_name IN (
  'logo_url', 'banner_url', 'favicon_url',
  'cor_primaria', 'titulo_hero', 'whatsapp_numero'
);
```
Deve retornar: `campos_novos: 6`

**3. Teste o endpoint de tenant:**
```bash
curl "https://api.agendaaquivistorias.com.br/api/tenant/config?slug=demo"
```

Se retornar 404 ou erro, a migration não foi aplicada corretamente.

---

**Próximo passo:** Execute `npm run setup:complete` no Shell do Render agora! ⚡
