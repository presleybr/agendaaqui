const Agendamento = require('../models/Agendamento');
const Configuracao = require('../models/Configuracao');
const db = require('../config/database');
const { addDays, format, parse, isAfter, isBefore, addHours } = require('date-fns');

class AvailabilityService {
  static async getAvailableSlots(data) {
    const config = await Configuracao.getWorkingHours();
    const vagasPorHorario = parseInt(await Configuracao.get('vagas_por_horario') || '3');
    const agendamentosNaData = await Agendamento.findByDate(data);

    const slots = [];
    const [horaInicio, minutoInicio] = (config.inicio || '08:00').split(':').map(Number);
    const [horaFim, minutoFim] = (config.fim || '18:00').split(':').map(Number);

    let currentTime = new Date();
    currentTime.setHours(horaInicio, minutoInicio, 0, 0);

    const endTime = new Date();
    endTime.setHours(horaFim, minutoFim, 0, 0);

    while (currentTime < endTime) {
      const horario = format(currentTime, 'HH:mm');

      // Verificar horários bloqueados
      const usePostgres = !!process.env.DATABASE_URL;
      let bloqueado = null;

      if (usePostgres) {
        const result = await db.query(`
          SELECT * FROM horarios_bloqueados
          WHERE data = $1 AND (
            (horario_inicio IS NULL AND horario_fim IS NULL) OR
            ($2 >= horario_inicio AND $2 < horario_fim)
          )
          LIMIT 1
        `, [data, horario]);
        bloqueado = result.rows[0];
      } else {
        bloqueado = db.prepare(`
          SELECT * FROM horarios_bloqueados
          WHERE data = ? AND (
            (horario_inicio IS NULL AND horario_fim IS NULL) OR
            (? >= horario_inicio AND ? < horario_fim)
          )
        `).get(data, horario, horario);
      }

      if (!bloqueado) {
        const agendamentosNoHorario = agendamentosNaData.filter(a => a.horario === horario);
        const vagasDisponiveis = vagasPorHorario - agendamentosNoHorario.length;

        slots.push({
          horario,
          disponivel: vagasDisponiveis > 0,
          vagasDisponiveis,
          vagasTotal: vagasPorHorario
        });
      }

      currentTime = new Date(currentTime.getTime() + config.duracao_slot * 60000);
    }

    return slots;
  }

  static async isSlotAvailable(data, horario) {
    const slots = await this.getAvailableSlots(data);
    const slot = slots.find(s => s.horario === horario);
    return slot ? slot.disponivel : false;
  }

  static async canSchedule(data, horario) {
    const antecedenciaMinima = parseInt(await Configuracao.get('antecedencia_minima') || '2');
    const antecedenciaMaxima = parseInt(await Configuracao.get('antecedencia_maxima') || '30');

    const agora = new Date();
    const dataAgendamento = parse(`${data} ${horario}`, 'yyyy-MM-dd HH:mm', new Date());

    // Verificar antecedência mínima
    const minimoPermitido = addHours(agora, antecedenciaMinima);
    if (isBefore(dataAgendamento, minimoPermitido)) {
      return {
        allowed: false,
        reason: `É necessário agendar com pelo menos ${antecedenciaMinima} horas de antecedência`
      };
    }

    // Verificar antecedência máxima
    const maximoPermitido = addDays(agora, antecedenciaMaxima);
    if (isAfter(dataAgendamento, maximoPermitido)) {
      return {
        allowed: false,
        reason: `Não é possível agendar com mais de ${antecedenciaMaxima} dias de antecedência`
      };
    }

    // Verificar dia da semana
    const diaSemana = dataAgendamento.getDay();
    const config = await Configuracao.getWorkingHours();
    if (!config.dias_trabalho.includes(diaSemana)) {
      return {
        allowed: false,
        reason: 'Não trabalhamos neste dia da semana'
      };
    }

    // Verificar disponibilidade
    if (!(await this.isSlotAvailable(data, horario))) {
      return {
        allowed: false,
        reason: 'Horário não disponível'
      };
    }

    return { allowed: true };
  }

  static async getAvailableDates(days = 30) {
    const config = await Configuracao.getWorkingHours();
    const dates = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = addDays(today, i);
      const diaSemana = date.getDay();

      if (config.dias_trabalho.includes(diaSemana)) {
        const dataFormatada = format(date, 'yyyy-MM-dd');

        // Verificar se o dia inteiro está bloqueado
        const usePostgres = !!process.env.DATABASE_URL;
        let diaBloqueado = null;

        if (usePostgres) {
          const result = await db.query(`
            SELECT * FROM horarios_bloqueados
            WHERE data = $1 AND horario_inicio IS NULL AND horario_fim IS NULL
            LIMIT 1
          `, [dataFormatada]);
          diaBloqueado = result.rows[0];
        } else {
          diaBloqueado = db.prepare(`
            SELECT * FROM horarios_bloqueados
            WHERE data = ? AND horario_inicio IS NULL AND horario_fim IS NULL
          `).get(dataFormatada);
        }

        if (!diaBloqueado) {
          const slots = await this.getAvailableSlots(dataFormatada);
          const slotsDisponiveis = slots.filter(s => s.disponivel).length;

          dates.push({
            data: dataFormatada,
            diaSemana,
            slotsDisponiveis,
            slotsTotal: slots.length
          });
        }
      }
    }

    return dates;
  }
}

module.exports = AvailabilityService;
