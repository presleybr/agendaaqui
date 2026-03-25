const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Empresa = require('../models/Empresa');

/**
 * GET /api/seo/sitemap.xml
 * Gera sitemap dinâmico com todas as empresas ativas
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT slug, updated_at FROM empresas WHERE status = 'ativo' ORDER BY updated_at DESC"
    );
    const empresas = result.rows;

    const baseUrl = 'https://agendaaquivistorias.com.br';
    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Página principal
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n    <lastmod>${today}</lastmod>\n  </url>\n`;

    // Cadastro de empresa
    xml += `  <url>\n    <loc>${baseUrl}/cadastro-empresa.html</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;

    // Páginas de empresas
    for (const empresa of empresas) {
      const lastmod = empresa.updated_at
        ? new Date(empresa.updated_at).toISOString().split('T')[0]
        : today;
      xml += `  <url>\n    <loc>${baseUrl}/${empresa.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
    }

    // Páginas de cidades
    const cidadesResult = await db.query(
      "SELECT DISTINCT cidade, estado FROM empresas WHERE status = 'ativo' AND cidade IS NOT NULL ORDER BY estado, cidade"
    );
    for (const c of cidadesResult.rows) {
      const cidadeSlug = c.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
      const estadoSlug = c.estado.toLowerCase();
      xml += `  <url>\n    <loc>${baseUrl}/vistorias/${cidadeSlug}-${estadoSlug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

/**
 * GET /api/seo/empresa/:slug
 * Retorna HTML pré-renderizado com meta tags para crawlers
 */
