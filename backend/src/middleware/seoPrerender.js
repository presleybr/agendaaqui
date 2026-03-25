const Empresa = require('../models/Empresa');
const db = require('../config/database');

/**
 * Lista de User-Agents de crawlers/bots de buscadores
 */
const BOT_USER_AGENTS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp',
  'baiduspider', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'telegrambot', 'discordbot', 'pinterestbot',
  'applebot', 'semrushbot', 'ahrefsbot', 'mj12bot',
  'petalbot', 'bytespider', 'gptbot'
];

/**
 * Detecta se a requisição vem de um bot/crawler
 */
function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

/**
 * Gera HTML completo pré-renderizado para uma empresa
 */
function generateEmpresaHTML(empresa, precos) {
  const baseUrl = 'https://agendaaquivistorias.com.br';
  const pageUrl = `${baseUrl}/${empresa.slug}`;
  const cidade = empresa.cidade || '';
  const estado = empresa.estado || '';
  const endereco = [empresa.endereco, empresa.numero, empresa.bairro, cidade, estado].filter(Boolean).join(', ');
  const descricao = empresa.meta_description ||
    `Agende sua vistoria veicular com ${empresa.nome} em ${cidade}, ${estado}. Vistorias cautelares, transferências e laudos. Atendimento rápido e online.`;
  const titulo = empresa.titulo_pagina ||
    `${empresa.nome} | Vistoria Veicular em ${cidade} ${estado}`.trim();
  const logoUrl = empresa.logo_url
    ? (empresa.logo_url.startsWith('http') ? empresa.logo_url : `${baseUrl}${empresa.logo_url}`)
    : `${baseUrl}/logo-dark.png`;
  const rating = parseFloat(empresa.google_rating) || 5.0;
  const reviewCount = parseInt(empresa.google_reviews_count) || 0;
  const cidadeSlug = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

  // Schemas
  const schemaLocalBusiness = {
    '@context': 'https://schema.org', '@type': 'AutoRepair',
    name: empresa.nome, description: descricao, url: pageUrl,
    telephone: empresa.telefone || empresa.whatsapp || '', priceRange: '$$',
    image: logoUrl,
    address: { '@type': 'PostalAddress', streetAddress: [empresa.endereco, empresa.numero].filter(Boolean).join(', '), addressLocality: cidade, addressRegion: estado, postalCode: empresa.cep || '', addressCountry: 'BR' }
  };
  if (empresa.latitude && empresa.longitude) {
    schemaLocalBusiness.geo = { '@type': 'GeoCoordinates', latitude: parseFloat(empresa.latitude), longitude: parseFloat(empresa.longitude) };
  }
  if (empresa.horario_funcionamento) schemaLocalBusiness.openingHours = empresa.horario_funcionamento;
  if (empresa.google_rating) {
    schemaLocalBusiness.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviewCount || 1, bestRating: 5 };
  }
  const sameAs = [empresa.facebook_url, empresa.instagram_url, empresa.site_url, empresa.website_url].filter(Boolean);
  if (sameAs.length > 0) schemaLocalBusiness.sameAs = sameAs;

  const schemaBreadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: `Vistorias em ${cidade}, ${estado}`, item: `${baseUrl}/vistorias/${cidadeSlug}-${estado.toLowerCase()}` },
      { '@type': 'ListItem', position: 3, name: empresa.nome, item: pageUrl }
    ]
  };

  const precoCautelar = ((empresa.preco_cautelar || 15000) / 100).toFixed(2).replace('.', ',');
  const schemaFAQ = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `Quanto custa uma vistoria veicular na ${empresa.nome}?`, acceptedAnswer: { '@type': 'Answer', text: `Os preços da ${empresa.nome} em ${cidade} variam conforme o tipo de serviço. Vistoria cautelar a partir de R$ ${precoCautelar}. Agende online para conferir todos os valores.` } },
      { '@type': 'Question', name: `Onde fica a ${empresa.nome}?`, acceptedAnswer: { '@type': 'Answer', text: `A ${empresa.nome} está localizada em ${endereco}. ${empresa.cep ? 'CEP: ' + empresa.cep + '.' : ''}` } },
      { '@type': 'Question', name: `Como agendar vistoria na ${empresa.nome}?`, acceptedAnswer: { '@type': 'Answer', text: `Você pode agendar sua vistoria online pelo site ${pageUrl}. Escolha o tipo de serviço, data e horário, e pague com segurança via PIX ou cartão.` } },
      { '@type': 'Question', name: `Qual o horário de funcionamento da ${empresa.nome}?`, acceptedAnswer: { '@type': 'Answer', text: empresa.horario_funcionamento || 'Segunda a Sexta, das 8h às 18h. Consulte a página para horários atualizados.' } }
    ]
  };

  // Build pricing HTML
  let precosHTML = '';
  if (precos && precos.length > 0) {
    precosHTML = precos.filter(p => p.ativo !== false).map(p =>
      `<li><strong>${p.nome_exibicao}</strong>: R$ ${(p.preco / 100).toFixed(2).replace('.', ',')} ${p.descricao ? '- ' + p.descricao : ''}</li>`
    ).join('\n            ');
  } else {
    precosHTML = `
            <li><strong>Vistoria Cautelar</strong>: R$ ${precoCautelar}</li>
            <li><strong>Transferência</strong>: R$ ${((empresa.preco_transferencia || 12000) / 100).toFixed(2).replace('.', ',')}</li>
            <li><strong>Outros Serviços</strong>: R$ ${((empresa.preco_outros || 10000) / 100).toFixed(2).replace('.', ',')}</li>`;
  }

  // Serviços
  const servicos = [
    'Vistoria Cautelar', 'Laudo para Transferência', 'Laudo para 2ª Via CRV',
    'Laudo para Licenciamento', 'Alienação/Desalienação', 'Vistoria para Seguro'
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <meta name="description" content="${descricao}">
  <meta name="keywords" content="vistoria veicular ${cidade}, vistoria ${estado}, cautelar ${cidade}, ${empresa.nome}, laudo veicular ${cidade}, transferência veicular ${cidade}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${pageUrl}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <!-- Open Graph -->
  <meta property="og:type" content="business.business">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="AgendaAqui Vistorias">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descricao}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${logoUrl}">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titulo}">
  <meta name="twitter:description" content="${descricao}">
  <meta name="twitter:image" content="${logoUrl}">

  <!-- JSON-LD Schemas -->
  <script type="application/ld+json">${JSON.stringify(schemaLocalBusiness)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaBreadcrumb)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaFAQ)}</script>
