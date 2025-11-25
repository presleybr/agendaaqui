const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UsuarioAdmin {
  static async create(data) {
    const { nome, email, senha } = data;
    const senha_hash = await bcrypt.hash(senha, 10);

    const result = await db.query(
      `INSERT INTO usuarios_admin (nome, email, senha_hash, ativo)
      VALUES ($1, $2, $3, true)
      RETURNING id, nome, email, ativo, created_at`,
      [nome, email, senha_hash]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, nome, email, ativo, created_at FROM usuarios_admin WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM usuarios_admin WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastAccess(id) {
    // Column ultimo_acesso doesn't exist in schema - removing this functionality
    // If needed, add ultimo_acesso column to schema first
    return;
  }

  static async findAll() {
    const result = await db.query(
      'SELECT id, nome, email, ativo, created_at FROM usuarios_admin ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.nome) {
      fields.push(`nome = $${paramIndex}`);
      params.push(data.nome);
      paramIndex++;
    }

    if (data.email) {
      fields.push(`email = $${paramIndex}`);
      params.push(data.email);
      paramIndex++;
    }

    if (data.senha) {
      const senha_hash = await bcrypt.hash(data.senha, 10);
      fields.push(`senha_hash = $${paramIndex}`);
      params.push(senha_hash);
      paramIndex++;
    }

    if (typeof data.ativo !== 'undefined') {
      fields.push(`ativo = $${paramIndex}`);
      params.push(data.ativo);
      paramIndex++;
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE usuarios_admin SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, nome, email, ativo`;
    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM usuarios_admin WHERE id = $1', [id]);
  }
}

module.exports = UsuarioAdmin;