router.get('/empresa/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const empresa = await Empresa.findBySlug(slug);

    if (!empresa || empresa.status !== 'ativo') {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const baseUrl = 'https://agendaaquivistorias.com.br';
    const pageUrl = `${baseUrl}/${slug}`;
    const cidade = empresa.cidade || '';
    const estado = empresa.estado || '';
    const descricao = empresa.meta_description ||
      `Agende sua vistoria veicular com ${empresa.nome} em ${cidade}, ${estado}. Vistorias cautelares, transferências e laudos. Atendimento rápido e online.`;
    const titulo = empresa.titulo_pagina ||
      `${empresa.nome} | Vistoria Veicular em ${cidade} ${estado}`.trim();

    const logoUrl = empresa.logo_url
      ? (empresa.logo_url.startsWith('http') ? empresa.logo_url : `${baseUrl}${empresa.logo_url}`)
      : `${baseUrl}/logo-dark.png`;

    // JSON-LD Schema
    const endereco = [empresa.endereco, empresa.numero].filter(Boolean).join(', ');
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      name: empresa.nome,
      description: descricao,
      url: pageUrl,
      telephone: empresa.telefone || empresa.whatsapp || '',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: endereco,
        addressLocality: cidade,
        addressRegion: estado,
        postalCode: empresa.cep || '',
        addressCountry: 'BR'
      },
      image: logoUrl
    };

    if (empresa.latitude && empresa.longitude) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: parseFloat(empresa.latitude),
        longitude: parseFloat(empresa.longitude)
      };
    }

    if (empresa.horario_funcionamento) {
      schema.openingHours = empresa.horario_funcionamento;
    }

    if (empresa.google_rating) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: parseFloat(empresa.google_rating) || 5.0,
        reviewCount: parseInt(empresa.google_reviews_count) || 1,
        bestRating: 5
      };
    }

    const sameAs = [empresa.facebook_url, empresa.instagram_url, empresa.site_url, empresa.website_url].filter(Boolean);
    if (sameAs.length > 0) {
      schema.sameAs = sameAs;
    }

    // Breadcrumb Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: `Vistorias em ${cidade}, ${estado}`, item: `${baseUrl}/vistorias/${cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}-${estado.toLowerCase()}` },
        { '@type': 'ListItem', position: 3, name: empresa.nome, item: pageUrl }
      ]
    };

    // FAQ Schema
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Quanto custa uma vistoria veicular na ${empresa.nome}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Os preços da ${empresa.nome} em ${cidade} variam conforme o tipo de serviço. Vistoria cautelar a partir de R$ ${((empresa.preco_cautelar || 15000) / 100).toFixed(2).replace('.', ',')}. Agende online para conferir todos os valores.`
          }
        },
        {
          '@type': 'Question',
          name: `Onde fica a ${empresa.nome}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `A ${empresa.nome} está localizada em ${endereco ? endereco + ', ' : ''}${cidade}, ${estado}. ${empresa.cep ? 'CEP: ' + empresa.cep + '.' : ''}`
          }
        },
        {
          '@type': 'Question',
          name: `Como agendar vistoria na ${empresa.nome}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Você pode agendar sua vistoria online pelo site ${pageUrl}. Escolha o tipo de serviço, data e horário, e pague com segurança via PIX ou cartão.`
          }
        },
        {
          '@type': 'Question',
          name: `Qual o horário de funcionamento da ${empresa.nome}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: empresa.horario_funcionamento || 'Segunda a Sexta, das 8h às 18h. Consulte a página para horários atualizados.'
          }
        }
      ]
    };

    res.json({
      titulo,
      descricao,
      keywords: `vistoria veicular ${cidade}, vistoria ${estado}, cautelar ${cidade}, ${empresa.nome}, laudo veicular ${cidade}, transferência veicular ${cidade}`,
      url: pageUrl,
      image: logoUrl,
      schemas: [schema, breadcrumbSchema, faqSchema],
      empresa: {
        nome: empresa.nome,
        cidade,
        estado,
        telefone: empresa.telefone || empresa.whatsapp || ''
      }
    });
  } catch (error) {
    console.error('Erro ao gerar SEO data:', error);
    res.status(500).json({ error: 'Erro ao gerar dados SEO' });
  }
});

/**
 * GET /api/seo/cidade/:cidadeSlug
 * Retorna dados SEO para landing page de cidade
 */
router.get('/cidade/:cidadeSlug', async (req, res) => {
  try {
    const { cidadeSlug } = req.params;

    // Parse cidadeSlug: "rio-brilhante-ms" -> cidade="rio brilhante", estado="ms"
    const parts = cidadeSlug.split('-');
    const estado = parts.pop().toUpperCase();
    const cidade = parts.join(' ');

    // Buscar empresas na cidade
    const result = await db.query(
      `SELECT id, nome, slug, descricao, cidade, estado, endereco, numero, bairro,
              telefone, whatsapp, logo_url, foto_capa_url, google_rating, google_reviews_count,
              preco_cautelar, preco_transferencia, preco_outros, horario_funcionamento,
              latitude, longitude
       FROM empresas
       WHERE status = 'ativo'
         AND LOWER(UNACCENT(cidade)) = LOWER(UNACCENT($1))
         AND UPPER(estado) = $2
       ORDER BY google_rating DESC NULLS LAST`,
      [cidade, estado]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhuma empresa encontrada nesta cidade' });
    }

    const empresas = result.rows;
    const cidadeReal = empresas[0].cidade;
    const estadoReal = empresas[0].estado;
    const baseUrl = 'https://agendaaquivistorias.com.br';

    res.json({
      cidade: cidadeReal,
      estado: estadoReal,
      total: empresas.length,
      empresas: empresas.map(e => ({
        ...e,
        url: `${baseUrl}/${e.slug}`
      })),
      seo: {
        titulo: `Vistoria Veicular em ${cidadeReal}, ${estadoReal} | AgendaAqui Vistorias`,
        descricao: `Encontre ${empresas.length} empresa${empresas.length > 1 ? 's' : ''} de vistoria veicular em ${cidadeReal}, ${estadoReal}. Compare preços, veja avaliações e agende online.`,
        keywords: `vistoria veicular ${cidadeReal}, vistoria ${estadoReal}, cautelar ${cidadeReal}, laudo veicular ${cidadeReal}, transferência veicular ${cidadeReal}`,
        url: `${baseUrl}/vistorias/${cidadeSlug}`
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados da cidade:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da cidade' });
  }
});

module.exports = router;
