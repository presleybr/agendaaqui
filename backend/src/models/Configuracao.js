const db = require('../config/database');

// Detecta se está usando PostgreSQL (retorna Promises) ou SQLite (síncrono)
const usePostgres = !!process.env.DATABASE_URL;

class Configuracao {
  static async get(chave) {
    if (usePostgres) {
      const result = await db.query('SELECT valor FROM configuracoes WHERE chave = $1', [chave]);
      return result.rows[0] ? result.rows[0].valor : null;
    } else {
      const result = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave);
      return result ? result.valor : null;
    }
  }

  static async getAll() {
    if (usePostgres) {
      const result = await db.query('SELECT chave, valor, descricao FROM configuracoes');
      return result.rows.reduce((acc, config) => {
        acc[config.chave] = config.valor;
        return acc;
      }, {});
    } else {
      const configs = db.prepare('SELECT chave, valor, descricao FROM configuracoes').all();
      return configs.reduce((acc, config) => {
        acc[config.chave] = config.valor;
        return acc;
      }, {});
    }
  }

  static async set(chave, valor) {
    if (usePostgres) {
      await db.query(`
        INSERT INTO configuracoes (chave, valor, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT(chave) DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
      `, [chave, valor]);
      return this.get(chave);
    } else {
      db.prepare(`
        INSERT INTO configuracoes (chave, valor, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(chave) DO UPDATE SET valor = ?, updated_at = CURRENT_TIMESTAMP
      `).run(chave, valor, valor);
      return this.get(chave);
    }
  }

  static async setMultiple(configs) {
    if (usePostgres) {
      const entries = Object.entries(configs);
      for (const [chave, valor] of entries) {
        await db.query(`
          INSERT INTO configuracoes (chave, valor, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT(chave) DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
        `, [chave, valor]);
      }
      return this.getAll();
    } else {
      const stmt = db.prepare(`
        INSERT INTO configuracoes (chave, valor, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(chave) DO UPDATE SET valor = ?, updated_at = CURRENT_TIMESTAMP
      `);

      const transaction = db.transaction((configsArray) => {
        configsArray.forEach(([chave, valor]) => {
          stmt.run(chave, valor, valor);
        });
      });

      transaction(Object.entries(configs));
      return this.getAll();
    }
  }

  static async getPrices() {
    const cautelar = await this.get('preco_cautelar');
    const transferencia = await this.get('preco_transferencia');
    const outros = await this.get('preco_outros');

    return {
      cautelar: parseInt(cautelar || '35000'),
      transferencia: parseInt(transferencia || '22000'),
      outros: parseInt(outros || '10000')
    };
  }

  static async getWorkingHours() {
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
  }
}

module.exports = Configuracao;
