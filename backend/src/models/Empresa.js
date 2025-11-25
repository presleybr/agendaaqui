const db = require('../config/database');

const usePostgres = !!process.env.DATABASE_URL;

class Empresa {
  static async create(data) {
    const {
      nome,
      slug,
      cnpj,
      email,
      telefone,
      chave_pix,
      preco_cautelar,
      preco_transferencia,
      preco_outros,
      horario_inicio,
      horario_fim,
      intervalo_minutos,
      status,
      plano
    } = data;

    if (usePostgres) {
      const result = await db.query(
        `INSERT INTO empresas
        (nome, slug, cnpj, email, telefone, chave_pix, preco_cautelar, preco_transferencia,
         preco_outros, horario_inicio, horario_fim, intervalo_minutos, status, plano)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          nome,
          slug,
          cnpj,
          email,
          telefone,
          chave_pix,
          preco_cautelar || 15000,
          preco_transferencia || 12000,
          preco_outros || 10000,
          horario_inicio || '08:00:00',
          horario_fim || '18:00:00',
          intervalo_minutos || 60,
          status || 'ativo',
          plano || 'basico'
        ]
      );
      return result.rows[0];
    } else {
      // SQLite version (legacy)
      const result = db.prepare(
        `INSERT INTO empresas
        (nome, slug, cnpj, email, telefone, chave_pix, status)
        VALUES (?, ?, ?, ?, ?, ?, 'ativo')`
      ).run(nome, slug, cnpj, email, telefone, chave_pix);

      return this.findById(result.lastInsertRowid);
    }
  }

  static async findById(id) {
    if (usePostgres) {
      const result = await db.query('SELECT * FROM empresas WHERE id = $1', [id]);
      return result.rows[0];
    } else {
      return db.prepare('SELECT * FROM empresas WHERE id = ?').get(id);
    }
  }

  static async findBySlug(slug) {
    if (usePostgres) {
      const result = await db.query('SELECT * FROM empresas WHERE slug = $1', [slug]);
      return result.rows[0];
    } else {
      return db.prepare('SELECT * FROM empresas WHERE slug = ?').get(slug);
    }
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM empresas WHERE 1=1';
    const params = [];

    if (filters.status) {
      if (usePostgres) {
        params.push(filters.status);
        query += ` AND status = $${params.length}`;
      } else {
        params.push(filters.status);
        query += ` AND status = ?`;
      }
    }

    query += ' ORDER BY created_at DESC';

    if (usePostgres) {
      const result = await db.query(query, params);
      return result.rows;
    } else {
      return db.prepare(query).all(...params);
    }
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(usePostgres ? `${key} = $${paramIndex}` : `${key} = ?`);
        params.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(usePostgres ? `updated_at = CURRENT_TIMESTAMP` : `updated_at = CURRENT_TIMESTAMP`);

    if (usePostgres) {
      params.push(id);
      const query = `UPDATE empresas SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const result = await db.query(query, params);
      return result.rows[0];
    } else {
      params.push(id);
      const query = `UPDATE empresas SET ${fields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...params);
      return this.findById(id);
    }
  }

  static async delete(id) {
    if (usePostgres) {
      await db.query('DELETE FROM empresas WHERE id = $1', [id]);
    } else {
      db.prepare('DELETE FROM empresas WHERE id = ?').run(id);
    }
  }

  static async getDiasFuncionamento(empresaId) {
    const empresa = await this.findById(empresaId);
    if (!empresa) return null;

    const dataInicio = new Date(empresa.data_inicio);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  static async getStats(empresaId) {
    if (usePostgres) {
      const result = await db.query(`
        SELECT
          COUNT(DISTINCT a.id) as total_agendamentos,
          COUNT(DISTINCT CASE WHEN p.status = 'aprovado' THEN p.id END) as pagamentos_aprovados,
          SUM(CASE WHEN p.status = 'aprovado' THEN p.valor ELSE 0 END) as valor_total,
          SUM(CASE WHEN p.status = 'aprovado' THEN p.valor_empresa ELSE 0 END) as valor_recebido,
          SUM(CASE WHEN p.status = 'aprovado' THEN p.valor_taxa ELSE 0 END) as valor_taxas
        FROM agendamentos a
        LEFT JOIN pagamentos p ON a.id = p.agendamento_id
        WHERE a.empresa_id = $1
      `, [empresaId]);
      return result.rows[0];
    } else {
      return db.prepare(`
        SELECT
          COUNT(DISTINCT a.id) as total_agendamentos,
          COUNT(DISTINCT CASE WHEN p.status = 'aprovado' THEN p.id END) as pagamentos_aprovados,
          SUM(CASE WHEN p.status = 'aprovado' THEN p.valor ELSE 0 END) as valor_total,
          SUM(CASE WHEN p.status = 'aprovado' THEN p.valor_empresa ELSE 0 END) as valor_recebido,
          SUM(CASE WHEN p.status = 'aprovado' THEN p.valor_taxa ELSE 0 END) as valor_taxas
        FROM agendamentos a
        LEFT JOIN pagamentos p ON a.id = p.agendamento_id
        WHERE a.empresa_id = ?
      `).get(empresaId);
    }
  }

  static async isSlugAvailable(slug) {
    const empresa = await this.findBySlug(slug);
    return !empresa;
  }

  static async getMetricas(empresaId, mes, ano) {
    if (usePostgres) {
      const result = await db.query(`
        SELECT
          COUNT(a.id) as total_agendamentos,
          COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.valor_total ELSE 0 END), 0) as total_receita,
          COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.valor_comissao ELSE 0 END), 0) as total_comissao_plataforma,
          COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.valor_empresa ELSE 0 END), 0) as total_repasses
        FROM agendamentos a
        LEFT JOIN pagamentos p ON a.id = p.agendamento_id
        WHERE a.empresa_id = $1
          AND EXTRACT(MONTH FROM a.data_hora) = $2
          AND EXTRACT(YEAR FROM a.data_hora) = $3
      `, [empresaId, mes, ano]);
      return result.rows[0];
    }
    return null;
  }

  static async getSplitsPendentes() {
    if (usePostgres) {
      const result = await db.query(`
        SELECT
          p.*,
          a.empresa_id,
          e.nome as empresa_nome
        FROM pagamentos p
        JOIN agendamentos a ON p.agendamento_id = a.id
        JOIN empresas e ON a.empresa_id = e.id
        WHERE p.status = 'approved'
          AND p.valor_empresa > 0
        ORDER BY p.pago_em DESC
      `);
      return result.rows;
    }
    return [];
  }
}

module.exports = Empresa;
