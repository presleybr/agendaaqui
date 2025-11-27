/**
 * Rotas do Painel CRM da Empresa
 * Base: /api/empresa/painel
 * Todas as rotas requerem autenticação de usuário da empresa
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authEmpresa, requireRole } = require('../middleware/authEmpresa');

// Todas as rotas requerem autenticação
router.use(authEmpresa);

// ==================== DASHBOARD ====================

/**
 * GET /api/empresa/painel/dashboard
 * Retorna estatísticas e resumo para o dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const empresaId = req.empresa_id;

    // Estatísticas gerais
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_agendamentos,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos,
        COUNT(CASE WHEN DATE(data_agendamento) = CURRENT_DATE THEN 1 END) as hoje,
        COUNT(CASE WHEN DATE(data_agendamento) = CURRENT_DATE + 1 THEN 1 END) as amanha,
        COALESCE(SUM(CASE WHEN status IN ('confirmado', 'concluido') THEN valor ELSE 0 END), 0) as faturamento_total,
        COALESCE(SUM(CASE WHEN status IN ('confirmado', 'concluido') AND DATE(data_agendamento) >= DATE_TRUNC('month', CURRENT_DATE) THEN valor ELSE 0 END), 0) as faturamento_mes
      FROM agendamentos
      WHERE empresa_id = $1
    `, [empresaId]);

    // Próximos agendamentos (hoje e futuros, não cancelados/concluídos)
    const proximos = await db.query(`
      SELECT
        id, nome_cliente, telefone, email, placa,
        data_agendamento, horario, tipo_servico, valor, status
      FROM agendamentos
      WHERE empresa_id = $1
        AND data_agendamento >= CURRENT_DATE
        AND status NOT IN ('cancelado', 'concluido')
      ORDER BY data_agendamento, horario
      LIMIT 10
    `, [empresaId]);

    // Agendamentos de hoje
    const hoje = await db.query(`
      SELECT
        id, nome_cliente, telefone, placa,
        horario, tipo_servico, valor, status
      FROM agendamentos
      WHERE empresa_id = $1 AND DATE(data_agendamento) = CURRENT_DATE
      ORDER BY horario
    `, [empresaId]);

    // Dados da empresa para exibir no header
    const empresa = await db.query(`
      SELECT nome, logo_url, cor_primaria FROM empresas WHERE id = $1
    `, [empresaId]);

    res.json({
      empresa: empresa.rows[0],
      estatisticas: stats.rows[0],
      agendamentos_hoje: hoje.rows,
      proximos_agendamentos: proximos.rows
    });

  } catch (err) {
    console.error('Erro ao buscar dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

// ==================== AGENDAMENTOS ====================

/**
 * GET /api/empresa/painel/agendamentos
 * Lista agendamentos com filtros e paginação
 */
