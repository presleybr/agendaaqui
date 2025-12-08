/**
 * Rotas do Painel CRM da Empresa
 * Base: /api/empresa/painel
 * Todas as rotas requerem autenticação de usuário da empresa
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authEmpresa, requireRole } = require('../middleware/authEmpresa');
const PrecoVistoria = require('../models/PrecoVistoria');

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

    // Estatísticas gerais (usando data_hora e status corretos)
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_agendamentos,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        COUNT(CASE WHEN status = 'realizado' THEN 1 END) as concluidos,
        COUNT(CASE WHEN DATE(data_hora) = CURRENT_DATE THEN 1 END) as hoje,
        COUNT(CASE WHEN DATE(data_hora) = CURRENT_DATE + 1 THEN 1 END) as amanha,
        COALESCE(SUM(CASE WHEN status IN ('confirmado', 'realizado') THEN valor ELSE 0 END), 0) as faturamento_total,
        COALESCE(SUM(CASE WHEN status IN ('confirmado', 'realizado') AND DATE(data_hora) >= DATE_TRUNC('month', CURRENT_DATE) THEN valor ELSE 0 END), 0) as faturamento_mes
      FROM agendamentos
      WHERE empresa_id = $1
    `, [empresaId]);

    // Próximos agendamentos (hoje e futuros, não cancelados/realizados)
    // JOIN com clientes e veiculos para obter dados completos
    const proximos = await db.query(`
      SELECT
        a.id,
        c.nome as nome_cliente,
        c.telefone,
        c.email,
        v.placa,
        a.data_hora,
        TO_CHAR(a.data_hora, 'HH24:MI') as horario,
        a.tipo_vistoria as tipo_servico,
        a.valor,
        a.status
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.empresa_id = $1
        AND DATE(a.data_hora) >= CURRENT_DATE
        AND a.status NOT IN ('cancelado', 'realizado')
      ORDER BY a.data_hora
      LIMIT 10
    `, [empresaId]);

    // Agendamentos de hoje
    const hoje = await db.query(`
      SELECT
        a.id,
        c.nome as nome_cliente,
        c.telefone,
        v.placa,
        TO_CHAR(a.data_hora, 'HH24:MI') as horario,
        a.tipo_vistoria as tipo_servico,
        a.valor,
        a.status
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.empresa_id = $1 AND DATE(a.data_hora) = CURRENT_DATE
      ORDER BY a.data_hora
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
      SELECT
        a.id,
        a.protocolo,
        c.nome as nome_cliente,
        c.telefone,
        c.email,
        c.cpf,
        v.placa,
        v.marca,
        v.modelo,
        a.data_hora,
        TO_CHAR(a.data_hora, 'HH24:MI') as horario,
        a.tipo_vistoria as tipo_servico,
        a.valor,
        a.status,
        a.status_pagamento,
        a.observacoes,
        a.created_at
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.empresa_id = $1
    `;
    const params = [req.empresa_id];
    let paramIndex = 2;

    if (status && status !== 'todos') {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    if (data_inicio) {
      query += ` AND DATE(a.data_hora) >= $${paramIndex++}`;
      params.push(data_inicio);
    }
    if (data_fim) {
      query += ` AND DATE(a.data_hora) <= $${paramIndex++}`;
      params.push(data_fim);
    }
    if (busca) {
      query += ` AND (c.nome ILIKE $${paramIndex} OR v.placa ILIKE $${paramIndex} OR c.telefone ILIKE $${paramIndex})`;
      params.push(`%${busca}%`);
      paramIndex++;
    }

    // Query para contar total
    const countQuery = query.replace(/SELECT[\s\S]*?FROM agendamentos/, 'SELECT COUNT(*) FROM agendamentos');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Adicionar ordenação e paginação
    query += ` ORDER BY a.data_hora DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
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
    const result = await db.query(`
      SELECT
        a.id,
        a.protocolo,
        c.nome as nome_cliente,
        c.telefone,
        c.email,
        c.cpf,
        v.placa,
        v.marca,
        v.modelo,
        v.ano,
        v.cor,
        a.data_hora,
        TO_CHAR(a.data_hora, 'HH24:MI') as horario,
        a.tipo_vistoria as tipo_servico,
        a.valor,
        a.status,
        a.status_pagamento,
        a.observacoes,
        a.created_at
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.id = $1 AND a.empresa_id = $2
    `, [req.params.id, req.empresa_id]);

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

    const statusValidos = ['pendente', 'confirmado', 'cancelado', 'realizado'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido', statusValidos });
    }

    // Verificar se pertence à empresa (JOIN com clientes para obter nome)
    const check = await db.query(`
      SELECT a.id, a.status as status_atual, c.nome as nome_cliente
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      WHERE a.id = $1 AND a.empresa_id = $2
    `, [id, req.empresa_id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const agendamento = check.rows[0];

    await db.query(
      'UPDATE agendamentos SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // Log (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao, dados_extras)
        VALUES ($1, $2, 'atualizar_status', $3, $4)
      `, [
        req.empresa_id,
        req.usuarioEmpresa.id,
        `Status do agendamento #${id} (${agendamento.nome_cliente || 'Cliente'}) alterado de ${agendamento.status_atual} para ${status}`,
        JSON.stringify({ agendamento_id: id, de: agendamento.status_atual, para: status })
      ]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

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

    // Log (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao)
        VALUES ($1, $2, 'atualizar_empresa', 'Dados da empresa atualizados')
      `, [req.empresa_id, req.usuarioEmpresa.id]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

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
        c.id,
        c.nome,
        c.email,
        c.telefone,
        c.cpf,
        COUNT(a.id) as total_agendamentos,
        MAX(a.data_hora) as ultimo_agendamento,
        COALESCE(SUM(CASE WHEN a.status IN ('confirmado', 'realizado') THEN a.valor ELSE 0 END), 0) as valor_total
      FROM clientes c
      LEFT JOIN agendamentos a ON c.id = a.cliente_id AND a.empresa_id = $1
      WHERE c.empresa_id = $1
      GROUP BY c.id, c.nome, c.email, c.telefone, c.cpf
      ORDER BY ultimo_agendamento DESC NULLS LAST
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

    // Log (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao)
        VALUES ($1, $2, 'atualizar_horarios', 'Horários de funcionamento atualizados')
      `, [req.empresa_id, req.usuarioEmpresa.id]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

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
    const { data_inicio, data_fim, periodo = '30' } = req.query;

    let query;
    let params;

    if (data_inicio && data_fim) {
      // Usar datas específicas
      query = `
        SELECT
          COUNT(*) as total_agendamentos,
          COUNT(CASE WHEN a.status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN a.status = 'confirmado' THEN 1 END) as confirmados,
          COUNT(CASE WHEN a.status = 'realizado' THEN 1 END) as concluidos,
          COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) as cancelados,
          COALESCE(SUM(CASE WHEN a.status IN ('confirmado', 'realizado') THEN a.valor ELSE 0 END), 0) as receita_total,
          COUNT(DISTINCT CASE WHEN a.status != 'cancelado' THEN a.cliente_id END) as novos_clientes
        FROM agendamentos a
        WHERE a.empresa_id = $1
          AND DATE(a.data_hora) >= $2
          AND DATE(a.data_hora) <= $3
      `;
      params = [req.empresa_id, data_inicio, data_fim];
    } else {
      // Usar período em dias
      query = `
        SELECT
          COUNT(*) as total_agendamentos,
          COUNT(CASE WHEN a.status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN a.status = 'confirmado' THEN 1 END) as confirmados,
          COUNT(CASE WHEN a.status = 'realizado' THEN 1 END) as concluidos,
          COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) as cancelados,
          COALESCE(SUM(CASE WHEN a.status IN ('confirmado', 'realizado') THEN a.valor ELSE 0 END), 0) as receita_total,
          COUNT(DISTINCT CASE WHEN a.status != 'cancelado' THEN a.cliente_id END) as novos_clientes
        FROM agendamentos a
        WHERE a.empresa_id = $1
          AND DATE(a.data_hora) >= CURRENT_DATE - $2::integer
      `;
      params = [req.empresa_id, parseInt(periodo)];
    }

    const result = await db.query(query, params);
    const stats = result.rows[0] || {};

    // Calcular taxa de confirmação
    const total = parseInt(stats.total_agendamentos || 0);
    const confirmados = parseInt(stats.confirmados || 0) + parseInt(stats.concluidos || 0);
    const taxa_confirmacao = total > 0 ? (confirmados / total) * 100 : 0;

    res.json({
      total_agendamentos: parseInt(stats.total_agendamentos || 0),
      receita_total: parseInt(stats.receita_total || 0),
      novos_clientes: parseInt(stats.novos_clientes || 0),
      taxa_confirmacao: Math.round(taxa_confirmacao),
      por_status: {
        pendente: parseInt(stats.pendentes || 0),
        confirmado: parseInt(stats.confirmados || 0),
        concluido: parseInt(stats.concluidos || 0),
        cancelado: parseInt(stats.cancelados || 0)
      }
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
    const { data_inicio, data_fim } = req.query;

    let query = `
      SELECT
        tipo_vistoria as tipo_servico,
        COUNT(*) as quantidade,
        COALESCE(SUM(CASE WHEN status IN ('confirmado', 'realizado') THEN valor ELSE 0 END), 0) as receita_total
      FROM agendamentos
      WHERE empresa_id = $1
    `;
    const params = [req.empresa_id];

    if (data_inicio && data_fim) {
      query += ` AND DATE(data_hora) >= $2 AND DATE(data_hora) <= $3`;
      params.push(data_inicio, data_fim);
    }

    query += ` GROUP BY tipo_vistoria ORDER BY quantidade DESC`;

    const result = await db.query(query, params);

    // Calcular ticket médio para cada serviço
    const servicos = result.rows.map(s => ({
      tipo_servico: s.tipo_servico,
      quantidade: parseInt(s.quantidade),
      receita_total: parseInt(s.receita_total || 0),
      ticket_medio: s.quantidade > 0 ? Math.round(parseInt(s.receita_total || 0) / parseInt(s.quantidade)) : 0
    }));

    res.json({ servicos });

  } catch (err) {
    console.error('Erro ao gerar relatório de serviços:', err);
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

// ==================== PREÇOS DE VISTORIA POR TIPO DE VEÍCULO ====================

/**
 * GET /api/empresa/painel/precos-vistoria
 * Lista todos os preços de vistoria da empresa
 */
