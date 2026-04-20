const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

/**
 * Notificações do Super Admin.
 * Aceita ?empresa_id=X como filtro opcional (caso super admin queira restringir).
 */

router.get('/', authenticateToken, async (req, res) => {
  try {
    const empresaFiltro = req.query.empresa_id ? parseInt(req.query.empresa_id) : null;
    const notifications = [];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const pendingParams = [yesterdayStr];
    let pendingEmpresa = '';
    if (empresaFiltro) {
      pendingParams.push(empresaFiltro);
      pendingEmpresa = ` AND a.empresa_id = $${pendingParams.length}`;
    }

    const pendingResult = await db.query(
      `SELECT a.*, c.nome as cliente_nome, v.placa, v.marca, v.modelo
       FROM agendamentos a
       JOIN clientes c ON a.cliente_id = c.id
       JOIN veiculos v ON a.veiculo_id = v.id
       WHERE a.status = 'pendente' AND DATE(a.created_at) >= $1${pendingEmpresa}
       ORDER BY a.created_at DESC
       LIMIT 10`,
      pendingParams
    );

    pendingResult.rows.forEach(apt => {
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

    const today = new Date().toISOString().split('T')[0];
    const todayParams = [today];
    let todayEmpresa = '';
    if (empresaFiltro) {
      todayParams.push(empresaFiltro);
      todayEmpresa = ` AND a.empresa_id = $${todayParams.length}`;
    }

    const todayResult = await db.query(
      `SELECT a.*, c.nome as cliente_nome, v.placa, v.marca, v.modelo
       FROM agendamentos a
       JOIN clientes c ON a.cliente_id = c.id
       JOIN veiculos v ON a.veiculo_id = v.id
       WHERE DATE(a.data_hora) = $1 AND a.status IN ('pendente', 'confirmado')${todayEmpresa}
       ORDER BY a.data_hora ASC
       LIMIT 5`,
      todayParams
    );

    todayResult.rows.forEach(apt => {
      notifications.push({
        id: `today-${apt.id}`,
        type: 'agendamento_hoje',
        title: 'Agendamento Hoje',
        message: `${apt.cliente_nome} (${apt.tipo_vistoria})`,
        time: apt.created_at,
        section: 'dashboard',
        link: `/admin#dashboard`,
        read: false
      });
    });

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    const newClientsParams = [lastWeekStr];
    let newClientsEmpresa = '';
    if (empresaFiltro) {
      newClientsParams.push(empresaFiltro);
      newClientsEmpresa = ` AND empresa_id = $${newClientsParams.length}`;
    }

    const newClientsResult = await db.query(
      `SELECT * FROM clientes WHERE DATE(created_at) >= $1${newClientsEmpresa}
       ORDER BY created_at DESC LIMIT 5`,
      newClientsParams
    );

    newClientsResult.rows.forEach(client => {
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

    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      notifications: notifications.slice(0, 20),
      unreadCount: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

router.get('/counts', authenticateToken, async (req, res) => {
  try {
    const empresaFiltro = req.query.empresa_id ? parseInt(req.query.empresa_id) : null;
    const counts = {
      dashboard: 0,
      agendamentos: 0,
      clientes: 0,
      calendario: 0,
      relatorios: 0,
      configuracoes: 0
    };

    const today = new Date().toISOString().split('T')[0];

    const empresaClause = empresaFiltro ? ' AND empresa_id = $LAST' : '';
    const build = (baseParams) => {
      if (!empresaFiltro) return { params: baseParams, clause: '' };
      const params = [...baseParams, empresaFiltro];
      return { params, clause: ` AND empresa_id = $${params.length}` };
    };

    const q1 = build([]);
    const pendingResult = await db.query(
      `SELECT COUNT(*) as count FROM agendamentos WHERE status = 'pendente'${q1.clause}`,
      q1.params
    );
    counts.agendamentos = parseInt(pendingResult.rows[0].count) || 0;

    const q2 = build([today]);
    const todayResult = await db.query(
      `SELECT COUNT(*) as count FROM agendamentos WHERE DATE(data_hora) = $1 AND status IN ('pendente', 'confirmado')${q2.clause}`,
      q2.params
    );
    counts.dashboard = parseInt(todayResult.rows[0].count) || 0;

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    const q3 = build([lastWeekStr]);
    const newClientsResult = await db.query(
      `SELECT COUNT(*) as count FROM clientes WHERE DATE(created_at) >= $1${q3.clause}`,
      q3.params
    );
    counts.clientes = parseInt(newClientsResult.rows[0].count) || 0;

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];
    const q4 = build([today, threeDaysStr]);
    const upcomingResult = await db.query(
      `SELECT COUNT(*) as count FROM agendamentos WHERE DATE(data_hora) BETWEEN $1 AND $2 AND status IN ('pendente', 'confirmado')${q4.clause}`,
      q4.params
    );
    counts.calendario = parseInt(upcomingResult.rows[0].count) || 0;

    res.json(counts);
  } catch (error) {
    console.error('Error fetching notification counts:', error);
    res.status(500).json({ error: 'Erro ao buscar contadores' });
  }
});

module.exports = router;