router.get('/agendamentos', async (req, res) => {
  try {
    const { status, data_inicio, data_fim, busca, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM agendamentos
      WHERE empresa_id = $1
    `;
    const params = [req.empresa_id];
    let paramIndex = 2;

    if (status && status !== 'todos') {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (data_inicio) {
      query += ` AND data_agendamento >= $${paramIndex++}`;
      params.push(data_inicio);
    }
    if (data_fim) {
      query += ` AND data_agendamento <= $${paramIndex++}`;
      params.push(data_fim);
    }
    if (busca) {
      query += ` AND (nome_cliente ILIKE $${paramIndex} OR placa ILIKE $${paramIndex} OR telefone ILIKE $${paramIndex})`;
      params.push(`%${busca}%`);
      paramIndex++;
    }

    // Query para contar total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Adicionar ordenação e paginação
    query += ` ORDER BY data_agendamento DESC, horario DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      agendamentos: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
});

/**
 * GET /api/empresa/painel/agendamentos/:id
 * Busca um agendamento específico
 */
router.get('/agendamentos/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM agendamentos WHERE id = $1 AND empresa_id = $2',
      [req.params.id, req.empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
});

/**
 * PATCH /api/empresa/painel/agendamentos/:id/status
 * Atualiza o status de um agendamento
 */
router.patch('/agendamentos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidos = ['pendente', 'confirmado', 'cancelado', 'concluido'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido', statusValidos });
    }

    // Verificar se pertence à empresa
    const check = await db.query(
      'SELECT id, status as status_atual, nome_cliente FROM agendamentos WHERE id = $1 AND empresa_id = $2',
      [id, req.empresa_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const agendamento = check.rows[0];

    await db.query(
      'UPDATE agendamentos SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // Log
    await db.query(`
      INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao, dados_extras)
      VALUES ($1, $2, 'atualizar_status', $3, $4)
    `, [
      req.empresa_id,
      req.usuarioEmpresa.id,
      `Status do agendamento #${id} (${agendamento.nome_cliente}) alterado de ${agendamento.status_atual} para ${status}`,
      JSON.stringify({ agendamento_id: id, de: agendamento.status_atual, para: status })
    ]);

    res.json({ success: true, message: 'Status atualizado com sucesso' });

  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ==================== EMPRESA (MEUS DADOS) ====================

/**
 * GET /api/empresa/painel/minha-empresa
 * Retorna dados da empresa do usuário logado
 */
router.get('/minha-empresa', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM empresas WHERE id = $1',
      [req.empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const empresa = result.rows[0];

    // Ocultar chave PIX parcialmente por segurança
    if (empresa.chave_pix) {
      const pix = empresa.chave_pix;
      empresa.chave_pix_masked = pix.length > 8
        ? pix.substring(0, 4) + '****' + pix.substring(pix.length - 4)
        : '****';
    }

    // Não expor dados sensíveis
    delete empresa.percentual_plataforma;

    res.json(empresa);

  } catch (err) {
    console.error('Erro ao buscar empresa:', err);
    res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
  }
});

/**
 * PUT /api/empresa/painel/minha-empresa
 * Atualiza dados da empresa (campos permitidos)
 */
router.put('/minha-empresa', requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const {
      telefone, whatsapp, endereco, numero, complemento, bairro,
      cidade, estado, cep, descricao, horario_funcionamento,
      cor_primaria, cor_secundaria, facebook_url, instagram_url, site_url
    } = req.body;

    // Campos que a empresa PODE editar
    // NÃO pode editar: nome, slug, email principal, PIX, preços, comissão
    await db.query(`
      UPDATE empresas SET
        telefone = COALESCE($1, telefone),
        whatsapp = COALESCE($2, whatsapp),
        endereco = COALESCE($3, endereco),
        numero = COALESCE($4, numero),
        complemento = COALESCE($5, complemento),
        bairro = COALESCE($6, bairro),
        cidade = COALESCE($7, cidade),
        estado = COALESCE($8, estado),
        cep = COALESCE($9, cep),
        descricao = COALESCE($10, descricao),
        horario_funcionamento = COALESCE($11, horario_funcionamento),
        cor_primaria = COALESCE($12, cor_primaria),
        cor_secundaria = COALESCE($13, cor_secundaria),
        facebook_url = COALESCE($14, facebook_url),
        instagram_url = COALESCE($15, instagram_url),
        site_url = COALESCE($16, site_url),
        updated_at = NOW()
      WHERE id = $17
    `, [telefone, whatsapp, endereco, numero, complemento, bairro,
        cidade, estado, cep, descricao, horario_funcionamento,
        cor_primaria, cor_secundaria, facebook_url, instagram_url, site_url,
        req.empresa_id]);

    // Log
    await db.query(`
      INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao)
      VALUES ($1, $2, 'atualizar_empresa', 'Dados da empresa atualizados')
    `, [req.empresa_id, req.usuarioEmpresa.id]);

    res.json({ success: true, message: 'Dados atualizados com sucesso' });

  } catch (err) {
    console.error('Erro ao atualizar empresa:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados' });
  }
});

// ==================== CLIENTES ====================

/**
 * GET /api/empresa/painel/clientes
 * Lista clientes únicos baseado nos agendamentos
 */
