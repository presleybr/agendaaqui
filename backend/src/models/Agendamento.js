const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Agendamento {
  static async create(data) {
    const protocolo = this.generateProtocolo();

    const result = await db.query(`
      INSERT INTO agendamentos (
        protocolo, cliente_id, veiculo_id, tipo_vistoria, categoria_veiculo,
        data_hora, endereco_vistoria, valor, status, observacoes, empresa_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      protocolo,
      data.cliente_id,
      data.veiculo_id,
      data.tipo_vistoria,
      data.categoria_veiculo || null,
      data.data_hora || data.data, // Accept both data_hora and data for backward compatibility
      data.endereco_vistoria || null,
      data.valor || data.preco, // Accept both valor and preco for backward compatibility
      data.status || 'pendente',
      data.observacoes || null,
      data.empresa_id || null
    ]);

    return this.findById(result.rows[0].id);
  }

  static generateProtocolo() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VST-${timestamp}-${random}`;
  }

  static async findById(id) {
    console.log('📍 Model: Buscando agendamento com ID:', id);

    const result = await db.query(`
      SELECT
        a.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.email as cliente_email,
        c.cpf as cliente_cpf,
        v.placa as veiculo_placa,
        v.marca as veiculo_marca,
        v.modelo as veiculo_modelo,
        v.ano as veiculo_ano,
        p.status as pagamento_status
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN veiculos v ON a.veiculo_id = v.id
      LEFT JOIN pagamentos p ON a.id = p.agendamento_id
      WHERE a.id = $1
    `, [id]);

    console.log('📊 Model: Resultado da query:', {
      rowCount: result.rowCount,
      hasData: result.rows.length > 0,
      data: result.rows[0]
    });

    return result.rows[0];
  }

  static async findByProtocolo(protocolo) {
    const result = await db.query(`
      SELECT
        a.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.email as cliente_email,
        v.placa as veiculo_placa,
        v.marca as veiculo_marca,
        v.modelo as veiculo_modelo,
        v.ano as veiculo_ano
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.protocolo = $1
    `, [protocolo]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT
        a.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        v.placa as veiculo_placa,
        v.marca as veiculo_marca,
        v.modelo as veiculo_modelo,
        p.status as pagamento_status,
        p.metodo_pagamento as pagamento_tipo
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN veiculos v ON a.veiculo_id = v.id
      LEFT JOIN pagamentos p ON a.id = p.agendamento_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.data || filters.data_hora) {
      params.push(filters.data || filters.data_hora);
      query += ` AND DATE(a.data_hora) = $${paramIndex++}`;
    }

    if (filters.status) {
      params.push(filters.status);
      query += ` AND a.status = $${paramIndex++}`;
    }

    if (filters.tipo_vistoria) {
      params.push(filters.tipo_vistoria);
      query += ` AND a.tipo_vistoria = $${paramIndex++}`;
    }

    if (filters.empresa_id) {
      params.push(filters.empresa_id);
      query += ` AND a.empresa_id = $${paramIndex++}`;
    }

    if (filters.data_inicio && filters.data_fim) {
      params.push(filters.data_inicio, filters.data_fim);
      query += ` AND DATE(a.data_hora) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
    }

    query += ' ORDER BY a.data_hora DESC';

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${paramIndex++}`;
      if (filters.offset) {
        params.push(filters.offset);
        query += ` OFFSET $${paramIndex++}`;
      }
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findByDate(data) {
    const result = await db.query(`
      SELECT * FROM agendamentos
      WHERE DATE(data_hora) = $1 AND status != 'cancelado'
      ORDER BY data_hora
    `, [data]);
    return result.rows;
  }

  static async findByDateAndTime(data, horario) {
    // Combine date and time into timestamp for comparison
    const result = await db.query(`
      SELECT COUNT(*) as count FROM agendamentos
      WHERE DATE(data_hora) = $1
        AND EXTRACT(HOUR FROM data_hora) = EXTRACT(HOUR FROM $2::time)
        AND EXTRACT(MINUTE FROM data_hora) = EXTRACT(MINUTE FROM $2::time)
        AND status != 'cancelado'
    `, [data, horario]);
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'protocolo' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(data[key]);
      }
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE agendamentos SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

    await db.query(query, params);

    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await db.query(`
      UPDATE agendamentos
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, id]);

    return this.findById(id);
  }

  static async delete(id) {
    return await db.query('DELETE FROM agendamentos WHERE id = $1', [id]);
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM agendamentos WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${paramIndex++}`;
    }

    if (filters.empresa_id) {
      params.push(filters.empresa_id);
      query += ` AND empresa_id = $${paramIndex++}`;
    }

    if (filters.data_inicio && filters.data_fim) {
      params.push(filters.data_inicio, filters.data_fim);
      query += ` AND DATE(data_hora) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total);
  }

  static async getStats(dataInicio, dataFim) {
    const result = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
        COUNT(CASE WHEN status = 'realizado' THEN 1 END) as realizados,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        SUM(valor) as receita_total,
        SUM(CASE WHEN status = 'realizado' THEN valor ELSE 0 END) as receita_realizada
      FROM agendamentos
      WHERE DATE(data_hora) BETWEEN $1 AND $2
    `, [dataInicio, dataFim]);
    return result.rows[0];
  }
}

module.exports = Agendamento;
