# 🔄 Como Resetar o Banco de Dados no Render

## ⚠️ Situação Atual

O deploy no Render está falhando porque:
1. A migração antiga foi executada (sem tabela `empresas`)
2. O código novo espera a tabela `empresas`
3. Resultado: Erros 500 em todos os endpoints

## 🎯 Solução: Resetar o Banco de Dados

### Opção 1: Via Dashboard do Render (RECOMENDADO)

1. **Acessar o Dashboard:**
   - Vá para: https://dashboard.render.com
   - Entre com sua conta

2. **Encontrar o Database:**
   - No menu lateral, clique em "PostgreSQL"
   - Selecione: `agendamentos-db`

3. **Conectar via psql Shell:**
   - Clique na aba "Shell" ou "Connect"
   - Clique em "PSQL Command" para copiar o comando
   - Cole no terminal local OU use o Shell Web do Render

4. **Resetar o Schema:**
   ```sql
   -- CUIDADO: Isso vai deletar TODOS os dados!
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   \q
   ```

5. **Fazer Re-deploy do Backend:**
   - Vá para: https://dashboard.render.com
   - Selecione: `agendaaqui-backend`
   - Clique em "Manual Deploy" → "Deploy latest commit"
   - Aguarde o deploy (vai executar a migração nova automaticamente)

### Opção 2: Criar um Novo Database

Se preferir não resetar (manter backup):

1. **Criar Novo Database:**
   - Dashboard → New → PostgreSQL
   - Nome: `agendamentos-db-v2`
   - Região: Oregon
   - Plan: Free

2. **Copiar Connection String:**
   - Abra o novo database
   - Copie a "Internal Database URL"

3. **Atualizar Web Service:**
   - Vá em `agendaaqui-backend`
   - Environment → DATABASE_URL
   - Cole a nova URL
   - Save Changes

4. **Deploy Manual:**
   - Manual Deploy → Deploy latest commit

### Opção 3: Via Script Local (Avançado)

Se você tem acesso à DATABASE_URL:

```bash
# 1. Instalar psql localmente (se não tiver)
# Mac:
brew install postgresql

# 2. Conectar ao banco
psql "sua_database_url_aqui"

# 3. Resetar
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
\q

# 4. Fazer deploy manual no Render
```

## ✅ Como Verificar se Funcionou

Após o deploy:

1. **Verificar Health Check:**
   ```bash
   curl https://agendaaqui-backend.onrender.com/api/health
   ```

   Deve retornar:
   ```json
   {
     "status": "ok",
     "database": {
       "connected": true,
       "type": "postgresql",
       "message": "Conexão PostgreSQL estabelecida"
     }
   }
   ```

2. **Verificar Logs do Deploy:**
   - Dashboard → agendaaqui-backend → Logs
   - Procure por: "✅ Migração concluída com sucesso!"
   - Deve mostrar: "Tabelas criadas: usuarios_admin, empresas, ..."

3. **Testar Login:**
   - Acesse: https://agendaaquivistorias.com.br/admin
   - Login: admin@vistoria.com
   - Senha: Admin123!@#

4. **Verificar Seção Empresas:**
   - No painel admin, clique em "Empresas"
   - Deve mostrar a empresa "Vistoria Express Demo"
   - Tente criar uma nova empresa

## 🔍 Troubleshooting

### Erro: "permission denied to create extension"
```sql
-- Executar como superuser (na shell do Render):
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: "database is being accessed by other users"
```sql
-- Desconectar todos os usuários primeiro:
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'agendamentos' AND pid <> pg_backend_pid();

-- Depois resetar
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Migração não executa automaticamente
- Verifique se o `buildCommand` no render.yaml está correto
- Deve ser: `npm install && npm run migrate:postgres`
- Faça deploy manual: Dashboard → Manual Deploy

## 📊 O que Será Criado

Após o reset e deploy, você terá:

### Tabelas
- ✅ `usuarios_admin` - Super admins
- ✅ `empresas` - Empresas clientes (multi-tenant)
- ✅ `configuracoes` - Configurações por empresa
- ✅ `clientes` - Clientes finais
- ✅ `veiculos` - Veículos
- ✅ `agendamentos` - Agendamentos
- ✅ `pagamentos` - Pagamentos
- ✅ `transacoes` - Comissões e repasses
- ✅ `notificacoes` - Notificações

### Dados Iniciais
- ✅ Super Admin: `admin@vistoria.com` / `Admin123!@#`
- ✅ Empresa Demo: slug `demo`

## ⏱️ Tempo Estimado

- Reset do banco: 1-2 minutos
- Deploy + Migração: 3-5 minutos
- **Total: ~5-7 minutos**

## 🔧 Fix: Ativar Super Admin

Se você receber erro "Usuário admin inativo" após o login, execute:

### Via pgAdmin (mais rápido):
```sql
UPDATE usuarios_admin
SET ativo = true
WHERE email = 'admin@vistoria.com';
```

### Via Script Node.js (localmente):
```bash
cd backend
node fix-admin-ativo.js
```

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique os logs no Render
2. Teste o health check endpoint
3. Verifique se a DATABASE_URL está configurada
4. Confirme que a região do DB e Web Service são as mesmas
5. Se receber "admin inativo", execute o fix acima