router.get('/precos-vistoria', async (req, res) => {
  try {
    const precos = await PrecoVistoria.findByEmpresa(req.empresa_id);

    // Se não tem preços cadastrados, retorna os padrões
    if (precos.length === 0) {
      return res.json({
        precos: PrecoVistoria.CATEGORIAS_PADRAO.map(c => ({
          ...c,
          empresa_id: req.empresa_id,
          ativo: true,
          id: null // indica que ainda não foi salvo no banco
        })),
        inicializado: false
      });
    }

    res.json({
      precos,
      inicializado: true
    });

  } catch (err) {
    console.error('Erro ao buscar preços de vistoria:', err);
    res.status(500).json({ error: 'Erro ao buscar preços' });
  }
});

/**
 * POST /api/empresa/painel/precos-vistoria/inicializar
 * Inicializa os preços padrão para a empresa
 */
router.post('/precos-vistoria/inicializar', requireRole('admin', 'gerente'), async (req, res) => {
  try {
    // Verificar se já tem preços
    const temPrecos = await PrecoVistoria.temPrecos(req.empresa_id);

    if (temPrecos) {
      return res.status(400).json({ error: 'Preços já foram inicializados' });
    }

    // Inicializar com preços padrão
    const precos = await PrecoVistoria.inicializarPadrao(req.empresa_id);

    // Log (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao)
        VALUES ($1, $2, 'inicializar_precos', 'Preços de vistoria inicializados com valores padrão')
      `, [req.empresa_id, req.usuarioEmpresa.id]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

    res.json({
      success: true,
      message: 'Preços inicializados com sucesso',
      precos
    });

  } catch (err) {
    console.error('Erro ao inicializar preços:', err);
    res.status(500).json({ error: 'Erro ao inicializar preços' });
  }
});

/**
 * PUT /api/empresa/painel/precos-vistoria
 * Atualiza todos os preços de vistoria da empresa
 */
router.put('/precos-vistoria', requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const { precos } = req.body;

    if (!precos || !Array.isArray(precos)) {
      return res.status(400).json({ error: 'Lista de preços é obrigatória' });
    }

    // Validar cada preço
    for (const preco of precos) {
      if (!preco.categoria) {
        return res.status(400).json({ error: 'Categoria é obrigatória' });
      }
      if (!preco.nome_exibicao) {
        return res.status(400).json({ error: 'Nome de exibição é obrigatório' });
      }
      if (typeof preco.preco !== 'number' || preco.preco < 0) {
        return res.status(400).json({ error: 'Preço deve ser um número positivo' });
      }
    }

    // Atualizar ou criar cada preço
    const resultados = await PrecoVistoria.atualizarMultiplos(req.empresa_id, precos);

    // Log (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao, dados_extras)
        VALUES ($1, $2, 'atualizar_precos', 'Preços de vistoria atualizados', $3)
      `, [
        req.empresa_id,
        req.usuarioEmpresa.id,
        JSON.stringify({ precos_atualizados: precos.length })
      ]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

    res.json({
      success: true,
      message: 'Preços atualizados com sucesso',
      precos: resultados
    });

  } catch (err) {
    console.error('Erro ao atualizar preços:', err);
    res.status(500).json({ error: 'Erro ao atualizar preços' });
  }
});

