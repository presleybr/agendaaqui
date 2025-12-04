/**
 * Script para popular clientes e agendamentos
 * 50 vistorias por mês por empresa = 150 nos últimos 3 meses
 * Uso: node populate-dados.js
 */

require('dotenv').config();
const db = require('./src/config/database');

// Nomes brasileiros
const nomes = [
  'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza',
  'Juliana Lima', 'Fernando Pereira', 'Camila Rodrigues', 'Lucas Almeida', 'Beatriz Ferreira',
  'Rafael Gomes', 'Larissa Martins', 'Bruno Araújo', 'Amanda Ribeiro', 'Diego Carvalho',
  'Patrícia Nascimento', 'Thiago Barbosa', 'Fernanda Moreira', 'Gustavo Rocha', 'Mariana Dias',
  'Ricardo Mendes', 'Letícia Castro', 'Felipe Cardoso', 'Gabriela Correia', 'Marcelo Teixeira',
  'Isabela Pinto', 'André Monteiro', 'Vanessa Cunha', 'Rodrigo Freitas', 'Aline Vieira',
  'Leandro Nunes', 'Priscila Campos', 'Matheus Ramos', 'Daniela Azevedo', 'Renato Duarte',
  'Natália Borges', 'Fábio Melo', 'Cristiane Lopes', 'Eduardo Moura', 'Tatiane Fonseca',
  'Roberto Alves', 'Sandra Machado', 'Paulo Henrique', 'Carla Santana', 'Marcos Vinicius',
  'Michele Oliveira', 'Alexandre Costa', 'Simone Fernandes', 'José Carlos', 'Rosana Lima'
];

// Veículos
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
  { marca: 'Toyota', modelo: 'Hilux', anos: [2019, 2020, 2021, 2022] },
  { marca: 'Honda', modelo: 'HR-V', anos: [2019, 2020, 2021, 2022] },
  { marca: 'Volkswagen', modelo: 'T-Cross', anos: [2020, 2021, 2022, 2023] },
  { marca: 'Hyundai', modelo: 'Creta', anos: [2020, 2021, 2022, 2023] },
  { marca: 'Chevrolet', modelo: 'S10', anos: [2018, 2019, 2020, 2021] },
  { marca: 'Fiat', modelo: 'Toro', anos: [2019, 2020, 2021, 2022] }
];

const cores = ['Branco', 'Prata', 'Preto', 'Vermelho', 'Azul', 'Cinza', 'Dourado', 'Verde'];
const tiposVistoria = ['cautelar', 'transferencia', 'outros'];

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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
  if (Math.random() > 0.5) {
    return `${l()}${l()}${l()}${n()}${l()}${n()}${n()}`;
  }
  return `${l()}${l()}${l()}-${n()}${n()}${n()}${n()}`;
}

