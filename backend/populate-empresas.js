/**
 * Script para popular o banco de dados com empresas de exemplo
 * Uso: node populate-empresas.js
 */

require('dotenv').config();
const db = require('./src/config/database');

const empresasData = [
  {
    nome: 'Agenda Aqui Vistorias - Matriz',
    slug: 'agendaaqui-matriz',
    razao_social: 'Agenda Aqui Vistorias LTDA',
    cnpj: '12.345.678/0001-90',
    email: 'contato@agendaaquivistorias.com.br',
    telefone: '(67) 99967-3464',
    whatsapp: '5567999673464',
    endereco: 'Rua Principal',
    numero: '100',
    bairro: 'Centro',
    cidade: 'Campo Grande',
    estado: 'MS',
    cep: '79000-000',
    latitude: -20.4697,
    longitude: -54.6201,
    chave_pix: 'contato@agendaaquivistorias.com.br',
    preco_cautelar: 15000,
    preco_transferencia: 12000,
    preco_outros: 10000,
    horario_inicio: '08:00:00',
    horario_fim: '18:00:00',
    descricao: 'Empresa matriz do sistema AgendaAqui. Realizamos vistorias cautelares, transferência e outros serviços com qualidade e agilidade.',
    google_rating: 5.0,
    google_reviews_count: 1100,
    status: 'ativo'
  },
  {
    nome: 'Terceira Visão Vistorias',
    slug: 'terceiravisao',
    razao_social: 'Terceira Visão Vistorias LTDA',
    cnpj: '23.456.789/0001-01',
    email: 'contato@terceiravisao.com.br',
    telefone: '(11) 99999-1111',
    whatsapp: '5511999991111',
    endereco: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    latitude: -23.5505,
    longitude: -46.6333,
    chave_pix: 'terceiravisao@email.com',
    preco_cautelar: 18000,
    preco_transferencia: 14000,
    preco_outros: 12000,
    horario_inicio: '08:00:00',
    horario_fim: '18:00:00',
    descricao: 'Especialistas em vistorias veiculares em São Paulo. Atendimento rápido e laudo detalhado.',
    google_rating: 4.8,
    google_reviews_count: 856,
    status: 'ativo'
  },
  {
    nome: 'Vistoria Express RJ',
    slug: 'vistoria-express-rj',
    razao_social: 'Vistoria Express RJ LTDA',
    cnpj: '34.567.890/0001-12',
    email: 'contato@vistoriaexpressrj.com.br',
    telefone: '(21) 98888-2222',
    whatsapp: '5521988882222',
    endereco: 'Rua do Ouvidor',
    numero: '50',
    bairro: 'Centro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20040-030',
    latitude: -22.9068,
    longitude: -43.1729,
    chave_pix: 'vistoriaexpressrj@email.com',
    preco_cautelar: 16000,
    preco_transferencia: 13000,
    preco_outros: 11000,
    horario_inicio: '07:30:00',
    horario_fim: '17:30:00',
    descricao: 'A melhor vistoria do Rio de Janeiro! Atendimento em toda região metropolitana.',
    google_rating: 4.9,
    google_reviews_count: 723,
    status: 'ativo'
  },
  {
    nome: 'Auto Check Vistorias BH',
    slug: 'autocheck-bh',
    razao_social: 'Auto Check Vistorias BH LTDA',
    cnpj: '45.678.901/0001-23',
    email: 'contato@autocheckbh.com.br',
    telefone: '(31) 97777-3333',
    whatsapp: '5531977773333',
    endereco: 'Av. Afonso Pena',
    numero: '2500',
    bairro: 'Funcionários',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '30130-007',
    latitude: -19.9167,
    longitude: -43.9345,
    chave_pix: 'autocheckbh@email.com',
    preco_cautelar: 14000,
    preco_transferencia: 11000,
    preco_outros: 9000,
    horario_inicio: '08:00:00',
    horario_fim: '18:00:00',
    descricao: 'Vistorias completas em Belo Horizonte. Preços acessíveis e atendimento de qualidade.',
    google_rating: 4.7,
    google_reviews_count: 534,
    status: 'ativo'
  },
  {
    nome: 'Vistoria Sul Curitiba',
    slug: 'vistoria-sul-curitiba',
    razao_social: 'Vistoria Sul LTDA',
    cnpj: '56.789.012/0001-34',
    email: 'contato@vistoriasul.com.br',
    telefone: '(41) 96666-4444',
    whatsapp: '5541966664444',
    endereco: 'Rua XV de Novembro',
    numero: '700',
    bairro: 'Centro',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80020-310',
    latitude: -25.4284,
    longitude: -49.2733,
    chave_pix: 'vistoriasul@email.com',
    preco_cautelar: 13500,
    preco_transferencia: 10500,
    preco_outros: 8500,
    horario_inicio: '08:30:00',
    horario_fim: '17:30:00',
    descricao: 'Referência em vistorias no Paraná. Equipe técnica qualificada e laudos reconhecidos.',
    google_rating: 4.9,
    google_reviews_count: 412,
    status: 'ativo'
  },
  {
    nome: 'Vistoria Nordeste Recife',
    slug: 'vistoria-nordeste-recife',
    razao_social: 'Vistoria Nordeste PE LTDA',
    cnpj: '67.890.123/0001-45',
    email: 'contato@vistorianordeste.com.br',
    telefone: '(81) 95555-5555',
    whatsapp: '5581955555555',
    endereco: 'Av. Boa Viagem',
    numero: '3000',
    bairro: 'Boa Viagem',
    cidade: 'Recife',
    estado: 'PE',
    cep: '51020-001',
    latitude: -8.0476,
    longitude: -34.8770,
    chave_pix: 'vistorianordeste@email.com',
    preco_cautelar: 12000,
    preco_transferencia: 9500,
    preco_outros: 8000,
    horario_inicio: '07:00:00',
    horario_fim: '17:00:00',
    descricao: 'A maior rede de vistorias do Nordeste! Atendimento em todo Recife e região.',
    google_rating: 4.6,
    google_reviews_count: 678,
    status: 'ativo'
  },
  {
    nome: 'Vistoria Center Salvador',
    slug: 'vistoria-center-salvador',
    razao_social: 'Vistoria Center BA LTDA',
    cnpj: '78.901.234/0001-56',
    email: 'contato@vistoriacenter.com.br',
    telefone: '(71) 94444-6666',
    whatsapp: '5571944446666',
    endereco: 'Av. Tancredo Neves',
    numero: '1500',
    bairro: 'Pituba',
    cidade: 'Salvador',
    estado: 'BA',
    cep: '41820-021',
    latitude: -12.9714,
    longitude: -38.5014,
    chave_pix: 'vistoriacenter@email.com',
    preco_cautelar: 11500,
    preco_transferencia: 9000,
    preco_outros: 7500,
    horario_inicio: '08:00:00',
    horario_fim: '18:00:00',
    descricao: 'Vistorias em Salvador com o melhor custo-benefício da Bahia!',
    google_rating: 4.5,
    google_reviews_count: 389,
    status: 'ativo'
  },
  {
    nome: 'RS Vistorias Porto Alegre',
    slug: 'rs-vistorias-poa',
    razao_social: 'RS Vistorias LTDA',
    cnpj: '89.012.345/0001-67',
    email: 'contato@rsvistorias.com.br',
    telefone: '(51) 93333-7777',
    whatsapp: '5551933337777',
    endereco: 'Rua dos Andradas',
    numero: '1200',
    bairro: 'Centro Histórico',
    cidade: 'Porto Alegre',
    estado: 'RS',
    cep: '90020-015',
    latitude: -30.0346,
    longitude: -51.2177,
    chave_pix: 'rsvistorias@email.com',
    preco_cautelar: 14500,
    preco_transferencia: 11500,
    preco_outros: 9500,
    horario_inicio: '08:00:00',
    horario_fim: '18:00:00',
    descricao: 'Tradição em vistorias no Rio Grande do Sul. Mais de 10 anos de experiência.',
    google_rating: 4.8,
    google_reviews_count: 567,
    status: 'ativo'
  },
  {
    nome: 'Vistoria Brasília DF',
    slug: 'vistoria-brasilia',
    razao_social: 'Vistoria Brasília LTDA',
    cnpj: '90.123.456/0001-78',
    email: 'contato@vistoriabrasilia.com.br',
    telefone: '(61) 92222-8888',
    whatsapp: '5561922228888',
    endereco: 'SCS Quadra 1',
    numero: 'Bloco A',
    bairro: 'Asa Sul',
    cidade: 'Brasília',
    estado: 'DF',
    cep: '70300-500',
    latitude: -15.7942,
    longitude: -47.8822,
    chave_pix: 'vistoriabrasilia@email.com',
    preco_cautelar: 17000,
    preco_transferencia: 13500,
    preco_outros: 11000,
    horario_inicio: '08:00:00',
    horario_fim: '18:00:00',
    descricao: 'Vistorias na capital federal. Atendemos todo o Distrito Federal.',
    google_rating: 4.7,
    google_reviews_count: 445,
    status: 'ativo'
  },
  {
    nome: 'Goiânia Vistorias',
    slug: 'goiania-vistorias',
    razao_social: 'Goiânia Vistorias LTDA',
    cnpj: '01.234.567/0001-89',
    email: 'contato@goianiavistorias.com.br',
    telefone: '(62) 91111-9999',
    whatsapp: '5562911119999',
    endereco: 'Av. T-63',
    numero: '500',
    bairro: 'Setor Bueno',
    cidade: 'Goiânia',
    estado: 'GO',
    cep: '74230-100',
    latitude: -16.6869,
    longitude: -49.2648,
    chave_pix: 'goianiavistorias@email.com',
    preco_cautelar: 13000,
    preco_transferencia: 10000,
    preco_outros: 8500,
    horario_inicio: '07:30:00',
    horario_fim: '17:30:00',
    descricao: 'Referência em vistorias em Goiás. Preços competitivos e qualidade garantida.',
    google_rating: 4.6,
    google_reviews_count: 312,
    status: 'ativo'
  }
];

