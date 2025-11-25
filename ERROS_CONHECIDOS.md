# 🐛 Erros Conhecidos

## 1. ✅ RESOLVIDO - EmpresasManager 404
**Erro:** `undefined/admin/empresas` (404)
**Causa:** `scheduleService.API_URL` estava undefined
**Solução:** Adicionado `API_URL: API_URL` ao scheduleService (commit 363e885)
**Status:** ✅ Corrigido

---

## 2. ⚠️  Admin.js - appointments.map is not a function
**Erro:** `TypeError: this.appointments.map is not a function`
**Causa:** API `/agendamentos` retorna `{ agendamentos: [], total }` mas código espera array direto
**Localização:** `frontend/src/admin.js` linha ~105
**Impacto:** Painel admin não carrega lista de agendamentos

### Correção Sugerida:
```javascript
// Em admin.js, método loadAppointments()
// ANTES:
this.appointments = await response.json();

// DEPOIS:
const data = await response.json();
this.appointments = data.agendamentos || [];
this.totalAppointments = data.total || 0;
```

**Status:** ⚠️ Pendente (bug pré-existente, não relacionado ao SaaS)

---

## 3. ✅ RESOLVIDO - db.prepare is not a function

**Erro:** `TypeError: db.prepare is not a function` em múltiplos modelos
**Causa:** Modelos usando métodos SQLite em produção PostgreSQL
**Solução:** Convertidos todos modelos para PostgreSQL puro
**Status:** ✅ Corrigido (commits 19e53c7, 5866898, bd6e1b7)

### Modelos Convertidos:
- ✅ Cliente.js
- ✅ Veiculo.js
- ✅ Agendamento.js
- ✅ Configuracao.js
- ✅ Pagamento.js

---

## 4. ✅ RESOLVIDO - Missing await em Controllers

**Erro:** 400 Bad Request ao criar agendamentos
**Causa:** Múltiplos `await` faltando em chamadas async
**Solução:** Adicionados awaits em 20+ locais
**Status:** ✅ Corrigido (commits f96bc27, bd6e1b7)

### Controllers Corrigidos:
- ✅ agendamentoController.js (9 awaits no create)
- ✅ availabilityController.js (2 awaits)
- ✅ payment.js (2 awaits)

---

## 5. ✅ Sistema Completo Funcionando

### Backend ✅
- [x] PostgreSQL exclusivo (sem SQLite)
- [x] Todos modelos convertidos e funcionais
- [x] Agendamentos sendo criados com sucesso
- [x] API PIX funcionando (erro 500 resolvido)
- [x] Sistema SaaS multi-tenant implementado
- [x] PaymentSplitService integrado

### Frontend ✅
- [x] Formulário de agendamento funcional
- [x] Slots disponíveis carregando corretamente
- [x] Pagamento apenas via PIX (cartão removido)
- [x] Seção Empresas no admin
- [x] EmpresasManager funcional

### Próximos Passos 🚀
1. ✅ Adicionar variáveis de ambiente MP no Render
   - `MP_ACCESS_TOKEN` (backend)
   - `MP_PUBLIC_KEY` (backend)
   - `VITE_MP_PUBLIC_KEY` (frontend)
2. Testar QR Code PIX em produção
3. Corrigir bug appointments.map no admin.js
4. Criar painel do cliente (read-only)
5. Habilitar multi-tenant (subdomínios)

---

**Última Atualização:** 2025-11-23
**Branch:** main
**Commit:** bd6e1b7