function gerarEmail(nome) {
  const providers = ['gmail.com', 'hotmail.com', 'yahoo.com.br', 'outlook.com'];
  const nomeEmail = nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${nomeEmail}${randomInt(1, 999)}@${random(providers)}`;
}

async function populateDados() {
  console.log('🚀 Populando clientes e agendamentos (50/mês por empresa)...\n');

  try {
    // Buscar empresas
    const empresasResult = await db.query(
      'SELECT id, nome, preco_cautelar, preco_transferencia, preco_outros FROM empresas WHERE status = $1',
      ['ativo']
    );
    const empresas = empresasResult.rows;

    if (empresas.length === 0) {
      console.error('❌ Nenhuma empresa encontrada. Execute populate-empresas.js primeiro.');
      process.exit(1);
    }

    console.log(`📊 ${empresas.length} empresas encontradas\n`);

    let totalClientes = 0;
    let totalAgendamentos = 0;
    let totalPagamentos = 0;

    for (const empresa of empresas) {
      console.log(`\n🏢 ${empresa.nome}`);

      // Criar 60 clientes por empresa
      const clientesEmpresa = [];
      for (let i = 0; i < 60; i++) {
        const nome = random(nomes);
        const cpf = gerarCPF();
        const telefone = gerarTelefone();
        const email = gerarEmail(nome);

        try {
          const result = await db.query(`
            INSERT INTO clientes (empresa_id, nome, cpf, telefone, email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (empresa_id, cpf) DO UPDATE SET nome = EXCLUDED.nome
            RETURNING id
          `, [empresa.id, nome, cpf, telefone, email]);

          clientesEmpresa.push({ id: result.rows[0].id, nome, cpf, telefone, email });
          totalClientes++;
        } catch (err) { /* ignora duplicatas */ }
      }
      console.log(`   ✓ ${clientesEmpresa.length} clientes`);

      // 150 agendamentos (50 por mês nos últimos 3 meses)
      let agendamentosCriados = 0;
      let pagamentosCriados = 0;

      for (let i = 0; i < 150; i++) {
        const cliente = random(clientesEmpresa);
        if (!cliente) continue;

        const veiculo = random(veiculos);
        const ano = random(veiculo.anos);
        const cor = random(cores);
        const placa = gerarPlaca();
        const tipo = random(tiposVistoria);

        // Distribuir nos últimos 90 dias
        const diasAtras = randomInt(0, 90);
        const dataHora = new Date();
        dataHora.setDate(dataHora.getDate() - diasAtras);
        dataHora.setHours(randomInt(8, 17), randomInt(0, 59), 0, 0);

        // Status baseado na data
        let status;
        if (diasAtras > 3) {
          status = Math.random() > 0.1 ? 'realizado' : 'cancelado';
        } else if (diasAtras > 0) {
          status = random(['confirmado', 'realizado']);
        } else {
          status = random(['pendente', 'confirmado']);
        }

        // Preço
        let preco;
        switch (tipo) {
          case 'cautelar': preco = empresa.preco_cautelar || 15000; break;
          case 'transferencia': preco = empresa.preco_transferencia || 12000; break;
          default: preco = empresa.preco_outros || 10000;
        }

        try {
          // Inserir veículo
          const veiculoResult = await db.query(`
            INSERT INTO veiculos (empresa_id, cliente_id, placa, marca, modelo, ano, cor)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (empresa_id, placa) DO UPDATE SET cliente_id = EXCLUDED.cliente_id
            RETURNING id
          `, [empresa.id, cliente.id, placa, veiculo.marca, veiculo.modelo, ano, cor]);

          // Inserir agendamento
          const agendamentoResult = await db.query(`
            INSERT INTO agendamentos (
              empresa_id, cliente_id, veiculo_id,
              nome_cliente, cpf_cliente, telefone_cliente, email_cliente,
              placa, marca, modelo, ano, cor,
              tipo_vistoria, data_hora, status, preco, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
          `, [
            empresa.id, cliente.id, veiculoResult.rows[0].id,
            cliente.nome, cliente.cpf, cliente.telefone, cliente.email,
            placa, veiculo.marca, veiculo.modelo, ano, cor,
            tipo, dataHora, status, preco, dataHora
          ]);

          agendamentosCriados++;
          totalAgendamentos++;

          // Pagamento para realizados
          if (status === 'realizado') {
            const valorPlataforma = 500;
            const valorEmpresa = preco - valorPlataforma;

            await db.query(`
              INSERT INTO pagamentos (
                agendamento_id, empresa_id, valor_total, valor_comissao, valor_empresa,
                status, metodo, mp_payment_id, created_at
              ) VALUES ($1, $2, $3, $4, $5, 'approved', 'pix', $6, $7)
            `, [
              agendamentoResult.rows[0].id, empresa.id,
              preco, valorPlataforma, valorEmpresa,
              `MP${Date.now()}${randomInt(1000, 9999)}`, dataHora
            ]);
            pagamentosCriados++;
            totalPagamentos++;
          }
        } catch (err) { /* ignora erros */ }
      }

      console.log(`   ✓ ${agendamentosCriados} agendamentos, ${pagamentosCriados} pagamentos`);
    }

    // Resumo final
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM clientes) as clientes,
        (SELECT COUNT(*) FROM agendamentos) as agendamentos,
        (SELECT COUNT(*) FROM agendamentos WHERE status = 'realizado') as realizados,
        (SELECT COUNT(*) FROM pagamentos WHERE status = 'approved') as pagamentos,
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos WHERE status = 'approved') as receita
    `);

    const s = stats.rows[0];
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO FINAL');
    console.log('='.repeat(60));
    console.log(`Clientes:              ${s.clientes}`);
    console.log(`Agendamentos:          ${s.agendamentos}`);
    console.log(`Realizados:            ${s.realizados}`);
    console.log(`Pagamentos aprovados:  ${s.pagamentos}`);
    console.log(`Receita total:         R$ ${(s.receita / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log('='.repeat(60));
    console.log('\n✅ Dados populados com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

populateDados();
