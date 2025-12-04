/**
 * Script para popular dados da empresa Terceira Visão
 * Uso: node scripts/popular-terceira-visao.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function popular() {
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando população de dados...');

    // 1. Criar empresa
    const senhaHash = await bcrypt.hash('123456', 10);

    const empresaResult = await client.query(`
      INSERT INTO empresas (nome, slug, email, telefone, whatsapp, cidade, estado, status, cor_primaria, cor_secundaria)
      VALUES ('Terceira Visão Vistorias', 'terceira-visao', 'terceiravisao@gmail.com', '11999999999', '11999999999', 'São Paulo', 'SP', 'ativo', '#2563eb', '#1e40af')
      ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id
    `);
    const empresaId = empresaResult.rows[0].id;
    console.log('✅ Empresa criada/atualizada. ID:', empresaId);

    // 2. Criar usuário admin
    await client.query(`
      INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
      VALUES ($1, 'Administrador Terceira Visão', 'terceiravisao@gmail.com', $2, 'admin', true, false)
      ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash
    `, [empresaId, senhaHash]);
    console.log('✅ Usuário admin criado');

    // 3. Limpar dados antigos desta empresa (opcional)
    await client.query('DELETE FROM agendamentos WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM veiculos WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM clientes WHERE empresa_id = $1', [empresaId]);
    console.log('🧹 Dados antigos limpos');

    // 4. Criar 50 clientes com veículos e agendamentos
    const nomes = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Lucas', 'Fernanda', 'Rafael', 'Camila', 'Bruno', 'Larissa', 'Gustavo', 'Patricia', 'Thiago', 'Amanda', 'Diego', 'Vanessa', 'Marcelo', 'Renata'];
    const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Carvalho'];
    const marcas = ['Fiat', 'Volkswagen', 'Chevrolet', 'Ford', 'Honda', 'Toyota', 'Hyundai', 'Renault', 'Jeep', 'Nissan'];
    const modelos = ['Uno', 'Gol', 'Onix', 'Ka', 'Civic', 'Corolla', 'HB20', 'Sandero', 'Renegade', 'Kicks'];
    const cores = ['Prata', 'Preto', 'Branco', 'Vermelho', 'Azul', 'Cinza'];
    const tipos = ['cautelar', 'transferencia', 'segunda_via'];
    const statusList = ['pendente', 'confirmado', 'realizado'];

    for (let i = 1; i <= 50; i++) {
      const nome = nomes[Math.floor(Math.random() * nomes.length)] + ' ' + sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
      const cpf = String(Math.floor(Math.random() * 900000000) + 100000000).replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3-') + String(Math.floor(Math.random() * 90) + 10);
      const telefone = '11' + String(Math.floor(Math.random() * 900000000) + 100000000);
      const email = `cliente${i}.terceira@teste.com`;

      // Criar cliente
      const clienteResult = await client.query(`
        INSERT INTO clientes (empresa_id, nome, email, telefone, cpf)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [empresaId, nome, email, telefone, cpf]);
      const clienteId = clienteResult.rows[0].id;

      // Criar veículo
      const placa = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    Math.floor(Math.random() * 10) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10);

      const veiculoResult = await client.query(`
        INSERT INTO veiculos (empresa_id, cliente_id, placa, marca, modelo, ano, cor)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [empresaId, clienteId, placa, marcas[Math.floor(Math.random() * marcas.length)], modelos[Math.floor(Math.random() * modelos.length)], 2018 + Math.floor(Math.random() * 7), cores[Math.floor(Math.random() * cores.length)]]);
      const veiculoId = veiculoResult.rows[0].id;

      // Criar agendamento
      const dataBase = new Date();
      dataBase.setDate(dataBase.getDate() - Math.floor(Math.random() * 30) + 15); // -15 a +15 dias
      const hora = 8 + Math.floor(Math.random() * 10);
      dataBase.setHours(hora, 0, 0, 0);

      const protocolo = 'VIS' + String(Math.floor(Math.random() * 900000000) + 100000000);
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      const valor = tipo === 'cautelar' ? 15000 : tipo === 'transferencia' ? 12000 : 10000;

      await client.query(`
        INSERT INTO agendamentos (empresa_id, cliente_id, veiculo_id, protocolo, data_hora, tipo_vistoria, valor, status, status_pagamento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [empresaId, clienteId, veiculoId, protocolo, dataBase.toISOString(), tipo, valor, status, status === 'realizado' ? 'aprovado' : 'pendente']);

      process.stdout.write(`\r📊 Progresso: ${i}/50 clientes`);
    }

    console.log('\n\n✅ Dados criados com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: terceiravisao@gmail.com');
    console.log('🔑 Senha: 123456');
    console.log('🏢 Empresa: Terceira Visão Vistorias');
    console.log('👥 Clientes: 50');
    console.log('🚗 Veículos: 50');
    console.log('📅 Agendamentos: 50');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

popular();
