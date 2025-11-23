const db = require('../config/database');

// Detecta se está usando PostgreSQL ou SQLite
const usePostgres = !!process.env.DATABASE_URL;

class Pagamento {
  static async create(data) {
    if (usePostgres) {
      const query = `
        INSERT INTO pagamentos (
          agendamento_id, mp_payment_id, tipo_pagamento, valor, status,
          qr_code, qr_code_base64, payment_method_id, installments,
          dados_pagamento, data_pagamento
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `;

      const result = await db.query(query, [
        data.agendamento_id,
        data.mp_payment_id || null,
        data.tipo_pagamento,
        data.valor,
        data.status || 'pending',
        data.qr_code || null,
        data.qr_code_base64 || null,
        data.payment_method_id || null,
        data.installments || 1,
        data.dados_pagamento ? JSON.stringify(data.dados_pagamento) : null,
        data.data_pagamento || null
      ]);

      return await this.findById(result.rows[0].id);
    } else {
      // SQLite
      const stmt = db.prepare(`
        INSERT INTO pagamentos (
          agendamento_id, mp_payment_id, tipo_pagamento, valor, status,
          qr_code, qr_code_base64, payment_method_id, installments,
          dados_pagamento, data_pagamento
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.agendamento_id,
        data.mp_payment_id || null,
        data.tipo_pagamento,
        data.valor,
        data.status || 'pending',
        data.qr_code || null,
        data.qr_code_base64 || null,
        data.payment_method_id || null,
        data.installments || 1,
        data.dados_pagamento ? JSON.stringify(data.dados_pagamento) : null,
        data.data_pagamento || null
      );

      return this.findById(result.lastInsertRowid);
    }
  }

  static async findById(id) {
    if (usePostgres) {
      const result = await db.query('SELECT * FROM pagamentos WHERE id = $1', [id]);
      const payment = result.rows[0];
      if (payment && payment.dados_pagamento) {
        payment.dados_pagamento = typeof payment.dados_pagamento === 'string'
          ? JSON.parse(payment.dados_pagamento)
          : payment.dados_pagamento;
      }
      return payment;
    } else {
      const payment = db.prepare('SELECT * FROM pagamentos WHERE id = ?').get(id);
      if (payment && payment.dados_pagamento) {
        payment.dados_pagamento = JSON.parse(payment.dados_pagamento);
      }
      return payment;
    }
  }

  static async findByAgendamentoId(agendamentoId) {
    if (usePostgres) {
      const result = await db.query('SELECT * FROM pagamentos WHERE agendamento_id = $1', [agendamentoId]);
      return result.rows.map(p => {
        if (p.dados_pagamento && typeof p.dados_pagamento === 'string') {
          p.dados_pagamento = JSON.parse(p.dados_pagamento);
        }
        return p;
      });
    } else {
      const payments = db.prepare('SELECT * FROM pagamentos WHERE agendamento_id = ?').all(agendamentoId);
      return payments.map(p => {
        if (p.dados_pagamento) {
          p.dados_pagamento = JSON.parse(p.dados_pagamento);
        }
        return p;
      });
    }
  }

  static async findByMpPaymentId(mpPaymentId) {
    if (usePostgres) {
      const result = await db.query('SELECT * FROM pagamentos WHERE mp_payment_id = $1', [mpPaymentId]);
      const payment = result.rows[0];
      if (payment && payment.dados_pagamento && typeof payment.dados_pagamento === 'string') {
        payment.dados_pagamento = JSON.parse(payment.dados_pagamento);
      }
      return payment;
    } else {
      const payment = db.prepare('SELECT * FROM pagamentos WHERE mp_payment_id = ?').get(mpPaymentId);
      if (payment && payment.dados_pagamento) {
        payment.dados_pagamento = JSON.parse(payment.dados_pagamento);
      }
      return payment;
    }
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      fields.push(usePostgres ? `status = $${paramIndex++}` : 'status = ?');
      values.push(data.status);
    }
    if (data.dados_pagamento !== undefined) {
      fields.push(usePostgres ? `dados_pagamento = $${paramIndex++}` : 'dados_pagamento = ?');
      values.push(JSON.stringify(data.dados_pagamento));
    }
    if (data.data_pagamento !== undefined) {
      fields.push(usePostgres ? `data_pagamento = $${paramIndex++}` : 'data_pagamento = ?');
      values.push(data.data_pagamento);
    }
    if (data.qr_code !== undefined) {
      fields.push(usePostgres ? `qr_code = $${paramIndex++}` : 'qr_code = ?');
      values.push(data.qr_code);
    }
    if (data.qr_code_base64 !== undefined) {
      fields.push(usePostgres ? `qr_code_base64 = $${paramIndex++}` : 'qr_code_base64 = ?');
      values.push(data.qr_code_base64);
    }
    // Campos do split
    if (data.empresa_id !== undefined) {
      fields.push(usePostgres ? `empresa_id = $${paramIndex++}` : 'empresa_id = ?');
      values.push(data.empresa_id);
    }
    if (data.valor_taxa !== undefined) {
      fields.push(usePostgres ? `valor_taxa = $${paramIndex++}` : 'valor_taxa = ?');
      values.push(data.valor_taxa);
    }
    if (data.valor_empresa !== undefined) {
      fields.push(usePostgres ? `valor_empresa = $${paramIndex++}` : 'valor_empresa = ?');
      values.push(data.valor_empresa);
    }
    if (data.status_repasse !== undefined) {
      fields.push(usePostgres ? `status_repasse = $${paramIndex++}` : 'status_repasse = ?');
      values.push(data.status_repasse);
    }
    if (data.data_repasse !== undefined) {
      fields.push(usePostgres ? `data_repasse = $${paramIndex++}` : 'data_repasse = ?');
      values.push(data.data_repasse);
    }
    if (data.split_data !== undefined) {
      fields.push(usePostgres ? `split_data = $${paramIndex++}` : 'split_data = ?');
      values.push(typeof data.split_data === 'string' ? data.split_data : JSON.stringify(data.split_data));
    }

    fields.push(usePostgres ? `atualizado_em = CURRENT_TIMESTAMP` : 'atualizado_em = CURRENT_TIMESTAMP');
    values.push(id);

    if (usePostgres) {
      const query = `
        UPDATE pagamentos
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
      `;
      await db.query(query, values);
    } else {
      const stmt = db.prepare(`
        UPDATE pagamentos
        SET ${fields.join(', ')}
        WHERE id = ?
      `);
      stmt.run(...values);
    }

    return await this.findById(id);
  }

  static async updateByMpPaymentId(mpPaymentId, data) {
    const payment = await this.findByMpPaymentId(mpPaymentId);
    if (!payment) return null;
    return await this.update(payment.id, data);
  }

  static async findPendingSplits() {
    if (usePostgres) {
      const result = await db.query(`
        SELECT * FROM pagamentos
        WHERE status = 'aprovado'
        AND (status_repasse IS NULL OR status_repasse = 'pendente')
        AND empresa_id IS NOT NULL
        ORDER BY data_pagamento ASC
      `);
      return result.rows;
    } else {
      return db.prepare(`
        SELECT * FROM pagamentos
        WHERE status = 'aprovado'
        AND (status_repasse IS NULL OR status_repasse = 'pendente')
        AND empresa_id IS NOT NULL
        ORDER BY data_pagamento ASC
      `).all();
    }
  }

  static async findByEmpresa(empresaId, filters = {}) {
    let query = 'SELECT * FROM pagamentos WHERE empresa_id = ';
    const params = [empresaId];

    if (usePostgres) {
      query += '$1';
      let paramIndex = 2;

      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const result = await db.query(query, params);
      return result.rows;
    } else {
      query += '?';

      if (filters.status) {
        query += ` AND status = ?`;
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(filters.limit);
      }

      return db.prepare(query).all(...params);
    }
  }
}

module.exports = Pagamento;
