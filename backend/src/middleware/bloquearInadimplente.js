const db = require('../config/database');

const DIAS_TOLERANCIA = 7;
const FLAG_ATIVO = process.env.BLOQUEIO_INADIMPLENTE === 'true';

async function bloquearInadimplente(req, res, next) {
  if (!FLAG_ATIVO) return next();
  try {
    const empresaId = req.empresa_id || (req.body && req.body.empresa_id) || req.params.empresaId;
    if (!empresaId) return next();

    const r = await db.query(
      `SELECT e.mensalidade_isenta, e.em_carencia_ate,
              MIN(m.data_vencimento) AS menor_vencimento_aberto
       FROM empresas e
       LEFT JOIN mensalidades m ON m.empresa_id = e.id
         AND m.status IN ('pendente','atrasada','aguardando_aprovacao')
       WHERE e.id = $1
       GROUP BY e.id, e.mensalidade_isenta, e.em_carencia_ate`,
      [empresaId]
    );
    const row = r.rows[0];
    if (!row) return next();
    if (row.mensalidade_isenta) return next();

    const hoje = new Date();
    if (row.em_carencia_ate && new Date(row.em_carencia_ate) >= hoje) return next();

    if (row.menor_vencimento_aberto) {
      const diasAtraso = Math.floor(
        (hoje - new Date(row.menor_vencimento_aberto)) / (1000 * 60 * 60 * 24)
      );
      if (diasAtraso > DIAS_TOLERANCIA) {
        return res.status(402).json({
          error: 'Empresa com mensalidade em atraso',
          code: 'MENSALIDADE_ATRASADA',
          dias_atraso: diasAtraso
        });
      }
    }
    next();
  } catch (err) {
    console.error('Erro bloquearInadimplente:', err.message);
    next();
  }
}

module.exports = bloquearInadimplente;
