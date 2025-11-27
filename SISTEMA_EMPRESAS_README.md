# Sistema de Gerenciamento de Empresas - AgendaAqui Vistorias

## Visão Geral

Este sistema permite criar páginas personalizadas para diferentes empresas de vistoria, onde cada empresa terá sua própria página acessível através de um slug único (ex: `https://agendaaquivistorias.com.br/nomedaempresa`).

## Funcionalidades Implementadas

### 1. Backend

#### Modelo de Dados Expandido
- **Tabela `empresas`** com campos completos para personalização:
  - Informações básicas: nome, slug, razão social, CNPJ, email, telefone
  - Localização: endereço, cidade, estado, CEP, latitude, longitude
  - Personalização visual: template_id, cor_primaria, cor_secundaria, logo, capa, perfil
  - Redes sociais: whatsapp, facebook_url, instagram_url, site_url
  - Preços: preco_cautelar, preco_transferencia, preco_outros
  - Dados de pagamento: pix_key, pix_type
  - Informações adicionais: descricao, horario_funcionamento

- **Tabela `empresa_carrossel`** para galeria de fotos
- **Tabela `templates`** para diferentes layouts de página

#### Rotas da API

**Rotas Públicas (sem autenticação):**
```
GET /api/empresas/:slug - Buscar empresa por slug
GET /api/empresas/:id/carrossel - Listar imagens do carrossel
```

**Rotas Administrativas (requerem autenticação de Super Admin):**
```
GET /api/admin/empresas - Listar todas as empresas
GET /api/admin/empresas/:id - Buscar empresa por ID
POST /api/admin/empresas - Criar nova empresa
PUT /api/admin/empresas/:id - Atualizar empresa
DELETE /api/admin/empresas/:id - Deletar empresa
PATCH /api/admin/empresas/:id/status - Alterar status
GET /api/admin/empresas/dashboard - Dashboard consolidado
```

**Rotas de Upload:**
```
POST /api/upload/empresa/:id/imagens - Upload de múltiplas imagens
POST /api/upload/empresa/:id/carrossel - Adicionar ao carrossel
DELETE /api/upload/carrossel/:id - Deletar imagem do carrossel
GET /api/upload/empresa/:id/carrossel - Listar carrossel
```

#### Sistema de Upload de Imagens
- Suporte para: logo, foto de capa, foto de perfil, carrossel (até 10 imagens)
- Validação de tipo de arquivo (jpeg, jpg, png, gif, webp)
- Limite de 5MB por arquivo
- Organização automática em pastas por tipo

### 2. Frontend

#### Painel Administrativo

Acesse através do menu "Empresas" no painel admin (`/admin.html`):

**Funcionalidades:**
- Listar todas as empresas cadastradas
- Criar nova empresa com todos os campos
- Editar empresas existentes
- Upload de imagens (logo, capa, perfil, carrossel)
- Seleção de template/layout
- Personalização de cores
- Gerenciamento de status (ativo, inativo, suspenso, trial)
- Deletar empresas

#### Página da Empresa

Cada empresa terá sua página em `/empresa.html?empresa=slug`:

**Personalização Automática:**
- Logo no header
- Foto de capa no hero
- Cores personalizadas (primária e secundária)
- Informações de contato
- Galeria de fotos (carrossel)
- Preços específicos da empresa
- Links para redes sociais
- Botão do WhatsApp flutuante
- Formulário de agendamento integrado

## Como Usar

### 1. Executar Migração do Banco de Dados

Primeiro, execute a migração para criar as novas tabelas e colunas:

```bash
# Se estiver usando PostgreSQL localmente
psql -U seu_usuario -d agendamentos < backend/migrations/add_empresa_personalization.sql

# Ou no Render/Produção (via Dashboard ou CLI)
psql $DATABASE_URL < backend/migrations/add_empresa_personalization.sql
```

### 2. Configurar Upload de Imagens

Certifique-se de que a pasta `uploads` existe e tem permissões de escrita:

```bash
mkdir -p uploads/empresas/{logos,capas,perfis,carrossel}
chmod -R 755 uploads
```

### 3. Registrar Rotas no Servidor

No seu arquivo principal do servidor (geralmente `backend/server.js` ou `backend/app.js`), adicione as novas rotas:

```javascript
const uploadRoutes = require('./src/routes/upload');

// Adicione após as outras rotas
app.use('/api', empresasRoutes);  // Já existe
app.use('/api/upload', uploadRoutes);  // ADICIONAR ESTA LINHA

// Servir arquivos estáticos (para as imagens)
app.use('/uploads', express.static('uploads'));
```

### 4. Adicionar Dependências

Instale o pacote necessário para upload:

```bash
cd backend
npm install multer
```

### 5. Criar uma Nova Empresa

**Via Painel Admin:**

1. Acesse `/admin.html`
2. Faça login com credenciais de Super Admin
3. Clique na aba "Empresas"
4. Clique em "+ Nova Empresa"
5. Preencha os campos:
   - **Nome**: Nome fantasia da empresa
   - **Slug**: Identificador único (ex: "minha-empresa" → `agendaaquivistorias.com.br/minha-empresa`)
   - **Email, Telefone, WhatsApp**: Contatos
   - **Endereço completo**: CEP, Rua, Cidade, Estado
   - **Descrição**: Texto sobre a empresa
   - **Redes Sociais**: URLs do Facebook, Instagram, Site
   - **Horário de Funcionamento**: Ex: "Seg-Sex: 8h-18h, Sáb: 8h-12h"
   - **Preços**: Valores em R$ (serão convertidos para centavos automaticamente)
   - **Template**: Escolha o layout da página
   - **Cores**: Primária e secundária (em hexadecimal)
   - **Chave PIX**: Para receber pagamentos

