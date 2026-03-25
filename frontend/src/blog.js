/**
 * AgendaAqui Blog - Frontend
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://agendaaqui-backend.onrender.com/api';
const BASE_URL = 'https://agendaaquivistorias.com.br';

class BlogPage {
  constructor() {
    this.artigos = [];
    this.currentSlug = this.getSlugFromURL();

    if (this.currentSlug) {
      this.loadArticle(this.currentSlug);
    } else {
      this.loadArticles();
    }

    this.setupFilters();
    this.setupPopState();
  }

  getSlugFromURL() {
    const path = window.location.pathname;
    const match = path.match(/^\/blog\/(.+)$/);
    return match ? match[1] : null;
  }

  setupPopState() {
    window.addEventListener('popstate', () => {
      const slug = this.getSlugFromURL();
      if (slug) {
        this.loadArticle(slug);
      } else {
        this.showList();
      }
    });
  }

  setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterArticles(btn.dataset.cat);
      });
    });
  }

  async loadArticles(categoria = '') {
    const loading = document.getElementById('blogLoading');
    loading.style.display = 'flex';

    try {
      const params = new URLSearchParams();
      if (categoria) params.append('categoria', categoria);

      const response = await fetch(`${API_URL}/blog?${params}`);
      const data = await response.json();
      this.artigos = data.artigos || [];

      this.renderArticleList();
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    } finally {
      loading.style.display = 'none';
    }
  }

  filterArticles(categoria) {
    this.loadArticles(categoria);
  }

  renderArticleList() {
    const grid = document.getElementById('blogGrid');

    if (this.artigos.length === 0) {
      grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum artigo encontrado.</p>';
      return;
    }

    grid.innerHTML = this.artigos.map(artigo => `
      <a href="/blog/${artigo.slug}" class="blog-card" data-slug="${artigo.slug}">
        <div class="blog-card-image">
          <img src="${artigo.imagem || '/bgnew.png'}" alt="${artigo.titulo}" loading="lazy">
          <span class="blog-card-category">${this.getCategoryLabel(artigo.categoria)}</span>
        </div>
        <div class="blog-card-body">
          <h2 class="blog-card-title">${artigo.titulo}</h2>
          <p class="blog-card-summary">${artigo.resumo}</p>
          <div class="blog-card-meta">
            <time>${this.formatDate(artigo.data_publicacao)}</time>
            <span>${artigo.tempo_leitura} min de leitura</span>
          </div>
        </div>
      </a>
    `).join('');

    // Handle click navigation (SPA)
    grid.querySelectorAll('.blog-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = card.dataset.slug;
        history.pushState({}, '', `/blog/${slug}`);
        this.loadArticle(slug);
      });
    });
  }

  async loadArticle(slug) {
    try {
      const response = await fetch(`${API_URL}/blog/${slug}`);

      if (!response.ok) {
        this.showList();
        return;
      }

      const artigo = await response.json();
      this.renderArticle(artigo);
    } catch (error) {
      console.error('Erro ao carregar artigo:', error);
      this.showList();
    }
  }

  renderArticle(artigo) {
    // Hide list, show article
    document.getElementById('blogList').style.display = 'none';
    document.getElementById('articleView').style.display = 'block';

    // Update page SEO
    document.title = artigo.seo.titulo;
    document.getElementById('pageDescription').content = artigo.seo.descricao;
    document.getElementById('pageCanonical').href = artigo.seo.url;

    const ogTitle = document.getElementById('ogTitle');
    const ogDesc = document.getElementById('ogDescription');
    const twTitle = document.getElementById('twTitle');
    const twDesc = document.getElementById('twDescription');
    if (ogTitle) ogTitle.content = artigo.seo.titulo;
    if (ogDesc) ogDesc.content = artigo.seo.descricao;
    if (twTitle) twTitle.content = artigo.seo.titulo;
    if (twDesc) twDesc.content = artigo.seo.descricao;

    // Breadcrumb
    document.getElementById('breadcrumbCurrent').innerHTML =
      `<a href="/blog" id="breadcrumbBlog">Blog</a> <span>&gt;</span> <span>${artigo.titulo.substring(0, 50)}...</span>`;

    document.getElementById('breadcrumbBlog')?.addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState({}, '', '/blog');
      this.showList();
    });

    // Article content
    document.getElementById('articleCategory').textContent = this.getCategoryLabel(artigo.categoria);
    document.getElementById('articleDate').textContent = this.formatDate(artigo.data_publicacao);
    document.getElementById('articleDate').setAttribute('datetime', artigo.data_publicacao);
    document.getElementById('articleReadTime').textContent = `${artigo.tempo_leitura} min de leitura`;
    document.getElementById('articleTitle').textContent = artigo.titulo;
    document.getElementById('articleSummary').textContent = artigo.resumo;
    document.getElementById('articleContent').innerHTML = artigo.conteudo;

    // Tags
    document.getElementById('articleTags').innerHTML = artigo.tags
      .map(tag => `<span class="tag">${tag}</span>`)
      .join('');

    // Inject schemas
    document.querySelectorAll('script[data-seo="jsonld"]').forEach(el => el.remove());
    if (artigo.seo.schemas) {
      artigo.seo.schemas.forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', 'jsonld');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

    // Related articles
    this.loadRelated(artigo.id);

    // Scroll to top
    window.scrollTo(0, 0);
  }

  async loadRelated(currentId) {
    try {
      const response = await fetch(`${API_URL}/blog`);
      const data = await response.json();
      const related = (data.artigos || []).filter(a => a.id !== currentId).slice(0, 3);

      const grid = document.getElementById('relatedGrid');
      grid.innerHTML = related.map(artigo => `
        <a href="/blog/${artigo.slug}" class="related-card" data-slug="${artigo.slug}">
          <h4>${artigo.titulo}</h4>
          <p>${artigo.resumo.substring(0, 100)}...</p>
          <span class="related-date">${this.formatDate(artigo.data_publicacao)}</span>
        </a>
      `).join('');

      grid.querySelectorAll('.related-card').forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          const slug = card.dataset.slug;
          history.pushState({}, '', `/blog/${slug}`);
          this.loadArticle(slug);
        });
      });
    } catch (e) {
      // Ignore
    }
  }

  showList() {
    document.getElementById('blogList').style.display = 'block';
    document.getElementById('articleView').style.display = 'none';

    // Reset SEO
    document.title = 'Blog | AgendaAqui Vistorias - Dicas e Guias sobre Vistoria Veicular';
    document.getElementById('pageDescription').content = 'Artigos, guias e dicas sobre vistoria veicular, compra de carros usados, transferência, documentação e mais.';
    document.getElementById('breadcrumbCurrent').textContent = 'Blog';

    if (this.artigos.length === 0) {
      this.loadArticles();
    }

    window.scrollTo(0, 0);
  }

  getCategoryLabel(cat) {
    const labels = { guia: 'Guia', dicas: 'Dicas', regional: 'Regional', novidades: 'Novidades' };
    return labels[cat] || cat || 'Artigo';
  }

  formatDate(dateStr) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }
}

new BlogPage();
