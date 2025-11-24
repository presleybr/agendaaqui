const db = require('../config/database');

class Cliente {
  static async create(data) {
    const result = await db.query(`
      INSERT INTO clientes (nome, telefone, email, cpf)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.nome, data.telefone, data.email, data.cpf]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByCPF(cpf) {
    const result = await db.query('SELECT * FROM clientes WHERE cpf = $1', [cpf]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM clientes WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findAll(limit = 100, offset = 0) {
    const result = await db.query(
      'SELECT * FROM clientes ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async update(id, data) {
    const result = await db.query(`
      UPDATE clientes
      SET nome = $1, telefone = $2, email = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [data.nome, data.telefone, data.email, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM clientes WHERE id = $1', [id]);
    return { success: true };
  }

  static async count() {
    const result = await db.query('SELECT COUNT(*) as total FROM clientes');
    return parseInt(result.rows[0].total);
  }
}

module.exports = Cliente;
