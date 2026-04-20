const db = require('../config/database');

class Cliente {
  static async create(data) {
    const result = await db.query(`
      INSERT INTO clientes (nome, telefone, email, cpf, empresa_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [data.nome, data.telefone, data.email, data.cpf, data.empresa_id || null]);
    return result.rows[0];
  }

  static async findById(id, empresaId) {
    if (empresaId) {
      const r = await db.query('SELECT * FROM clientes WHERE id = $1 AND empresa_id = $2', [id, empresaId]);
      return r.rows[0];
    }
    const result = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByCPF(cpf, empresaId) {
    if (empresaId) {
      const r = await db.query('SELECT * FROM clientes WHERE cpf = $1 AND empresa_id = $2', [cpf, empresaId]);
      return r.rows[0];
    }
    const result = await db.query('SELECT * FROM clientes WHERE cpf = $1', [cpf]);
    return result.rows[0];
  }

  static async findByEmail(email, empresaId) {
    if (empresaId) {
      const r = await db.query('SELECT * FROM clientes WHERE email = $1 AND empresa_id = $2', [email, empresaId]);
      return r.rows[0];
    }
    const result = await db.query('SELECT * FROM clientes WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findAll(limit = 100, offset = 0, empresaId) {
    if (empresaId) {
      const r = await db.query(
        'SELECT * FROM clientes WHERE empresa_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [empresaId, limit, offset]
      );
      return r.rows;
    }
    const result = await db.query(
      'SELECT * FROM clientes ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async update(id, data, empresaId) {
    const params = [data.nome, data.telefone, data.email, id];
    let whereEmpresa = '';
    if (empresaId) {
      params.push(empresaId);
      whereEmpresa = ` AND empresa_id = $${params.length}`;
    }
    const result = await db.query(`
      UPDATE clientes
      SET nome = $1, telefone = $2, email = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4${whereEmpresa}
      RETURNING *
    `, params);
    return result.rows[0];
  }

  static async delete(id, empresaId) {
    if (empresaId) {
      await db.query('DELETE FROM clientes WHERE id = $1 AND empresa_id = $2', [id, empresaId]);
    } else {
      await db.query('DELETE FROM clientes WHERE id = $1', [id]);
    }
    return { success: true };
  }

  static async count(empresaId) {
    if (empresaId) {
      const r = await db.query('SELECT COUNT(*) as total FROM clientes WHERE empresa_id = $1', [empresaId]);
      return parseInt(r.rows[0].total);
    }
    const result = await db.query('SELECT COUNT(*) as total FROM clientes');
    return parseInt(result.rows[0].total);
  }
}

module.exports = Cliente;
