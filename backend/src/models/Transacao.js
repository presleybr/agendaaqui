const db = require('../config/database');

const usePostgres = !!process.env.DATABASE_URL;

class Transacao {
  static async create(data) {
    const {
      empresa_id,
      pagamento_id,
      agendamento_id,
      tipo,
      valor,
      descricao,
      pix_key,
      pix_txid,
      pix_status = 'pendente'
    } = data;

    if (usePostgres) {
      const result = await db.query(
        `INSERT INTO transacoes
        (empresa_id, pagamento_id, agendamento_id, tipo, valor, descricao, pix_key, pix_txid, pix_status, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente')
        RETURNING *`,
        [empresa_id, pagamento_id, agendamento_id, tipo, valor, descricao, pix_key, pix_txid, pix_status]
      );
      return result.rows[0];
    } else {
      const result = db.prepare(
        `INSERT INTO transacoes
        (empresa_id, pagamento_id, agendamento_id, tipo, valor, descricao, pix_key, pix_txid, pix_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`
      ).run(empresa_id, pagamento_id, agendamento_id, tipo, valor, descricao, pix_key, pix_txid, pix_status);

      return this.findById(result.lastInsertRowid);
    }
  }

  static async findById(id) {
    if (usePostgres) {
      const result = await db.query('SELECT * FROM transacoes WHERE id = $1', [id]);
      return result.rows[0];
    } else {
      return db.prepare('SELECT * FROM transacoes WHERE id = ?').get(id);
    }
  }

  static async findByEmpresa(empresaId, filters = {}) {
    let query = 'SELECT * FROM transacoes WHERE empresa_id = ';
    const params = [empresaId];

    if (usePostgres) {
      query += '$1';
      let paramIndex = 2;

      if (filters.tipo) {
        query += ` AND tipo = $${paramIndex}`;
        params.push(filters.tipo);
        paramIndex++;
      }

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

      if (filters.tipo) {
        query += ` AND tipo = ?`;
        params.push(filters.tipo);
      }

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

  static async findByPagamento(pagamentoId) {
    if (usePostgres) {
      const result = await db.query(
        'SELECT * FROM transacoes WHERE pagamento_id = $1 ORDER BY created_at DESC',
        [pagamentoId]
      );
      return result.rows;
    } else {
      return db.prepare(
        'SELECT * FROM transacoes WHERE pagamento_id = ? ORDER BY created_at DESC'
      ).all(pagamentoId);
    }
  }

  static async updateStatus(id, status, data = {}) {
    const fields = [usePostgres ? 'status = $1' : 'status = ?'];
    const params = [status];
    let paramIndex = 2;

    if (data.pix_status) {
      fields.push(usePostgres ? `pix_status = $${paramIndex}` : 'pix_status = ?');
      params.push(data.pix_status);
      paramIndex++;
    }

    if (data.erro_mensagem) {
      fields.push(usePostgres ? `erro_mensagem = $${paramIndex}` : 'erro_mensagem = ?');
      params.push(data.erro_mensagem);
      paramIndex++;
    }

    if (status === 'processado') {
      fields.push(usePostgres ? `data_processamento = CURRENT_TIMESTAMP` : 'data_processamento = CURRENT_TIMESTAMP');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (usePostgres) {
      params.push(id);
      const query = `UPDATE transacoes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const result = await db.query(query, params);
      return result.rows[0];
    } else {
      params.push(id);
      const query = `UPDATE transacoes SET ${fields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...params);
      return this.findById(id);
    }
  }

  static async getResumoEmpresa(empresaId) {
    if (usePostgres) {
      const result = await db.query(`
        SELECT
          COUNT(*) as total_transacoes,
          SUM(CASE WHEN tipo = 'repasse' AND status = 'processado' THEN valor ELSE 0 END) as total_recebido,
          SUM(CASE WHEN tipo = 'taxa' THEN valor ELSE 0 END) as total_taxas,
          SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as total_pendente
        FROM transacoes
        WHERE empresa_id = $1
      `, [empresaId]);
      return result.rows[0];
    } else {
      return db.prepare(`
        SELECT
          COUNT(*) as total_transacoes,
          SUM(CASE WHEN tipo = 'repasse' AND status = 'processado' THEN valor ELSE 0 END) as total_recebido,
          SUM(CASE WHEN tipo = 'taxa' THEN valor ELSE 0 END) as total_taxas,
          SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as total_pendente
        FROM transacoes
        WHERE empresa_id = ?
      `).get(empresaId);
    }
  }

  static async getResumoSistema() {
    if (usePostgres) {
      const result = await db.query(`
        SELECT
          COUNT(DISTINCT empresa_id) as total_empresas,
          COUNT(*) as total_transacoes,
          SUM(CASE WHEN tipo = 'taxa' AND status = 'processado' THEN valor ELSE 0 END) as total_taxas_recebidas,
          SUM(CASE WHEN tipo = 'repasse' AND status = 'processado' THEN valor ELSE 0 END) as total_repassado,
          SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as total_pendente
        FROM transacoes
      `);
      return result.rows[0];
    } else {
      return db.prepare(`
        SELECT
          COUNT(DISTINCT empresa_id) as total_empresas,
          COUNT(*) as total_transacoes,
          SUM(CASE WHEN tipo = 'taxa' AND status = 'processado' THEN valor ELSE 0 END) as total_taxas_recebidas,
          SUM(CASE WHEN tipo = 'repasse' AND status = 'processado' THEN valor ELSE 0 END) as total_repassado,
          SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as total_pendente
        FROM transacoes
      `).get();
    }
  }
}

module.exports = Transacao;
