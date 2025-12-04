const Empresa = require('../models/Empresa');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

/**
 * Calcula distância entre dois pontos usando fórmula Haversine
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Retorna em km com 1 casa decimal
}

class EmpresaController {
  /**
   * Buscar empresas por cidade/estado para o marketplace (público)
   */
  static async buscarEmpresas(req, res) {
    try {
      const { cidade, estado, lat, lng, raio = 50 } = req.query;

      let query = `
        SELECT
          id, nome, slug, cidade, estado, bairro, endereco,
          telefone, whatsapp, logo_url, foto_perfil_url,
          foto_capa_url, banner_url,
          preco_cautelar, preco_transferencia, preco_outros,
          horario_inicio, horario_fim, horario_funcionamento,
          google_rating, google_reviews_count,
          latitude, longitude, descricao
        FROM empresas
        WHERE status = 'ativo'
      `;
      const params = [];
      let paramIndex = 1;

      // Filtrar por cidade
      if (cidade) {
        params.push(`%${cidade}%`);
        query += ` AND LOWER(cidade) LIKE LOWER($${paramIndex})`;
        paramIndex++;
      }

      // Filtrar por estado
      if (estado) {
        params.push(estado.toUpperCase());
        query += ` AND UPPER(estado) = $${paramIndex}`;
        paramIndex++;
      }

      // Ordenar por distância se coordenadas foram fornecidas
      if (lat && lng) {
        // Fórmula Haversine simplificada para ordenação
        query += `
          ORDER BY
            CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
            THEN (
              6371 * acos(
                cos(radians($${paramIndex})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($${paramIndex + 1})) +
                sin(radians($${paramIndex})) * sin(radians(latitude))
              )
            )
            ELSE 999999 END ASC,
            google_rating DESC NULLS LAST
        `;
        params.push(parseFloat(lat), parseFloat(lng));
      } else {
        query += ` ORDER BY google_rating DESC NULLS LAST, nome ASC`;
      }

      query += ` LIMIT 50`;

      const result = await db.query(query, params);

      // Calcular distância para cada empresa se coordenadas foram fornecidas
      let empresas = result.rows.map(empresa => {
        const empresaData = {
          ...empresa,
          preco_minimo: Math.min(
            empresa.preco_cautelar || 99999,
            empresa.preco_transferencia || 99999,
            empresa.preco_outros || 99999
          ),
          url: `/${empresa.slug}`
        };

        // Calcular distância se temos coordenadas
        if (lat && lng && empresa.latitude && empresa.longitude) {
          empresaData.distancia_km = calcularDistancia(
            parseFloat(lat), parseFloat(lng),
            parseFloat(empresa.latitude), parseFloat(empresa.longitude)
          );
        }

        return empresaData;
      });

      // Filtrar por raio se temos coordenadas e distância calculada
      if (lat && lng && raio) {
        empresas = empresas.filter(e => !e.distancia_km || e.distancia_km <= parseFloat(raio));
      }

      res.json({
        total: empresas.length,
        empresas
      });
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      res.status(500).json({ error: 'Erro ao buscar empresas' });
    }
  }

  /**
   * Listar cidades disponíveis com empresas ativas (público)
   */
  static async listarCidades(req, res) {
    try {
      const result = await db.query(`
        SELECT
          cidade,
          estado,
          COUNT(*) as total_empresas
        FROM empresas
        WHERE status = 'ativo'
          AND cidade IS NOT NULL
          AND cidade != ''
        GROUP BY cidade, estado
        ORDER BY total_empresas DESC, cidade ASC
      `);

      res.json({
        total: result.rows.length,
        cidades: result.rows
      });
    } catch (error) {
      console.error('Erro ao listar cidades:', error);
      res.status(500).json({ error: 'Erro ao listar cidades' });
    }
  }

  /**
   * Buscar empresa por slug (público)
   */
  static async getBySlug(req, res) {
    try {
      const { slug } = req.params;

      const empresa = await Empresa.findBySlug(slug);

      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // Verificar se empresa está ativa
      if (empresa.status !== 'ativo') {
        return res.status(403).json({ error: 'Empresa temporariamente indisponível' });
      }

      // Remover dados sensíveis
      delete empresa.pix_key;
      delete empresa.pix_type;
      delete empresa.percentual_plataforma;

      res.json(empresa);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  }

  /**
   * Listar imagens do carrossel (público)
   */
  static async getCarrosselImages(req, res) {
    try {
      const { id } = req.params;

      const imagens = await Empresa.getCarouselImages(id);

      res.json(imagens);
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      res.status(500).json({ error: 'Erro ao buscar imagens do carrossel' });
    }
  }

  /**
   * Listar todas as empresas (Super Admin)
   */
  static async list(req, res) {
    try {
      const { status, plano } = req.query;

      const empresas = await Empresa.findAll({ status, plano });

      // Para cada empresa, buscar métricas do mês atual
      const now = new Date();
      const mes = now.getMonth() + 1;
      const ano = now.getFullYear();

      const empresasComMetricas = await Promise.all(
        empresas.map(async (empresa) => {
          const metricas = await Empresa.getMetricas(empresa.id, mes, ano);
          return {
            ...empresa,
            metricas: metricas || {
              total_agendamentos: 0,
              total_receita: 0,
              total_comissao_plataforma: 0,
              total_repasses: 0
            }
          };
        })
      );

      res.json(empresasComMetricas);
    } catch (error) {
      console.error('❌ Erro ao listar empresas:', error);
      res.status(500).json({ error: 'Erro ao listar empresas' });
    }
  }

  /**
   * Buscar empresa por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const empresa = await Empresa.findById(id);

      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // Buscar métricas dos últimos 6 meses
      const metricas = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mes = date.getMonth() + 1;
        const ano = date.getFullYear();

        const metrica = await Empresa.getMetricas(empresa.id, mes, ano);
        metricas.push({
          mes,
          ano,
          ...(metrica || {
            total_agendamentos: 0,
            total_receita: 0,
            total_comissao_plataforma: 0,
            total_repasses: 0
          })
        });
      }

      res.json({
        ...empresa,
        metricas
      });
    } catch (error) {
      console.error('❌ Erro ao buscar empresa:', error);
      res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  }

  /**
   * Criar nova empresa
   */
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        // Dados básicos
        nome,
        slug,
        razao_social,
        cnpj,
        email,
        telefone,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        chave_pix,
        tipo_pix,

        // Preços
        preco_cautelar,
        preco_transferencia,
        preco_outros,

        // Horários
        horario_inicio,
        horario_fim,
        intervalo_minutos,
        dias_trabalho,
        horario_funcionamento,

        // Personalização visual
        logo_url,
        banner_url,
        favicon_url,
        foto_capa_url,
        foto_perfil_url,
        cor_primaria,
        cor_secundaria,
        cor_texto,
        cor_fundo,
        fonte_primaria,
        template_id,

        // Textos personalizados
        titulo_hero,
        subtitulo_hero,
        texto_sobre,
        descricao,
        titulo_pagina,
        meta_description,

        // Contato e redes sociais
        whatsapp_numero,
        whatsapp,
        facebook_url,
        instagram_url,
        linkedin_url,
        website_url,
        site_url,

        // Localização
        latitude,
        longitude,

        // Avaliações Google
        google_rating,
        google_reviews_count,
        mostrar_avaliacoes,

        // Analytics
        meta_pixel_id,
        google_analytics_id,

        // Configurações de exibição
        mostrar_whatsapp_float,
        mostrar_marca_propria,

        // Plano e status
        plano,
        status
      } = req.body;

      // Verificar se slug está disponível
      const slugDisponivel = await Empresa.isSlugAvailable(slug);
      if (!slugDisponivel) {
        return res.status(400).json({
          error: 'Este subdomínio já está em uso. Escolha outro.'
        });
      }

      // Criar empresa com comissão fixa de R$ 5,00
      const empresa = await Empresa.create({
        // Dados básicos
        nome,
        slug: slug.toLowerCase(),
        razao_social,
        cnpj,
        email,
        telefone,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        chave_pix,
        pix_key: chave_pix,
        pix_type: tipo_pix || 'cpf',

        // Preços
        preco_cautelar: preco_cautelar || 0,
        preco_transferencia: preco_transferencia || 0,
        preco_outros: preco_outros || 0,

        // Horários
        horario_inicio,
        horario_fim,
        intervalo_minutos,
        dias_trabalho,
        horario_funcionamento,

        // Personalização visual
        logo_url,
        banner_url,
        favicon_url,
        foto_capa_url,
        foto_perfil_url,
        cor_primaria: cor_primaria || '#2563eb',
        cor_secundaria: cor_secundaria || '#1e40af',
        cor_texto,
        cor_fundo,
        fonte_primaria,
        template_id: template_id || 'default',

        // Textos personalizados
        titulo_hero,
        subtitulo_hero,
        texto_sobre,
        descricao,
        titulo_pagina,
        meta_description,

        // Contato e redes sociais
        whatsapp_numero,
        whatsapp: whatsapp || whatsapp_numero,
        facebook_url,
        instagram_url,
        linkedin_url,
        website_url,
        site_url: site_url || website_url,

        // Localização
        latitude,
        longitude,

        // Avaliações Google
        google_rating,
        google_reviews_count,
        mostrar_avaliacoes,

        // Analytics
        meta_pixel_id,
        google_analytics_id,

        // Configurações de exibição
        mostrar_whatsapp_float,
        mostrar_marca_propria,

        // Sistema
        percentual_plataforma: 500, // R$ 5,00 fixo por transação
        status: status || 'ativo',
        plano: plano || 'basico'
      });

      console.log('✅ Empresa criada:', empresa.slug);
      console.log(`🌐 Disponível em: https://agendaaquivistorias.com.br/${empresa.slug}`);

      // ============================================
      // CRIAR USUÁRIO ADMIN PARA A EMPRESA
      // ============================================
      let senhaTemporaria = null;
      let usuarioCriado = null;

      try {
        // Gerar senha temporária segura
        senhaTemporaria = Math.random().toString(36).slice(-6).toUpperCase() +
                          Math.random().toString(36).slice(-2) + '!';

        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

        // Criar usuário admin
        const resultUsuario = await db.query(`
          INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
          VALUES ($1, $2, $3, $4, 'admin', true, true)
          RETURNING id, nome, email, role
        `, [empresa.id, nome, email, senhaHash]);

        usuarioCriado = resultUsuario.rows[0];
        console.log(`👤 Usuário admin criado para ${empresa.slug}: ${email}`);
      } catch (errUsuario) {
        // Se falhar ao criar usuário, loga mas não impede a criação da empresa
        console.error('⚠️ Erro ao criar usuário da empresa (tabela pode não existir):', errUsuario.message);
      }

      // Resposta com dados da empresa e credenciais
      const resposta = {
        ...empresa,
        url: `https://agendaaquivistorias.com.br/${empresa.slug}`,
        painel_url: `https://agendaaquivistorias.com.br/painel`,
        mensagem: 'Empresa criada com sucesso! Comissão fixa de R$ 5,00 por transação nos primeiros 30 dias.'
      };

      // Incluir credenciais apenas se usuário foi criado
      if (usuarioCriado && senhaTemporaria) {
        resposta.credenciais = {
          email: email,
          senha_temporaria: senhaTemporaria,
          aviso: 'IMPORTANTE: Envie estas credenciais ao cliente. A senha deve ser alterada no primeiro acesso.',
          url_login: 'https://agendaaquivistorias.com.br/painel'
        };
      }

      res.status(201).json(resposta);
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      res.status(500).json({
        error: 'Erro ao criar empresa',
        details: error.message
      });
    }
  }

  /**
   * Atualizar empresa
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      const empresaAtualizada = await Empresa.update(id, req.body);

      res.json({
        ...empresaAtualizada,
        mensagem: 'Empresa atualizada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error);
      res.status(500).json({
        error: 'Erro ao atualizar empresa',
        details: error.message
      });
    }
  }

  /**
   * Deletar empresa
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      await Empresa.delete(id);

      console.log('🗑️ Empresa deletada:', empresa.slug);

      res.json({
        mensagem: 'Empresa deletada com sucesso',
        slug: empresa.slug
      });
    } catch (error) {
      console.error('❌ Erro ao deletar empresa:', error);
      res.status(500).json({
        error: 'Erro ao deletar empresa',
        details: error.message
      });
    }
  }

  /**
   * Alterar status da empresa
   */
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ativo', 'inativo', 'suspenso', 'trial'].includes(status)) {
        return res.status(400).json({
          error: 'Status inválido. Use: ativo, inativo, suspenso ou trial'
        });
      }

      const empresa = await Empresa.update(id, { status });

      res.json({
        ...empresa,
        mensagem: `Status alterado para: ${status}`
      });
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      res.status(500).json({ error: 'Erro ao alterar status' });
    }
  }

  /**
   * Verificar se empresa passou dos 30 dias e ajustar comissão
   */
  static async verificarPeriodoComissao(req, res) {
    try {
      const { id } = req.params;

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      const dataInicio = new Date(empresa.data_inicio);
      const hoje = new Date();
      const diasDesdeInicio = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));

      let percentualAtual = empresa.percentual_plataforma;
      let mensagem = '';

      if (diasDesdeInicio > 30 && empresa.percentual_plataforma === 500) {
        // Passou dos 30 dias, zerar comissão
        await Empresa.update(id, { percentual_plataforma: 0 });
        percentualAtual = 0;
        mensagem = 'Período promocional de 30 dias encerrado. Comissão zerada.';
        console.log(`✅ Empresa ${empresa.slug}: Comissão zerada após 30 dias`);
      } else if (diasDesdeInicio <= 30) {
        const diasRestantes = 30 - diasDesdeInicio;
        mensagem = `Período promocional: ${diasRestantes} dias restantes com comissão de R$ 5,00`;
      } else {
        mensagem = 'Sem comissão (período promocional encerrado)';
      }

      res.json({
        empresa_id: empresa.id,
        slug: empresa.slug,
        data_inicio: empresa.data_inicio,
        dias_desde_inicio: diasDesdeInicio,
        percentual_plataforma: percentualAtual,
        mensagem
      });
    } catch (error) {
      console.error('❌ Erro ao verificar período:', error);
      res.status(500).json({ error: 'Erro ao verificar período de comissão' });
    }
  }

  /**
   * Dashboard de métricas consolidadas
   */
  static async dashboard(req, res) {
    try {
      const empresas = await Empresa.findAll({ status: 'ativo' });

      const now = new Date();
      const mes = now.getMonth() + 1;
      const ano = now.getFullYear();

      let totais = {
        empresas_ativas: empresas.length,
        agendamentos_mes: 0,
        receita_mes: 0,
        comissao_mes: 0,
        repasses_pendentes: 0
      };

      for (const empresa of empresas) {
        const metricas = await Empresa.getMetricas(empresa.id, mes, ano);
        if (metricas) {
          totais.agendamentos_mes += metricas.total_agendamentos || 0;
          totais.receita_mes += metricas.total_receita || 0;
          totais.comissao_mes += metricas.total_comissao_plataforma || 0;
        }
      }

      // Buscar splits pendentes
      const splitsPendentes = await Empresa.getSplitsPendentes();
      totais.repasses_pendentes = splitsPendentes.reduce(
        (sum, split) => sum + split.valor_empresa,
        0
      );

      res.json(totais);
    } catch (error) {
      console.error('❌ Erro ao buscar dashboard:', error);
      res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
  }
}

module.exports = EmpresaController;
