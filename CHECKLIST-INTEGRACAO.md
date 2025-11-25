# ✅ Checklist de Integração - Sistema Multi-Tenant

Este documento lista todas as alterações realizadas e os passos para garantir que tudo está funcionando corretamente com o PostgreSQL do Render.

## 📋 1. Alterações no Banco de Dados

### Migration Criada
- ✅ **`backend/src/migrations/006_fix_and_customization.sql`**
  - Corrige incompatibilidades entre schemas antigos e novos
  - Adiciona campos de personalização visual
  - Cria tabelas `pagamento_splits` e `empresa_metricas` se não existirem
  - Adiciona campos: logo_url, banner_url, cores, textos personalizados, etc.

### Campos Adicionados na Tabela `empresas`

**Campos de Pagamento:**
- `percentual_plataforma` INTEGER DEFAULT 500 (R$ 5,00 fixo)
- `data_inicio` DATE (para calcular tempo de uso)

**Campos Visuais:**
- `logo_url` TEXT
- `banner_url` TEXT
- `favicon_url` TEXT
- `cor_primaria` VARCHAR(7)
- `cor_secundaria` VARCHAR(7)
- `cor_texto` VARCHAR(7)
- `cor_fundo` VARCHAR(7)
- `fonte_primaria` VARCHAR(100)

**Campos de Conteúdo:**
- `titulo_hero` TEXT
- `subtitulo_hero` TEXT
- `texto_sobre` TEXT

**Campos de Marketing:**
- `meta_pixel_id` VARCHAR(50)
- `google_analytics_id` VARCHAR(50)
- `whatsapp_numero` VARCHAR(20)
- `facebook_url` TEXT
- `instagram_url` TEXT
- `linkedin_url` TEXT
- `website_url` TEXT

**Avaliações:**
- `google_rating` DECIMAL(2,1)
- `google_reviews_count` INTEGER
- `mostrar_avaliacoes` BOOLEAN
- `mostrar_whatsapp_float` BOOLEAN

### Novas Tabelas

**`pagamento_splits`** - Registro de cada divisão de pagamento
```sql
Campos principais:
- pagamento_id
- empresa_id
- valor_total
- valor_plataforma (R$ 5,00)
- valor_empresa (restante)
- status_repasse (pendente/processando/concluido/erro)
- chave_pix_destino
- comprovante_repasse
```

**`empresa_metricas`** - Métricas mensais por empresa
```sql
Campos principais:
- empresa_id
- mes, ano
- total_agendamentos
- total_receita
- total_comissao_plataforma
- total_repasses
```

## 📋 2. Alterações no Backend

### Modelos Atualizados

**`backend/src/models/Empresa.js`**
- ✅ `getSplitsPendentes()` - Busca splits pendentes da tabela correta
- ✅ `registrarSplit()` - Registra novo split no banco
- ✅ `atualizarRepasse()` - Atualiza status do repasse
- ✅ `updateMetricas()` - Atualiza métricas mensais (UPSERT)

### Rotas Criadas/Atualizadas

**`backend/src/routes/tenant.js`**
- ✅ Endpoint retorna todas configurações visuais e personalizadas
- ✅ Suporta busca por slug (query parameter)
- ✅ Retorna cores, textos, avaliações, analytics, etc.

**`backend/src/routes/repasses.js`** (NOVO)
- ✅ `GET /api/repasses/pendentes` - Lista repasses pendentes
- ✅ `POST /api/repasses/processar` - Processa todos
- ✅ `POST /api/repasses/processar/:id` - Processa específico
- ✅ `POST /api/repasses/cron` - Endpoint para CRON automático
- ✅ `GET /api/repasses/empresa/:id` - Métricas por empresa

**`backend/src/server.js`**
- ✅ Rotas de repasses registradas

### Serviços Criados

**`backend/src/services/PixTransferService.js`** (NOVO)
- ✅ Transferências PIX com validação
- ✅ Suporte a múltiplos provedores
- ✅ Modo simulado por padrão
- ✅ Documentação de integração

**`backend/src/services/PaymentSplitService.js`** (ATUALIZADO)
- ✅ Split fixo de R$ 5,00 (removida lógica de 30 dias)
- ✅ Integração com PixTransferService
- ✅ Processamento automático de repasses
- ✅ Melhor tracking e logs

## 📋 3. Alterações no Frontend

### Serviços

**`frontend/src/main.js`**
- ✅ Função `applyCustomization()` completa
- ✅ Aplica cores personalizadas via CSS Custom Properties
- ✅ Substitui logo, banner, favicon
- ✅ Atualiza textos do hero
- ✅ Configura WhatsApp float
- ✅ Atualiza avaliações Google
- ✅ Injeta Meta Pixel e Google Analytics

**`frontend/src/services/tenant.js`**
- ✅ Já estava implementado corretamente
- ✅ Detecta tenant por subdomain ou path

## 📋 4. Passos para Aplicar

### Passo 1: Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` tem:
```env
DATABASE_URL=postgresql://usuario:senha@host/database
MP_ACCESS_TOKEN=seu_token_mercado_pago
CRON_TOKEN=token_secreto_para_cron
```

### Passo 2: Aplicar Migration

Opção A - Script Node.js (Recomendado):
```bash
cd backend
node apply-migration.js
```

Opção B - psql direto:
```bash
psql $DATABASE_URL -f backend/src/migrations/006_fix_and_customization.sql
```

