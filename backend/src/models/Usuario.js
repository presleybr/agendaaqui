const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Detecta se está usando PostgreSQL ou SQLite
const usePostgres = !!process.env.DATABASE_URL;

class Usuario {
  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.senha, 10);

    if (usePostgres) {
      const result = await db.query(
        'INSERT INTO usuarios_admin (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id',
        [data.nome, data.email, hashedPassword]
      );
      return this.findById(result.rows[0].id);
    } else {
      const stmt = db.prepare(`
        INSERT INTO usuarios_admin (nome, email, senha_hash)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(data.nome, data.email, hashedPassword);
      return this.findById(result.lastInsertRowid);
    }
  }

  static async findById(id) {
    console.log('🔍 Usuario.findById:', id);

    if (usePostgres) {
      const result = await db.query(
        'SELECT id, nome, email, ativo, created_at FROM usuarios_admin WHERE id = $1',
        [id]
      );
      console.log('📊 PostgreSQL findById result:', result.rows[0]);
      return result.rows[0];
    } else {
      return db.prepare('SELECT id, nome, email, ativo, created_at FROM usuarios_admin WHERE id = ?').get(id);
    }
  }

  static async findByEmail(email) {
    console.log('🔍 Usuario.findByEmail:', email);

    if (usePostgres) {
      const result = await db.query(
        'SELECT * FROM usuarios_admin WHERE email = $1',
        [email]
      );
      console.log('📊 PostgreSQL findByEmail result:', result.rows[0]);
      return result.rows[0];
    } else {
      return db.prepare('SELECT * FROM usuarios_admin WHERE email = ?').get(email);
    }
  }

  static async findAll() {
    if (usePostgres) {
      const result = await db.query('SELECT id, nome, email, ativo, created_at FROM usuarios_admin');
      return result.rows;
    } else {
      return db.prepare('SELECT id, nome, email, ativo, created_at FROM usuarios_admin').all();
    }
  }

  static async verifyPassword(senha, hash) {
    return await bcrypt.compare(senha, hash);
  }

  static async updatePassword(id, novaSenha) {
    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    if (usePostgres) {
      await db.query(
        'UPDATE usuarios_admin SET senha_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, id]
      );
    } else {
      db.prepare('UPDATE usuarios_admin SET senha_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(hashedPassword, id);
    }

    return this.findById(id);
  }

  static async update(id, data) {
    if (usePostgres) {
      await db.query(
        'UPDATE usuarios_admin SET nome = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [data.nome, data.email, id]
      );
    } else {
      db.prepare('UPDATE usuarios_admin SET nome = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.nome, data.email, id);
    }

    return this.findById(id);
  }

  static async toggleStatus(id) {
    if (usePostgres) {
      await db.query(
        'UPDATE usuarios_admin SET ativo = NOT ativo, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    } else {
      db.prepare('UPDATE usuarios_admin SET ativo = NOT ativo, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(id);
    }

    return this.findById(id);
  }
}

module.exports = Usuario;
