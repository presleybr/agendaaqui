const db = require('../config/database');

const usePostgres = !!process.env.DATABASE_URL;

class PrecoVistoria {
  // Categorias padrão de veículos
  static CATEGORIAS_PADRAO = [
    {
      categoria: 'moto_pequena',
      nome_exibicao: 'Motos até 200cc',
      descricao: 'Motocicletas com cilindrada até 200cc',
      preco: 19000,
      ordem: 1
    },
    {
      categoria: 'moto_grande_automovel',
      nome_exibicao: 'Motos +200cc / Automóveis',
      descricao: 'Motocicletas acima de 200cc e automóveis de passeio',
      preco: 22000,
      ordem: 2
    },
    {
      categoria: 'camionete',
      nome_exibicao: 'Camionetes / Camionetas',
      descricao: 'Veículos utilitários como picapes e SUVs',
      preco: 23000,
      ordem: 3
    },
    {
      categoria: 'van_microonibus',
      nome_exibicao: 'Vans / Micro-ônibus',
      descricao: 'Vans, motorhomes e micro-ônibus',
      preco: 25000,
      ordem: 4
    },
    {
      categoria: 'caminhao_onibus',
      nome_exibicao: 'Caminhões / Ônibus',
      descricao: 'Caminhões, carretas e ônibus de grande porte',
      preco: 28000,
      ordem: 5
    }
  ];

  // Buscar todos os preços de uma empresa
  static async findByEmpresa(empresaId) {
    if (usePostgres) {
      const result = await db.query(
        `SELECT * FROM precos_vistoria
         WHERE empresa_id = $1
         ORDER BY ordem ASC`,
        [empresaId]
      );
      return result.rows;
    }
    return [];
  }

  // Buscar preços ativos de uma empresa (para exibir no frontend)
  static async findAtivos(empresaId) {
    if (usePostgres) {
      const result = await db.query(
        `SELECT id, categoria, nome_exibicao, descricao, preco, ordem
         FROM precos_vistoria
         WHERE empresa_id = $1 AND ativo = true
         ORDER BY ordem ASC`,
        [empresaId]
      );
      return result.rows;
    }
    return [];
  }

  // Buscar preço por categoria
  static async findByCategoria(empresaId, categoria) {
    if (usePostgres) {
      const result = await db.query(
        `SELECT * FROM precos_vistoria
         WHERE empresa_id = $1 AND categoria = $2`,
        [empresaId, categoria]
      );
      return result.rows[0];
    }
    return null;
  }

  // Criar ou atualizar preço (upsert)
  static async upsert(empresaId, data) {
    if (usePostgres) {
      const result = await db.query(
        `INSERT INTO precos_vistoria
         (empresa_id, categoria, nome_exibicao, descricao, preco, ordem, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (empresa_id, categoria)
         DO UPDATE SET
           nome_exibicao = EXCLUDED.nome_exibicao,
           descricao = EXCLUDED.descricao,
           preco = EXCLUDED.preco,
           ordem = EXCLUDED.ordem,
           ativo = EXCLUDED.ativo,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          empresaId,
          data.categoria,
          data.nome_exibicao,
          data.descricao || null,
          data.preco,
          data.ordem || 0,
          data.ativo !== false
        ]
      );
      return result.rows[0];
    }
    return null;
  }

  // Atualizar preço existente
  static async update(id, data) {
    if (usePostgres) {
      const fields = [];
      const params = [];
      let paramIndex = 1;

      const allowedFields = ['nome_exibicao', 'descricao', 'preco', 'ordem', 'ativo'];

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = $${paramIndex}`);
          params.push(data[field]);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        return this.findById(id);
      }

      params.push(id);
      const query = `
        UPDATE precos_vistoria
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, params);
      return result.rows[0];
    }
    return null;
  }

  // Buscar por ID
  static async findById(id) {
    if (usePostgres) {
      const result = await db.query(
        'SELECT * FROM precos_vistoria WHERE id = $1',
        [id]
      );
      return result.rows[0];
    }
    return null;
  }

  // Criar novo preço
  static async create(empresaId, data) {
    if (usePostgres) {
      const result = await db.query(
        `INSERT INTO precos_vistoria
         (empresa_id, categoria, nome_exibicao, descricao, preco, ordem, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          empresaId,
          data.categoria,
          data.nome_exibicao,
          data.descricao || null,
          data.preco,
          data.ordem || 99,
          data.ativo !== false
        ]
      );
      return result.rows[0];
    }
    return null;
  }

  // Deletar preço
  static async delete(id) {
    if (usePostgres) {
      await db.query('DELETE FROM precos_vistoria WHERE id = $1', [id]);
      return true;
    }
    return false;
  }

  // Inicializar preços padrão para uma empresa
  static async inicializarPadrao(empresaId) {
    if (usePostgres) {
      const promises = this.CATEGORIAS_PADRAO.map(cat =>
        this.upsert(empresaId, cat)
      );
      return Promise.all(promises);
    }
    return [];
  }

  // Verificar se empresa tem preços configurados
  static async temPrecos(empresaId) {
    if (usePostgres) {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM precos_vistoria WHERE empresa_id = $1',
        [empresaId]
      );
      return parseInt(result.rows[0].count) > 0;
    }
    return false;
  }

  // Buscar preço para um agendamento (verifica se empresa tem preços, senão retorna padrão)
  static async getPrecoParaAgendamento(empresaId, categoria) {
    // Primeiro tenta buscar o preço específico da empresa
    const precoEmpresa = await this.findByCategoria(empresaId, categoria);

    if (precoEmpresa && precoEmpresa.ativo) {
      return precoEmpresa.preco;
    }

    // Se não encontrar, busca o preço padrão da categoria
    const categoriaPadrao = this.CATEGORIAS_PADRAO.find(c => c.categoria === categoria);
    return categoriaPadrao ? categoriaPadrao.preco : 22000; // fallback para automóvel
  }

  // Atualizar múltiplos preços de uma vez
  static async atualizarMultiplos(empresaId, precos) {
    if (usePostgres) {
      const results = [];
      for (const preco of precos) {
        const result = await this.upsert(empresaId, preco);
        results.push(result);
      }
      return results;
    }
    return [];
  }
}

module.exports = PrecoVistoria;