async function populateEmpresas() {
  console.log('🚀 Iniciando população do banco de dados...\n');

  try {
    for (const empresaData of empresasData) {
      // Verificar se empresa já existe pelo slug
      const existeResult = await db.query(
        'SELECT id, nome FROM empresas WHERE slug = $1',
        [empresaData.slug]
      );

      if (existeResult.rows.length > 0) {
        // Atualizar empresa existente
        const empresa = existeResult.rows[0];
        console.log(`📝 Atualizando empresa existente: ${empresa.nome} (ID: ${empresa.id})`);

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        // Construir query de update dinamicamente
        Object.entries(empresaData).forEach(([key, value]) => {
          if (key !== 'slug' && value !== undefined) {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
          }
        });

        updateValues.push(empresaData.slug);

        await db.query(
          `UPDATE empresas SET ${updateFields.join(', ')}, updated_at = NOW() WHERE slug = $${paramIndex}`,
          updateValues
        );

        console.log(`   ✓ Atualizada com cidade: ${empresaData.cidade}, ${empresaData.estado}\n`);
      } else {
        // Inserir nova empresa
        console.log(`➕ Criando nova empresa: ${empresaData.nome}`);

        const fields = Object.keys(empresaData);
        const values = Object.values(empresaData);
        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

        const result = await db.query(
          `INSERT INTO empresas (${fields.join(', ')}) VALUES (${placeholders}) RETURNING id`,
          values
        );

        console.log(`   ✓ Criada com ID: ${result.rows[0].id}`);
        console.log(`   ✓ Cidade: ${empresaData.cidade}, ${empresaData.estado}`);
        console.log(`   ✓ URL: /${empresaData.slug}\n`);
      }
    }

    // Mostrar resumo
    const totalResult = await db.query('SELECT COUNT(*) as total FROM empresas WHERE status = $1', ['ativo']);
    const cidadesResult = await db.query(`
      SELECT cidade, estado, COUNT(*) as total
      FROM empresas
      WHERE status = 'ativo' AND cidade IS NOT NULL
      GROUP BY cidade, estado
      ORDER BY total DESC
    `);

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO');
    console.log('='.repeat(50));
    console.log(`Total de empresas ativas: ${totalResult.rows[0].total}`);
    console.log('\nCidades atendidas:');
    cidadesResult.rows.forEach(c => {
      console.log(`   • ${c.cidade}, ${c.estado} (${c.total} empresa${c.total > 1 ? 's' : ''})`);
    });
    console.log('='.repeat(50));
    console.log('\n✅ Banco de dados populado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

populateEmpresas();
