# 🔧 CORRIGIR LOGIN DO SUPER ADMIN

## ❌ Problema
Login no `/admin` retorna erro 500: "Credenciais inválidas"

## 🔍 Causa
O usuário admin não foi criado corretamente no PostgreSQL durante o primeiro deploy.

## ✅ Solução

### **Opção 1: Atualizar Build Command no Render (RECOMENDADO)**

1. Acesse: https://dashboard.render.com
2. Selecione o serviço: `agendaaqui-backend`
3. Vá em **Settings** → **Build & Deploy**
4. Atualize o **Build Command** para:
   ```bash
   cd backend && npm install && node src/setup.js && node src/create-admin.js
   ```
5. Clique em **Save Changes**
6. Clique em **Manual Deploy** → **Clear build cache & deploy**

O script `create-admin.js` irá:
- ✅ Verificar se o admin existe
- ✅ Criar admin se não existir
- ✅ Atualizar senha se admin já existir
- ✅ Exibir credenciais nos logs

---

### **Opção 2: Executar Script Manual via Render Shell**

1. Acesse: https://dashboard.render.com
2. Selecione o serviço: `agendaaqui-backend`
3. Vá em **Shell**
4. Execute:
   ```bash
   cd backend
   node src/create-admin.js
   ```

Você verá a saída:
```
✅ Admin criado com sucesso!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CREDENCIAIS PARA LOGIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Email: automacoesvon@gmail.com
   Senha: 1657victOr@
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **Opção 3: Criar Admin via SQL (PostgreSQL)**

1. Acesse o PostgreSQL Database no Render
2. Vá em **Connect** → copie a **External URL**
3. Use um cliente PostgreSQL (DBeaver, pgAdmin, etc.) ou CLI:
   ```bash
   psql <EXTERNAL_DATABASE_URL>
   ```

4. Execute:
   ```sql
   -- Verificar se tabela existe
   SELECT * FROM usuarios_admin;

   -- Se estiver vazia, inserir admin
   -- Senha: 1657victOr@ (hash bcrypt)
   INSERT INTO usuarios_admin (nome, email, senha_hash, role, status)
   VALUES (
     'Victor',
     'automacoesvon@gmail.com',
     '$2a$10$YourBcryptHashHere',  -- Gerar hash abaixo
     'super_admin',
     'ativo'
   );
   ```

Para gerar o hash da senha:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('1657victOr@', 10).then(h => console.log(h));"
```

---

## 🧪 Testar Após Correção

### 1. Verificar Logs do Deploy
Procure por:
```
✅ Admin criado com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CREDENCIAIS PARA LOGIN:
   Email: automacoesvon@gmail.com
   Senha: 1657victOr@
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Testar Login via API
```bash
curl -X POST https://agendaaquivistorias.com.br/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "automacoesvon@gmail.com",
    "senha": "1657victOr@"
  }'
```

Deve retornar:
```json
{
  "token": "eyJhbGc...",
  "admin": {
    "id": 1,
    "nome": "Victor",
    "email": "automacoesvon@gmail.com",
    "role": "super_admin"
  }
}
```

### 3. Testar Login no Painel
1. Acesse: https://agendaaquivistorias.com.br/admin
2. Login:
   - Email: `automacoesvon@gmail.com`
   - Senha: `1657victOr@`
3. Deve redirecionar para dashboard

---

## 📝 Credenciais

**Email:** `automacoesvon@gmail.com`
**Senha:** `1657victOr@`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

---

## 🐛 Troubleshooting

### Erro: "bcryptjs module not found"
```bash
cd backend
npm install bcryptjs
node src/create-admin.js
```

### Erro: "usuarios_admin table does not exist"
Execute primeiro:
```bash
node src/setup.js
```

### Erro persistente
1. Verifique se as variáveis de ambiente estão corretas:
   - `ADMIN_EMAIL=automacoesvon@gmail.com`
   - `ADMIN_PASSWORD=1657victOr@`
   - `ADMIN_NAME=Victor`

2. Verifique logs completos do Render
3. Conecte no PostgreSQL e verifique a tabela:
   ```sql
   SELECT * FROM usuarios_admin;
   ```

---

## ✅ Checklist Final

- [ ] Build command atualizado no Render
- [ ] Deploy manual executado
- [ ] Logs mostram "Admin criado com sucesso"
- [ ] Teste de login via API retorna token
- [ ] Login no painel /admin funciona
- [ ] Dashboard carrega corretamente

---

**Data:** 2025-11-22
**Status:** 🔄 Deploy em andamento
