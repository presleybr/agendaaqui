import { scheduleService, getImageUrl } from './services/api.js';
import { ScheduleForm } from './components/ScheduleForm.js';
import ThemeManager from './themeManager.js';

class EmpresaPage {
  constructor() {
    this.empresa = null;
    this.slug = null;
    this.photos = [];
    this.precosVistoria = [];
    this.currentPhotoIndex = 0;
    this.init();
  }

  async init() {
    // Extrair slug da URL
    this.slug = this.getSlugFromURL();

    if (!this.slug) {
      this.showError('Empresa nao encontrada');
      return;
    }

    try {
      await this.loadEmpresa();
      await this.loadPhotos();
      await this.loadPrecosVistoria();
      this.customizePage();
      this.initScheduleForm();
      this.setupEventListeners();
      this.hideLoading();
    } catch (error) {
      console.error('Erro ao carregar pagina:', error);
      this.showError('Erro ao carregar dados da empresa');
    }
  }

  getSlugFromURL() {
    // Prioridade 1: Query string (?empresa=slug)
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get('empresa') || urlParams.get('slug');
    if (querySlug) {
      return querySlug;
    }

    // Prioridade 2: Extrair do pathname
    const path = window.location.pathname;
    let slug = path.replace(/^\//, '').replace(/\.html$/, '');

    if (slug.includes('/')) {
      const segments = slug.split('/').filter(s => s);
      slug = segments[segments.length - 1] || '';
    }

    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      return slug;
    }

    return null;
  }

  async loadEmpresa() {
    const response = await fetch(`${scheduleService.API_URL}/empresas/${this.slug}`);

    if (!response.ok) {
      throw new Error('Empresa nao encontrada');
    }

    this.empresa = await response.json();
    console.log('Empresa carregada:', this.empresa);
  }