</head>
<body>
  <header>
    <nav>
      <a href="${baseUrl}">AgendaAqui Vistorias</a>
      <a href="${baseUrl}/vistorias/${cidadeSlug}-${estado.toLowerCase()}">Vistorias em ${cidade}</a>
    </nav>
  </header>

  <main>
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="${baseUrl}">Home</a></li>
        <li><a href="${baseUrl}/vistorias/${cidadeSlug}-${estado.toLowerCase()}">Vistorias em ${cidade}, ${estado}</a></li>
        <li>${empresa.nome}</li>
      </ol>
    </nav>

    <article>
      <h1>${empresa.nome} - Vistoria Veicular em ${cidade}, ${estado}</h1>

      ${empresa.logo_url ? `<img src="${logoUrl}" alt="Logo ${empresa.nome}" width="200" height="200">` : ''}

      <section id="sobre">
        <h2>Sobre a ${empresa.nome}</h2>
        <p>${empresa.descricao || `Empresa de vistoria veicular especializada em laudos cautelares, transferências e demais serviços em ${cidade}, ${estado}.`}</p>

        <h3>Informações de Contato</h3>
        <ul>
          <li><strong>Endereço:</strong> ${endereco}</li>
          ${empresa.cep ? `<li><strong>CEP:</strong> ${empresa.cep}</li>` : ''}
          <li><strong>Telefone:</strong> ${empresa.telefone || empresa.whatsapp || 'Não informado'}</li>
          ${empresa.whatsapp ? `<li><strong>WhatsApp:</strong> ${empresa.whatsapp}</li>` : ''}
          <li><strong>E-mail:</strong> ${empresa.email || 'Não informado'}</li>
          <li><strong>Horário:</strong> ${empresa.horario_funcionamento || 'Segunda a Sexta: 8h - 18h'}</li>
        </ul>
      </section>

      <section id="servicos">
        <h2>Serviços Oferecidos</h2>
        <ul>
          ${servicos.map(s => `<li>${s}</li>`).join('\n          ')}
        </ul>
      </section>

      <section id="precos">
        <h2>Preços</h2>
        <ul>
          ${precosHTML}
        </ul>
        <p><a href="${pageUrl}#agendamento">Agende sua vistoria online agora</a></p>
      </section>

      <section id="avaliacoes">
        <h2>Avaliações</h2>
        <p>Nota: ${rating.toFixed(1)} de 5.0 (${reviewCount} avaliações)</p>
      </section>

      <section id="localizacao">
        <h2>Localização</h2>
        <p>${endereco}</p>
        <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}" rel="noopener" target="_blank">Ver no Google Maps</a></p>
      </section>

      <section id="agendamento">
        <h2>Agendar Vistoria</h2>
        <p>Agende sua vistoria veicular online com a ${empresa.nome}. Escolha o tipo de serviço, data e horário, e pague com segurança via PIX ou cartão de crédito.</p>
        <p><strong><a href="${pageUrl}">Clique aqui para agendar sua vistoria online</a></strong></p>
      </section>

      <section id="faq">
        <h2>Perguntas Frequentes sobre ${empresa.nome}</h2>
        <dl>
          <dt>Quanto custa uma vistoria veicular na ${empresa.nome}?</dt>
          <dd>Os preços variam conforme o tipo de serviço. Vistoria cautelar a partir de R$ ${precoCautelar}. Agende online para conferir todos os valores.</dd>

          <dt>Onde fica a ${empresa.nome}?</dt>
          <dd>A ${empresa.nome} está localizada em ${endereco}.</dd>

          <dt>Como agendar vistoria na ${empresa.nome}?</dt>
          <dd>Agende online pelo site ${pageUrl}. Escolha serviço, data e horário, e pague via PIX ou cartão.</dd>

          <dt>Qual o horário de funcionamento?</dt>
          <dd>${empresa.horario_funcionamento || 'Segunda a Sexta, das 8h às 18h.'}</dd>
        </dl>
      </section>
    </article>
  </main>

  <footer>
    <p>&copy; ${new Date().getFullYear()} ${empresa.nome}. Agendamento online por <a href="${baseUrl}">AgendaAqui Vistorias</a>.</p>
    <nav>
      <a href="${baseUrl}">Buscar Vistorias</a> |
      <a href="${baseUrl}/vistorias/${cidadeSlug}-${estado.toLowerCase()}">Vistorias em ${cidade}</a> |
      <a href="${baseUrl}/cadastro-empresa.html">Cadastrar Empresa</a>
    </nav>
  </footer>
