/**
 * AgendaAqui - Landing Page de Vistorias por Cidade
 * URL: /vistorias/rio-brilhante-ms
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://agendaaqui-backend.onrender.com/api';
const BASE_URL = 'https://agendaaquivistorias.com.br';
const BACKEND_URL = API_URL.replace(/\/api$/, '');

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return `${BACKEND_URL}/${cleanUrl}`;
}

class VistoriasPage {
  constructor() {
    this.cidadeSlug = this.getCidadeSlug();
    if (this.cidadeSlug) {
      this.loadCidade();
    } else {
      this.loadTodasCidades();
    }
  }

  getCidadeSlug() {
    const path = window.location.pathname;
    const match = path.match(/^\/vistorias\/(.+)$/);
    return match ? match[1] : null;
  }

  async loadCidade() {
    try {
      const response = await fetch(`${API_URL}/seo/cidade/${this.cidadeSlug}`);

      if (!response.ok) {
        this.showEmpty();
        return;
      }

      const data = await response.json();
      this.renderCidade(data);
    } catch (error) {
      console.error('Erro ao carregar cidade:', error);
      this.showEmpty();
    }
  }

  async loadTodasCidades() {
    try {
      const response = await fetch(`${API_URL}/empresas/cidades`);
      const data = await response.json();
      const cidades = data.cidades || [];

      document.getElementById('cityTitle').textContent = 'Vistoria Veicular em todo o Brasil';
      document.getElementById('citySubtitle').textContent = `${cidades.length} cidades com empresas parceiras`;
      document.getElementById('loadingState').style.display = 'none';
      document.getElementById('resultsHeader').style.display = 'flex';
      document.getElementById('resultsTitle').textContent = 'Cidades atendidas';

      const grid = document.getElementById('resultsGrid');
      grid.innerHTML = cidades.map(c => {
        const cidadeSlug = c.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
        const estadoSlug = c.estado.toLowerCase();
        return `
          <a href="/vistorias/${cidadeSlug}-${estadoSlug}" class="empresa-card" style="text-decoration: none;">
            <div class="card-header" style="background: linear-gradient(135deg, #1e3a5f, #2563eb); min-height: 80px; display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 32px; height: 32px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="card-body">
              <h3 class="empresa-nome">${c.cidade}, ${c.estado}</h3>
              <p class="empresa-location" style="display: flex; align-items: center; gap: 6px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; flex-shrink: 0;">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                </svg>
                ${c.total_empresas} empresa${c.total_empresas > 1 ? 's' : ''} de vistoria
              </p>
            </div>
            <div class="card-footer">
              <span class="btn-agendar">
                Ver empresas
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </a>
        `;
      }).join('');

    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      this.showEmpty();
    }
  }

  renderCidade(data) {
    const { cidade, estado, total, empresas, seo } = data;

    // Update page SEO
    document.title = seo.titulo;
    document.getElementById('pageDescription').content = seo.descricao;
    document.getElementById('pageKeywords').content = seo.keywords;
    document.getElementById('pageCanonical').href = seo.url;

    // OG tags
    const ogTitle = document.getElementById('ogTitle');
    const ogDesc = document.getElementById('ogDescription');
    const twTitle = document.getElementById('twitterTitle');
    const twDesc = document.getElementById('twitterDescription');
    if (ogTitle) ogTitle.content = seo.titulo;
    if (ogDesc) ogDesc.content = seo.descricao;
    if (twTitle) twTitle.content = seo.titulo;
    if (twDesc) twDesc.content = seo.descricao;

    // Breadcrumb
    document.getElementById('breadcrumbCidade').textContent = `Vistorias em ${cidade}, ${estado}`;

    // Hero
    document.getElementById('cityTitle').textContent = `Vistoria Veicular em ${cidade}, ${estado}`;
    document.getElementById('citySubtitle').textContent = `${total} empresa${total > 1 ? 's' : ''} de vistoria veicular encontrada${total > 1 ? 's' : ''}`;

    // Results
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('resultsHeader').style.display = 'flex';
    document.getElementById('resultsTitle').textContent = `Empresas de vistoria em ${cidade}`;

    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = empresas.map(empresa => this.renderEmpresaCard(empresa)).join('');

    // FAQ Section
    this.renderFAQ(cidade, estado, empresas);

    // JSON-LD Schemas
    this.injectSchemas(cidade, estado, empresas, seo);
  }

  renderEmpresaCard(empresa) {
    const logoUrl = getImageUrl(empresa.logo_url || empresa.foto_perfil_url) || '/default-logo.png';
    const capaUrl = getImageUrl(empresa.foto_capa_url || empresa.banner_url) || '';
    const rating = parseFloat(empresa.google_rating) || 5.0;
    const reviews = parseInt(empresa.google_reviews_count) || 0;
    const location = [empresa.bairro, empresa.cidade, empresa.estado].filter(Boolean).join(', ');
    const precoMin = empresa.preco_cautelar
      ? `R$ ${(empresa.preco_cautelar / 100).toFixed(2).replace('.', ',')}`
      : 'Consulte';

    const headerStyle = capaUrl
      ? `style="background-image: url('${capaUrl}'); background-size: cover; background-position: center;"`
      : '';
    const headerClass = capaUrl ? 'card-header has-capa' : 'card-header';

    return `
      <a href="/${empresa.slug}" class="empresa-card">
        <div class="${headerClass}" ${headerStyle}>
          <div class="empresa-logo">
            <img src="${logoUrl}" alt="${empresa.nome}" loading="lazy" onerror="this.style.display='none'">
          </div>
        </div>
        <div class="card-body">
          <h3 class="empresa-nome">${empresa.nome}</h3>
          ${location ? `
            <p class="empresa-location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${location}
            </p>
          ` : ''}
          <div class="empresa-rating">
            <div class="stars">${this.renderStars(rating)}</div>
            <span class="rating-text">${rating.toFixed(1)} (${reviews} avaliações)</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="preco">
            <span class="preco-label">A partir de</span>
            <span class="preco-valor">${precoMin}</span>
          </div>
          <span class="btn-agendar">
            Agendar
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </a>
    `;
  }

  renderStars(rating) {
    return Array(5).fill(0).map((_, i) => {
      if (i < Math.floor(rating)) return '<span class="star filled">&#9733;</span>';
      if (i < rating) return '<span class="star half">&#9733;</span>';
      return '<span class="star">&#9733;</span>';
    }).join('');
  }

  renderFAQ(cidade, estado, empresas) {
    const faqSection = document.getElementById('faqSection');
    const faqList = document.getElementById('faqList');
    if (!faqSection || !faqList) return;

    const nomes = empresas.slice(0, 3).map(e => e.nome).join(', ');
    const precoMin = Math.min(...empresas.map(e => e.preco_cautelar || 15000));

    const faqs = [
      {
        q: `Quantas empresas de vistoria existem em ${cidade}, ${estado}?`,
        a: `Atualmente existem ${empresas.length} empresa${empresas.length > 1 ? 's' : ''} de vistoria veicular cadastrada${empresas.length > 1 ? 's' : ''} em ${cidade}, ${estado}, incluindo ${nomes}.`
      },
      {
        q: `Quanto custa uma vistoria veicular em ${cidade}?`,
        a: `Os precos variam conforme o tipo de servico. A vistoria cautelar em ${cidade} custa a partir de R$ ${(precoMin / 100).toFixed(2).replace('.', ',')}. Compare precos entre as empresas para encontrar a melhor opcao.`
      },
      {
        q: `Como agendar uma vistoria veicular em ${cidade}?`,
        a: `Pelo AgendaAqui voce pode agendar online: escolha a empresa, selecione data e horario, e pague com seguranca via PIX ou cartao. A confirmacao e instantanea.`
      },
      {
        q: `Quais tipos de vistoria estao disponiveis em ${cidade}?`,
        a: `As empresas em ${cidade} oferecem vistoria cautelar, laudo para transferencia, 2a via CRV, licenciamento, alienacao/desalienacao e vistoria para seguro.`
      }
    ];

    faqList.innerHTML = faqs.map(faq => `
      <details style="margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
        <summary style="font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;">
          ${faq.q}
          <span style="font-size: 1.2em; transition: transform 0.2s;">+</span>
        </summary>
        <p style="margin-top: 12px; color: #555; line-height: 1.6;">${faq.a}</p>
      </details>
    `).join('');

    faqSection.style.display = 'block';
  }

  injectSchemas(cidade, estado, empresas, seo) {
    const cidadeSlug = this.cidadeSlug;

    // Breadcrumb
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: `Vistorias em ${cidade}, ${estado}`, item: `${BASE_URL}/vistorias/${cidadeSlug}` }
      ]
    };

    // LocalBusiness list
    const businessList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Empresas de Vistoria Veicular em ${cidade}, ${estado}`,
      numberOfItems: empresas.length,
      itemListElement: empresas.map((emp, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'AutoRepair',
          name: emp.nome,
          url: `${BASE_URL}/${emp.slug}`,
          telephone: emp.telefone || emp.whatsapp || '',
          address: {
            '@type': 'PostalAddress',
            streetAddress: [emp.endereco, emp.numero].filter(Boolean).join(', '),
            addressLocality: cidade,
            addressRegion: estado,
            addressCountry: 'BR'
          },
          ...(emp.google_rating ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: parseFloat(emp.google_rating),
              reviewCount: parseInt(emp.google_reviews_count) || 1,
              bestRating: 5
            }
          } : {})
        }
      }))
    };

    // FAQ
    const precoMin = Math.min(...empresas.map(e => e.preco_cautelar || 15000));
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Quantas empresas de vistoria existem em ${cidade}, ${estado}?`,
          acceptedAnswer: { '@type': 'Answer', text: `Existem ${empresas.length} empresas de vistoria veicular em ${cidade}, ${estado} cadastradas no AgendaAqui.` }
        },
        {
          '@type': 'Question',
          name: `Quanto custa uma vistoria veicular em ${cidade}?`,
          acceptedAnswer: { '@type': 'Answer', text: `A vistoria cautelar em ${cidade} custa a partir de R$ ${(precoMin / 100).toFixed(2).replace('.', ',')}. Precos variam conforme o tipo de servico.` }
        },
        {
          '@type': 'Question',
          name: `Como agendar uma vistoria veicular em ${cidade}?`,
          acceptedAnswer: { '@type': 'Answer', text: `Pelo AgendaAqui voce pode agendar online, escolher data e horario, e pagar via PIX ou cartao com confirmacao instantanea.` }
        }
      ]
    };

    [breadcrumb, businessList, faqSchema].forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }

  showEmpty() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
  }
}

// Initialize
new VistoriasPage();
