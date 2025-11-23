const AvailabilityService = require('../utils/availability');
const Configuracao = require('../models/Configuracao');

class AvailabilityController {
  static async getAvailableDates(req, res) {
    try {
      const { days = 30 } = req.query;
      const dates = AvailabilityService.getAvailableDates(parseInt(days));
      res.json(dates);
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis:', error);
      res.status(500).json({ error: 'Erro ao buscar datas disponíveis' });
    }
  }

  static async getAvailableSlots(req, res) {
    try {
      const { data } = req.query;

      if (!data) {
        return res.status(400).json({ error: 'Data é obrigatória' });
      }

      const slots = AvailabilityService.getAvailableSlots(data);
      res.json(slots);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      res.status(500).json({ error: 'Erro ao buscar horários disponíveis' });
    }
  }

  static async checkAvailability(req, res) {
    try {
      const { data, horario } = req.query;

      if (!data || !horario) {
        return res.status(400).json({ error: 'Data e horário são obrigatórios' });
      }

      const availability = AvailabilityService.canSchedule(data, horario);
      res.json(availability);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
    }
  }

  static async getPrices(req, res) {
    try {
      const precos = await Configuracao.getPrices();

      res.json({
        cautelar: {
          valor: precos.cautelar,
          valorFormatado: `R$ ${(precos.cautelar / 100).toFixed(2)}`
        },
        transferencia: {
          valor: precos.transferencia,
          valorFormatado: `R$ ${(precos.transferencia / 100).toFixed(2)}`
        },
        outros: {
          valor: precos.outros,
          valorFormatado: `R$ ${(precos.outros / 100).toFixed(2)}`
        }
      });
    } catch (error) {
      console.error('Erro ao buscar preços:', error);
      res.status(500).json({ error: 'Erro ao buscar preços' });
    }
  }
}

module.exports = AvailabilityController;
