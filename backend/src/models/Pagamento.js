const db = require('../config/database');

class Pagamento {
  static async create(data) {
    const query = `
      INSERT INTO pagamentos (
        agendamento_id, empresa_id, mp_payment_id, tipo_pagamento, valor, status,
        qr_code, qr_code_base64, payment_method_id, installments,
        dados_pagamento, data_pagamento
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const result = await db.query(query, [
      data.agendamento_id,
      data.empresa_id || null,
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
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM pagamentos WHERE id = $1', [id]);
    const payment = result.rows[0];
    if (payment && payment.dados_pagamento) {
      payment.dados_pagamento = typeof payment.dados_pagamento === 'string'
        ? JSON.parse(payment.dados_pagamento)
        : payment.dados_pagamento;
    }
    return payment;
  }

  static async findByAgendamentoId(agendamentoId) {
    const result = await db.query('SELECT * FROM pagamentos WHERE agendamento_id = $1', [agendamentoId]);
    return result.rows.map(p => {
      if (p.dados_pagamento && typeof p.dados_pagamento === 'string') {
        p.dados_pagamento = JSON.parse(p.dados_pagamento);
      }
      return p;
    });
  }

  static async findByMpPaymentId(mpPaymentId) {
    const result = await db.query('SELECT * FROM pagamentos WHERE mp_payment_id = $1', [mpPaymentId]);
    const payment = result.rows[0];
    if (payment && payment.dados_pagamento && typeof payment.dados_pagamento === 'string') {
      payment.dados_pagamento = JSON.parse(payment.dados_pagamento);
    }
    return payment;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.dados_pagamento !== undefined) {
      fields.push(`dados_pagamento = $${paramIndex++}`);
      values.push(JSON.stringify(data.dados_pagamento));
    }
    if (data.data_pagamento !== undefined) {
      fields.push(`data_pagamento = $${paramIndex++}`);
      values.push(data.data_pagamento);
    }
    if (data.qr_code !== undefined) {
      fields.push(`qr_code = $${paramIndex++}`);
      values.push(data.qr_code);
    }
    if (data.qr_code_base64 !== undefined) {
      fields.push(`qr_code_base64 = $${paramIndex++}`);
      values.push(data.qr_code_base64);
    }
    // Campos do split
    if (data.empresa_id !== undefined) {
      fields.push(`empresa_id = $${paramIndex++}`);
      values.push(data.empresa_id);
    }
    if (data.valor_taxa !== undefined) {
      fields.push(`valor_taxa = $${paramIndex++}`);
      values.push(data.valor_taxa);
    }
    if (data.valor_empresa !== undefined) {
      fields.push(`valor_empresa = $${paramIndex++}`);
      values.push(data.valor_empresa);
    }
    if (data.status_repasse !== undefined) {
      fields.push(`status_repasse = $${paramIndex++}`);
      values.push(data.status_repasse);
    }
    if (data.data_repasse !== undefined) {
      fields.push(`data_repasse = $${paramIndex++}`);
      values.push(data.data_repasse);
    }
    if (data.split_data !== undefined) {
      fields.push(`split_data = $${paramIndex++}`);
      values.push(typeof data.split_data === 'string' ? data.split_data : JSON.stringify(data.split_data));
    }

    fields.push(`atualizado_em = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE pagamentos
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `;
    await db.query(query, values);

    return await this.findById(id);
  }

  static async updateByMpPaymentId(mpPaymentId, data) {
    const payment = await this.findByMpPaymentId(mpPaymentId);
    if (!payment) return null;
    return await this.update(payment.id, data);
  }

  static async findPendingSplits() {
    const result = await db.query(`
      SELECT * FROM pagamentos
      WHERE status = 'aprovado'
      AND (status_repasse IS NULL OR status_repasse = 'pendente')
      AND empresa_id IS NOT NULL
      ORDER BY data_pagamento ASC
    `);
    return result.rows;
  }

  static async findByEmpresa(empresaId, filters = {}) {
    let query = 'SELECT * FROM pagamentos WHERE empresa_id = $1';
    const params = [empresaId];
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
  }
}

module.exports = Pagamento;
