const db = require('../config/database');
const bcrypt = require('bcryptjs');

const usePostgres = !!process.env.DATABASE_URL;

class UsuarioAdmin {
  static async create(data) {
    const { nome, email, senha, role = 'admin' } = data;
    const senha_hash = await bcrypt.hash(senha, 10);

    if (usePostgres) {
      const result = await db.query(
        `INSERT INTO usuarios_admin (nome, email, senha_hash, role, status)
        VALUES ($1, $2, $3, $4, 'ativo')
        RETURNING id, nome, email, role, status, created_at`,
        [nome, email, senha_hash, role]
      );
      return result.rows[0];
    } else {
      const result = db.prepare(
        `INSERT INTO usuarios_admin (nome, email, senha_hash, role, status)
        VALUES (?, ?, ?, ?, 'ativo')`
      ).run(nome, email, senha_hash, role);

      return this.findById(result.lastInsertRowid);
    }
  }

  static async findById(id) {
    if (usePostgres) {
      const result = await db.query(
        'SELECT id, nome, email, role, status, ultimo_acesso, created_at FROM usuarios_admin WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } else {
      return db.prepare(
        'SELECT id, nome, email, role, status, ultimo_acesso, created_at FROM usuarios_admin WHERE id = ?'
      ).get(id);
    }
  }

  static async findByEmail(email) {
    if (usePostgres) {
      const result = await db.query(
        'SELECT * FROM usuarios_admin WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } else {
      return db.prepare('SELECT * FROM usuarios_admin WHERE email = ?').get(email);
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastAccess(id) {
    if (usePostgres) {
      await db.query(
        'UPDATE usuarios_admin SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    } else {
      db.prepare('UPDATE usuarios_admin SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    }
  }

  static async findAll() {
    if (usePostgres) {
      const result = await db.query(
        'SELECT id, nome, email, role, status, ultimo_acesso, created_at FROM usuarios_admin ORDER BY created_at DESC'
      );
      return result.rows;
    } else {
      return db.prepare(
        'SELECT id, nome, email, role, status, ultimo_acesso, created_at FROM usuarios_admin ORDER BY created_at DESC'
      ).all();
    }
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.nome) {
      fields.push(usePostgres ? `nome = $${paramIndex}` : `nome = ?`);
      params.push(data.nome);
      paramIndex++;
    }

    if (data.email) {
      fields.push(usePostgres ? `email = $${paramIndex}` : `email = ?`);
      params.push(data.email);
      paramIndex++;
    }

    if (data.senha) {
      const senha_hash = await bcrypt.hash(data.senha, 10);
      fields.push(usePostgres ? `senha_hash = $${paramIndex}` : `senha_hash = ?`);
      params.push(senha_hash);
      paramIndex++;
    }

    if (data.role) {
      fields.push(usePostgres ? `role = $${paramIndex}` : `role = ?`);
      params.push(data.role);
      paramIndex++;
    }

    if (data.status) {
      fields.push(usePostgres ? `status = $${paramIndex}` : `status = ?`);
      params.push(data.status);
      paramIndex++;
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (usePostgres) {
      params.push(id);
      const query = `UPDATE usuarios_admin SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, nome, email, role, status`;
      const result = await db.query(query, params);
      return result.rows[0];
    } else {
      params.push(id);
      const query = `UPDATE usuarios_admin SET ${fields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...params);
      return this.findById(id);
    }
  }

  static async delete(id) {
    if (usePostgres) {
      await db.query('DELETE FROM usuarios_admin WHERE id = $1', [id]);
    } else {
      db.prepare('DELETE FROM usuarios_admin WHERE id = ?').run(id);
    }
  }
}

module.exports = UsuarioAdmin;
