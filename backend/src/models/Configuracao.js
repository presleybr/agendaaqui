const db = require('../config/database');

class Configuracao {
  static async get(chave) {
    const result = await db.query('SELECT valor FROM configuracoes WHERE chave = $1', [chave]);
    return result.rows[0] ? result.rows[0].valor : null;
  }

  static async getAll() {
    const result = await db.query('SELECT chave, valor FROM configuracoes');
    return result.rows.reduce((acc, config) => {
      acc[config.chave] = config.valor;
      return acc;
    }, {});
  }

  static async set(chave, valor) {
    await db.query(`
      INSERT INTO configuracoes (chave, valor, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT(chave) DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
    `, [chave, valor]);
    return this.get(chave);
  }

  static async setMultiple(configs) {
    const entries = Object.entries(configs);
    for (const [chave, valor] of entries) {
      await db.query(`
        INSERT INTO configuracoes (chave, valor, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT(chave) DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
      `, [chave, valor]);
    }
    return this.getAll();
  }

  static async getPrices() {
    try {
      const cautelar = await this.get('preco_cautelar');
      const transferencia = await this.get('preco_transferencia');
      const outros = await this.get('preco_outros');

      return {
        cautelar: parseInt(cautelar || '15000'),
        transferencia: parseInt(transferencia || '12000'),
        outros: parseInt(outros || '10000')
      };
    } catch (error) {
      console.error('❌ Erro ao buscar preços do banco:', error.message);
      console.log('⚠️  Usando preços padrão');

      // Retornar valores padrão caso a tabela não exista
      return {
        cautelar: 15000,  // R$ 150,00
        transferencia: 12000,  // R$ 120,00
        outros: 10000  // R$ 100,00
      };
    }
  }

  static async getWorkingHours() {
    try {
      const inicio = await this.get('horario_inicio');
      const fim = await this.get('horario_fim');
      const duracao_slot = await this.get('duracao_slot');
      const dias_trabalho = await this.get('dias_trabalho');

      return {
        inicio: inicio || '08:00',
        fim: fim || '18:00',
        duracao_slot: parseInt(duracao_slot || '60'),
        dias_trabalho: (dias_trabalho || '1,2,3,4,5,6').split(',').map(Number)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar horários do banco:', error.message);
      console.log('⚠️  Usando horários padrão');

      // Retornar valores padrão caso a tabela não exista
      return {
        inicio: '08:00',
        fim: '18:00',
        duracao_slot: 60,
        dias_trabalho: [1, 2, 3, 4, 5, 6]  // Seg-Sáb
      };
    }
  }
}

module.exports = Configuracao;
