/**
 * Script para popular o banco de dados com clientes e agendamentos de exemplo
 * Uso: node populate-dados.js
 */

require('dotenv').config();
const db = require('./src/config/database');

// Nomes brasileiros para gerar clientes
const nomes = [
  'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza',
  'Juliana Lima', 'Fernando Pereira', 'Camila Rodrigues', 'Lucas Almeida', 'Beatriz Ferreira',
  'Rafael Gomes', 'Larissa Martins', 'Bruno Araújo', 'Amanda Ribeiro', 'Diego Carvalho',
  'Patrícia Nascimento', 'Thiago Barbosa', 'Fernanda Moreira', 'Gustavo Rocha', 'Mariana Dias',
  'Ricardo Mendes', 'Letícia Castro', 'Felipe Cardoso', 'Gabriela Correia', 'Marcelo Teixeira',
  'Isabela Pinto', 'André Monteiro', 'Vanessa Cunha', 'Rodrigo Freitas', 'Aline Vieira',
  'Leandro Nunes', 'Priscila Campos', 'Matheus Ramos', 'Daniela Azevedo', 'Renato Duarte',
  'Natália Borges', 'Fábio Melo', 'Cristiane Lopes', 'Eduardo Moura', 'Tatiane Fonseca'
];

// Marcas e modelos de veículos
const veiculos = [
  { marca: 'Volkswagen', modelo: 'Gol', anos: [2018, 2019, 2020, 2021, 2022] },
  { marca: 'Fiat', modelo: 'Uno', anos: [2017, 2018, 2019, 2020, 2021] },
  { marca: 'Chevrolet', modelo: 'Onix', anos: [2019, 2020, 2021, 2022, 2023] },
  { marca: 'Ford', modelo: 'Ka', anos: [2018, 2019, 2020, 2021] },
  { marca: 'Hyundai', modelo: 'HB20', anos: [2019, 2020, 2021, 2022, 2023] },
  { marca: 'Toyota', modelo: 'Corolla', anos: [2018, 2019, 2020, 2021, 2022] },
  { marca: 'Honda', modelo: 'Civic', anos: [2017, 2018, 2019, 2020, 2021] },
  { marca: 'Renault', modelo: 'Sandero', anos: [2018, 2019, 2020, 2021] },
  { marca: 'Nissan', modelo: 'Kicks', anos: [2020, 2021, 2022, 2023] },
  { marca: 'Jeep', modelo: 'Renegade', anos: [2019, 2020, 2021, 2022] },
  { marca: 'Fiat', modelo: 'Argo', anos: [2020, 2021, 2022, 2023] },
  { marca: 'Volkswagen', modelo: 'Polo', anos: [2018, 2019, 2020, 2021, 2022] },
  { marca: 'Chevrolet', modelo: 'Tracker', anos: [2021, 2022, 2023] },
  { marca: 'Fiat', modelo: 'Strada', anos: [2020, 2021, 2022, 2023] },
  { marca: 'Toyota', modelo: 'Hilux', anos: [2019, 2020, 2021, 2022] }
];

const cores = ['Branco', 'Prata', 'Preto', 'Vermelho', 'Azul', 'Cinza', 'Dourado'];
const tiposVistoria = ['cautelar', 'transferencia', 'outros'];
const statusAgendamento = ['pendente', 'confirmado', 'realizado', 'cancelado'];