6. Faça upload das imagens:
   - Logo (exibido no header)
   - Foto de Capa (background do hero)
   - Foto de Perfil (opcional)
   - Carrossel (múltiplas imagens da galeria)

7. Clique em "Salvar"

A empresa estará disponível imediatamente em:
```
https://agendaaquivistorias.com.br/empresa.html?empresa=slug-da-empresa
```

**Via API (usando cURL ou Postman):**

```bash
curl -X POST https://seu-dominio.com/api/admin/empresas \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Vistoria XYZ",
    "slug": "vistoria-xyz",
    "email": "contato@vistoriaxyz.com",
    "telefone": "(67) 99999-9999",
    "whatsapp": "67999999999",
    "endereco": "Rua ABC, 123",
    "cidade": "Campo Grande",
    "estado": "MS",
    "cep": "79000-000",
    "descricao": "Especialistas em vistoria veicular",
    "horario_funcionamento": "Segunda a Sábado, 8h às 18h",
    "chave_pix": "contato@vistoriaxyz.com",
    "tipo_pix": "email",
    "template_id": "default",
    "cor_primaria": "#2563eb",
    "cor_secundaria": "#1e40af",
    "preco_cautelar": 15000,
    "preco_transferencia": 12000,
    "preco_outros": 10000,
    "facebook_url": "https://facebook.com/vistoriaxyz",
    "instagram_url": "https://instagram.com/vistoriaxyz"
  }'
```

### 6. Upload de Imagens

Após criar a empresa, faça upload das imagens:

```bash
curl -X POST https://seu-dominio.com/api/upload/empresa/1/imagens \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -F "logo=@/caminho/para/logo.png" \
  -F "capa=@/caminho/para/capa.jpg" \
  -F "perfil=@/caminho/para/perfil.jpg" \
  -F "carrossel=@/caminho/para/foto1.jpg" \
  -F "carrossel=@/caminho/para/foto2.jpg" \
  -F "carrossel=@/caminho/para/foto3.jpg"
```

### 7. Configurar Roteamento

Para que as URLs amigáveis funcionem (ex: `/minhaempresa`), configure um dos métodos abaixo:

**Opção A: Configuração do Servidor Web (Nginx)**

```nginx
location ~ ^/([a-z0-9-]+)$ {
    try_files $uri /empresa.html?empresa=$1;
}
```

**Opção B: Express.js Middleware**

Adicione no seu `server.js`:

```javascript
// Capturar rotas de empresas (antes do 404)
app.get('/:slug([a-z0-9-]+)', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/empresa.html'));
});
```

### 8. Templates Disponíveis

Quatro templates foram pré-configurados:

1. **default** - Template padrão (atual do sistema)
2. **modern** - Design minimalista moderno
3. **classic** - Layout tradicional
4. **minimal** - Foco em agendamento

## Estrutura de Arquivos Criados/Modificados

```
backend/
├── migrations/
│   └── add_empresa_personalization.sql   [NOVO]
├── src/
│   ├── models/
│   │   └── Empresa.js                    [MODIFICADO]
│   ├── controllers/
│   │   └── empresaController.js          [MODIFICADO]
│   ├── routes/
│   │   ├── empresas.js                   [MODIFICADO]
│   │   └── upload.js                     [NOVO]
│   └── middleware/
│       └── upload.js                     [NOVO]

frontend/
├── empresa.html                           [NOVO]
└── src/
    ├── empresa.js                         [NOVO]
    ├── styles/
    │   └── empresa.css                    [CRIAR]
    └── components/
        └── EmpresasManager.js             [MODIFICADO]
```

## Próximos Passos Recomendados

1. **Criar estilos específicos** para `empresa.css`
2. **Implementar os templates** (modern, classic, minimal) com CSS diferente
3. **Adicionar validação de coordenadas** (latitude/longitude) para mapa
4. **Implementar busca por localização** (CEP, cidade)
5. **Criar painel para empresa** (não admin) visualizar seus próprios agendamentos
6. **Adicionar métricas** de performance por empresa
7. **Implementar sistema de notificações** por empresa
8. **Criar API pública** para agendamentos por empresa
9. **Adicionar suporte a domínio customizado** (ex: empresa.com.br)
10. **Implementar cache** para melhorar performance

## Integração com Agendamentos

Os agendamentos já estão preparados para empresas através do campo `empresa_id` na tabela `agendamentos`.

**Para vincular agendamentos a uma empresa:**

```javascript
// No formulário de agendamento (ScheduleForm)
const agendamento = await Agendamento.create({
  // ... outros campos
  empresa_id: empresaId, // ID da empresa
  preco: empresaPreco    // Preço específico da empresa
});
```

## Perguntas Frequentes

**Q: Como testar localmente?**

A: Acesse `http://localhost:3000/empresa.html?empresa=slug-da-empresa`

**Q: Posso ter múltiplas empresas com a mesma aparência?**

A: Sim, basta usar o mesmo template_id e cores para todas.

**Q: Como deletar uma empresa?**

A: Via painel admin ou API DELETE. ATENÇÃO: Deleta todos os dados relacionados (agendamentos, etc.)

**Q: Posso personalizar ainda mais os templates?**

A: Sim! Você pode criar novos templates adicionando registros na tabela `templates` e criando CSS correspondente.

**Q: Como funciona o sistema de cores?**

A: As cores são aplicadas dinamicamente via CSS variables, permitindo personalização total sem duplicar código.

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor (`console.log`)
2. Inspecione o Network no navegador
3. Confirme que a migração foi executada
4. Verifique permissões da pasta uploads

## Licença

Proprietário - AgendaAqui Vistorias
