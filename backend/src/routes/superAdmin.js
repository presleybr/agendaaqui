const express = require('express');
const router = express.Router();
const { authAdmin } = require('../middleware/authAdmin');
const db = require('../config/database');
const Empresa = require('../models/Empresa');
const Agendamento = require('../models/Agendamento');
const Transacao = require('../models/Transacao');
const Configuracao = require('../models/Configuracao');

// ============================================
// DASHBOARD - Métricas consolidadas
// ============================================
router.get('/dashboard', authAdmin, async (req, res) => {
  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    // Total de empresas
    const empresasResult = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativas,
        COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial,
        COUNT(CASE WHEN status = 'inativo' THEN 1 END) as inativas,
        COUNT(CASE WHEN status = 'suspenso' THEN 1 END) as suspensas
      FROM empresas
    `);

    // Agendamentos do mês
    const agendamentosResult = await db.query(`
      SELECT
        COUNT(*) as total_mes,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
        COUNT(CASE WHEN status = 'realizado' THEN 1 END) as realizados,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        COALESCE(SUM(valor), 0) as receita_total
      FROM agendamentos
      WHERE EXTRACT(MONTH FROM data_hora) = $1
        AND EXTRACT(YEAR FROM data_hora) = $2
    `, [mes, ano]);

    // Pagamentos do mês
    const pagamentosResult = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as aprovados,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN valor_total ELSE 0 END), 0) as valor_total,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN valor_comissao ELSE 0 END), 0) as comissao_total
      FROM pagamentos
      WHERE EXTRACT(MONTH FROM created_at) = $1
        AND EXTRACT(YEAR FROM created_at) = $2
    `, [mes, ano]);

    // Splits pendentes (repasses)
    const splitsPendentesResult = await db.query(`
      SELECT
        COUNT(*) as quantidade,
        COALESCE(SUM(valor_empresa), 0) as valor_total
      FROM pagamento_splits
      WHERE status_repasse = 'pendente'
    `);

    // Agendamentos de hoje
    const hoje = now.toISOString().split('T')[0];
    const agendamentosHojeResult = await db.query(`
      SELECT COUNT(*) as total
      FROM agendamentos
      WHERE DATE(data_hora) = $1
    `, [hoje]);

    // Gráfico de receita dos últimos 6 meses
    const receitaMensalResult = await db.query(`
      SELECT
        EXTRACT(MONTH FROM data_hora) as mes,
        EXTRACT(YEAR FROM data_hora) as ano,
        COALESCE(SUM(valor), 0) as receita
      FROM agendamentos
      WHERE data_hora >= NOW() - INTERVAL '6 months'
        AND status IN ('confirmado', 'realizado')
      GROUP BY EXTRACT(YEAR FROM data_hora), EXTRACT(MONTH FROM data_hora)
      ORDER BY ano, mes
    `);

    res.json({
      empresas: empresasResult.rows[0],
      agendamentos: agendamentosResult.rows[0],
      pagamentos: pagamentosResult.rows[0],
      splits_pendentes: splitsPendentesResult.rows[0],
      agendamentos_hoje: parseInt(agendamentosHojeResult.rows[0].total),
      receita_mensal: receitaMensalResult.rows,
      periodo: { mes, ano }
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// ============================================
// EMPRESAS - CRUD Completo
// ============================================

// Listar todas as empresas com métricas
router.get('/empresas', authAdmin, async (req, res) => {
  try {
    const { status, plano, busca } = req.query;

    let query = `
      SELECT e.*,
        (SELECT COUNT(*) FROM agendamentos a WHERE a.empresa_id = e.id) as total_agendamentos,
        (SELECT COUNT(*) FROM agendamentos a WHERE a.empresa_id = e.id AND a.status = 'realizado') as agendamentos_realizados,
        (SELECT COALESCE(SUM(p.valor_total), 0) FROM pagamentos p
          JOIN agendamentos a ON p.agendamento_id = a.id
          WHERE a.empresa_id = e.id AND p.status = 'approved') as receita_total,
        (SELECT COUNT(*) FROM usuarios_empresa ue WHERE ue.empresa_id = e.id) as total_usuarios
      FROM empresas e
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (plano) {
      query += ` AND e.plano = $${paramIndex}`;
      params.push(plano);
      paramIndex++;
    }

    if (busca) {
      query += ` AND (e.nome ILIKE $${paramIndex} OR e.slug ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex})`;
      params.push(`%${busca}%`);
      paramIndex++;
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await db.query(query, params);

    // Calcular dias desde início e comissão
    const empresas = result.rows.map(empresa => {
      const dataInicio = new Date(empresa.data_inicio || empresa.created_at);
      const hoje = new Date();
      const diasDesdeInicio = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
      const temComissao = diasDesdeInicio <= 30;

      return {
        ...empresa,
        dias_desde_inicio: diasDesdeInicio,
        tem_comissao: temComissao,
        dias_restantes_comissao: temComissao ? 30 - diasDesdeInicio : 0
      };
    });

    res.json({ empresas });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
});

// Buscar empresa por ID com detalhes completos
router.get('/empresas/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Métricas dos últimos 6 meses
    const metricasResult = await db.query(`
      SELECT
        EXTRACT(MONTH FROM a.data_hora) as mes,
        EXTRACT(YEAR FROM a.data_hora) as ano,
        COUNT(*) as total_agendamentos,
        COALESCE(SUM(a.valor), 0) as receita,
        COUNT(CASE WHEN a.status = 'realizado' THEN 1 END) as realizados
      FROM agendamentos a
      WHERE a.empresa_id = $1
        AND a.data_hora >= NOW() - INTERVAL '6 months'
      GROUP BY EXTRACT(YEAR FROM a.data_hora), EXTRACT(MONTH FROM a.data_hora)
      ORDER BY ano, mes
    `, [id]);

    // Usuários da empresa
    const usuariosResult = await db.query(`
      SELECT id, nome, email, role, ativo, ultimo_acesso, created_at
      FROM usuarios_empresa
      WHERE empresa_id = $1
      ORDER BY created_at DESC
    `, [id]);

    // Últimos 10 agendamentos
    const agendamentosResult = await db.query(`
      SELECT a.*, c.nome as cliente_nome, v.placa as veiculo_placa
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.empresa_id = $1
      ORDER BY a.data_hora DESC
      LIMIT 10
    `, [id]);

    // Stats gerais
    const statsResult = await db.query(`
      SELECT
        COUNT(*) as total_agendamentos,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
        COUNT(CASE WHEN status = 'realizado' THEN 1 END) as realizados,
        COALESCE(SUM(valor), 0) as receita_total
      FROM agendamentos
      WHERE empresa_id = $1
    `, [id]);

    // Preços de vistoria da empresa
    const precosResult = await db.query(`
      SELECT id, categoria, nome_exibicao, descricao, preco, ordem, ativo
      FROM precos_vistoria
      WHERE empresa_id = $1
      ORDER BY ordem
    `, [id]);

    // Calcular dias desde início
    const dataInicio = new Date(empresa.data_inicio || empresa.created_at);
    const hoje = new Date();
    const diasDesdeInicio = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));

    res.json({
      ...empresa,
      dias_desde_inicio: diasDesdeInicio,
      tem_comissao: diasDesdeInicio <= 30,
      metricas: metricasResult.rows,
      usuarios: usuariosResult.rows,
      ultimos_agendamentos: agendamentosResult.rows,
      stats: statsResult.rows[0],
      precos_vistoria: precosResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// Criar empresa (já usa o empresaController.create com criação de usuário)
// A rota está em /api/admin/empresas (empresasRoutes)

// Atualizar empresa
router.put('/empresas/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { precos_vistoria, ...dados } = req.body;

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Se estiver alterando o slug, verificar se já existe
    if (dados.slug && dados.slug !== empresa.slug) {
      const slugDisponivel = await Empresa.isSlugAvailable(dados.slug, id);
      if (!slugDisponivel) {
        return res.status(400).json({ error: 'Slug já está em uso' });
      }
    }

    const empresaAtualizada = await Empresa.update(id, dados);

    // Atualizar preços de vistoria se fornecidos
    if (precos_vistoria && Array.isArray(precos_vistoria)) {
      for (const preco of precos_vistoria) {
        await db.query(`
          INSERT INTO precos_vistoria (empresa_id, categoria, nome_exibicao, descricao, preco, ordem, ativo)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          ON CONFLICT (empresa_id, categoria)
          DO UPDATE SET
            nome_exibicao = EXCLUDED.nome_exibicao,
            descricao = EXCLUDED.descricao,
            preco = EXCLUDED.preco,
            ordem = EXCLUDED.ordem,
            updated_at = CURRENT_TIMESTAMP
        `, [id, preco.categoria, preco.nome_exibicao, preco.descricao, preco.preco, preco.ordem]);
      }
    }

    res.json({
      ...empresaAtualizada,
      mensagem: 'Empresa atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// Deletar empresa
router.delete('/empresas/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Verificar se tem agendamentos
    const agendamentosResult = await db.query(
      'SELECT COUNT(*) as total FROM agendamentos WHERE empresa_id = $1',
      [id]
    );

    if (parseInt(agendamentosResult.rows[0].total) > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar empresa com agendamentos. Desative-a ao invés disso.',
        total_agendamentos: agendamentosResult.rows[0].total
      });
    }

    // Deletar usuários da empresa
    await db.query('DELETE FROM usuarios_empresa WHERE empresa_id = $1', [id]);

    // Deletar empresa
    await Empresa.delete(id);

    res.json({ mensagem: 'Empresa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ error: 'Erro ao deletar empresa' });
  }
});

// Alterar status da empresa
router.patch('/empresas/:id/status', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ativo', 'inativo', 'suspenso', 'trial'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const empresa = await Empresa.update(id, { status });

    res.json({
      ...empresa,
      mensagem: `Status alterado para: ${status}`
    });
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// ============================================
// AGENDAMENTOS - Listagem global
// ============================================

// Listar todos os agendamentos (todas as empresas)
router.get('/agendamentos', authAdmin, async (req, res) => {
  try {
    const { empresa_id, status, data_inicio, data_fim, limite = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        a.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.email as cliente_email,
        v.placa as veiculo_placa,
        v.marca as veiculo_marca,
        v.modelo as veiculo_modelo,
        e.nome as empresa_nome,
        e.slug as empresa_slug,
        p.status as pagamento_status,
        p.metodo_pagamento as pagamento_metodo
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
      LEFT JOIN empresas e ON a.empresa_id = e.id
      LEFT JOIN pagamentos p ON a.id = p.agendamento_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (empresa_id) {
      query += ` AND a.empresa_id = $${paramIndex}`;
      params.push(empresa_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (data_inicio) {
      query += ` AND DATE(a.data_hora) >= $${paramIndex}`;
      params.push(data_inicio);
      paramIndex++;
    }

    if (data_fim) {
      query += ` AND DATE(a.data_hora) <= $${paramIndex}`;
      params.push(data_fim);
      paramIndex++;
    }

    query += ` ORDER BY a.data_hora DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limite), parseInt(offset));

    const result = await db.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM agendamentos a WHERE 1=1';
    const countParams = [];
    let countIndex = 1;

    if (empresa_id) {
      countQuery += ` AND a.empresa_id = $${countIndex}`;
      countParams.push(empresa_id);
      countIndex++;
    }
    if (status) {
      countQuery += ` AND a.status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }
    if (data_inicio) {
      countQuery += ` AND DATE(a.data_hora) >= $${countIndex}`;
      countParams.push(data_inicio);
      countIndex++;
    }
    if (data_fim) {
      countQuery += ` AND DATE(a.data_hora) <= $${countIndex}`;
      countParams.push(data_fim);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      agendamentos: result.rows,
      total: parseInt(countResult.rows[0].total),
      limite: parseInt(limite),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
});

// Buscar agendamento por ID
router.get('/agendamentos/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const agendamento = await Agendamento.findById(id);

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
});

// Atualizar status do agendamento
router.patch('/agendamentos/:id/status', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendente', 'confirmado', 'realizado', 'cancelado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const agendamento = await Agendamento.updateStatus(id, status);

    res.json({
      ...agendamento,
      mensagem: `Status alterado para: ${status}`
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// ============================================
// CLIENTES - Listagem global
// ============================================

router.get('/clientes', authAdmin, async (req, res) => {
  try {
    const { empresa_id, busca, limite = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        c.*,
        e.nome as empresa_nome,
        (SELECT COUNT(*) FROM agendamentos a WHERE a.cliente_id = c.id) as total_agendamentos
      FROM clientes c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (empresa_id) {
      query += ` AND c.empresa_id = $${paramIndex}`;
      params.push(empresa_id);
      paramIndex++;
    }

    if (busca) {
      query += ` AND (c.nome ILIKE $${paramIndex} OR c.cpf ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.telefone ILIKE $${paramIndex})`;
      params.push(`%${busca}%`);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limite), parseInt(offset));

    const result = await db.query(query, params);

    res.json({ clientes: result.rows });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// ============================================
// PAGAMENTOS E SPLITS
// ============================================

// Listar pagamentos
router.get('/pagamentos', authAdmin, async (req, res) => {
  try {
    const { empresa_id, status, limite = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        p.*,
        a.protocolo as agendamento_protocolo,
        a.tipo_vistoria,
        e.nome as empresa_nome,
        e.slug as empresa_slug,
        c.nome as cliente_nome
      FROM pagamentos p
      LEFT JOIN agendamentos a ON p.agendamento_id = a.id
      LEFT JOIN empresas e ON a.empresa_id = e.id
      LEFT JOIN clientes c ON a.cliente_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (empresa_id) {
      query += ` AND a.empresa_id = $${paramIndex}`;
      params.push(empresa_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limite), parseInt(offset));

    const result = await db.query(query, params);

    res.json({ pagamentos: result.rows });
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
});

// Listar splits (repasses pendentes)
router.get('/splits', authAdmin, async (req, res) => {
  try {
    const { status = 'pendente', empresa_id } = req.query;

    let query = `
      SELECT
        ps.*,
        e.nome as empresa_nome,
        e.slug as empresa_slug,
        e.chave_pix as empresa_pix,
        p.mercadopago_id,
        a.protocolo as agendamento_protocolo
      FROM pagamento_splits ps
      JOIN empresas e ON ps.empresa_id = e.id
      LEFT JOIN pagamentos p ON ps.pagamento_id = p.id
      LEFT JOIN agendamentos a ON p.agendamento_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND ps.status_repasse = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (empresa_id) {
      query += ` AND ps.empresa_id = $${paramIndex}`;
      params.push(empresa_id);
    }

    query += ' ORDER BY ps.created_at ASC';

    const result = await db.query(query, params);

    // Calcular total
    const total = result.rows.reduce((sum, split) => sum + parseFloat(split.valor_empresa || 0), 0);

    res.json({
      splits: result.rows,
      total_valor: total,
      quantidade: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao listar splits:', error);
    res.status(500).json({ error: 'Erro ao listar splits' });
  }
});

// Marcar split como processado
router.patch('/splits/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status_repasse, comprovante } = req.body;

    if (!['pendente', 'processando', 'concluido', 'erro'].includes(status_repasse)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const result = await db.query(`
      UPDATE pagamento_splits
      SET status_repasse = $1,
          comprovante_repasse = $2,
          data_repasse = CASE WHEN $1 = 'concluido' THEN CURRENT_TIMESTAMP ELSE data_repasse END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status_repasse, comprovante || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Split não encontrado' });
    }

    res.json({
      ...result.rows[0],
      mensagem: `Status do repasse alterado para: ${status_repasse}`
    });
  } catch (error) {
    console.error('Erro ao atualizar split:', error);
    res.status(500).json({ error: 'Erro ao atualizar split' });
  }
});

// ============================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================

router.get('/configuracoes', authAdmin, async (req, res) => {
  try {
    const configuracoes = await Configuracao.getAll();
    res.json({ configuracoes });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/configuracoes', authAdmin, async (req, res) => {
  try {
    const configs = req.body;
    await Configuracao.setMultiple(configs);
    res.json({ mensagem: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// ============================================
// RELATÓRIOS
// ============================================

router.get('/relatorios/resumo', authAdmin, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Período obrigatório (data_inicio e data_fim)' });
    }

    // Stats gerais do período
    const statsResult = await db.query(`
      SELECT
        COUNT(*) as total_agendamentos,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
        COUNT(CASE WHEN status = 'realizado' THEN 1 END) as realizados,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        COALESCE(SUM(valor), 0) as receita_total,
        COALESCE(AVG(valor), 0) as ticket_medio
      FROM agendamentos
      WHERE DATE(data_hora) BETWEEN $1 AND $2
    `, [data_inicio, data_fim]);

    // Agendamentos por tipo
    const tiposResult = await db.query(`
      SELECT
        tipo_vistoria,
        COUNT(*) as quantidade,
        COALESCE(SUM(valor), 0) as receita
      FROM agendamentos
      WHERE DATE(data_hora) BETWEEN $1 AND $2
      GROUP BY tipo_vistoria
      ORDER BY quantidade DESC
    `, [data_inicio, data_fim]);

    // Receita diária
    const receitaDiariaResult = await db.query(`
      SELECT
        DATE(data_hora) as data,
        COUNT(*) as agendamentos,
        COALESCE(SUM(valor), 0) as receita
      FROM agendamentos
      WHERE DATE(data_hora) BETWEEN $1 AND $2
        AND status IN ('confirmado', 'realizado')
      GROUP BY DATE(data_hora)
      ORDER BY data
    `, [data_inicio, data_fim]);

    // Top empresas
    const topEmpresasResult = await db.query(`
      SELECT
        e.id, e.nome, e.slug,
        COUNT(a.id) as total_agendamentos,
        COALESCE(SUM(a.valor), 0) as receita
      FROM empresas e
      LEFT JOIN agendamentos a ON e.id = a.empresa_id
        AND DATE(a.data_hora) BETWEEN $1 AND $2
      GROUP BY e.id, e.nome, e.slug
      ORDER BY receita DESC
      LIMIT 10
    `, [data_inicio, data_fim]);

    // Agendamentos por hora
    const horarioResult = await db.query(`
      SELECT
        EXTRACT(HOUR FROM data_hora) as hora,
        COUNT(*) as quantidade
      FROM agendamentos
      WHERE DATE(data_hora) BETWEEN $1 AND $2
      GROUP BY EXTRACT(HOUR FROM data_hora)
      ORDER BY hora
    `, [data_inicio, data_fim]);

    // Novos clientes no período
    const novosClientesResult = await db.query(`
      SELECT COUNT(*) as total
      FROM clientes
      WHERE DATE(created_at) BETWEEN $1 AND $2
    `, [data_inicio, data_fim]);

    res.json({
      periodo: { inicio: data_inicio, fim: data_fim },
      stats: statsResult.rows[0],
      por_tipo: tiposResult.rows,
      receita_diaria: receitaDiariaResult.rows,
      top_empresas: topEmpresasResult.rows,
      por_horario: horarioResult.rows,
      novos_clientes: parseInt(novosClientesResult.rows[0].total)
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// ============================================
// USUÁRIOS DE EMPRESAS
// ============================================

// Listar usuários de uma empresa
router.get('/empresas/:id/usuarios', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT id, nome, email, role, ativo, primeiro_acesso, ultimo_acesso, created_at
      FROM usuarios_empresa
      WHERE empresa_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.json({ usuarios: result.rows });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Senha padrão para novos usuários
const SENHA_PADRAO = '123456';

// Criar usuário para empresa
router.post('/empresas/:id/usuarios', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role = 'admin' } = req.body;
    const bcrypt = require('bcryptjs');

    // Verificar se empresa existe
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Verificar se email já existe
    const existente = await db.query(
      'SELECT id FROM usuarios_empresa WHERE email = $1',
      [email]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Usar senha padrão
    const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

    const result = await db.query(`
      INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
      VALUES ($1, $2, $3, $4, $5, true, true)
      RETURNING id, nome, email, role, ativo
    `, [id, nome, email, senhaHash, role]);

    res.status(201).json({
      usuario: result.rows[0],
      senha_padrao: SENHA_PADRAO,
      mensagem: 'Usuário criado com sucesso. Senha padrão: ' + SENHA_PADRAO
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Resetar senha de usuário (volta para senha padrão)
router.post('/usuarios/:userId/reset-senha', authAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const bcrypt = require('bcryptjs');

    // Usar senha padrão
    const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

    const result = await db.query(`
      UPDATE usuarios_empresa
      SET senha_hash = $1, primeiro_acesso = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, nome, email
    `, [senhaHash, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      usuario: result.rows[0],
      senha_padrao: SENHA_PADRAO,
      mensagem: 'Senha resetada para: ' + SENHA_PADRAO
    });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
});

// Ativar/desativar usuário
router.patch('/usuarios/:userId/ativo', authAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { ativo } = req.body;

    const result = await db.query(`
      UPDATE usuarios_empresa
      SET ativo = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, nome, email, ativo
    `, [ativo, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      usuario: result.rows[0],
      mensagem: ativo ? 'Usuário ativado' : 'Usuário desativado'
    });
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro ao alterar status do usuário' });
  }
});

// ============================================
// TRANSAÇÕES - Gestão de Repasses
// ============================================

// Listar transações com filtros
router.get('/transacoes', authAdmin, async (req, res) => {
  try {
    const { tipo, status, empresa_id, limite = 100, offset = 0 } = req.query;

    let query = `
      SELECT
        t.*,
        e.nome as empresa_nome,
        e.slug as empresa_slug,
        p.valor_total,
        p.valor_taxa,
        p.mp_payment_id
      FROM transacoes t
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN pagamentos p ON t.pagamento_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (tipo) {
      query += ` AND t.tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (empresa_id) {
      query += ` AND t.empresa_id = $${paramIndex}`;
      params.push(empresa_id);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limite), parseInt(offset));

    const result = await db.query(query, params);

    res.json({ transacoes: result.rows });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// Atualizar status de uma transação (marcar repasse como pago)
router.patch('/transacoes/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pix_status, comprovante } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (pix_status) {
      updates.push(`pix_status = $${paramIndex}`);
      params.push(pix_status);
      paramIndex++;
    }

    if (comprovante) {
      updates.push(`pix_txid = $${paramIndex}`);
      params.push(comprovante);
      paramIndex++;
    }

    if (status === 'processado') {
      updates.push('data_processamento = CURRENT_TIMESTAMP');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE transacoes
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Se for repasse e foi marcado como processado, atualizar o pagamento também
    if (result.rows[0].tipo === 'repasse' && status === 'processado' && result.rows[0].pagamento_id) {
      await db.query(`
        UPDATE pagamentos
        SET status_repasse = 'processado', data_repasse = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [result.rows[0].pagamento_id]);
    }

    res.json({
      transacao: result.rows[0],
      mensagem: 'Transação atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// Resumo de transações para dashboard
router.get('/transacoes/resumo', authAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE tipo = 'repasse' AND status = 'pendente') as repasses_pendentes,
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'repasse' AND status = 'pendente'), 0) as valor_pendente,
        COUNT(*) FILTER (WHERE tipo = 'repasse' AND status = 'processado') as repasses_processados,
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'repasse' AND status = 'processado'), 0) as valor_processado,
        COUNT(*) FILTER (WHERE tipo = 'taxa') as total_taxas,
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'taxa'), 0) as valor_taxas
      FROM transacoes
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo de transações' });
  }
});

// ============================================
// MIGRATIONS - Correções de dados
// ============================================

/**
 * POST /api/super-admin/migrations/fix-primeiro-acesso
 * Corrige usuários que têm primeiro_acesso = true mas já têm senha
 */
router.post('/migrations/fix-primeiro-acesso', authAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE usuarios_empresa
      SET primeiro_acesso = false, updated_at = CURRENT_TIMESTAMP
      WHERE primeiro_acesso = true
        AND senha_hash IS NOT NULL
        AND senha_hash != ''
      RETURNING id, email, nome
    `);

    console.log(`✅ Migration fix-primeiro-acesso: ${result.rows.length} usuários atualizados`);

    res.json({
      success: true,
      message: `${result.rows.length} usuários atualizados`,
      usuarios: result.rows
    });
  } catch (error) {
    console.error('Erro na migration fix-primeiro-acesso:', error);
    res.status(500).json({ error: 'Erro ao executar migration' });
  }
});

module.exports = router;
