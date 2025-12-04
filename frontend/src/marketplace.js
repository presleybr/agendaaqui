/**
 * AgendaAqui Marketplace - Busca de Vistorias
 */

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || '';

class Marketplace {
  constructor() {
    this.empresas = [];
    this.cidades = [];
    this.userLocation = null;
    this.isSearching = false;

    this.init();
  }

  async init() {
    console.log('🚀 Inicializando Marketplace AgendaAqui...');

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadCidades();
    await this.loadFeaturedEmpresas();

    // Setup mobile menu
    this.setupMobileMenu();

    console.log('✅ Marketplace inicializado');
  }

  setupEventListeners() {
    // Search button
    const btnBuscar = document.getElementById('btnBuscar');
    if (btnBuscar) {
      btnBuscar.addEventListener('click', () => this.buscar());
    }

    // Enter key on search input
    const searchCidade = document.getElementById('searchCidade');
    if (searchCidade) {
      searchCidade.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.buscar();
        }
      });

      // Autocomplete suggestions
      searchCidade.addEventListener('input', (e) => this.showSuggestions(e.target.value));
      searchCidade.addEventListener('focus', () => this.showSuggestions(searchCidade.value));
      searchCidade.addEventListener('blur', () => {
        // Delay to allow click on suggestion
        setTimeout(() => this.hideSuggestions(), 200);
      });
    }

    // Estado select
    const searchEstado = document.getElementById('searchEstado');
    if (searchEstado) {
      searchEstado.addEventListener('change', () => {
        if (searchCidade.value) {
          this.buscar();
        }
      });
    }

    // Location button
    const btnLocalizacao = document.getElementById('btnLocalizacao');
    if (btnLocalizacao) {
      btnLocalizacao.addEventListener('click', () => this.usarLocalizacao());
    }

    // Filter order
    const filterOrdem = document.getElementById('filterOrdem');
    if (filterOrdem) {
      filterOrdem.addEventListener('change', () => this.ordenarResultados());
    }
  }

  setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const nav = document.querySelector('.main-nav');

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        toggle.classList.toggle('active');
      });
    }
  }

  async loadCidades() {
    try {
      const response = await fetch(`${API_URL}/empresas/cidades`);
      const data = await response.json();

      this.cidades = data.cidades || [];

      // Update stats
      const statCidades = document.getElementById('statCidades');
      if (statCidades) {
        statCidades.textContent = this.cidades.length || '--';
      }

      console.log(`📍 ${this.cidades.length} cidades carregadas`);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    }
  }

  async loadFeaturedEmpresas() {
    try {
      const response = await fetch(`${API_URL}/empresas/buscar`);
      const data = await response.json();

      const empresas = data.empresas || [];

      // Update stats
      const statEmpresas = document.getElementById('statEmpresas');
      if (statEmpresas) {
        statEmpresas.textContent = empresas.length || '--';
      }

      // Show featured (top 6)
      const featured = empresas.slice(0, 6);
      this.renderFeatured(featured);

      console.log(`🏢 ${empresas.length} empresas carregadas`);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  }

  showSuggestions(value) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;

    if (!value || value.length < 2) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    const filtered = this.cidades
      .filter(c => c.cidade && c.cidade.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 5);

    if (filtered.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.innerHTML = filtered.map(c => `
      <div class="suggestion-item" data-cidade="${c.cidade}" data-estado="${c.estado}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${c.cidade}, ${c.estado}</span>
        <span class="suggestion-count">${c.total_empresas} empresa${c.total_empresas > 1 ? 's' : ''}</span>
      </div>
    `).join('');

    container.style.display = 'block';

    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const cidade = item.dataset.cidade;
        const estado = item.dataset.estado;

        document.getElementById('searchCidade').value = cidade;
        document.getElementById('searchEstado').value = estado;

        this.hideSuggestions();
        this.buscar();
      });
    });
  }

  hideSuggestions() {
    const container = document.getElementById('searchSuggestions');
    if (container) {
      container.style.display = 'none';
    }
  }

  async usarLocalizacao() {
    const btn = document.getElementById('btnLocalizacao');

    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização');
      return;
    }

    btn.classList.add('loading');
    btn.innerHTML = `
      <div class="spinner-small"></div>
      <span>Obtendo localização...</span>
    `;

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log('📍 Localização obtida:', this.userLocation);

      // Clear search inputs
      document.getElementById('searchCidade').value = '';
      document.getElementById('searchEstado').value = '';

      // Search by location
      await this.buscar();

    } catch (error) {
      console.error('Erro ao obter localização:', error);
      alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
    } finally {
      btn.classList.remove('loading');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
        </svg>
        <span>Usar minha localização</span>
      `;
    }
  }

  async buscar() {
    if (this.isSearching) return;
    this.isSearching = true;

    const cidade = document.getElementById('searchCidade').value.trim();
    const estado = document.getElementById('searchEstado').value;

    // Build query params
    const params = new URLSearchParams();
    if (cidade) params.append('cidade', cidade);
    if (estado) params.append('estado', estado);
    if (this.userLocation) {
      params.append('lat', this.userLocation.lat);
      params.append('lng', this.userLocation.lng);
      params.append('raio', 100); // 100km radius
    }

    // Show loading
    this.showLoading();

    try {
      const response = await fetch(`${API_URL}/empresas/buscar?${params}`);
      const data = await response.json();

      this.empresas = data.empresas || [];
      console.log(`🔍 ${this.empresas.length} resultados encontrados`);

      // Update UI
      this.hideLoading();
      this.renderResults();

      // Update title
      const title = document.getElementById('resultsTitle');
      if (title) {
        if (cidade) {
          title.textContent = `Vistorias em ${cidade}${estado ? `, ${estado}` : ''}`;
        } else if (this.userLocation) {
          title.textContent = 'Vistorias perto de você';
        } else {
          title.textContent = 'Todas as vistorias';
        }
      }

      // Scroll to results
      document.getElementById('busca').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Erro na busca:', error);
      this.hideLoading();
      this.showEmpty();
    } finally {
      this.isSearching = false;
    }
  }

  ordenarResultados() {
    const ordem = document.getElementById('filterOrdem').value;

    switch (ordem) {
      case 'preco':
        this.empresas.sort((a, b) => (a.preco_minimo || 0) - (b.preco_minimo || 0));
        break;
      case 'avaliacao':
        this.empresas.sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
        break;
      case 'distancia':
        this.empresas.sort((a, b) => (a.distancia_km || 9999) - (b.distancia_km || 9999));
        break;
      default:
        // Relevância: avaliação + proximidade
        this.empresas.sort((a, b) => {
          const scoreA = (a.google_rating || 0) * 10 - (a.distancia_km || 0);
          const scoreB = (b.google_rating || 0) * 10 - (b.distancia_km || 0);
          return scoreB - scoreA;
        });
    }

    this.renderResults();
  }

  showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('resultsGrid').innerHTML = '';
    document.getElementById('resultsHeader').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('featuredSection').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
  }

  showEmpty() {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('resultsHeader').style.display = 'none';
  }

  renderResults() {
    const grid = document.getElementById('resultsGrid');
    const header = document.getElementById('resultsHeader');
    const empty = document.getElementById('emptyState');
    const featured = document.getElementById('featuredSection');

    if (this.empresas.length === 0) {
      grid.innerHTML = '';
      header.style.display = 'none';
      empty.style.display = 'flex';
      featured.style.display = 'none';
      return;
    }

    header.style.display = 'flex';
    empty.style.display = 'none';
    featured.style.display = 'none';

    grid.innerHTML = this.empresas.map(empresa => this.renderEmpresaCard(empresa)).join('');
  }

  renderFeatured(empresas) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) {
      console.error('❌ featuredGrid não encontrado');
      return;
    }

    console.log(`🎨 Renderizando ${empresas.length} empresas em destaque`);

    if (empresas.length === 0) {
      grid.innerHTML = '<p class="no-featured">Nenhuma empresa cadastrada ainda.</p>';
      return;
    }

    try {
      const cardsHtml = empresas.map(empresa => this.renderEmpresaCard(empresa, true)).join('');
      grid.innerHTML = cardsHtml;
      console.log('✅ Cards renderizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao renderizar cards:', error);
      grid.innerHTML = '<p class="no-featured">Erro ao carregar empresas.</p>';
    }
  }

  renderEmpresaCard(empresa, isFeatured = false) {
    try {
      const precoMin = empresa.preco_minimo && empresa.preco_minimo < 99999
        ? this.formatCurrency(empresa.preco_minimo)
        : 'Consulte';

      const rating = parseFloat(empresa.google_rating) || 5.0;
      const reviews = parseInt(empresa.google_reviews_count) || 0;

      const distancia = empresa.distancia_km
        ? `<span class="distance-badge">${empresa.distancia_km} km</span>`
        : '';

      const logoUrl = empresa.logo_url || empresa.foto_perfil_url || '/default-logo.png';

      const location = [empresa.bairro, empresa.cidade, empresa.estado]
        .filter(Boolean)
        .join(', ');

      const descricaoTruncada = empresa.descricao
        ? empresa.descricao.substring(0, 100) + (empresa.descricao.length > 100 ? '...' : '')
        : '';

      return `
        <a href="${empresa.url || '/' + empresa.slug}" class="empresa-card ${isFeatured ? 'featured-card' : ''}">
          <div class="card-header">
            <div class="empresa-logo">
              <img src="${logoUrl}" alt="${empresa.nome || 'Empresa'}" onerror="this.style.display='none'">
            </div>
            ${distancia}
          </div>

          <div class="card-body">
            <h3 class="empresa-nome">${empresa.nome || 'Sem nome'}</h3>

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
              <div class="stars">
                ${this.renderStars(rating)}
              </div>
              <span class="rating-text">${rating.toFixed(1)} (${reviews} avaliações)</span>
            </div>

            ${descricaoTruncada ? `<p class="empresa-descricao">${descricaoTruncada}</p>` : ''}
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
    } catch (error) {
      console.error('❌ Erro ao renderizar card:', empresa, error);
      return '';
    }
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    let html = '';

    for (let i = 0; i < fullStars; i++) {
      html += '<span class="star filled">★</span>';
    }

    if (hasHalf) {
      html += '<span class="star half">★</span>';
    }

    for (let i = 0; i < emptyStars; i++) {
      html += '<span class="star empty">★</span>';
    }

    return html;
  }

  formatCurrency(centavos) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(centavos / 100);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.marketplace = new Marketplace();
});
