const db = require('../config/database');

class Veiculo {
  static async create(data) {
    const result = await db.query(`
      INSERT INTO veiculos (placa, marca, modelo, ano, chassi, cliente_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      data.placa,
      data.marca,
      data.modelo,
      data.ano,
      data.chassi,
      data.cliente_id
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(`
      SELECT v.*, c.nome as cliente_nome, c.telefone as cliente_telefone
      FROM veiculos v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async findByPlaca(placa) {
    const result = await db.query('SELECT * FROM veiculos WHERE placa = $1', [placa]);
    return result.rows[0];
  }

  static async findByClienteId(clienteId) {
    const result = await db.query('SELECT * FROM veiculos WHERE cliente_id = $1', [clienteId]);
    return result.rows;
  }

  static async findAll(limit = 100, offset = 0) {
    const result = await db.query(`
      SELECT v.*, c.nome as cliente_nome
      FROM veiculos v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  static async update(id, data) {
    const result = await db.query(`
      UPDATE veiculos
      SET placa = $1, marca = $2, modelo = $3, ano = $4, chassi = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [data.placa, data.marca, data.modelo, data.ano, data.chassi, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM veiculos WHERE id = $1', [id]);
    return { success: true };
  }
}

module.exports = Veiculo;
