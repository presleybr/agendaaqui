const db = require('../config/database');

const usePostgres = !!process.env.DATABASE_URL;

class Empresa {
  static async create(data) {
    const { nome, slug, razao_social, cnpj, email, telefone, pix_key, pix_type, logo_url } = data;

    if (usePostgres) {
      const result = await db.query(
        `INSERT INTO empresas
        (nome, slug, razao_social, cnpj, email, telefone, pix_key, pix_type, logo_url, status, data_inicio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ativo', CURRENT_DATE)
        RETURNING *`,
        [nome, slug, razao_social, cnpj, email, telefone, pix_key, pix_type, logo_url]
      );
      return result.rows[0];
    } else {
      const result = db.prepare(
        `INSERT INTO empresas
        (nome, slug, razao_social, cnpj, email, telefone, pix_key, pix_type, logo_url, status, data_inicio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', date('now'))`
      ).run(nome, slug, razao_social, cnpj, email, telefone, pix_key, pix_type, logo_url);

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
}

module.exports = Empresa;
