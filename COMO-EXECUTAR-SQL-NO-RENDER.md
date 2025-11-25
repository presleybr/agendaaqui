# 📘 Como Executar SQL no Render (Passo a Passo com Imagens)

## 🎯 Objetivo
Aplicar a migration 006 para resolver o erro 500 ao criar empresas.

---

## 🚀 Método 1: SQL Editor do Render (MAIS FÁCIL)

### Passo 1: Acessar o Dashboard
1. Entre em: **https://dashboard.render.com**
2. Faça login na sua conta

### Passo 2: Selecionar o Banco de Dados
1. No menu lateral, clique em **"PostgreSQL"** ou procure seu banco
2. Clique no nome do seu banco de dados (ex: `agendaaqui-db`)

### Passo 3: Abrir SQL Editor
Você tem 2 opções:

**Opção A: SQL Editor Nativo (se disponível)**
1. Na página do banco, procure por um botão **"SQL Editor"** ou **"Query"**
2. Clique para abrir o editor

**Opção B: Conectar via Cliente Externo**
1. Clique no botão **"Connect"** (canto superior direito)
2. Selecione **"External Connection"**
3. Copie a **"External Database URL"**

### Passo 4: Executar o SQL

**Se usando SQL Editor nativo:**
1. Copie TODO o conteúdo do arquivo `EXECUTAR-NO-RENDER.sql`
2. Cole no editor SQL
3. Clique em **"Execute"** ou **"Run"**
4. Aguarde a execução (pode levar 10-30 segundos)
5. Verifique se apareceu "✅ Success" ou similar

**Se usando cliente externo (DBeaver, pgAdmin, etc):**
1. Abra seu cliente SQL favorito
2. Conecte usando a URL copiada
3. Abra o arquivo `EXECUTAR-NO-RENDER.sql`
4. Execute o script completo
5. Verifique os resultados

### Passo 5: Verificar se Funcionou

Execute esta query para confirmar:
```sql
SELECT COUNT(*) as campos_novos
FROM information_schema.columns
WHERE table_name = 'empresas'
AND column_name IN (
  'logo_url', 'banner_url', 'cor_primaria',
  'titulo_hero', 'whatsapp_numero', 'google_rating'
);
```

**Resultado esperado:** `campos_novos: 6`

Se retornar 0, algo deu errado.

---

## 🚀 Método 2: Via psql (Terminal)

### Passo 1: Obter Connection String
1. Dashboard Render → PostgreSQL database
2. Clique em **"Connect"** → **"External Connection"**
3. Copie a **"PSQL Command"** (exemplo):
   ```
   psql postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/database
   ```

### Passo 2: Conectar via Terminal
```bash
# Cole o comando copiado
psql postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/database
```

### Passo 3: Executar o Script
```bash
# Dentro do psql, execute:
\i /caminho/para/EXECUTAR-NO-RENDER.sql

# Ou copie e cole o conteúdo direto no terminal
```

### Passo 4: Verificar
```sql
\d empresas

-- Deve listar os novos campos:
-- logo_url, banner_url, cor_primaria, titulo_hero, etc
```

---

## 🚀 Método 3: Via Shell do Render (AUTOMÁTICO)

### Passo 1: Acessar o Shell
1. Dashboard Render → Selecione seu **Web Service** (backend)
2. Clique na aba **"Shell"**
3. Aguarde o terminal carregar

### Passo 2: Executar o Script
```bash
cd backend && npm run setup:complete
```

### Passo 3: Aguardar Conclusão
Você verá:
```
🚀 Configuração Completa do Sistema
==================================================

📦 PASSO 1: Aplicando Migration 006...
✅ Migration 006 aplicada com sucesso!

🏢 PASSO 2: Criando empresa Vistoria Premium...
✅ Empresa criada/atualizada:
   ID: 2
   Nome: Vistoria Premium
   Slug: vistoriapremium
   Email: contato@vistoriapremium.com.br
   Status: ativo

🔍 PASSO 3: Verificando estrutura do banco...
📋 Tabelas verificadas:
   ✓ empresas
   ✓ empresa_metricas
   ✓ pagamento_splits

✅ CONFIGURAÇÃO COMPLETA!
🎉 Sistema pronto para uso!
```

---

## ✅ Verificação Final

### Teste 1: API do Tenant
```bash
curl "https://api.agendaaquivistorias.com.br/api/tenant/config?slug=vistoriapremium"
```

**Resposta esperada:**
```json
{
  "id": 2,
  "nome": "Vistoria Premium",
  "slug": "vistoriapremium",
  "visual": {
    "cor_primaria": "#1976d2",
    "cor_secundaria": "#424242",
    "logo_url": null,
    ...
  },
  "textos": {
    "titulo_hero": "Vistoria Premium - Excelência...",
    ...
  },
  ...
}
```

### Teste 2: Criar Empresa no Admin
1. Acesse: https://agendaaquivistorias.com.br/admin
2. Faça login
3. Vá em **"Empresas"**
4. Clique em **"Nova Empresa"**
5. Preencha:
   - Nome: `Teste`
   - Slug: `teste`
   - Email: `teste@teste.com`
   - Chave PIX: `teste@teste.com`
   - Telefone: `(67) 99999-9999`
6. Clique em **"Salvar"**

**Deve aparecer:**
```
✅ Empresa criada com sucesso!
🌐 Disponível em: https://agendaaquivistorias.com.br/teste
```

### Teste 3: Acessar Página da Empresa
```
https://agendaaquivistorias.com.br/vistoriapremium
```

**Deve carregar a página com:**
- ✅ Sem erros 404 ou 500
- ✅ Título: "Vistoria Premium - Excelência..."
- ✅ Cores aplicadas
- ✅ Console sem erros (F12)

---

## 🆘 Problemas Comuns

### ❌ Erro: "permission denied"
**Solução:** Você não tem permissão no banco. Entre em contato com quem gerencia o Render.

### ❌ Erro: "relation empresas does not exist"
**Solução:** Banco não foi inicializado. Execute primeiro:
```bash
npm run migrate:postgres
```

### ❌ Erro: "column already exists"
**Solução:** Migration já foi aplicada parcialmente. Não é um problema, pode ignorar.

### ❌ SQL Editor não aparece no Render
**Solução:** Use o Método 2 (psql) ou Método 3 (Shell).

### ❌ Empresa criada mas sem personalização
**Solução:** Verifique se os campos foram salvos:
```sql
SELECT slug, cor_primaria, titulo_hero
FROM empresas
WHERE slug = 'teste';
```

Se retornar NULL, a migration não foi aplicada corretamente.

---

## 📞 URLs Corretas

Certifique-se de estar usando:

**Frontend:**
- ✅ https://agendaaquivistorias.com.br/
- ✅ https://agendaaquivistorias.com.br/admin
- ✅ https://agendaaquivistorias.com.br/vistoriapremium

**Backend (API):**
- ✅ https://api.agendaaquivistorias.com.br/api
- ✅ https://api.agendaaquivistorias.com.br/api/tenant/config?slug=X
- ✅ https://api.agendaaquivistorias.com.br/api/admin/empresas

**NÃO usar:**
- ❌ agendaaqui-backend.onrender.com (URL antiga)
- ❌ localhost (só desenvolvimento)

---

## 🎉 Pronto!

Após executar o SQL, você pode:
1. ✅ Criar empresas no admin sem erro 500
2. ✅ Personalizar cores, textos, logo
3. ✅ Acessar páginas das empresas
4. ✅ Sistema multi-tenant funcionando

---

**Dúvidas?** Verifique o arquivo `RESOLVER-ERRO-500.md` para mais detalhes.