Opção C - Via código do servidor:
```bash
cd backend
node -e "require('dotenv').config(); const db = require('./src/config/database'); const fs = require('fs'); const sql = fs.readFileSync('./src/migrations/006_fix_and_customization.sql', 'utf8'); db.query(sql).then(() => { console.log('✅ Migration aplicada!'); process.exit(0); }).catch(err => { console.error('❌ Erro:', err); process.exit(1); });"
```

### Passo 3: Verificar Tabelas Criadas

```sql
-- Conectar ao banco
psql $DATABASE_URL

-- Verificar colunas de empresas
\d empresas

-- Verificar se tabelas foram criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pagamento_splits', 'empresa_metricas');

-- Verificar estrutura
\d pagamento_splits
\d empresa_metricas
```

### Passo 4: Testar Endpoints

**1. Testar configuração do tenant:**
```bash
curl "http://localhost:3000/api/tenant/config?slug=demo"
```

Deve retornar JSON com:
- nome, email, telefone
- precos (cautelar, transferencia, outros)
- horarios (inicio, fim, intervalo_minutos)
- visual (cores, logo_url, banner_url, etc)
- textos (titulo_hero, subtitulo_hero)
- contato (whatsapp, redes sociais)
- avaliacoes (rating, count)
- analytics (meta_pixel_id, google_analytics_id)

**2. Testar repasses (como super admin):**
```bash
# Listar pendentes
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/repasses/pendentes

# Processar todos
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/repasses/processar
```

### Passo 5: Testar no Frontend

1. **Iniciar frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Acessar página de empresa:**
   ```
   http://localhost:5173/demo
   ```

3. **Verificar personalizações aplicadas:**
   - Abrir DevTools → Console
   - Deve ver logs: "🎨 Aplicando personalização visual..."
   - Verificar CSS Custom Properties no Elements

4. **Testar diferentes empresas:**
   - Criar empresa no admin: `/super-admin`
   - Configurar campos visuais
   - Acessar: `http://localhost:5173/slug-da-empresa`

## 📋 5. Checklist de Validação

### Banco de Dados
- [ ] Migration 006 aplicada sem erros
- [ ] Tabela `empresas` tem todos os novos campos
- [ ] Tabela `pagamento_splits` existe
- [ ] Tabela `empresa_metricas` existe
- [ ] Campo `percentual_plataforma` = 500 por padrão

### Backend
- [ ] Servidor inicia sem erros
- [ ] Endpoint `/api/tenant/config?slug=demo` retorna dados completos
- [ ] Endpoint `/api/repasses/pendentes` funciona
- [ ] Logs do PaymentSplitService mostram R$ 5,00 fixo
- [ ] Modelo Empresa tem todos os métodos (registrarSplit, etc)

### Frontend
- [ ] Frontend compila sem erros
- [ ] Página `/demo` carrega
- [ ] Console mostra logs de personalização
- [ ] Cores personalizadas são aplicadas
- [ ] Logo é substituído (se configurado)
- [ ] Textos do hero são atualizados
- [ ] WhatsApp float funciona

### Integração
- [ ] Criar agendamento → Split correto (R$ 5,00 plataforma)
- [ ] Split é registrado em `pagamento_splits`
- [ ] Métricas são atualizadas em `empresa_metricas`
- [ ] Processamento de repasse funciona (modo simulado)

## 📋 6. Possíveis Problemas e Soluções

### Problema: Migration falha com erro de coluna duplicada

**Solução:** A migration usa `ADD COLUMN IF NOT EXISTS`, então isso não deveria acontecer. Se acontecer:
```sql
-- Verificar quais colunas existem
\d empresas

-- Remover linhas duplicadas da migration manualmente
```

### Problema: Tabela `transacoes` existe mas `pagamento_splits` não

**Solução:** O schema antigo usa `transacoes`. A migration 006 cria `pagamento_splits`. Ambas podem coexistir, mas o código novo usa `pagamento_splits`.

### Problema: Endpoint retorna campos NULL

**Solução:** Campos visuais são opcionais. Configure-os via super-admin:
```sql
UPDATE empresas
SET logo_url = 'https://example.com/logo.png',
    cor_primaria = '#FF5722',
    titulo_hero = 'Bem-vindo!'
WHERE slug = 'demo';
```

### Problema: Frontend não aplica personalizações

**Solução:**
1. Verificar console para erros
2. Confirmar que `/api/tenant/config` retorna dados
3. Verificar se `tenantService.loadTenantConfig()` é chamado

## 📋 7. Próximas Configurações

### Configurar CRON para Repasses Automáticos

1. **Criar conta em cron-job.org**
2. **Adicionar job:**
   - URL: `https://seu-dominio.com/api/repasses/cron`
   - Method: POST
   - Header: `x-cron-token: SEU_TOKEN`
   - Schedule: Hourly (a cada hora)

### Configurar PIX Real (Opcional)

Ver documentação em: `TRANSFERENCIAS-PIX.md`

Opções:
1. Mercado Pago Split Payment (melhor para SaaS)
2. Asaas (API simples)
3. PagBank (alternativa)

## 🎉 Conclusão

Todas as alterações estão **conectadas e prontas**:
- ✅ Banco de dados compatível (migration 006)
- ✅ Backend com todos endpoints e serviços
- ✅ Frontend com personalização dinâmica
- ✅ Split de R$ 5,00 fixo implementado
- ✅ Sistema de repasses PIX automático
- ✅ Documentação completa

**Próximo passo:** Aplicar a migration e testar!