  async loadPhotos() {
    try {
      const response = await fetch(`${scheduleService.API_URL}/empresas/${this.empresa.id}/carrossel`);
      if (response.ok) {
        this.photos = await response.json();
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    }
  }

  async loadPrecosVistoria() {
    try {
      const response = await fetch(`${scheduleService.API_URL}/tenant/precos-vistoria?slug=${this.slug}`);
      if (response.ok) {
        const data = await response.json();
        this.precosVistoria = data.precos || [];
        console.log('Precos carregados:', this.precosVistoria);
      }
    } catch (error) {
      console.error('Erro ao carregar precos:', error);
    }
  }

  setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    menuToggle?.addEventListener('click', () => {
      mobileMenu?.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu?.classList.remove('active');
        menuToggle?.classList.remove('active');
      });
    });

    // Header glassmorphism - scroll detection
    const header = document.getElementById('siteHeader');
    if (header) {
      const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 200);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Tab navigation highlighting
    this.setupTabNavigation();

    // Share button
    document.getElementById('shareBtn')?.addEventListener('click', () => this.handleShare());

    // Call button
    document.getElementById('callBtn')?.addEventListener('click', () => {
      if (this.empresa.telefone) {
        window.location.href = `tel:${this.empresa.telefone.replace(/\D/g, '')}`;
      }
    });

    // Photo modal
    this.setupPhotoModal();

    // Mobile CTA - Show scheduling form when clicked
    this.setupMobileCTA();
  }

  setupMobileCTA() {
    const ctaButton = document.getElementById('ctaButton');
    const ctaContent = document.getElementById('ctaContent');
    const ctaFormContainer = document.getElementById('ctaFormContainer');
    const ctaCancelBtn = document.getElementById('ctaCancelBtn');
    const mobileScheduleApp = document.getElementById('mobileScheduleApp');

    // Track if form has been initialized
    this.mobileFormInitialized = false;

    // Click on "Agendar Agora" button - show form
    ctaButton?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Hide CTA content, show form
      if (ctaContent) ctaContent.style.display = 'none';
      if (ctaFormContainer) ctaFormContainer.style.display = 'block';

      // Initialize form if not already done
      if (!this.mobileFormInitialized && mobileScheduleApp && this.empresa) {
        this.mobileScheduleForm = new ScheduleForm(mobileScheduleApp, {
          empresaId: this.empresa.id,
          precosVistoria: this.precosVistoria,
          precos: {
            cautelar: this.empresa.preco_cautelar,
            transferencia: this.empresa.preco_transferencia,
            outros: this.empresa.preco_outros
          }
        });
        this.mobileFormInitialized = true;
      }
    });

    // Click on Cancel button - go back to CTA
    ctaCancelBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Show CTA content, hide form
      if (ctaContent) ctaContent.style.display = 'block';
      if (ctaFormContainer) ctaFormContainer.style.display = 'none';
    });

    // Intercept navigation links to #agendamento on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.querySelectorAll('a[href="#agendamento"]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();

          // Close mobile menu if open
          const mobileMenu = document.getElementById('mobileMenu');
          const menuToggle = document.getElementById('mobileMenuToggle');
          mobileMenu?.classList.remove('active');
          menuToggle?.classList.remove('active');

          // Scroll to the CTA card and show the form
          const mobileCTA = document.getElementById('mobileCTA');
          if (mobileCTA) {
            mobileCTA.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // After scrolling, show the form
            setTimeout(() => {
              if (ctaContent) ctaContent.style.display = 'none';
              if (ctaFormContainer) ctaFormContainer.style.display = 'block';

              // Initialize form if not already done
              if (!this.mobileFormInitialized && mobileScheduleApp && this.empresa) {
                this.mobileScheduleForm = new ScheduleForm(mobileScheduleApp, {
                  empresaId: this.empresa.id,
                  precosVistoria: this.precosVistoria,
                  precos: {
                    cautelar: this.empresa.preco_cautelar,
                    transferencia: this.empresa.preco_transferencia,
                    outros: this.empresa.preco_outros
                  }
                });
                this.mobileFormInitialized = true;
              }
            }, 300);
          }
        });
      });
    }
  }

  setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab-item');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === id);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' });

    ['sobre', 'servicos', 'fotos', 'avaliacoes', 'localizacao', 'agendamento'].forEach(id => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  setupPhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const closeBtn = document.getElementById('modalClose');
    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');

    closeBtn?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    prevBtn?.addEventListener('click', () => {
      this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.photos.length) % this.photos.length;
      modalImage.src = this.photos[this.currentPhotoIndex].imagem_url;
    });

    nextBtn?.addEventListener('click', () => {
      this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
      modalImage.src = this.photos[this.currentPhotoIndex].imagem_url;
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!modal?.classList.contains('active')) return;

      if (e.key === 'Escape') modal.classList.remove('active');
      if (e.key === 'ArrowLeft') prevBtn?.click();
      if (e.key === 'ArrowRight') nextBtn?.click();
    });
  }

  handleShare() {
    const shareData = {
      title: this.empresa.nome,
      text: `Confira ${this.empresa.nome} - Vistorias veiculares`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copiado para a area de transferencia!');
      });
    }
  }

  customizePage() {
    // Title and meta
    document.title = `${this.empresa.nome} | Vistoria Veicular em ${this.empresa.cidade || ''} ${this.empresa.estado || ''}`.trim();
    document.getElementById('pageDescription').content =
      `Agende sua vistoria veicular com ${this.empresa.nome} em ${this.empresa.cidade || ''}, ${this.empresa.estado || ''}. Vistorias cautelares, transferências e laudos. Atendimento rápido e online.`;

    // SEO: Inject dynamic meta tags, Open Graph, canonical, and JSON-LD schema
    this.injectSEOTags();

    // Profile section
    this.renderProfileSection();

    // About section
    this.renderAboutSection();

    // Services section
    this.renderServices();

    // Pricing section
    this.renderPricing();

    // Photos section
    this.renderPhotos();

    // Reviews section
    this.renderReviews();

    // Location section
    this.renderLocation();

    // WhatsApp buttons
    this.setupWhatsApp();

    // Footer
    this.renderFooter();

    // Apply custom colors
    this.applyCustomColors();
  }

  async injectSEOTags() {
    const empresa = this.empresa;
    const slug = this.slug;
    const baseUrl = 'https://agendaaquivistorias.com.br';
    const pageUrl = `${baseUrl}/${slug}`;
    const cidade = empresa.cidade || '';
    const estado = empresa.estado || '';
    const descricao = empresa.meta_description ||
      `Agende sua vistoria veicular com ${empresa.nome} em ${cidade}, ${estado}. Vistorias cautelares, transferências e laudos. Atendimento rápido e online.`;
    const logoUrl = empresa.logo_url
      ? (empresa.logo_url.startsWith('http') ? empresa.logo_url : `${baseUrl}${empresa.logo_url}`)
      : `${baseUrl}/logo-dark.png`;

    // --- Canonical ---
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    // --- Keywords ---
    this.setMetaTag('name', 'keywords', `vistoria veicular ${cidade}, vistoria ${estado}, cautelar ${cidade}, ${empresa.nome}, laudo veicular ${cidade}, transferência veicular ${cidade}`);

    // --- Open Graph ---
    const ogTags = {
      'og:title': `${empresa.nome} | Vistoria Veicular em ${cidade} ${estado}`,
      'og:description': descricao,
      'og:url': pageUrl,
      'og:type': 'business.business',
      'og:locale': 'pt_BR',
      'og:site_name': 'AgendaAqui Vistorias',
      'og:image': logoUrl
    };
    for (const [property, content] of Object.entries(ogTags)) {
      this.setMetaTag('property', property, content);
    }

    // --- Twitter Cards ---
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': `${empresa.nome} | Vistoria Veicular em ${cidade} ${estado}`,
      'twitter:description': descricao,
      'twitter:image': logoUrl
    };
    for (const [name, content] of Object.entries(twitterTags)) {
      this.setMetaTag('name', name, content);
    }

    // --- Preconnect to API for performance ---
    if (!document.querySelector('link[rel="preconnect"][href*="onrender"]')) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = scheduleService.API_URL.replace('/api', '');
      document.head.appendChild(preconnect);
    }

    // --- Try to load rich SEO data from backend (includes Breadcrumb + FAQ schemas) ---
    try {
      const response = await fetch(`${scheduleService.API_URL}/seo/empresa/${slug}`);
      if (response.ok) {
        const seoData = await response.json();
        if (seoData.schemas) {
          document.querySelectorAll('script[data-seo="jsonld"]').forEach(el => el.remove());
          seoData.schemas.forEach(schema => {
            const scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            scriptTag.setAttribute('data-seo', 'jsonld');
            scriptTag.textContent = JSON.stringify(schema);
            document.head.appendChild(scriptTag);
          });
          return;
        }
      }
    } catch (e) {
      // Fallback to client-side schemas
    }

    // --- Fallback: generate schemas client-side ---
    const endereco = [empresa.endereco, empresa.numero].filter(Boolean).join(', ');
    const cidadeSlug = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

    const schemas = [
      // LocalBusiness / AutoRepair
      {
        '@context': 'https://schema.org', '@type': 'AutoRepair',
        name: empresa.nome, description: descricao, url: pageUrl,
        telephone: empresa.telefone || empresa.whatsapp || '', priceRange: '$$',
        image: logoUrl,
        address: { '@type': 'PostalAddress', streetAddress: endereco, addressLocality: cidade, addressRegion: estado, postalCode: empresa.cep || '', addressCountry: 'BR' },
        ...(empresa.latitude && empresa.longitude ? { geo: { '@type': 'GeoCoordinates', latitude: empresa.latitude, longitude: empresa.longitude } } : {}),
        ...(empresa.horario_funcionamento ? { openingHours: empresa.horario_funcionamento } : {}),
        ...(empresa.google_rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: parseFloat(empresa.google_rating) || 5.0, reviewCount: parseInt(empresa.google_reviews_count) || 1, bestRating: 5 } } : {}),
        ...([empresa.facebook_url, empresa.instagram_url, empresa.site_url].filter(Boolean).length > 0 ? { sameAs: [empresa.facebook_url, empresa.instagram_url, empresa.site_url].filter(Boolean) } : {})
      },
      // Breadcrumb
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: `Vistorias em ${cidade}, ${estado}`, item: `${baseUrl}/vistorias/${cidadeSlug}-${estado.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: empresa.nome, item: pageUrl }
        ]
      },
      // FAQ
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `Quanto custa uma vistoria veicular na ${empresa.nome}?`, acceptedAnswer: { '@type': 'Answer', text: `Os preços variam conforme o serviço. Vistoria cautelar a partir de R$ ${((empresa.preco_cautelar || 15000) / 100).toFixed(2).replace('.', ',')}. Agende online para conferir.` } },
          { '@type': 'Question', name: `Onde fica a ${empresa.nome}?`, acceptedAnswer: { '@type': 'Answer', text: `Localizada em ${endereco ? endereco + ', ' : ''}${cidade}, ${estado}.` } },
          { '@type': 'Question', name: `Como agendar vistoria na ${empresa.nome}?`, acceptedAnswer: { '@type': 'Answer', text: `Agende online pelo site. Escolha serviço, data e horário, e pague via PIX ou cartão.` } }
        ]
      }
    ];

    document.querySelectorAll('script[data-seo="jsonld"]').forEach(el => el.remove());
    schemas.forEach(s => {
      const scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.setAttribute('data-seo', 'jsonld');
      scriptTag.textContent = JSON.stringify(s);
      document.head.appendChild(scriptTag);
    });
  }

  setMetaTag(attr, key, content) {
    let tag = document.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.content = content;
  }

  renderProfileSection() {
    // Profile picture
    const profilePicture = document.getElementById('profilePicture');
    const profileImage = document.getElementById('profileImage');
    const profileInitial = document.getElementById('profileInitial');

    const fotoPerfil = this.empresa.foto_perfil_url || this.empresa.logo_url;
    if (fotoPerfil) {
      const logoUrl = getImageUrl(fotoPerfil);
      console.log('Foto perfil URL:', logoUrl?.substring(0, 80));
      // Mostra direto (mesmo padrao do /painel) — se a imagem falhar, onerror reverte.
      profileImage.src = logoUrl;
      profileImage.style.display = 'block';
      profilePicture.classList.remove('no-image');
      profileImage.onerror = () => {
        console.error('Erro ao carregar foto de perfil');
        profileImage.style.display = 'none';
        profilePicture.classList.add('no-image');
      };
    } else {
      profileImage.style.display = 'none';
      profilePicture.classList.add('no-image');
    }
    profileInitial.textContent = this.empresa.nome?.charAt(0).toUpperCase() || 'V';

    // Cover photo
    const coverImage = document.getElementById('coverImage');
    if (this.empresa.foto_capa_url) {
      const capaUrl = getImageUrl(this.empresa.foto_capa_url);
      console.log('Capa URL:', capaUrl);
      coverImage.onload = () => {
        coverImage.style.display = 'block';
      };
      coverImage.onerror = () => {
        console.error('Erro ao carregar capa:', capaUrl);
        coverImage.style.display = 'none';
      };
      coverImage.src = capaUrl;
    }

    // Name and location
    document.getElementById('empresaNome').textContent = this.empresa.nome;
    document.getElementById('cidadeEstado').textContent =
      [this.empresa.cidade, this.empresa.estado].filter(Boolean).join(', ') || 'Brasil';

    // Rating
    const rating = parseFloat(this.empresa.google_rating) || 5.0;
    const reviewCount = parseInt(this.empresa.google_reviews_count) || 0;

    document.getElementById('ratingValue').textContent = rating.toFixed(1);
    document.getElementById('reviewCount').textContent = reviewCount;
    document.getElementById('ratingBig').textContent = rating.toFixed(1);
    document.getElementById('totalReviews').textContent = reviewCount;

    // Update stars based on rating
    this.updateStars('.profile-rating .rating-stars', rating);
    this.updateStars('.rating-stars-big', rating);
  }

  updateStars(selector, rating) {
    const container = document.querySelector(selector);
    if (!container) return;

    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
      star.classList.toggle('filled', index < Math.round(rating));
    });
  }

  renderAboutSection() {
    // Description
    document.getElementById('empresaDescricao').textContent =
      this.empresa.descricao || 'Empresa de vistoria veicular especializada em laudos cautelares, transferencias e demais servicos.';

    // Address
    const endereco = [
      this.empresa.endereco,
      this.empresa.numero,
      this.empresa.bairro,
      this.empresa.cidade,
      this.empresa.estado
    ].filter(Boolean).join(', ');

    document.getElementById('empresaEndereco').textContent = endereco || 'Endereco nao informado';

    // Phone
    const telefoneEl = document.getElementById('empresaTelefone');
    const telefoneNum = this.empresa.whatsapp || this.empresa.telefone || '';
    if (telefoneEl && telefoneNum) {
      const numLimpo = telefoneNum.replace(/\D/g, '');
      const numWhatsapp = numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`;
      telefoneEl.innerHTML = `<a href="https://wa.me/${numWhatsapp}" target="_blank" style="color: inherit; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">${telefoneNum} <svg viewBox="0 0 24 24" fill="#25D366" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.522 5.857L.057 23.64l5.932-1.56A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.998 0-3.87-.557-5.47-1.522l-.392-.232-3.516.925.938-3.437-.254-.404A9.786 9.786 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/></svg></a>`;
    } else if (telefoneEl) {
      telefoneEl.textContent = 'Nao informado';
    }

    // Hours
    const horarioEl = document.getElementById('empresaHorario');
    if (horarioEl) {
      horarioEl.innerHTML = this.formatHorario(this.empresa.horario_funcionamento);
    }

    // Email
    document.getElementById('empresaEmail').textContent =
      this.empresa.email || 'contato@empresa.com';

    // Social links
    this.renderSocialLinks();
  }

  formatHorario(value) {
    if (!value) return 'Segunda a Sexta: 8h - 18h';
    // Tentar parse JSON
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(h => {
          if (h.inicio && h.fim) {
            const inicio = h.inicio.replace(':', 'h');
            const fim = h.fim.replace(':', 'h');
            return `<div>${h.dias}: ${inicio} às ${fim}</div>`;
          }
          return `<div>${h.dias}</div>`;
        }).join('');
      }
    } catch (e) { /* nao e JSON, usar como texto */ }
    return value;
  }

  renderSocialLinks() {
    const socialContainer = document.getElementById('socialLinks');
    let hasLinks = false;

    if (this.empresa.facebook_url) {
      document.getElementById('linkFacebook').href = this.empresa.facebook_url;
      hasLinks = true;
    } else {
      document.getElementById('linkFacebook')?.remove();
    }

    if (this.empresa.instagram_url) {
      document.getElementById('linkInstagram').href = this.empresa.instagram_url;
      hasLinks = true;
    } else {
      document.getElementById('linkInstagram')?.remove();
    }

    if (this.empresa.site_url) {
      document.getElementById('linkSite').href = this.empresa.site_url;
      hasLinks = true;
    } else {
      document.getElementById('linkSite')?.remove();
    }

    if (hasLinks && socialContainer) {
      socialContainer.style.display = 'flex';
    }
  }

  renderServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;

    // Usar precos dinamicos do painel como lista de servicos
    if (this.precosVistoria && this.precosVistoria.length > 0) {
      const precosAtivos = this.precosVistoria.filter(p => p.ativo !== false);

      // Icone padrao para servicos
      const defaultIcon = 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';

      servicesGrid.innerHTML = precosAtivos.map(item => `
        <div class="service-item">
          <div class="service-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="${defaultIcon}"/>
            </svg>
          </div>
          <span class="service-name">${item.nome_exibicao}</span>
        </div>
      `).join('');
    } else {
      // Fallback caso nao tenha precos configurados
      const services = [
        { name: 'Vistoria Cautelar', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Laudo para Transferencia', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Vistoria para Seguro', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
      ];

      servicesGrid.innerHTML = services.map(service => `
        <div class="service-item">
          <div class="service-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="${service.icon}"/>
            </svg>
          </div>
          <span class="service-name">${service.name}</span>
        </div>
      `).join('');
    }
  }

  renderPricing() {
    const pricingGrid = document.getElementById('pricingGrid');
    if (!pricingGrid) return;

    const formatPrice = (valor) => {
      return (valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Usar precos dinamicos se disponiveis
    if (this.precosVistoria && this.precosVistoria.length > 0) {
      const precosAtivos = this.precosVistoria.filter(p => p.ativo !== false);

      pricingGrid.innerHTML = precosAtivos.map((item, index) => {
        const isSobConsulta = item.preco === 0;
        const whatsapp = this.empresa?.whatsapp || this.empresa?.whatsapp_numero || this.empresa?.telefone || '';
        const whatsappLink = whatsapp ? `https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Ola! Gostaria de saber o valor da ${item.nome_exibicao}.`)}` : '#agendamento';

        return `
          <div class="pricing-card ${index === 0 ? 'featured' : ''}">
            <h4>${item.nome_exibicao}</h4>
            ${isSobConsulta
              ? `<div class="price" style="font-size: 1.2rem; color: var(--text-secondary);">Sob Consulta</div>`
              : `<div class="price">R$ ${formatPrice(item.preco)}</div>`
            }
            <p style="color: var(--text-secondary); margin-bottom: 16px;">${item.descricao || ''}</p>
            ${isSobConsulta
              ? `<a href="${whatsappLink}" target="_blank" class="btn ${index === 0 ? 'btn-primary' : 'btn-secondary'}" style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.522 5.857L.057 23.64l5.932-1.56A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.998 0-3.87-.557-5.47-1.522l-.392-.232-3.516.925.938-3.437-.254-.404A9.786 9.786 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/></svg>
                  Sob Consulta
                </a>`
              : `<a href="#agendamento" class="btn ${index === 0 ? 'btn-primary' : 'btn-secondary'}" data-categoria="${item.categoria}">
                  Agendar
                </a>`
            }
          </div>
        `;
      }).join('');

      // Add click handlers para precos dinamicos
      pricingGrid.querySelectorAll('[data-categoria]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          sessionStorage.setItem('selectedCategoria', btn.dataset.categoria);
        });
      });
    } else {
      // Fallback para precos antigos se nao houver precos dinamicos
      const precos = [
        {
          tipo: 'Vistoria Cautelar',
          preco: this.empresa.preco_cautelar || 15000,
          descricao: 'Laudo completo para compra segura',
          featured: true,
          items: ['Analise de chassi e motor', 'Verificacao de sinistros', 'Laudo fotografico', 'Validade juridica']
        },
        {
          tipo: 'Transferencia',
          preco: this.empresa.preco_transferencia || 12000,
          descricao: 'Vistoria para transferencia',
          featured: false,
          items: ['Laudo tecnico', 'Reconhecido DETRAN', 'Processo rapido', 'Documentacao completa']
        },
        {
          tipo: 'Outros Servicos',
          preco: this.empresa.preco_outros || 10000,
          descricao: 'Demais tipos de vistoria',
          featured: false,
          items: ['2a via CRV', 'Licenciamento', 'Alienacao', 'Pre cautelar']
        }
      ];

      pricingGrid.innerHTML = precos.map((item, index) => `
        <div class="pricing-card ${item.featured ? 'featured' : ''}">
          <h4>${item.tipo}</h4>
          <div class="price">R$ ${formatPrice(item.preco)}</div>
          <p style="color: var(--text-secondary); margin-bottom: 16px;">${item.descricao}</p>
          <ul>
            ${item.items.map(i => `<li>${i}</li>`).join('')}
          </ul>
          <a href="#agendamento" class="btn ${item.featured ? 'btn-primary' : 'btn-secondary'}" data-service="${index === 0 ? 'cautelar' : index === 1 ? 'transferencia' : 'outros'}">
            Agendar
          </a>
        </div>
      `).join('');

      // Add click handlers
      pricingGrid.querySelectorAll('[data-service]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          sessionStorage.setItem('selectedService', btn.dataset.service);
        });
      });
    }
  }

  renderPhotos() {
    const photosGrid = document.getElementById('photosGrid');
    if (!photosGrid) return;

    if (this.photos.length === 0) {
      // Keep placeholder
      return;
    }

    photosGrid.innerHTML = this.photos.map((photo, index) => `
      <div class="photo-item" data-index="${index}">
        <img src="${photo.imagem_url}" alt="Foto ${index + 1}" loading="lazy">
      </div>
    `).join('');

    // Add click handlers for modal
    photosGrid.querySelectorAll('.photo-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentPhotoIndex = parseInt(item.dataset.index);
        document.getElementById('modalImage').src = this.photos[this.currentPhotoIndex].imagem_url;
        document.getElementById('photoModal').classList.add('active');
      });
    });
  }

  renderReviews() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;

    // Simulated reviews (in production, these would come from Google API)
    const reviews = [
      { name: 'Maria Silva', rating: 5, text: 'Excelente atendimento! Servico rapido e profissional. Recomendo muito!', date: 'Ha 2 semanas' },
      { name: 'Joao Santos', rating: 5, text: 'Muito satisfeito com o laudo. Equipe atenciosa e preco justo.', date: 'Ha 1 mes' },
      { name: 'Ana Costa', rating: 5, text: 'Melhor vistoria da regiao. Ambiente limpo e organizado.', date: 'Ha 1 mes' }
    ];

    reviewsList.innerHTML = reviews.map(review => `
      <div class="review-item">
        <div class="review-header">
          <div class="review-avatar">${review.name.charAt(0)}</div>
          <div class="review-author">
            <h4>${review.name}</h4>
            <span class="review-date">${review.date}</span>
          </div>
          <div class="review-rating">
            ${Array(5).fill(0).map((_, i) => `<span class="star ${i < review.rating ? 'filled' : ''}">&#9733;</span>`).join('')}
          </div>
        </div>
        <p class="review-text">${review.text}</p>
      </div>
    `).join('');
  }

  renderLocation() {
    const endereco = [
      this.empresa.endereco,
      this.empresa.numero,
      this.empresa.bairro,
      this.empresa.cidade,
      this.empresa.estado
    ].filter(Boolean).join(', ');

    // Location info
    document.getElementById('locEndereco').textContent = endereco || 'Endereco nao informado';

    // Directions link
    const directionsLink = document.getElementById('locDirections');
    if (directionsLink && endereco) {
      directionsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    }

    // Map
    const mapContainer = document.getElementById('empresaMapa');
    if (mapContainer && endereco) {
      const encodedAddress = encodeURIComponent(endereco);
      mapContainer.innerHTML = `
        <iframe
          src="https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Localizacao ${this.empresa.nome}"
        ></iframe>
      `;
    }
  }

  setupWhatsApp() {
    if (!this.empresa.whatsapp) return;

    const whatsappNumber = this.empresa.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${whatsappNumber}`;

    // Float button
    const floatBtn = document.getElementById('whatsappFloat');
    if (floatBtn) {
      floatBtn.href = whatsappUrl;
      floatBtn.style.display = 'flex';
    }

    // Action buttons
    ['whatsappBtn', 'whatsappBtnMobile'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.href = whatsappUrl;
    });
  }

  renderFooter() {
    document.getElementById('footerNome').textContent = this.empresa.nome;
    document.getElementById('footerDescricao').textContent =
      this.empresa.descricao?.substring(0, 100) + '...' || 'Sua empresa de confianca em vistorias veiculares';

    const footerTelEl = document.getElementById('footerTelefone');
    const footerNum = this.empresa.whatsapp || this.empresa.telefone || '';
    if (footerTelEl && footerNum) {
      const numLimpo = footerNum.replace(/\D/g, '');
      const numWa = numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`;
      footerTelEl.innerHTML = `<a href="https://wa.me/${numWa}" target="_blank" style="color: inherit; text-decoration: none;">${footerNum}</a>`;
    } else if (footerTelEl) {
      footerTelEl.textContent = '-';
    }
    document.getElementById('footerEmail').textContent =
      this.empresa.email || '-';

    const footerHorarioEl = document.getElementById('footerHorario');
    if (footerHorarioEl) {
      footerHorarioEl.innerHTML = this.formatHorario(this.empresa.horario_funcionamento);
    }

    const endereco = [this.empresa.cidade, this.empresa.estado].filter(Boolean).join(', ');
    document.getElementById('footerEndereco').textContent = endereco || '-';

    document.getElementById('footerCopyright').textContent =
      `© ${new Date().getFullYear()} ${this.empresa.nome}. Todos os direitos reservados.`;
  }

  applyCustomColors() {
    const corPrimaria = this.empresa.cor_primaria || '#16a34a';
    const corSecundaria = this.empresa.cor_secundaria || '#15803d';

    const styles = `
      :root {
        --brand-primary: ${corPrimaria};
        --brand-secondary: ${corSecundaria};
      }

      .action-primary,
      .btn-primary,
      .directions-btn {
        background: ${corPrimaria};
      }

      .action-primary:hover,
      .btn-primary:hover,
      .directions-btn:hover {
        background: ${corSecundaria};
      }

      .tab-item.active {
        color: ${corPrimaria};
        border-bottom-color: ${corPrimaria};
      }

      .service-icon {
        background: ${corPrimaria};
      }

      .pricing-card.featured {
        border-color: ${corPrimaria};
      }

      .scheduling-card {
        background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%);
      }

      .social-link:hover {
        background: ${corPrimaria};
      }

      .mobile-nav-cta {
        background: ${corPrimaria} !important;
      }

      .mobile-nav-cta:hover {
        background: ${corSecundaria} !important;
      }

      .mobile-cta-agendamento {
        background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%) !important;
        box-shadow: 0 4px 16px ${corPrimaria}4d !important;
      }

      .cover-photo {
        background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%);
      }

      .profile-picture {
        background: ${corPrimaria};
      }

      .pricing-card:hover {
        border-color: ${corPrimaria} !important;
        background: linear-gradient(135deg, ${corPrimaria}08 0%, ${corPrimaria}14) !important;
        box-shadow: 0 8px 24px ${corPrimaria}26 !important;
      }

      .pricing-card.featured {
        box-shadow: 0 4px 12px ${corPrimaria}26 !important;
      }

      .spinner {
        border-top-color: ${corPrimaria};
      }
    `;

    document.getElementById('dynamicStyles').textContent = styles;
  }

  initScheduleForm() {
    const scheduleApp = document.getElementById('scheduleApp');

    if (scheduleApp) {
      const scheduleForm = new ScheduleForm(scheduleApp, {
        empresaId: this.empresa.id,
        precosVistoria: this.precosVistoria,
        precos: {
          cautelar: this.empresa.preco_cautelar,
          transferencia: this.empresa.preco_transferencia,
          outros: this.empresa.preco_outros
        }
      });
    }
  }

  hideLoading() {
    const loading = document.getElementById('pageLoading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  showError(message) {
    const loading = document.getElementById('pageLoading');
    if (loading) {
      loading.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2 style="color: #ef4444; margin-bottom: 16px;">Empresa nao encontrada</h2>
          <p style="color: #666; margin-bottom: 24px;">${message}</p>
          <a href="/" style="display: inline-block; padding: 12px 24px; background: var(--brand-primary, #16a34a); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Voltar para Home</a>
        </div>
      `;
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new EmpresaPage();
});
