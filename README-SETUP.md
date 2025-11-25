# 🚀 Guia Completo de Setup - Sistema Multi-Tenant

Este é o guia principal para configurar o sistema de vistorias multi-tenant.

---

## 📚 Documentação Disponível

### 🔥 **Para Resolver Problemas AGORA:**

1. **[RESOLVER-ERRO-500.md](./RESOLVER-ERRO-500.md)** ⚡
   - **Use quando:** Erro 500 ao criar empresa no admin
   - **Solução:** 3 opções para aplicar migration
   - **Tempo:** 5-10 minutos

2. **[COMO-EXECUTAR-SQL-NO-RENDER.md](./COMO-EXECUTAR-SQL-NO-RENDER.md)** 📘
   - **Use quando:** Precisa executar SQL no banco Render
   - **Contém:** Passo a passo visual com screenshots
   - **Tempo:** 5 minutos

3. **[EXECUTAR-NO-RENDER.sql](./EXECUTAR-NO-RENDER.sql)** 📄
   - **Use quando:** Quer copiar/colar SQL direto
   - **Executa:** Migration completa + cria 2 empresas exemplo
   - **Tempo:** 1 minuto

### 📖 **Para Entender o Sistema:**

4. **[CHECKLIST-INTEGRACAO.md](./CHECKLIST-INTEGRACAO.md)** ✅
   - Checklist completo de integração
   - Todas as alterações no sistema
   - Validação de cada parte
   - Troubleshooting detalhado

5. **[TRANSFERENCIAS-PIX.md](./TRANSFERENCIAS-PIX.md)** 💸
   - Como funciona o sistema de repasses
   - Configurar CRON job
   - Integração com PIX real
   - API de repasses

6. **[GUIA-RAPIDO-RENDER.md](./GUIA-RAPIDO-RENDER.md)** 🎯
   - Guia rápido para criar empresas
   - Personalização via SQL
   - URLs corretas do sistema

---

## 🎯 Fluxo de Setup Recomendado

### 1️⃣ **Primeira Vez** (Setup Inicial)

Execute no **Shell do Render**:
```bash
cd backend && npm run setup:complete
```

Isso vai:
- ✅ Aplicar migration 006 (campos de personalização)
- ✅ Criar tabelas `pagamento_splits` e `empresa_metricas`
- ✅ Criar empresa "vistoriapremium" de exemplo
- ✅ Verificar estrutura do banco

**Tempo:** ~30 segundos

---

### 2️⃣ **Criar Novas Empresas**

Acesse o painel admin:
```
https://agendaaquivistorias.com.br/admin
```

Faça login e vá em **"Empresas"** → **"Nova Empresa"**

**Campos obrigatórios:**
- Nome: `Nome da Empresa`
- Slug: `slug-da-empresa` (lowercase, sem espaços!)
- Email: `email@empresa.com`
- Chave PIX: `chave@pix.com`
- Telefone: `(67) 99999-9999`

**Campos opcionais (personalização):**
- Cores (cor_primaria, cor_secundaria, etc)
- Logo, banner, favicon
- Textos personalizados
- Redes sociais
- Analytics (Meta Pixel, Google Analytics)

Todas as empresas têm **comissão fixa de R$ 5,00** por transação.

---

### 3️⃣ **Acessar Páginas das Empresas**

Cada empresa tem 2 URLs:

**Via Path (recomendado):**
```
https://agendaaquivistorias.com.br/vistoriapremium
https://agendaaquivistorias.com.br/criar
```

**Via Subdomain:**
```
https://vistoriapremium.agendaaquivistorias.com.br
https://criar.agendaaquivistorias.com.br
```

---

### 4️⃣ **Personalizar Empresa**

Edite a empresa no admin ou via SQL:

```sql
UPDATE empresas
SET
  cor_primaria = '#FF5722',
  cor_secundaria = '#212121',
  logo_url = 'https://exemplo.com/logo.png',
  banner_url = 'https://exemplo.com/banner.jpg',
  titulo_hero = 'Seu Título Aqui',
  subtitulo_hero = 'Seu subtítulo aqui',
  whatsapp_numero = '5567999999999',
  google_rating = 4.9,
  google_reviews_count = 250,
  meta_pixel_id = 'SEU_PIXEL_ID',
  google_analytics_id = 'G-XXXXXXX'
WHERE slug = 'vistoriapremium';
```

A página será atualizada automaticamente!

---

## 🔧 Resolução de Problemas

### ❌ Erro 500 ao Criar Empresa
➡️ Leia: [RESOLVER-ERRO-500.md](./RESOLVER-ERRO-500.md)

**Causa:** Migration não aplicada
**Solução:** Execute `npm run setup:complete` no Shell do Render

---

### ❌ Página 404 (Empresa Não Encontrada)
➡️ Leia: [GUIA-RAPIDO-RENDER.md](./GUIA-RAPIDO-RENDER.md)

**Causa:** Empresa não existe no banco
**Solução:** Crie a empresa no admin ou execute o SQL

---

### ❌ Sem Personalização Visual
➡️ Leia: [CHECKLIST-INTEGRACAO.md](./CHECKLIST-INTEGRACAO.md)

