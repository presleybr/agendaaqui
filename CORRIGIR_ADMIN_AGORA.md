# 🔧 CORRIGIR ADMIN AGORA - 401 Unauthorized

## ✅ Boa Notícia
O erro mudou de **500** para **401**, o que significa:
- ✅ API está funcionando
- ✅ CORS corrigido
- ✅ Endpoint de login OK

## ❌ Problema
O admin no banco de dados ainda é o antigo (`admin@suavistoria.com`) ao invés de `automacoesvon@gmail.com`.

---

## 🛠️ SOLUÇÃO: Executar Script via Render Shell

### PASSO 1: Acessar o Shell do Render

1. Acesse: https://dashboard.render.com
2. Selecione o serviço: `agendaaqui-backend`
3. Clique em **Shell** (no menu lateral esquerdo)

### PASSO 2: Executar o Script create-admin.js

No terminal do Shell, execute:

```bash
cd backend
node src/create-admin.js
```

### PASSO 3: Verificar a Saída

**Se as variáveis de ambiente estiverem corretas**, você verá:

```
🔍 Verificando conexão com banco de dados...
📊 Usando: PostgreSQL

👤 Dados do admin:
   Email: automacoesvon@gmail.com
   Senha: 1657victOr@
   Nome: Victor

🔍 Verificando se admin já existe...
⚠️  Admin já existe no banco de dados!

Admin encontrado:
{
  id: 1,
  nome: 'Administrador',
  email: 'admin@suavistoria.com',
  ...
}

🔄 Atualizando senha...
✅ Senha atualizada com sucesso!
```

**Mas ESPERE!** O script está procurando por `automacoesvon@gmail.com` e não vai encontrar, então vai tentar criar um novo admin.

---

## ⚠️ IMPORTANTE: Verificar Variáveis de Ambiente no Render

Antes de executar o script, **VERIFIQUE** se estas variáveis estão configuradas no Render:

1. No Render, vá em **Environment** (menu lateral)
2. Procure por:
   ```
   ADMIN_EMAIL
   ADMIN_PASSWORD
   ADMIN_NAME
   ```

### Se NÃO estiverem configuradas:

1. Clique em **Add Environment Variable**
2. Adicione UMA POR UMA:

```
Key: ADMIN_EMAIL
Value: automacoesvon@gmail.com

Key: ADMIN_PASSWORD
Value: 1657victOr@

Key: ADMIN_NAME
Value: Victor
```

3. Clique em **Save Changes**
4. **Importante:** O serviço vai reiniciar automaticamente

### Se ESTIVEREM configuradas MAS COM VALORES ERRADOS:

1. Clique no botão de editar (lápis) ao lado de cada variável
2. Atualize os valores:
   ```
   ADMIN_EMAIL = automacoesvon@gmail.com
   ADMIN_PASSWORD = 1657victOr@
   ADMIN_NAME = Victor
   ```
3. Clique em **Save Changes**

---

## 🔄 APÓS CONFIGURAR AS VARIÁVEIS

### Opção 1: Aguardar Reinício Automático (RECOMENDADO)

1. Após salvar as variáveis, o Render vai **reiniciar** o serviço automaticamente
2. Aguarde o serviço voltar online (1-2 minutos)
3. O script `create-admin.js` roda automaticamente no Build Command
4. Veja os logs para confirmar:

```
✅ Admin criado com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CREDENCIAIS PARA LOGIN:
   Email: automacoesvon@gmail.com
   Senha: 1657victOr@
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Opção 2: Executar Manualmente via Shell

Se quiser forçar agora sem esperar:

1. Vá em **Shell**
2. Execute:
   ```bash
   cd backend
   export ADMIN_EMAIL=automacoesvon@gmail.com
   export ADMIN_PASSWORD=1657victOr@
   export ADMIN_NAME=Victor
   node src/create-admin.js
   ```

**IMPORTANTE:** Isso só funciona se você exportar as variáveis ANTES de rodar o script.

---

## 🧪 TESTAR O LOGIN

Após configurar tudo, teste o login:

### 1. Via Painel Admin
Acesse: https://agendaaquivistorias.com.br/admin

**Credenciais:**
- Email: `automacoesvon@gmail.com`
- Senha: `1657victOr@`

### 2. Via API (Curl)
```bash
curl -X POST https://agendaaquivistorias.com.br/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "automacoesvon@gmail.com",
    "senha": "1657victOr@"
  }'
```

**Resposta esperada (sucesso):**
```json
{
  "token": "eyJhbGc...",
  "admin": {
    "id": 2,
    "nome": "Victor",
    "email": "automacoesvon@gmail.com",
    "role": "super_admin"
  }
}
```

**Se ainda der 401:**
- Verifique se as variáveis de ambiente estão corretas no Render
- Veja os logs do último deploy
- Confirme se o create-admin.js rodou com sucesso

---

## 🔍 TROUBLESHOOTING

### Erro: "Variáveis de ambiente obrigatórias não definidas"

Significa que `ADMIN_EMAIL`, `ADMIN_PASSWORD` ou `ADMIN_NAME` não estão configuradas no Render.

**Solução:** Configure as variáveis conforme instruções acima.

### Erro: "Admin já existe" mas com email errado

Há dois admins no banco. Você pode:

1. **Opção A (RECOMENDADO):** Deletar o admin antigo via PostgreSQL:
   ```sql
   DELETE FROM usuarios_admin WHERE email = 'admin@suavistoria.com';
   ```

2. **Opção B:** Atualizar o email do admin existente:
   ```sql
   UPDATE usuarios_admin
   SET email = 'automacoesvon@gmail.com',
       nome = 'Victor',
       senha_hash = '$2a$10$...'  -- Hash da senha 1657victOr@
   WHERE email = 'admin@suavistoria.com';
   ```

Para executar SQL:
1. No Render, vá no seu **PostgreSQL Database**
2. Clique em **Connect**
3. Use a **PSQL Command** ou **External Connection**

---

## ✅ CHECKLIST

- [ ] Variáveis de ambiente configuradas no Render (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
- [ ] Serviço reiniciado (automático após salvar variáveis)
- [ ] Logs mostram "Admin criado com sucesso" com email correto
- [ ] Login via painel funciona
- [ ] Login via API retorna token

---

**Data:** 2025-11-22
**Status:** 🔄 Aguardando configuração de variáveis no Render