/**
 * PUT /api/empresa/painel/precos-vistoria/:id
 * Atualiza um preço específico
 */
router.put('/precos-vistoria/:id', requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_exibicao, descricao, preco, ativo } = req.body;

    // Verificar se o preço pertence à empresa
    const precoExistente = await PrecoVistoria.findById(id);
    if (!precoExistente) {
      return res.status(404).json({ error: 'Preço não encontrado' });
    }

    // Verificar se pertence à empresa do usuário
    const precosDaEmpresa = await PrecoVistoria.findByEmpresa(req.empresa_id);
    const pertence = precosDaEmpresa.some(p => p.id === parseInt(id));

    if (!pertence) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const atualizado = await PrecoVistoria.update(id, {
      nome_exibicao,
      descricao,
      preco,
      ativo
    });

    res.json({
      success: true,
      message: 'Preço atualizado com sucesso',
      preco: atualizado
    });

  } catch (err) {
    console.error('Erro ao atualizar preço:', err);
    res.status(500).json({ error: 'Erro ao atualizar preço' });
  }
});

// ==================== UPLOAD DE IMAGENS (CLOUDINARY) ====================

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinaryService = require('../services/cloudinary');

// Usar memoria temporaria para upload (depois envia para Cloudinary)
const storage = multer.memoryStorage();