// Funções auxiliares
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gerarCPF() {
  const n = () => Math.floor(Math.random() * 10);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

function gerarTelefone() {
  const ddd = randomInt(11, 99);
  const n = () => Math.floor(Math.random() * 10);
  return `(${ddd}) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

function gerarPlaca() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = () => letras[Math.floor(Math.random() * letras.length)];
  const n = () => Math.floor(Math.random() * 10);
  // Formato Mercosul ou antigo
  if (Math.random() > 0.5) {
    return `${l()}${l()}${l()}${n()}${l()}${n()}${n()}`; // Mercosul
  }
  return `${l()}${l()}${l()}-${n()}${n()}${n()}${n()}`; // Antigo
}

function gerarEmail(nome) {
  const providers = ['gmail.com', 'hotmail.com', 'yahoo.com.br', 'outlook.com'];
  const nomeEmail = nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z.]/g, '');
  return `${nomeEmail}${randomInt(1, 999)}@${random(providers)}`;
}

function gerarDataPassada(diasAtras) {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  data.setHours(randomInt(8, 17), randomInt(0, 59), 0, 0);
  return data;
}

async function populateDados() {
  console.log('🚀 Iniciando população de clientes e agendamentos...\n');

  try {
    // Buscar todas as empresas ativas
    const empresasResult = await db.query(
      'SELECT id, nome, preco_cautelar, preco_transferencia, preco_outros FROM empresas WHERE status = $1',
      ['ativo']
    );
    const empresas = empresasResult.rows;

    if (empresas.length === 0) {
      console.error('❌ Nenhuma empresa ativa encontrada. Execute populate-empresas.js primeiro.');
      process.exit(1);
    }

    console.log(`📊 Encontradas ${empresas.length} empresas ativas\n`);

    let totalClientes = 0;
    let totalAgendamentos = 0;

    // Para cada empresa, criar clientes e agendamentos
    for (const empresa of empresas) {
      console.log(`\n🏢 Processando: ${empresa.nome}`);

      // Número aleatório de clientes por empresa (15-40)
      const numClientes = randomInt(15, 40);
      const clientesEmpresa = [];

      // Criar clientes
      for (let i = 0; i < numClientes; i++) {
        const nome = random(nomes);
        const cpf = gerarCPF();
        const telefone = gerarTelefone();
        const email = gerarEmail(nome);

        try {
          const result = await db.query(`
            INSERT INTO clientes (empresa_id, nome, cpf, telefone, email, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (empresa_id, cpf) DO UPDATE SET nome = EXCLUDED.nome
            RETURNING id
          `, [empresa.id, nome, cpf, telefone, email, gerarDataPassada(randomInt(30, 180))]);

          clientesEmpresa.push({
            id: result.rows[0].id,
            nome,
            cpf,
            telefone,
            email
          });
          totalClientes++;
        } catch (err) {
          // Ignora duplicatas
        }
      }

      console.log(`   ✓ ${clientesEmpresa.length} clientes criados`);

      // Criar agendamentos para os últimos 90 dias
      const numAgendamentos = randomInt(30, 80);

      for (let i = 0; i < numAgendamentos; i++) {
        const cliente = random(clientesEmpresa);
        if (!cliente) continue;

        const veiculo = random(veiculos);
        const ano = random(veiculo.anos);
        const cor = random(cores);
        const placa = gerarPlaca();
        const tipo = random(tiposVistoria);
        const diasAtras = randomInt(0, 90);
        const dataHora = gerarDataPassada(diasAtras);

        // Determinar status baseado na data
        let status;
        if (diasAtras > 7) {
          // Agendamentos antigos: maioria realizado
          status = Math.random() > 0.15 ? 'realizado' : 'cancelado';
        } else if (diasAtras > 0) {
          // Agendamentos recentes
          status = random(['confirmado', 'realizado', 'pendente']);
        } else {
          // Hoje
          status = random(['pendente', 'confirmado']);
        }

        // Preço baseado no tipo
        let preco;
        switch (tipo) {
          case 'cautelar':
            preco = empresa.preco_cautelar || 15000;
            break;
          case 'transferencia':
            preco = empresa.preco_transferencia || 12000;
            break;
          default:
            preco = empresa.preco_outros || 10000;
        }

        try {
          // Inserir veículo
          const veiculoResult = await db.query(`
            INSERT INTO veiculos (empresa_id, cliente_id, placa, marca, modelo, ano, cor, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (empresa_id, placa) DO UPDATE SET cliente_id = EXCLUDED.cliente_id
            RETURNING id
          `, [empresa.id, cliente.id, placa, veiculo.marca, veiculo.modelo, ano, cor, dataHora]);

          const veiculoId = veiculoResult.rows[0].id;

          // Inserir agendamento
          const agendamentoResult = await db.query(`
            INSERT INTO agendamentos (
              empresa_id, cliente_id, veiculo_id,
              nome_cliente, cpf_cliente, telefone_cliente, email_cliente,
              placa, marca, modelo, ano, cor,
              tipo_vistoria, data_hora, status, preco, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
          `, [
            empresa.id, cliente.id, veiculoId,
            cliente.nome, cliente.cpf, cliente.telefone, cliente.email,
            placa, veiculo.marca, veiculo.modelo, ano, cor,
            tipo, dataHora, status, preco, dataHora
          ]);

          // Se realizado, criar pagamento
          if (status === 'realizado' && Math.random() > 0.1) {
            const valorPlataforma = 500; // R$ 5,00
            const valorEmpresa = preco - valorPlataforma;

            await db.query(`
              INSERT INTO pagamentos (
                agendamento_id, empresa_id, valor_total, valor_comissao, valor_empresa,
                status, metodo, mp_payment_id, created_at
              )
              VALUES ($1, $2, $3, $4, $5, 'approved', 'pix', $6, $7)
            `, [
              agendamentoResult.rows[0].id, empresa.id,
              preco, valorPlataforma, valorEmpresa,
              `MP${Date.now()}${randomInt(1000, 9999)}`, dataHora
            ]);
          }

          totalAgendamentos++;
        } catch (err) {
          // Ignora erros de duplicata
        }
      }

      console.log(`   ✓ Agendamentos criados para esta empresa`);
    }

    // Mostrar resumo
    const statsClientes = await db.query('SELECT COUNT(*) as total FROM clientes');
    const statsAgendamentos = await db.query('SELECT COUNT(*) as total FROM agendamentos');
    const statsPagamentos = await db.query('SELECT COUNT(*) as total, SUM(valor_total) as receita FROM pagamentos WHERE status = $1', ['approved']);
    const statsRealizados = await db.query('SELECT COUNT(*) as total FROM agendamentos WHERE status = $1', ['realizado']);

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO FINAL');
    console.log('='.repeat(50));
    console.log(`Total de clientes: ${statsClientes.rows[0].total}`);
    console.log(`Total de agendamentos: ${statsAgendamentos.rows[0].total}`);
    console.log(`Agendamentos realizados: ${statsRealizados.rows[0].total}`);
    console.log(`Pagamentos aprovados: ${statsPagamentos.rows[0].total}`);
    console.log(`Receita total: R$ ${((statsPagamentos.rows[0].receita || 0) / 100).toFixed(2)}`);
    console.log('='.repeat(50));

    // Stats por empresa
    console.log('\n📈 ESTATÍSTICAS POR EMPRESA:');
    const statsPorEmpresa = await db.query(`
      SELECT
        e.nome,
        COUNT(DISTINCT c.id) as clientes,
        COUNT(DISTINCT a.id) as agendamentos,
        COUNT(DISTINCT CASE WHEN a.status = 'realizado' THEN a.id END) as realizados,
        COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.valor_total END), 0) as receita
      FROM empresas e
      LEFT JOIN clientes c ON c.empresa_id = e.id
      LEFT JOIN agendamentos a ON a.empresa_id = e.id
      LEFT JOIN pagamentos p ON p.agendamento_id = a.id
      WHERE e.status = 'ativo'
      GROUP BY e.id, e.nome
      ORDER BY receita DESC
    `);

    statsPorEmpresa.rows.forEach(emp => {
      console.log(`\n   ${emp.nome}:`);
      console.log(`      Clientes: ${emp.clientes}`);
      console.log(`      Agendamentos: ${emp.agendamentos}`);
      console.log(`      Realizados: ${emp.realizados}`);
      console.log(`      Receita: R$ ${(emp.receita / 100).toFixed(2)}`);
    });

    console.log('\n✅ Banco de dados populado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

populateDados();