</body>
</html>`;
}

/**
 * Middleware de pre-rendering para SEO
 * Detecta bots e serve HTML completo em vez de SPA
 */
async function seoPrerender(req, res, next) {
  const userAgent = req.get('user-agent') || '';

  if (!isBot(userAgent)) {
    return next(); // Usuário normal, serve a SPA
  }

  const slug = req.params.slug;
  if (!slug) return next();

  try {
    const empresa = await Empresa.findBySlug(slug);

    if (!empresa || empresa.status !== 'ativo') {
      return next(); // Empresa não encontrada, deixa o handler normal tratar
    }

    // Buscar preços dinâmicos
    let precos = [];
    try {
      const precosResult = await db.query(
        'SELECT * FROM precos_vistoria WHERE empresa_id = $1 AND ativo = true ORDER BY ordem ASC, nome_exibicao ASC',
        [empresa.id]
      );
      precos = precosResult.rows;
    } catch (e) {
      // Tabela pode não existir, ignora
    }

    console.log(`🤖 SEO Pre-render para bot: ${userAgent.substring(0, 50)} -> /${slug}`);

    const html = generateEmpresaHTML(empresa, precos);
    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 hora
    res.send(html);

  } catch (error) {
    console.error('Erro no pre-render SEO:', error);
    next(); // Fallback para SPA
  }
}

module.exports = { seoPrerender, isBot, generateEmpresaHTML };
