const express = require('express');
const router = express.Router();
const { requireTenant } = require('../middleware/tenantMiddleware');

/**
 * GET /api/tenant/config
 * Retorna as configurações públicas do tenant atual
 * Suporta: subdomínio OU query parameter ?slug=empresa1
 */
router.get('/config', async (req, res) => {
  try {
    let empresa = req.tenant; // Do middleware (subdomínio)

    // Se não tem tenant do subdomínio, tentar buscar por slug query parameter
    if (!empresa && req.query.slug) {
      const Empresa = require('../models/Empresa');
      console.log('🔍 Buscando empresa pelo slug query:', req.query.slug);
      empresa = await Empresa.findBySlug(req.query.slug);

      if (!empresa) {
        return res.status(404).json({
          error: 'Empresa não encontrada',
          slug: req.query.slug
        });
      }

      if (empresa.status !== 'ativo') {
        return res.status(403).json({
          error: 'Empresa inativa ou suspensa'
        });
      }
    }

    // Se ainda não tem empresa, retornar erro
    if (!empresa) {
      return res.status(400).json({
        error: 'Informe o slug da empresa via subdomínio ou query parameter ?slug=...'
      });
    }

    // Retornar apenas informações públicas (não sensíveis)
    const config = {
      id: empresa.id,
      nome: empresa.nome,
      slug: empresa.slug,
      email: empresa.email,
      telefone: empresa.telefone,

      // Configurações de Preços (em centavos)
      precos: {
        cautelar: empresa.preco_cautelar || 15000,
        transferencia: empresa.preco_transferencia || 12000,
        outros: empresa.preco_outros || 10000
      },

      // Configurações de Horário
      horarios: {
        inicio: empresa.horario_inicio || '08:00:00',
        fim: empresa.horario_fim || '18:00:00',
        intervalo_minutos: empresa.intervalo_minutos || 60
      },

      // Informações do plano
      plano: empresa.plano || 'basico',
      status: empresa.status,

      // URLs
      url: `https://${empresa.slug}.agendaaquivistorias.com.br`,

      // Comissão (informação útil para calcular preços)
      tem_comissao: calcularTemComissao(empresa),
      dias_desde_cadastro: calcularDiasDesdeCadastro(empresa)
    };

    res.json(config);
  } catch (error) {
    console.error('❌ Erro ao buscar configurações do tenant:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

/**
 * GET /api/tenant/info
 * Retorna informações básicas do tenant (sem configurações sensíveis)
 */
router.get('/info', requireTenant, async (req, res) => {
  try {
    const empresa = req.tenant;

    res.json({
      nome: empresa.nome,
      slug: empresa.slug,
      email: empresa.email,
      telefone: empresa.telefone,
      status: empresa.status
    });
  } catch (error) {
    console.error('❌ Erro ao buscar info do tenant:', error);
    res.status(500).json({ error: 'Erro ao buscar informações' });
  }
});

function calcularTemComissao(empresa) {
  if (!empresa.data_cadastro) return false;

  const dataInicio = new Date(empresa.data_cadastro);
  const hoje = new Date();
  const diasDesde = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));

  return diasDesde <= (empresa.periodo_comissao_dias || 30);
}

function calcularDiasDesdeCadastro(empresa) {
  if (!empresa.data_cadastro) return 0;

  const dataInicio = new Date(empresa.data_cadastro);
  const hoje = new Date();
  return Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
}

module.exports = router;
