const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.senha, 10);

    const result = await db.query(
      'INSERT INTO usuarios_admin (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id',
      [data.nome, data.email, hashedPassword]
    );

    return this.findById(result.rows[0].id);
  }

  static async findById(id) {
    console.log('🔍 Usuario.findById:', id);

    const result = await db.query(
      'SELECT id, nome, email, ativo, created_at FROM usuarios_admin WHERE id = $1',
      [id]
    );

    console.log('📊 PostgreSQL findById result:', result.rows[0]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    console.log('🔍 Usuario.findByEmail:', email);

    const result = await db.query(
      'SELECT * FROM usuarios_admin WHERE email = $1',
      [email]
    );

    console.log('📊 PostgreSQL findByEmail result:', result.rows[0]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query(
      'SELECT id, nome, email, ativo, created_at FROM usuarios_admin ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async verifyPassword(senha, hash) {
    return await bcrypt.compare(senha, hash);
  }

  static async updatePassword(id, novaSenha) {
    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await db.query(
      'UPDATE usuarios_admin SET senha_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );

    return this.findById(id);
  }

  static async update(id, data) {
    await db.query(
      'UPDATE usuarios_admin SET nome = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [data.nome, data.email, id]
    );

    return this.findById(id);
  }

  static async toggleStatus(id) {
    await db.query(
      'UPDATE usuarios_admin SET ativo = NOT ativo, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    return this.findById(id);
  }
}

module.exports = Usuario;
