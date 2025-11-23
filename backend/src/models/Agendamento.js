const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const usePostgres = !!process.env.DATABASE_URL;

class Agendamento {
  static async create(data) {
    const protocolo = this.generateProtocolo();

    if (usePostgres) {
      const result = await db.query(`
        INSERT INTO agendamentos (
          protocolo, cliente_id, veiculo_id, tipo_vistoria,
          data, horario, endereco_vistoria, preco, status, observacoes, empresa_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        protocolo,
        data.cliente_id,
        data.veiculo_id,
        data.tipo_vistoria,
        data.data,
        data.horario,
        data.endereco_vistoria || null,
        data.preco,
        data.status || 'pendente',
        data.observacoes || null,
        data.empresa_id || null
      ]);

      return this.findById(result.rows[0].id);
    } else {
      const stmt = db.prepare(`
        INSERT INTO agendamentos (
          protocolo, cliente_id, veiculo_id, tipo_vistoria,
          data, horario, endereco_vistoria, preco, status, observacoes, empresa_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        protocolo,
        data.cliente_id,
        data.veiculo_id,
        data.tipo_vistoria,
        data.data,
        data.horario,
        data.endereco_vistoria || null,
        data.preco,
        data.status || 'pendente',
        data.observacoes || null,
        data.empresa_id || null
      );

      return this.findById(result.lastInsertRowid);
    }
  }

  static generateProtocolo() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VST-${timestamp}-${random}`;
  }

  static async findById(id) {
    if (usePostgres) {
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
          p.status as pagamento_status,
          p.tipo_pagamento as pagamento_tipo,
          p.data_pagamento as pagamento_data
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        JOIN veiculos v ON a.veiculo_id = v.id
        LEFT JOIN pagamentos p ON a.id = p.agendamento_id
        WHERE a.id = $1
      `, [id]);
      return result.rows[0];
    } else {
      return db.prepare(`
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
          p.status as pagamento_status,
          p.tipo_pagamento as pagamento_tipo,
          p.data_pagamento as pagamento_data
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        JOIN veiculos v ON a.veiculo_id = v.id
        LEFT JOIN pagamentos p ON a.id = p.agendamento_id
        WHERE a.id = ?
      `).get(id);
    }
  }

  static async findByProtocolo(protocolo) {
    if (usePostgres) {
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
    } else {
      return db.prepare(`
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
        WHERE a.protocolo = ?
      `).get(protocolo);
    }
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
        p.tipo_pagamento as pagamento_tipo
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN veiculos v ON a.veiculo_id = v.id
      LEFT JOIN pagamentos p ON a.id = p.agendamento_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.data) {
      params.push(filters.data);
      query += usePostgres ? ` AND a.data = $${paramIndex++}` : ' AND a.data = ?';
    }

    if (filters.status) {
      params.push(filters.status);
      query += usePostgres ? ` AND a.status = $${paramIndex++}` : ' AND a.status = ?';
    }

    if (filters.tipo_vistoria) {
      params.push(filters.tipo_vistoria);
      query += usePostgres ? ` AND a.tipo_vistoria = $${paramIndex++}` : ' AND a.tipo_vistoria = ?';
    }

    if (filters.empresa_id) {
      params.push(filters.empresa_id);
      query += usePostgres ? ` AND a.empresa_id = $${paramIndex++}` : ' AND a.empresa_id = ?';
    }

    if (filters.data_inicio && filters.data_fim) {
      params.push(filters.data_inicio, filters.data_fim);
      if (usePostgres) {
        query += ` AND a.data BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      } else {
        query += ' AND a.data BETWEEN ? AND ?';
      }
    }

    query += ' ORDER BY a.data DESC, a.horario DESC';

    if (filters.limit) {
      params.push(filters.limit);
      query += usePostgres ? ` LIMIT $${paramIndex++}` : ' LIMIT ?';
      if (filters.offset) {
        params.push(filters.offset);
        query += usePostgres ? ` OFFSET $${paramIndex++}` : ' OFFSET ?';
      }
    }

    if (usePostgres) {
      const result = await db.query(query, params);
      return result.rows;
    } else {
      return db.prepare(query).all(...params);
    }
  }

  static async findByDate(data) {
    if (usePostgres) {
      const result = await db.query(`
        SELECT * FROM agendamentos
        WHERE data = $1 AND status != 'cancelado'
        ORDER BY horario
      `, [data]);
      return result.rows;
    } else {
      return db.prepare(`
        SELECT * FROM agendamentos
        WHERE data = ? AND status != 'cancelado'
        ORDER BY horario
      `).all(data);
    }
  }

  static async findByDateAndTime(data, horario) {
    if (usePostgres) {
      const result = await db.query(`
        SELECT COUNT(*) as count FROM agendamentos
        WHERE data = $1 AND horario = $2 AND status != 'cancelado'
      `, [data, horario]);
      return result.rows[0];
    } else {
      return db.prepare(`
        SELECT COUNT(*) as count FROM agendamentos
        WHERE data = ? AND horario = ? AND status != 'cancelado'
      `).get(data, horario);
    }
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'protocolo' && key !== 'created_at') {
        fields.push(usePostgres ? `${key} = $${paramIndex++}` : `${key} = ?`);
        params.push(data[key]);
      }
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE agendamentos SET ${fields.join(', ')} WHERE id = ${usePostgres ? `$${paramIndex}` : '?'}`;

    if (usePostgres) {
      await db.query(query, params);
    } else {
      db.prepare(query).run(...params);
    }

    return this.findById(id);
  }

  static async updateStatus(id, status) {
    if (usePostgres) {
      await db.query(`
        UPDATE agendamentos
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status, id]);
    } else {
      db.prepare(`
        UPDATE agendamentos
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, id);
    }

    return this.findById(id);
  }

  static async delete(id) {
    if (usePostgres) {
      return await db.query('DELETE FROM agendamentos WHERE id = $1', [id]);
    } else {
      return db.prepare('DELETE FROM agendamentos WHERE id = ?').run(id);
    }
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM agendamentos WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      params.push(filters.status);
      query += usePostgres ? ` AND status = $${paramIndex++}` : ' AND status = ?';
    }

    if (filters.empresa_id) {
      params.push(filters.empresa_id);
      query += usePostgres ? ` AND empresa_id = $${paramIndex++}` : ' AND empresa_id = ?';
    }

    if (filters.data_inicio && filters.data_fim) {
      params.push(filters.data_inicio, filters.data_fim);
      if (usePostgres) {
        query += ` AND data BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      } else {
        query += ' AND data BETWEEN ? AND ?';
      }
    }

    if (usePostgres) {
      const result = await db.query(query, params);
      return result.rows[0].total;
    } else {
      return db.prepare(query).get(...params).total;
    }
  }

  static async getStats(dataInicio, dataFim) {
    if (usePostgres) {
      const result = await db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
          COUNT(CASE WHEN status = 'realizado' THEN 1 END) as realizados,
          COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
          SUM(preco) as receita_total,
          SUM(CASE WHEN status = 'realizado' THEN preco ELSE 0 END) as receita_realizada
        FROM agendamentos
        WHERE data BETWEEN $1 AND $2
      `, [dataInicio, dataFim]);
      return result.rows[0];
    } else {
      return db.prepare(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
          COUNT(CASE WHEN status = 'realizado' THEN 1 END) as realizados,
          COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
          SUM(preco) as receita_total,
          SUM(CASE WHEN status = 'realizado' THEN preco ELSE 0 END) as receita_realizada
        FROM agendamentos
        WHERE data BETWEEN ? AND ?
      `).get(dataInicio, dataFim);
    }
  }
}

module.exports = Agendamento;
