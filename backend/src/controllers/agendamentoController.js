const { validationResult } = require('express-validator');
const Agendamento = require('../models/Agendamento');
const Cliente = require('../models/Cliente');
const Veiculo = require('../models/Veiculo');
const Configuracao = require('../models/Configuracao');
const Empresa = require('../models/Empresa');
const PrecoVistoria = require('../models/PrecoVistoria');
const AvailabilityService = require('../utils/availability');
const emailService = require('../utils/emailService');
const { TAXA_PIX_ASAAS, calcularValorTotal } = require('../config/taxas');

class AgendamentoController {
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cliente: clienteData, veiculo: veiculoData, tipo_vistoria, categoria_veiculo, data, horario, endereco_vistoria, observacoes, empresa_id } = req.body;

      console.log('📝 Dados recebidos para criar agendamento:', {
        tipo_vistoria,
        categoria_veiculo,
        data,
        horario,
        empresa_id,
        clienteData,
        veiculoData
      });

      // Verificar disponibilidade
      console.log('🔍 Verificando disponibilidade...');
      const availability = await AvailabilityService.canSchedule(data, horario);
      if (!availability.allowed) {
        return res.status(400).json({ error: availability.reason });
      }
      console.log('✅ Disponibilidade OK');

      // Buscar ou criar cliente
      console.log('👤 Processando cliente com CPF:', clienteData.cpf);
      let cliente = await Cliente.findByCPF(clienteData.cpf);
      if (!cliente) {
        console.log('   Criando novo cliente...');
        cliente = await Cliente.create(clienteData);
      } else {
        console.log('   Cliente existente, atualizando...');
        // Atualizar dados do cliente se necessário
        cliente = await Cliente.update(cliente.id, clienteData);
      }
      console.log('✅ Cliente processado:', cliente?.id);

      // Buscar ou criar veículo
      console.log('🚗 Processando veículo com placa:', veiculoData.placa);
      let veiculo = await Veiculo.findByPlaca(veiculoData.placa);
      if (!veiculo) {
        console.log('   Criando novo veículo...');
        veiculo = await Veiculo.create({ ...veiculoData, cliente_id: cliente.id });
      }
      console.log('✅ Veículo processado:', veiculo?.id);

      // Obter preço - da categoria de veículo se disponível, senão usa o tipo_vistoria legado
      console.log('💰 Obtendo preços...');
      let precoVistoria; // Preço base da vistoria (sem taxas)

      if (categoria_veiculo && empresa_id) {
        // Novo sistema: preço por categoria de veículo
        precoVistoria = await PrecoVistoria.getPrecoParaAgendamento(empresa_id, categoria_veiculo);
        console.log('✅ Preço por categoria de veículo:', precoVistoria, 'centavos para categoria:', categoria_veiculo);
      } else if (empresa_id) {
        // Sistema legado: preço por tipo de vistoria da empresa
        const empresa = await Empresa.findById(empresa_id);
        if (empresa) {
          const precosEmpresa = {
            cautelar: empresa.preco_cautelar,
            transferencia: empresa.preco_transferencia,
            outros: empresa.preco_outros
          };
          precoVistoria = precosEmpresa[tipo_vistoria] || precosEmpresa.outros;
          console.log('✅ Preço da empresa (legado):', precoVistoria, 'centavos para tipo:', tipo_vistoria);
        } else {
          // Fallback para configuração global se empresa não encontrada
          const precos = await Configuracao.getPrices();
          precoVistoria = precos[tipo_vistoria] || precos.outros;
          console.log('⚠️ Empresa não encontrada, usando preço global:', precoVistoria);
        }
      } else {
        // Usar configuração global (página principal)
        const precos = await Configuracao.getPrices();
        precoVistoria = precos[tipo_vistoria] || precos.outros;
        console.log('✅ Preço global:', precoVistoria, 'para tipo:', tipo_vistoria);
      }

      // Adicionar taxa PIX Asaas ao valor total (cliente paga)
      const preco = calcularValorTotal(precoVistoria, true);
      console.log('💳 Valor total com taxa PIX:', preco, 'centavos (vistoria:', precoVistoria, '+ taxa PIX:', TAXA_PIX_ASAAS, ')');

      // Combinar data e horário em timestamp
      const data_hora = `${data} ${horario}:00`;
      console.log('📅 Data/hora combinada:', data_hora);

      // Criar agendamento
      console.log('📝 Criando agendamento...');
      const agendamento = await Agendamento.create({
        cliente_id: cliente.id,
        veiculo_id: veiculo.id,
        tipo_vistoria: tipo_vistoria || 'vistoria_veicular',
        categoria_veiculo: categoria_veiculo || null,
        data_hora,
        endereco_vistoria,
        valor: preco,
        observacoes,
        status: 'pendente',
        empresa_id: empresa_id || null
      });

      console.log('✅ Agendamento criado com sucesso:', agendamento.protocolo);

      // Enviar email de confirmação
      const emailAtivo = await Configuracao.get('email_confirmacao_ativo') === '1';
      if (emailAtivo) {
        try {
          await emailService.sendConfirmacaoAgendamento(agendamento);
          await Agendamento.update(agendamento.id, { confirmado_email: 1 });
        } catch (error) {
          console.error('Erro ao enviar email:', error);
        }
      }

      res.status(201).json(agendamento);
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      console.error('   Stack:', error.stack);
      res.status(500).json({
        error: 'Erro ao criar agendamento',
        details: error.message,
        code: error.code
      });
    }
  }

  static async getAll(req, res) {
    try {
      const { data, status, tipo_vistoria, data_inicio, data_fim, limit, offset } = req.query;

      const agendamentos = await Agendamento.findAll({
        data,
        status,
        tipo_vistoria,
        data_inicio,
        data_fim,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      });

      const total = await Agendamento.count({ status, data_inicio, data_fim });

      res.json({
        agendamentos,
        total,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      });
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 Buscando agendamento com ID:', id);

      const agendamento = await Agendamento.findById(id);
      console.log('📊 Agendamento encontrado:', agendamento);

      if (!agendamento) {
        console.log('❌ Agendamento não encontrado para ID:', id);
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json(agendamento);
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamento', details: error.message });
    }
  }

  static async getByProtocolo(req, res) {
    try {
      const { protocolo } = req.params;
      const agendamento = await Agendamento.findByProtocolo(protocolo);

      if (!agendamento) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json(agendamento);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const agendamento = await Agendamento.updateStatus(id, status);

      if (!agendamento) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json(agendamento);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        status,
        cliente_nome,
        cliente_cpf,
        cliente_email,
        cliente_telefone,
        veiculo_placa,
        veiculo_marca,
        veiculo_modelo,
        veiculo_ano,
        tipo_vistoria,
        data,
        horario,
        preco,
        endereco_vistoria,
        observacoes
      } = req.body;

      // Get current appointment
      const currentAppointment = await Agendamento.findById(id);
      if (!currentAppointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Update cliente if data provided
      if (cliente_nome || cliente_cpf || cliente_email || cliente_telefone) {
        const clienteData = {
          nome: cliente_nome,
          cpf: cliente_cpf,
          email: cliente_email,
          telefone: cliente_telefone
        };
        await Cliente.update(currentAppointment.cliente_id, clienteData);
      }

      // Update veiculo if data provided
      if (veiculo_placa || veiculo_marca || veiculo_modelo || veiculo_ano) {
        const veiculoData = {
          placa: veiculo_placa,
          marca: veiculo_marca,
          modelo: veiculo_modelo,
          ano: veiculo_ano
        };
        await Veiculo.update(currentAppointment.veiculo_id, veiculoData);
      }

      // Update agendamento
      const agendamentoData = {
        status,
        tipo_vistoria,
        data,
        horario,
        preco,
        endereco_vistoria,
        observacoes
      };

      // Remove undefined fields
      Object.keys(agendamentoData).forEach(key => {
        if (agendamentoData[key] === undefined) {
          delete agendamentoData[key];
        }
      });

      const agendamento = await Agendamento.update(id, agendamentoData);

      res.json(agendamento);
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      res.status(500).json({ error: 'Erro ao atualizar agendamento' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await Agendamento.delete(id);
      res.json({ message: 'Agendamento excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir agendamento' });
    }
  }

  static async getStats(req, res) {
    try {
      const { data_inicio, data_fim } = req.query;

      if (!data_inicio || !data_fim) {
        return res.status(400).json({ error: 'Período obrigatório' });
      }

      const stats = await Agendamento.getStats(data_inicio, data_fim);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}

module.exports = AgendamentoController;
