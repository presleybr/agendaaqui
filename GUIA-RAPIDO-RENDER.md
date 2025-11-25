# 🚀 Guia Rápido - Resolver Erro 404 no Render

## Problema
Ao acessar `https://agendaaquivistorias.com.br/vistoriapremium` aparece erro 404 porque a empresa não existe no banco de dados.

## Solução Rápida

### Opção 1: Script Automático (RECOMENDADO) ⚡

Execute este comando **uma única vez** no Shell do Render:

```bash
cd backend && npm run setup:complete
```

Isso vai:
- ✅ Aplicar migration 006 (campos de personalização)
- ✅ Criar empresa "vistoriapremium" no banco
- ✅ Configurar cores, textos, preços
- ✅ Listar todas as empresas

**Como acessar o Shell do Render:**
1. Entre em: https://dashboard.render.com
2. Selecione seu Web Service (backend)
3. Clique na aba **"Shell"**
4. Digite o comando acima

---

### Opção 2: SQL Manual 📝

Se preferir executar SQL manualmente:

**1. Acesse o banco PostgreSQL:**
- Dashboard Render → PostgreSQL database
- Clique em "Connect" → "External Connection"
- Use `psql` ou qualquer cliente SQL

**2. Execute este SQL:**

```sql
-- Aplicar campos de personalização (se ainda não foi feito)
-- Ver arquivo: backend/src/migrations/006_fix_and_customization.sql

-- Criar empresa vistoriapremium
INSERT INTO empresas (
  nome, slug, email, telefone, chave_pix, status, plano,
  preco_cautelar, preco_transferencia, preco_outros,
  horario_inicio, horario_fim, intervalo_minutos,
  cor_primaria, cor_secundaria,
  titulo_hero, subtitulo_hero,
  google_rating, google_reviews_count,
  whatsapp_numero,
  percentual_plataforma, data_inicio
) VALUES (
  'Vistoria Premium',
  'vistoriapremium',
  'contato@vistoriapremium.com.br',
  '(67) 99999-9999',
  'contato@vistoriapremium.com.br',
  'ativo',
  'premium',
  15000, 12000, 10000,
  '08:00:00', '18:00:00', 60,
  '#1976d2', '#424242',
  'Vistoria Premium - Excelência em Vistorias Veiculares',
  'Agende sua vistoria com os melhores profissionais do mercado',
  5.0, 150,
  '5567999999999',
  500, CURRENT_DATE
)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  updated_at = CURRENT_TIMESTAMP;
```

**3. Verificar se foi criada:**

```sql
SELECT id, nome, slug, email, status
FROM empresas
WHERE slug = 'vistoriapremium';
```

---

## Verificar se Funcionou ✅

### 1. Testar API (Backend)
```bash
curl "https://seu-backend.onrender.com/api/tenant/config?slug=vistoriapremium"
```

Deve retornar JSON com:
```json
{
  "id": 2,
  "nome": "Vistoria Premium",
  "slug": "vistoriapremium",
  "email": "contato@vistoriapremium.com.br",
  "precos": { "cautelar": 15000, ... },
  "visual": { "cor_primaria": "#1976d2", ... },
  "textos": { "titulo_hero": "...", ... }
}
```

### 2. Testar Frontend
Acesse: `https://agendaaquivistorias.com.br/vistoriapremium`

Deve carregar a página com:
- ✅ Título: "Vistoria Premium - Excelência em Vistorias Veiculares"
- ✅ Cores personalizadas
- ✅ Preços corretos

### 3. Verificar Console do Navegador
Abra DevTools (F12) → Console

Deve aparecer:
```
🔍 Verificando se é tenant...
🏢 Sistema multi-tenant detectado!
📦 Configurações recebidas: {...}
🎨 Aplicando personalização visual...
✅ Personalização visual aplicada com sucesso!
```

---

## Erros Comuns e Soluções

### ❌ Erro: "Tabela empresas não tem coluna X"
**Causa:** Migration 006 não foi aplicada

**Solução:**
```bash
cd backend && npm run setup:complete
```

### ❌ Erro: "Empresa não encontrada"
**Causa:** Empresa não existe no banco

**Solução:** Execute o SQL acima ou o script setup:complete

### ❌ Erro: "favicon.ico 404"
**Causa:** Arquivo não existe (normal)

**Solução:** Isso é normal e não afeta o funcionamento. Para resolver:
1. Adicione um favicon.svg no `frontend/public/`
2. Ou ignore (não é crítico)

---

## Criar Mais Empresas 🏢

Para criar outras empresas, basta duplicar o SQL mudando:

```sql
INSERT INTO empresas (
  nome, slug, email, ...
) VALUES (
  'Nome da Empresa',        -- Nome completo
  'slugdaempresa',          -- IMPORTANTE: lowercase, sem espaços
  'email@empresa.com',
  ...
);
```

**IMPORTANTE:** O `slug` deve ser:
- ✅ Lowercase (minúsculas)
- ✅ Sem espaços
- ✅ Sem caracteres especiais
- ✅ Único (não pode repetir)

**Exemplos de slugs válidos:**
- ✅ `vistoriasp`
- ✅ `vistoria-rio`
- ✅ `vistorias123`

**Exemplos de slugs INVÁLIDOS:**
- ❌ `Vistoria SP` (tem espaço e maiúscula)
- ❌ `vistória` (tem acento)
- ❌ `vistoria/sp` (tem barra)

---

## Personalizar Empresa via SQL 🎨

Depois de criar, você pode personalizar:

```sql
UPDATE empresas
SET
  -- Cores
  cor_primaria = '#FF5722',
  cor_secundaria = '#212121',
  cor_texto = '#333333',
  cor_fundo = '#ffffff',

  -- Textos
  titulo_hero = 'Seu novo título aqui',
  subtitulo_hero = 'Seu novo subtítulo aqui',

  -- Logo e Banner
  logo_url = 'https://exemplo.com/logo.png',
  banner_url = 'https://exemplo.com/banner.jpg',

  -- Avaliações
  google_rating = 4.9,
  google_reviews_count = 250,

  -- WhatsApp (formato: 55 + DDD + número)
  whatsapp_numero = '5511999999999',

  -- Analytics
  meta_pixel_id = 'SEU_PIXEL_ID',
  google_analytics_id = 'G-XXXXXXX'

WHERE slug = 'vistoriapremium';
```

---

## Próximos Passos 📋

Depois de criar a empresa:

1. ✅ Acessar: `https://agendaaquivistorias.com.br/vistoriapremium`
2. ✅ Configurar cores e logo via SQL (acima)
3. ✅ Testar agendamento
4. ✅ Configurar Meta Pixel e Google Analytics
5. ✅ Configurar CRON job para repasses (ver TRANSFERENCIAS-PIX.md)

---

## Suporte 💬

Se os erros persistirem:
1. Verifique os logs do Render
2. Teste a API: `/api/tenant/config?slug=vistoriapremium`
3. Verifique se a migration foi aplicada: `\d empresas` no psql
4. Verifique se NODE_ENV=production no Render

---

**Pronto!** Após executar o script, acesse:
👉 https://agendaaquivistorias.com.br/vistoriapremium
