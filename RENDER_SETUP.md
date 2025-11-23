# Guia de Configuração no Render

Este projeto usa **dois serviços** no Render:
1. **Backend (Web Service)** - API Node.js
2. **Frontend (Static Site)** - Arquivos estáticos do Vite

## 1. Criar o Banco de Dados PostgreSQL

1. No dashboard do Render, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `agendamentos-db`
   - **Database:** `agendamentos`
   - **User:** `agendamentos_user`
   - **Region:** Oregon (ou mesma região dos outros serviços)
   - **Plan:** Free
3. Clique em **"Create Database"**
4. **Aguarde** a criação (pode levar alguns minutos)
5. **Copie** a **Internal Database URL** (você vai precisar dela)

---

## 2. Criar o Backend (Web Service)

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. **Connect** ao seu repositório GitHub `presleybr/agendaaqui`
3. Configure:

   **Basic Settings:**
   - **Name:** `agendaaqui-backend`
   - **Region:** Oregon (mesma do banco)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:**
     ```bash
     npm install && npm run migrate:postgres
     ```
   - **Start Command:**
     ```bash
     npm start
     ```

   **Advanced Settings → Environment Variables:**

   Adicione as seguintes variáveis:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | _(Conecte ao banco: clique em "Add from Database" → selecione `agendamentos-db`)_ |
   | `JWT_SECRET` | _(Clique em "Generate" para criar um valor aleatório)_ |
   | `FRONTEND_URL` | `*` _(ou a URL do seu domínio customizado)_ |

4. Clique em **"Create Web Service"**
5. **Aguarde** o deploy (5-10 minutos)
6. **Copie a URL** do backend (ex: `https://agendaaqui-backend.onrender.com`)

---

## 3. Criar o Frontend (Static Site)

1. No dashboard do Render, clique em **"New +"** → **"Static Site"**
2. **Connect** ao mesmo repositório GitHub `presleybr/agendaaqui`
3. Configure:

   **Basic Settings:**
   - **Name:** `agendaaqui-frontend`
   - **Region:** Oregon (mesma dos outros)
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory:** `dist`

   **Advanced Settings → Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://agendaaqui-backend.onrender.com/api` |

   ⚠️ **IMPORTANTE:** Substitua pela URL real do seu backend (copiada no passo 2.6)

   **Advanced Settings → Rewrite Rules:**

   Adicione a regra:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** Rewrite

4. Clique em **"Create Static Site"**
5. **Aguarde** o deploy (3-5 minutos)

---

## 4. Configurar Domínio Customizado (Opcional)

### Para o Frontend:

1. Vá no serviço **`agendaaqui-frontend`**
2. Clique em **"Settings"** → **"Custom Domains"**
3. Adicione seu domínio: `agendaaquivistorias.com.br`
4. Configure os registros DNS conforme instruções do Render:
   - **Tipo A:** Aponte para o IP fornecido
   - **Tipo CNAME (www):** `agendaaqui-frontend.onrender.com`

### Para o Backend:

Se quiser usar um subdomínio para a API (ex: `api.agendaaquivistorias.com.br`):

1. Vá no serviço **`agendaaqui-backend`**
2. Clique em **"Settings"** → **"Custom Domains"**
3. Adicione: `api.agendaaquivistorias.com.br`
4. Configure DNS:
   - **Tipo CNAME:** `agendaaqui-backend.onrender.com`
5. **Atualize** a variável `VITE_API_URL` no frontend para:
   ```
   https://api.agendaaquivistorias.com.br/api
   ```
6. **Redeploy** o frontend para aplicar a mudança

---

## 5. Verificar se está Funcionando

### Testar o Backend:

Acesse: `https://agendaaqui-backend.onrender.com/api/health`

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T...",
  "uptime": 123.45
}
```

### Testar o Frontend:

1. Acesse: `https://agendaaqui-frontend.onrender.com` (ou seu domínio)
2. A página inicial deve carregar
3. Acesse: `https://agendaaqui-frontend.onrender.com/admin.html`
4. O painel admin deve carregar
5. Tente fazer login com:
   - Email: `admin@vistoria.com`
   - Senha: `Admin123!@#`

---

## 6. Solução de Problemas

### Backend não inicia:

1. Verifique os **logs** do backend no Render
2. Confirme que a variável `DATABASE_URL` está configurada
3. Verifique se as migrations rodaram com sucesso

### Frontend não carrega a API:

1. Abra o **Console do navegador** (F12)
2. Verifique se a URL da API está correta
3. Confirme que `VITE_API_URL` está configurada no Static Site
4. Verifique os **logs de build** para ver se a variável foi usada

### Erro CORS:

1. Verifique a variável `FRONTEND_URL` no backend
2. Use `*` para permitir qualquer origem (ou a URL específica do frontend)

### Banco de dados vazio:

1. Entre no backend via **Shell** (Render Shell)
2. Execute: `npm run migrate:postgres`
3. Execute: `cd src && node setup.js && node create-admin.js`

---

## URLs Importantes

Após configurar, suas URLs serão:

- **Frontend:** `https://agendaaquivistorias.com.br/`
- **Admin Panel:** `https://agendaaquivistorias.com.br/admin.html`
- **API Backend:** `https://agendaaqui-backend.onrender.com/api/`
- **Health Check:** `https://agendaaqui-backend.onrender.com/api/health`

---

## Arquitetura Final

```
┌─────────────────────────────────────┐
│  agendaaquivistorias.com.br         │
│  (Static Site - Frontend)           │
│                                      │
│  - Serve: HTML, CSS, JS, imagens    │
│  - Vite build (React/Vue/Vanilla)   │
└──────────────┬──────────────────────┘
               │
               │ API Calls via HTTPS
               │
               ▼
┌─────────────────────────────────────┐
│  agendaaqui-backend.onrender.com    │
│  (Web Service - Node.js API)        │
│                                      │
│  - Express.js API                    │
│  - Rotas /api/*                      │
└──────────────┬──────────────────────┘
               │
               │ PostgreSQL Connection
               │
               ▼
┌─────────────────────────────────────┐
│  agendamentos-db                     │
│  (PostgreSQL Database)               │
│                                      │
│  - Armazena dados da aplicação       │
└─────────────────────────────────────┘
```
