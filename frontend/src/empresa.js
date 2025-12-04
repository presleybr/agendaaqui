import { scheduleService, getImageUrl } from './services/api.js';
import { ScheduleForm } from './components/ScheduleForm.js';

class EmpresaPage {
  constructor() {
    this.empresa = null;
    this.slug = null;
    this.photos = [];
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
    const mobileCTA = document.getElementById('mobileCTA');
    const schedulingCard = document.getElementById('agendamento');

    mobileCTA?.addEventListener('click', (e) => {
      e.preventDefault();

      // Show the scheduling form on mobile
      if (schedulingCard) {
        schedulingCard.style.display = 'block';
        schedulingCard.style.setProperty('display', 'block', 'important');

        // Scroll to the scheduling section
        schedulingCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Hide the CTA after clicking
        mobileCTA.style.display = 'none';
      }
    });
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
    document.title = `${this.empresa.nome} - Vistoria Veicular`;
    document.getElementById('pageDescription').content = this.empresa.descricao || `Agende sua vistoria com ${this.empresa.nome}`;

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

  renderProfileSection() {
    // Profile picture
    const profilePicture = document.getElementById('profilePicture');
    const profileImage = document.getElementById('profileImage');
    const profileInitial = document.getElementById('profileInitial');

    if (this.empresa.logo_url) {
      const logoUrl = getImageUrl(this.empresa.logo_url);
      console.log('Logo URL:', logoUrl);
      profileImage.onload = () => {
        profilePicture.classList.remove('no-image');
        profileImage.style.display = 'block';
      };
      profileImage.onerror = () => {
        console.error('Erro ao carregar logo:', logoUrl);
        profilePicture.classList.add('no-image');
      };
      profileImage.src = logoUrl;
    } else {
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
    document.getElementById('empresaTelefone').textContent =
      this.empresa.telefone || this.empresa.whatsapp || 'Nao informado';

    // Hours
    document.getElementById('empresaHorario').textContent =
      this.empresa.horario_funcionamento || 'Segunda a Sexta: 8h - 18h';

    // Email
    document.getElementById('empresaEmail').textContent =
      this.empresa.email || 'contato@empresa.com';

    // Social links
    this.renderSocialLinks();
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

    const services = [
      { name: 'Vistoria Cautelar', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { name: 'Laudo para Transferencia', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { name: 'Laudo para 2a Via CRV', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
      { name: 'Laudo para Licenciamento', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { name: 'Alienacao/Desalienacao', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
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

  renderPricing() {
    const pricingGrid = document.getElementById('pricingGrid');
    if (!pricingGrid) return;

    const formatPrice = (valor) => {
      return (valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

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

    document.getElementById('footerTelefone').textContent =
      this.empresa.telefone || this.empresa.whatsapp || '-';
    document.getElementById('footerEmail').textContent =
      this.empresa.email || '-';

    document.getElementById('footerHorario').textContent =
      this.empresa.horario_funcionamento || 'Segunda a Sexta: 8h - 18h';

    const endereco = [this.empresa.cidade, this.empresa.estado].filter(Boolean).join(', ');
    document.getElementById('footerEndereco').textContent = endereco || '-';

    document.getElementById('footerCopyright').textContent =
      `© ${new Date().getFullYear()} ${this.empresa.nome}. Todos os direitos reservados.`;
  }

  applyCustomColors() {
    const corPrimaria = this.empresa.cor_primaria || '#1877f2';
    const corSecundaria = this.empresa.cor_secundaria || '#166fe5';

    const styles = `
      :root {
        --brand-primary: ${corPrimaria};
        --brand-secondary: ${corSecundaria};
      }

      .profile-header {
        background: ${corPrimaria};
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
    `;

    document.getElementById('dynamicStyles').textContent = styles;
  }

  initScheduleForm() {
    const scheduleApp = document.getElementById('scheduleApp');

    if (scheduleApp) {
      const scheduleForm = new ScheduleForm(scheduleApp, {
        empresaId: this.empresa.id,
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
          <a href="/" style="display: inline-block; padding: 12px 24px; background: #1877f2; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Voltar para Home</a>
        </div>
      `;
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new EmpresaPage();
});
