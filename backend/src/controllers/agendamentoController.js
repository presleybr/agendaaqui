const { validationResult } = require('express-validator');
const Agendamento = require('../models/Agendamento');
const Cliente = require('../models/Cliente');
const Veiculo = require('../models/Veiculo');
const Configuracao = require('../models/Configuracao');
const AvailabilityService = require('../utils/availability');
const emailService = require('../utils/emailService');

class AgendamentoController {
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cliente: clienteData, veiculo: veiculoData, tipo_vistoria, data, horario, endereco_vistoria, observacoes } = req.body;

      // Verificar disponibilidade
      const availability = await AvailabilityService.canSchedule(data, horario);
      if (!availability.allowed) {
        return res.status(400).json({ error: availability.reason });
      }

      // Buscar ou criar cliente
      let cliente = await Cliente.findByCPF(clienteData.cpf);
      if (!cliente) {
        cliente = await Cliente.create(clienteData);
      } else {
        // Atualizar dados do cliente se necessário
        cliente = await Cliente.update(cliente.id, clienteData);
      }

      // Buscar ou criar veículo
      let veiculo = await Veiculo.findByPlaca(veiculoData.placa);
      if (!veiculo) {
        veiculo = await Veiculo.create({ ...veiculoData, cliente_id: cliente.id });
      }

      // Obter preço
      const precos = await Configuracao.getPrices();
      const preco = precos[tipo_vistoria] || precos.outros;

      // Criar agendamento
      const agendamento = await Agendamento.create({
        cliente_id: cliente.id,
        veiculo_id: veiculo.id,
        tipo_vistoria,
        data,
        horario,
        endereco_vistoria,
        preco,
        observacoes,
        status: 'pendente'
      });

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
      console.error('Erro ao criar agendamento:', error);
      res.status(500).json({ error: 'Erro ao criar agendamento' });
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
      const agendamento = await Agendamento.findById(id);

      if (!agendamento) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json(agendamento);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar agendamento' });
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
