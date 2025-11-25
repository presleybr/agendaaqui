const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Get all notifications
router.get('/', authenticateToken, (req, res) => {
  try {
    const notifications = [];

    // Get pending appointments (new appointments in last 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const pendingAppointments = db.prepare(`
      SELECT a.*, c.nome as cliente_nome, v.placa, v.marca, v.modelo
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN veiculos v ON a.veiculo_id = v.id
      WHERE a.status = 'pendente' AND date(a.created_at) >= date(?)
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(yesterdayStr);

    pendingAppointments.forEach(apt => {
      notifications.push({
        id: `apt-${apt.id}`,
        type: 'agendamento',
        title: 'Novo Agendamento',
        message: `${apt.cliente_nome} - ${apt.marca} ${apt.modelo} (${apt.placa})`,
        time: apt.created_at,
        section: 'agendamentos',
        link: `/admin#agendamentos`,
        read: false
      });
    });

    // Get appointments for today
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = db.prepare(`
      SELECT a.*, c.nome as cliente_nome, v.placa, v.marca, v.modelo
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN veiculos v ON a.veiculo_id = v.id
      WHERE date(a.data_agendamento) = date(?) AND a.status IN ('pendente', 'confirmado')
      ORDER BY a.horario_agendamento ASC
      LIMIT 5
    `).all(today);

    todayAppointments.forEach(apt => {
      notifications.push({
        id: `today-${apt.id}`,
        type: 'agendamento_hoje',
        title: 'Agendamento Hoje',
        message: `${apt.horario_agendamento} - ${apt.cliente_nome} (${apt.tipo_vistoria})`,
        time: apt.created_at,
        section: 'dashboard',
        link: `/admin#dashboard`,
        read: false
      });
    });

    // Get new clients (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    const newClients = db.prepare(`
      SELECT * FROM clientes
      WHERE date(created_at) >= date(?)
      ORDER BY created_at DESC
      LIMIT 5
    `).all(lastWeekStr);

    newClients.forEach(client => {
      notifications.push({
        id: `client-${client.id}`,
        type: 'novo_cliente',
        title: 'Novo Cliente',
        message: `${client.nome} cadastrado`,
        time: client.created_at,
        section: 'clientes',
        link: `/admin#clientes`,
        read: false
      });
    });

    // Sort by time (most recent first)
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      notifications: notifications.slice(0, 20), // Limit to 20 most recent
      unreadCount: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Get notification counts by section
router.get('/counts', authenticateToken, async (req, res) => {
  try {
    const counts = {
      dashboard: 0,
      agendamentos: 0,
      clientes: 0,
      calendario: 0,
      relatorios: 0,
      configuracoes: 0
    };

    const today = new Date().toISOString().split('T')[0];

    // Agendamentos pendentes
    const pendingResult = await db.query(
      "SELECT COUNT(*) as count FROM agendamentos WHERE status = 'pendente'"
    );
    counts.agendamentos = parseInt(pendingResult.rows[0].count) || 0;

    // Agendamentos hoje
    const todayResult = await db.query(
      "SELECT COUNT(*) as count FROM agendamentos WHERE DATE(data_hora) = $1 AND status IN ('pendente', 'confirmado')",
      [today]
    );
    counts.dashboard = parseInt(todayResult.rows[0].count) || 0;

    // Novos clientes (últimos 7 dias)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    const newClientsResult = await db.query(
      "SELECT COUNT(*) as count FROM clientes WHERE DATE(created_at) >= $1",
      [lastWeekStr]
    );
    counts.clientes = parseInt(newClientsResult.rows[0].count) || 0;

    // Agendamentos próximos (próximos 3 dias)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const upcomingResult = await db.query(
      "SELECT COUNT(*) as count FROM agendamentos WHERE DATE(data_hora) BETWEEN $1 AND $2 AND status IN ('pendente', 'confirmado')",
      [today, threeDaysStr]
    );
    counts.calendario = parseInt(upcomingResult.rows[0].count) || 0;

    res.json(counts);

  } catch (error) {
    console.error('Error fetching notification counts:', error);
    res.status(500).json({ error: 'Erro ao buscar contadores' });
  }
});

module.exports = router;
