const db = require('../config/database');
const QRCode = require('qrcode');
const { generateBRCode } = require('../utils/pixBRCode');

const NEXUS_SLUG = 'nexus';

function ascii(str, max = 25) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .,\-\/]/g, '')
    .trim()
    .slice(0, max);
}

function competenciaAtual(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function vencimentoDoMes(ano, mes, dia) {
  const dataVenc = new Date(Date.UTC(ano, mes - 1, Math.min(dia, 28)));
  return dataVenc.toISOString().slice(0, 10);
}

async function getNexusEmpresa() {
  const r = await db.query(
    `SELECT id, nome, chave_pix, pix_type, pix_titular, cidade
     FROM empresas WHERE slug = $1 LIMIT 1`,
    [NEXUS_SLUG]
  );
  return r.rows[0] || null;
}

class MensalidadeService {
  static async gerarMensalidadeEmpresa(empresaId, competencia = null) {
    const comp = competencia || competenciaAtual();
    const [ano, mes] = comp.split('-').map(Number);

    const empRes = await db.query(
      `SELECT e.id, e.nome, e.mensalidade_dia_vencimento, e.mensalidade_isenta,
              e.plano_id, e.em_carencia_ate,
              p.nome AS plano_nome, p.preco_centavos
       FROM empresas e
       LEFT JOIN planos_mensalidade p ON p.id = e.plano_id
       WHERE e.id = $1`,
      [empresaId]
    );
    const empresa = empRes.rows[0];
    if (!empresa) throw new Error('Empresa nao encontrada');
    if (empresa.mensalidade_isenta) return { skipped: true, motivo: 'isenta' };
    if (!empresa.plano_id) throw new Error('Empresa sem plano');

    const diaVenc = empresa.mensalidade_dia_vencimento || 10;
    const dataVencimento = vencimentoDoMes(ano, mes, diaVenc);
    const valor = empresa.preco_centavos;

    const existing = await db.query(
      `SELECT id FROM mensalidades WHERE empresa_id = $1 AND competencia = $2`,
      [empresaId, comp]
    );
    if (existing.rows[0]) {
      return { skipped: true, motivo: 'ja_existe', mensalidade_id: existing.rows[0].id };
    }

    const ins = await db.query(
      `INSERT INTO mensalidades (empresa_id, plano_id, competencia, valor_centavos, data_vencimento, status)
       VALUES ($1, $2, $3, $4, $5, 'pendente') RETURNING *`,
      [empresaId, empresa.plano_id, comp, valor, dataVencimento]
    );
    return { created: true, mensalidade: ins.rows[0] };
  }

  static async gerarMensalidadesDoMes(competencia = null) {
    const comp = competencia || competenciaAtual();
    const empresas = await db.query(
      `SELECT id FROM empresas
       WHERE status = 'ativo' AND mensalidade_isenta = false AND plano_id IS NOT NULL`
    );
    const resultados = [];
    for (const e of empresas.rows) {
      try {
        const r = await this.gerarMensalidadeEmpresa(e.id, comp);
        resultados.push({ empresa_id: e.id, ...r });
      } catch (err) {
        resultados.push({ empresa_id: e.id, erro: err.message });
      }
    }
    return { competencia: comp, total: resultados.length, resultados };
  }

  static async gerarPix(mensalidadeId) {
    const r = await db.query('SELECT * FROM mensalidades WHERE id = $1', [mensalidadeId]);
    const mens = r.rows[0];
    if (!mens) throw new Error('Mensalidade nao encontrada');
    if (['paga', 'isenta'].includes(mens.status)) {
      throw new Error('Mensalidade ja esta ' + mens.status);
    }

    const nexus = await getNexusEmpresa();
    if (!nexus || !nexus.chave_pix) throw new Error('Chave PIX da Nexus nao configurada');

    const valorReais = mens.valor_centavos / 100;
    const txid = `MENS${mens.id}${Date.now().toString(36).toUpperCase()}`.slice(0, 25);
    const titular = ascii(nexus.pix_titular || nexus.nome || 'NEXUS', 25) || 'NEXUS';
    const cidade = ascii(nexus.cidade || 'BRASIL', 15) || 'BRASIL';

    const brCode = generateBRCode({
      pixKey: nexus.chave_pix,
      merchantName: titular,
      merchantCity: cidade,
      amount: valorReais,
      txid
    });
    const qrBase64 = await QRCode.toDataURL(brCode, { errorCorrectionLevel: 'M', margin: 1, width: 360 });

    await db.query(
      `UPDATE mensalidades SET pix_br_code = $1, pix_qr_base64 = $2, pix_txid = $3, updated_at = NOW()
       WHERE id = $4`,
      [brCode, qrBase64, txid, mens.id]
    );

    return {
      mensalidade_id: mens.id,
      br_code: brCode,
      qr_code_base64: qrBase64,
      txid,
      valor: valorReais,
      titular,
      cidade,
      chave_pix: nexus.chave_pix,
      pix_type: nexus.pix_type
    };
  }

  static async registrarComprovante(mensalidadeId, comprovanteUrl) {
    const upd = await db.query(
      `UPDATE mensalidades
       SET comprovante_url = $1, comprovante_enviado_em = NOW(),
           status = 'aguardando_aprovacao', updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [comprovanteUrl, mensalidadeId]
    );
    if (!upd.rows[0]) throw new Error('Mensalidade nao encontrada');
    return upd.rows[0];
  }

  static async aprovar(mensalidadeId, aprovador) {
    const upd = await db.query(
      `UPDATE mensalidades
       SET status = 'paga', aprovado_em = NOW(), aprovado_por = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [mensalidadeId, aprovador || 'admin']
    );
    if (!upd.rows[0]) throw new Error('Mensalidade nao encontrada');

    await db.query(
      `UPDATE empresas SET mensalidade_status = 'em_dia' WHERE id = $1`,
      [upd.rows[0].empresa_id]
    );
    return upd.rows[0];
  }

  static async rejeitar(mensalidadeId, motivo) {
    const upd = await db.query(
      `UPDATE mensalidades
       SET status = 'pendente', rejeitado_em = NOW(), rejeicao_motivo = $2,
           comprovante_url = NULL, comprovante_enviado_em = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [mensalidadeId, motivo || 'Comprovante invalido']
    );
    if (!upd.rows[0]) throw new Error('Mensalidade nao encontrada');
    return upd.rows[0];
  }

  static async marcarAtrasadas() {
    const hoje = new Date().toISOString().slice(0, 10);
    const r = await db.query(
      `UPDATE mensalidades SET status = 'atrasada', updated_at = NOW()
       WHERE status = 'pendente' AND data_vencimento < $1 RETURNING empresa_id`,
      [hoje]
    );
    const empresasIds = [...new Set(r.rows.map(x => x.empresa_id))];
    for (const id of empresasIds) {
      await db.query(
        `UPDATE empresas SET mensalidade_status = 'atrasada' WHERE id = $1`,
        [id]
      );
    }
    return { atualizadas: r.rowCount };
  }

  static async minhaMensalidade(empresaId) {
    const comp = competenciaAtual();
    const atual = await db.query(
      `SELECT m.*, p.nome AS plano_nome, p.slug AS plano_slug
       FROM mensalidades m
       LEFT JOIN planos_mensalidade p ON p.id = m.plano_id
       WHERE m.empresa_id = $1 AND m.competencia = $2`,
      [empresaId, comp]
    );
    const historico = await db.query(
      `SELECT m.id, m.competencia, m.valor_centavos, m.data_vencimento, m.status,
              m.aprovado_em, m.comprovante_enviado_em
       FROM mensalidades m
       WHERE m.empresa_id = $1
       ORDER BY m.competencia DESC LIMIT 12`,
      [empresaId]
    );
    const empRes = await db.query(
      `SELECT e.plano_id, e.mensalidade_status, e.mensalidade_isenta, e.em_carencia_ate,
              e.mensalidade_dia_vencimento,
              p.nome AS plano_nome, p.slug AS plano_slug, p.preco_centavos, p.features,
              p.limite_agendamentos_mes
       FROM empresas e
       LEFT JOIN planos_mensalidade p ON p.id = e.plano_id
       WHERE e.id = $1`,
      [empresaId]
    );
    return {
      empresa: empRes.rows[0] || null,
      atual: atual.rows[0] || null,
      historico: historico.rows
    };
  }

  static async listarPendentesSuperAdmin() {
    const r = await db.query(
      `SELECT m.id, m.empresa_id, m.competencia, m.valor_centavos, m.data_vencimento,
              m.status, m.comprovante_url, m.comprovante_enviado_em, m.pix_txid,
              m.aprovado_em, m.rejeitado_em, m.rejeicao_motivo,
              e.nome AS empresa_nome, e.slug AS empresa_slug, e.email AS empresa_email,
              p.nome AS plano_nome
       FROM mensalidades m
       JOIN empresas e ON e.id = m.empresa_id
       LEFT JOIN planos_mensalidade p ON p.id = m.plano_id
       WHERE m.status IN ('pendente','aguardando_aprovacao','atrasada')
       ORDER BY m.status DESC, m.data_vencimento ASC`
    );
    return r.rows;
  }
}

module.exports = MensalidadeService;
