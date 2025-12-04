/**
 * Script para popular o banco de dados com 20 empresas
 * Uso: node populate-empresas.js
 */

require('dotenv').config();
const db = require('./src/config/database');

const empresasData = [
  // Região Centro-Oeste
  {
    nome: 'Agenda Aqui Vistorias - Matriz',
    slug: 'agendaaqui-matriz',
    cidade: 'Campo Grande', estado: 'MS',
    latitude: -20.4697, longitude: -54.6201,
    preco_cautelar: 15000, preco_transferencia: 12000, preco_outros: 10000,
    google_rating: 5.0, google_reviews_count: 1100
  },
  {
    nome: 'Vistoria Center MS',
    slug: 'vistoria-center-ms',
    cidade: 'Dourados', estado: 'MS',
    latitude: -22.2231, longitude: -54.8080,
    preco_cautelar: 14000, preco_transferencia: 11000, preco_outros: 9000,
    google_rating: 4.8, google_reviews_count: 342
  },
  {
    nome: 'Goiânia Vistorias',
    slug: 'goiania-vistorias',
    cidade: 'Goiânia', estado: 'GO',
    latitude: -16.6869, longitude: -49.2648,
    preco_cautelar: 13000, preco_transferencia: 10000, preco_outros: 8500,
    google_rating: 4.6, google_reviews_count: 512
  },
  {
    nome: 'Vistoria Brasília DF',
    slug: 'vistoria-brasilia',
    cidade: 'Brasília', estado: 'DF',
    latitude: -15.7942, longitude: -47.8822,
    preco_cautelar: 17000, preco_transferencia: 13500, preco_outros: 11000,
    google_rating: 4.7, google_reviews_count: 445
  },
  {
    nome: 'Cuiabá Auto Vistoria',
    slug: 'cuiaba-auto-vistoria',
    cidade: 'Cuiabá', estado: 'MT',
    latitude: -15.6014, longitude: -56.0979,
    preco_cautelar: 14500, preco_transferencia: 11500, preco_outros: 9500,
    google_rating: 4.5, google_reviews_count: 287
  },

  // Região Sudeste
  {
    nome: 'Terceira Visão Vistorias',
    slug: 'terceiravisao',
    cidade: 'São Paulo', estado: 'SP',
    latitude: -23.5505, longitude: -46.6333,
    preco_cautelar: 18000, preco_transferencia: 14000, preco_outros: 12000,
    google_rating: 4.8, google_reviews_count: 1256
  },
  {
    nome: 'Vistoria Express Campinas',
    slug: 'vistoria-express-campinas',
    cidade: 'Campinas', estado: 'SP',
    latitude: -22.9099, longitude: -47.0626,
    preco_cautelar: 16000, preco_transferencia: 13000, preco_outros: 10500,
    google_rating: 4.7, google_reviews_count: 678
  },
  {
    nome: 'Vistoria Express RJ',
    slug: 'vistoria-express-rj',
    cidade: 'Rio de Janeiro', estado: 'RJ',
    latitude: -22.9068, longitude: -43.1729,
    preco_cautelar: 16000, preco_transferencia: 13000, preco_outros: 11000,
    google_rating: 4.9, google_reviews_count: 923
  },
  {
    nome: 'Auto Check Vistorias BH',
    slug: 'autocheck-bh',
    cidade: 'Belo Horizonte', estado: 'MG',
    latitude: -19.9167, longitude: -43.9345,
    preco_cautelar: 14000, preco_transferencia: 11000, preco_outros: 9000,
    google_rating: 4.7, google_reviews_count: 734
  },
  {
    nome: 'Vitória Vistorias ES',
    slug: 'vitoria-vistorias',
    cidade: 'Vitória', estado: 'ES',
    latitude: -20.2976, longitude: -40.2958,
    preco_cautelar: 13500, preco_transferencia: 10500, preco_outros: 8500,
    google_rating: 4.6, google_reviews_count: 312
  },

  // Região Sul
  {
    nome: 'Vistoria Sul Curitiba',
    slug: 'vistoria-sul-curitiba',
    cidade: 'Curitiba', estado: 'PR',
    latitude: -25.4284, longitude: -49.2733,
    preco_cautelar: 13500, preco_transferencia: 10500, preco_outros: 8500,
    google_rating: 4.9, google_reviews_count: 612
  },
  {
    nome: 'RS Vistorias Porto Alegre',
    slug: 'rs-vistorias-poa',
    cidade: 'Porto Alegre', estado: 'RS',
    latitude: -30.0346, longitude: -51.2177,
    preco_cautelar: 14500, preco_transferencia: 11500, preco_outros: 9500,
    google_rating: 4.8, google_reviews_count: 567
  },
  {
    nome: 'Floripa Vistorias',
    slug: 'floripa-vistorias',
    cidade: 'Florianópolis', estado: 'SC',
    latitude: -27.5954, longitude: -48.5480,
    preco_cautelar: 15000, preco_transferencia: 12000, preco_outros: 10000,
    google_rating: 4.7, google_reviews_count: 423
  },

  // Região Nordeste
  {
    nome: 'Vistoria Nordeste Recife',
    slug: 'vistoria-nordeste-recife',
    cidade: 'Recife', estado: 'PE',
    latitude: -8.0476, longitude: -34.8770,
    preco_cautelar: 12000, preco_transferencia: 9500, preco_outros: 8000,
    google_rating: 4.6, google_reviews_count: 878
  },
  {
    nome: 'Vistoria Center Salvador',
    slug: 'vistoria-center-salvador',
    cidade: 'Salvador', estado: 'BA',
    latitude: -12.9714, longitude: -38.5014,
    preco_cautelar: 11500, preco_transferencia: 9000, preco_outros: 7500,
    google_rating: 4.5, google_reviews_count: 689
  },
  {
    nome: 'Fortaleza Vistorias',
    slug: 'fortaleza-vistorias',
    cidade: 'Fortaleza', estado: 'CE',
    latitude: -3.7172, longitude: -38.5433,
    preco_cautelar: 11000, preco_transferencia: 8500, preco_outros: 7000,
    google_rating: 4.6, google_reviews_count: 534
  },
  {
    nome: 'Natal Auto Vistoria',
    slug: 'natal-auto-vistoria',
    cidade: 'Natal', estado: 'RN',
    latitude: -5.7945, longitude: -35.2110,
    preco_cautelar: 10500, preco_transferencia: 8000, preco_outros: 6500,
    google_rating: 4.4, google_reviews_count: 298
  },

  // Região Norte
  {
    nome: 'Manaus Vistorias',
    slug: 'manaus-vistorias',
    cidade: 'Manaus', estado: 'AM',
    latitude: -3.1190, longitude: -60.0217,
    preco_cautelar: 13000, preco_transferencia: 10000, preco_outros: 8500,
    google_rating: 4.5, google_reviews_count: 367
  },
  {
    nome: 'Belém Vistoria Express',
    slug: 'belem-vistoria-express',
    cidade: 'Belém', estado: 'PA',
    latitude: -1.4558, longitude: -48.4902,
    preco_cautelar: 12500, preco_transferencia: 9500, preco_outros: 8000,
    google_rating: 4.4, google_reviews_count: 276
  },
  {
    nome: 'Porto Velho Vistorias',
    slug: 'porto-velho-vistorias',
    cidade: 'Porto Velho', estado: 'RO',
    latitude: -8.7612, longitude: -63.9004,
    preco_cautelar: 12000, preco_transferencia: 9000, preco_outros: 7500,
    google_rating: 4.3, google_reviews_count: 189
  }
];