**Causa:** Campos NULL no banco ou migration não aplicada
**Solução:** Verifique se migration foi aplicada:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'empresas'
AND column_name IN ('logo_url', 'cor_primaria', 'titulo_hero');
```

---

### ❌ Repasses PIX Não Funcionam
➡️ Leia: [TRANSFERENCIAS-PIX.md](./TRANSFERENCIAS-PIX.md)

**Causa:** Sistema está em modo simulado
**Solução:** Configure integração com Mercado Pago, Asaas ou PagBank

---

## 🌐 URLs do Sistema

### Frontend
- Principal: https://agendaaquivistorias.com.br/
- Admin: https://agendaaquivistorias.com.br/admin
- Super Admin: https://agendaaquivistorias.com.br/super-admin
- Empresa (path): https://agendaaquivistorias.com.br/{slug}
- Empresa (subdomain): https://{slug}.agendaaquivistorias.com.br

### Backend (API)
- Base: https://api.agendaaquivistorias.com.br/api
- Health: https://api.agendaaquivistorias.com.br/api/health
- Tenant config: https://api.agendaaquivistorias.com.br/api/tenant/config?slug={slug}
- Admin empresas: https://api.agendaaquivistorias.com.br/api/admin/empresas
- Repasses: https://api.agendaaquivistorias.com.br/api/repasses/pendentes

---

## 📋 Estrutura de Arquivos

```
agendaaqui/
├── README-SETUP.md                  ← VOCÊ ESTÁ AQUI
├── RESOLVER-ERRO-500.md             ← Resolver erro ao criar empresa
├── COMO-EXECUTAR-SQL-NO-RENDER.md   ← Passo a passo SQL
├── EXECUTAR-NO-RENDER.sql           ← Script SQL pronto
├── CHECKLIST-INTEGRACAO.md          ← Checklist completo
├── TRANSFERENCIAS-PIX.md            ← Guia de repasses PIX
├── GUIA-RAPIDO-RENDER.md            ← Guia rápido
│
├── backend/
│   ├── setup-complete.js            ← Script automático de setup
│   ├── apply-migration.js           ← Aplica migration
│   ├── src/
│   │   ├── migrations/
│   │   │   └── 006_fix_and_customization.sql  ← Migration principal
│   │   ├── models/
│   │   │   └── Empresa.js           ← Modelo com todos campos
│   │   ├── controllers/
│   │   │   └── empresaController.js ← Controller de empresas
│   │   ├── routes/
│   │   │   ├── empresas.js          ← Rotas admin de empresas
│   │   │   ├── tenant.js            ← Rotas de tenant config
│   │   │   └── repasses.js          ← Rotas de repasses PIX
│   │   └── services/
│   │       ├── PaymentSplitService.js    ← Split R$ 5,00
│   │       └── PixTransferService.js     ← Transferências PIX
│
└── frontend/
    └── src/
        ├── main.js                  ← Aplica personalização
        └── services/
            └── tenant.js            ← Detecta tenant
```

---

## 🎓 Conceitos Importantes

### Multi-Tenant
Cada empresa é um "tenant" com:
- URL própria (path ou subdomain)
- Dados isolados
- Personalização visual única
- Comissão fixa de R$ 5,00

### Split de Pagamento
- Cliente paga R$ 100
- R$ 5 → Plataforma (você)
- R$ 95 → Empresa vendedora
- Registro em `pagamento_splits`

### Personalização Visual
Cada empresa pode ter:
- Cores próprias
- Logo e banner
- Textos customizados
- Redes sociais
- Analytics próprio

---

## 🚀 Comandos Úteis

### No Shell do Render (Backend)
```bash
# Setup completo (primeira vez)
npm run setup:complete

# Apenas migration
node apply-migration.js

# Verificar empresas
psql $DATABASE_URL -c "SELECT slug, nome, status FROM empresas;"
```

### No psql (Banco de Dados)
```sql
-- Listar empresas
SELECT id, nome, slug, status FROM empresas;

-- Ver campos de uma empresa
SELECT * FROM empresas WHERE slug = 'vistoriapremium';

-- Atualizar personalização
UPDATE empresas SET cor_primaria = '#FF5722' WHERE slug = 'criar';

-- Ver splits pendentes
SELECT * FROM pagamento_splits WHERE status_repasse = 'pendente';
```

---

## 📊 Métricas e Monitoramento

### Dashboard Super Admin
```
https://agendaaquivistorias.com.br/super-admin
```

Ver:
- Total de empresas ativas
- Receita do mês
- Comissões da plataforma
- Repasses pendentes

### API de Repasses
```bash
# Listar pendentes
curl -H "Authorization: Bearer TOKEN" \
  https://api.agendaaquivistorias.com.br/api/repasses/pendentes

# Processar todos
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://api.agendaaquivistorias.com.br/api/repasses/processar
```

---

## 🆘 Suporte

**Problemas não resolvidos?**

1. Verifique os guias específicos listados no topo
2. Cheque os logs do Render
3. Teste os endpoints da API
4. Verifique se migration foi aplicada

**Contatos:**
- GitHub Issues: https://github.com/presleybr/agendaaqui/issues
- Documentação: Arquivos .md na raiz do projeto

---

## ✅ Checklist de Setup Completo

- [ ] Migration 006 aplicada (`npm run setup:complete`)
- [ ] Tabelas criadas (pagamento_splits, empresa_metricas)
- [ ] Empresa "vistoriapremium" criada
- [ ] Página carrega: /vistoriapremium
- [ ] Consegue criar nova empresa no admin
- [ ] Personalização visual funciona
- [ ] API /tenant/config retorna dados completos
- [ ] Split de R$ 5,00 configurado

---

**🎉 Sistema pronto para uso!**

Comece criando sua primeira empresa em: https://agendaaquivistorias.com.br/admin