router.get('/clientes', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        nome_cliente as nome,
        email,
        telefone,
        cpf,
        COUNT(*) as total_agendamentos,
        MAX(data_agendamento) as ultimo_agendamento,
        SUM(CASE WHEN status IN ('confirmado', 'concluido') THEN valor ELSE 0 END) as valor_total
      FROM agendamentos
      WHERE empresa_id = $1 AND nome_cliente IS NOT NULL
      GROUP BY nome_cliente, email, telefone, cpf
      ORDER BY ultimo_agendamento DESC
    `, [req.empresa_id]);

    res.json({
      clientes: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// ==================== CONFIGURAÇÕES ====================

/**
 * GET /api/empresa/painel/configuracoes/horarios
 * Retorna configurações de horários da empresa
 */
router.get('/configuracoes/horarios', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT horario_inicio, horario_fim, intervalo_minutos
      FROM empresas WHERE id = $1
    `, [req.empresa_id]);

    res.json(result.rows[0] || {});

  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

/**
 * PUT /api/empresa/painel/configuracoes/horarios
 * Atualiza configurações de horários
 */
router.put('/configuracoes/horarios', requireRole('admin'), async (req, res) => {
  try {
    const { horario_inicio, horario_fim, intervalo_minutos } = req.body;

    await db.query(`
      UPDATE empresas SET
        horario_inicio = COALESCE($1, horario_inicio),
        horario_fim = COALESCE($2, horario_fim),
        intervalo_minutos = COALESCE($3, intervalo_minutos),
        updated_at = NOW()
      WHERE id = $4
    `, [horario_inicio, horario_fim, intervalo_minutos, req.empresa_id]);

    // Log
    await db.query(`
      INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao)
      VALUES ($1, $2, 'atualizar_horarios', 'Horários de funcionamento atualizados')
    `, [req.empresa_id, req.usuarioEmpresa.id]);

    res.json({ success: true, message: 'Horários atualizados' });

  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar horários' });
  }
});

// ==================== RELATÓRIOS ====================

/**
 * GET /api/empresa/painel/relatorios/resumo
 * Relatório resumido por período
 */
router.get('/relatorios/resumo', async (req, res) => {
  try {
    const { periodo = '30' } = req.query; // dias

    const result = await db.query(`
      SELECT
        DATE(data_agendamento) as data,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        SUM(CASE WHEN status IN ('confirmado', 'concluido') THEN valor ELSE 0 END) as faturamento
      FROM agendamentos
      WHERE empresa_id = $1
        AND data_agendamento >= CURRENT_DATE - $2::integer
      GROUP BY DATE(data_agendamento)
      ORDER BY data DESC
    `, [req.empresa_id, parseInt(periodo)]);

    // Calcular totais
    const totais = result.rows.reduce((acc, row) => {
      acc.total += parseInt(row.total);
      acc.concluidos += parseInt(row.concluidos);
      acc.cancelados += parseInt(row.cancelados);
      acc.faturamento += parseInt(row.faturamento || 0);
      return acc;
    }, { total: 0, concluidos: 0, cancelados: 0, faturamento: 0 });

    res.json({
      periodo: parseInt(periodo),
      dados_diarios: result.rows,
      totais
    });

  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

/**
 * GET /api/empresa/painel/relatorios/servicos
 * Relatório por tipo de serviço
 */
router.get('/relatorios/servicos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        tipo_servico,
        COUNT(*) as quantidade,
        SUM(CASE WHEN status IN ('confirmado', 'concluido') THEN valor ELSE 0 END) as faturamento
      FROM agendamentos
      WHERE empresa_id = $1
      GROUP BY tipo_servico
      ORDER BY quantidade DESC
    `, [req.empresa_id]);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// ==================== LOG DE ATIVIDADES ====================

/**
 * GET /api/empresa/painel/log-atividades
 * Lista atividades recentes (apenas para admin)
 */
router.get('/log-atividades', requireRole('admin'), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await db.query(`
      SELECT
        l.id, l.acao, l.descricao, l.ip_address, l.created_at,
        u.nome as usuario_nome, u.email as usuario_email
      FROM log_atividades_empresa l
      LEFT JOIN usuarios_empresa u ON l.usuario_id = u.id
      WHERE l.empresa_id = $1
      ORDER BY l.created_at DESC
      LIMIT $2
    `, [req.empresa_id, parseInt(limit)]);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar log' });
  }
});

module.exports = router;