async function populateEmpresas() {
  console.log('🚀 Iniciando população de 20 empresas...\n');

  try {
    for (const data of empresasData) {
      // Dados padrão
      const empresa = {
        ...data,
        razao_social: `${data.nome} LTDA`,
        cnpj: `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}/0001-${Math.floor(Math.random() * 90 + 10)}`,
        email: `contato@${data.slug.replace(/-/g, '')}.com.br`,
        telefone: `(${Math.floor(Math.random() * 90 + 10)}) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        whatsapp: `55${Math.floor(Math.random() * 90 + 10)}9${Math.floor(Math.random() * 90000000 + 10000000)}`,
        endereco: 'Rua Principal',
        numero: String(Math.floor(Math.random() * 2000 + 100)),
        bairro: 'Centro',
        cep: `${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 900 + 100)}`,
        chave_pix: `contato@${data.slug.replace(/-/g, '')}.com.br`,
        horario_inicio: '08:00:00',
        horario_fim: '18:00:00',
        descricao: `Empresa de vistorias veiculares em ${data.cidade}. Realizamos vistorias cautelares, transferência e outros serviços com qualidade e agilidade. Atendimento rápido e profissional.`,
        status: 'ativo'
      };

      // Verificar se empresa já existe
      const existeResult = await db.query(
        'SELECT id FROM empresas WHERE slug = $1',
        [empresa.slug]
      );

      if (existeResult.rows.length > 0) {
        // Atualizar
        const id = existeResult.rows[0].id;
        const updateFields = [];
        const updateValues = [];
        let idx = 1;

        Object.entries(empresa).forEach(([key, value]) => {
          if (key !== 'slug' && value !== undefined) {
            updateFields.push(`${key} = $${idx}`);
            updateValues.push(value);
            idx++;
          }
        });

        updateValues.push(empresa.slug);
        await db.query(
          `UPDATE empresas SET ${updateFields.join(', ')}, updated_at = NOW() WHERE slug = $${idx}`,
          updateValues
        );
        console.log(`📝 Atualizada: ${empresa.nome} (${empresa.cidade}, ${empresa.estado})`);
      } else {
        // Inserir
        const fields = Object.keys(empresa);
        const values = Object.values(empresa);
        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

        await db.query(
          `INSERT INTO empresas (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );
        console.log(`➕ Criada: ${empresa.nome} (${empresa.cidade}, ${empresa.estado})`);
      }
    }

    // Resumo
    const total = await db.query('SELECT COUNT(*) as total FROM empresas WHERE status = $1', ['ativo']);
    const cidades = await db.query(`
      SELECT estado, COUNT(*) as total
      FROM empresas WHERE status = 'ativo'
      GROUP BY estado ORDER BY total DESC
    `);

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Total de empresas ativas: ${total.rows[0].total}`);
    console.log('Por estado:', cidades.rows.map(c => `${c.estado}(${c.total})`).join(', '));
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit(0);
  }
}

populateEmpresas();