const uploadEmpresa = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Apenas imagens sao permitidas'));
  }
}).single('imagem');

/**
 * POST /api/empresa/painel/upload-imagem
 * Upload de logo ou capa da empresa para Cloudinary
 */
router.post('/upload-imagem', requireRole('admin', 'gerente'), (req, res) => {
  uploadEmpresa(req, res, async (err) => {
    if (err) {
      console.error('Erro no upload:', err);
      return res.status(400).json({ error: err.message || 'Erro no upload' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    try {
      const tipo = req.body.tipo || 'outros';

      // Verificar se Cloudinary esta configurado
      if (!cloudinaryService.isConfigured()) {
        console.error('Cloudinary nao configurado - variaveis de ambiente faltando');
        return res.status(500).json({
          error: 'Servico de imagens nao configurado. Contate o suporte.'
        });
      }

      // Definir pasta e public_id no Cloudinary
      let folder = 'agendaaqui/empresas';
      if (tipo === 'logo') folder = 'agendaaqui/empresas/logos';
      else if (tipo === 'capa') folder = 'agendaaqui/empresas/capas';
      else if (tipo === 'perfil') folder = 'agendaaqui/empresas/perfis';

      // Public ID unico baseado na empresa e tipo
      const publicId = `empresa-${req.empresa_id}-${tipo}`;

      // Fazer upload para Cloudinary
      console.log(`Enviando imagem para Cloudinary: ${folder}/${publicId}`);
      const uploadResult = await cloudinaryService.uploadImageBuffer(req.file.buffer, {
        folder: folder,
        public_id: publicId
      });

      if (!uploadResult.success) {
        console.error('Erro no upload para Cloudinary:', uploadResult.error);
        return res.status(500).json({ error: 'Erro ao enviar imagem para o servidor' });
      }

      const imageUrl = uploadResult.url;
      console.log(`Imagem enviada com sucesso: ${imageUrl}`);

      // Determinar campo do banco de dados
      let campo = '';
      if (tipo === 'logo') campo = 'logo_url';
      else if (tipo === 'capa') campo = 'foto_capa_url';
      else if (tipo === 'perfil') campo = 'foto_perfil_url';
      else campo = 'banner_url';

      // Atualizar banco de dados
      await db.query(
        `UPDATE empresas SET ${campo} = $1, updated_at = NOW() WHERE id = $2`,
        [imageUrl, req.empresa_id]
      );

      // Log (nao bloqueante)
      try {
        await db.query(`
          INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao)
          VALUES ($1, $2, 'upload_imagem', $3)
        `, [req.empresa_id, req.usuarioEmpresa.id, `Upload de ${tipo}: ${imageUrl}`]);
      } catch (logErr) {
        console.error('Erro ao registrar log:', logErr.message);
      }

      res.json({
        success: true,
        message: 'Imagem enviada com sucesso',
        url: imageUrl,
        tipo: tipo,
        cloudinary: {
          public_id: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format
        }
      });

    } catch (dbErr) {
      console.error('Erro ao salvar URL:', dbErr);
      res.status(500).json({ error: 'Erro ao salvar imagem no banco' });
    }
  });
});

module.exports = router;
