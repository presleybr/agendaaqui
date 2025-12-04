import { scheduleService } from './services/api.js';
import { ScheduleForm } from './components/ScheduleForm.js';

class EmpresaPage {
  constructor() {
    this.empresa = null;
    this.slug = null;
    this.init();
  }

  async init() {
    // Extrair slug da URL
    this.slug = this.getSlugFromURL();

    if (!this.slug) {
      this.showError('Empresa não encontrada');
      return;
    }

    try {
      await this.loadEmpresa();
      await this.loadCarrossel();
      this.customizePage();
      this.initScheduleForm();
      this.hideLoading();
    } catch (error) {
      console.error('Erro ao carregar página:', error);
      this.showError('Erro ao carregar dados da empresa');
    }
  }

  getSlugFromURL() {
    // Prioridade 1: Query string (?empresa=slug) - útil para desenvolvimento
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get('empresa') || urlParams.get('slug');
    if (querySlug) {
      return querySlug;
    }

    // Prioridade 2: Extrair do pathname
    // Exemplos: /vistoriapremium -> vistoriapremium
    //           /vistoria-express -> vistoria-express
    const path = window.location.pathname;

    // Remove a barra inicial e qualquer .html no final
    let slug = path.replace(/^\//, '').replace(/\.html$/, '');

    // Se ainda tiver barras (ex: /empresa/slug), pega o último segmento
    if (slug.includes('/')) {
      const segments = slug.split('/').filter(s => s);
      slug = segments[segments.length - 1] || '';
    }

    // Validar que é um slug válido (apenas letras minúsculas, números e hífens)
    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      return slug;
    }

    return null;
  }

  async loadEmpresa() {
    const response = await fetch(`${scheduleService.API_URL}/empresas/${this.slug}`);

    if (!response.ok) {
      throw new Error('Empresa não encontrada');
    }

    this.empresa = await response.json();
    console.log('Empresa carregada:', this.empresa);
  }

  async loadCarrossel() {
    try {
      const response = await fetch(`${scheduleService.API_URL}/empresas/${this.empresa.id}/carrossel`);

      if (response.ok) {
        const imagens = await response.json();
        this.renderCarrossel(imagens);
      }
    } catch (error) {
      console.error('Erro ao carregar carrossel:', error);
    }
  }

  customizePage() {
    // Título e meta
    document.title = `${this.empresa.nome} - Agendamento de Vistorias`;
    document.getElementById('pageDescription').content = this.empresa.descricao || `Agende sua vistoria com ${this.empresa.nome}`;

    // Header
    document.getElementById('empresaNome').textContent = this.empresa.nome;

    if (this.empresa.logo_url) {
      const logoContainer = document.getElementById('empresaLogo');
      logoContainer.innerHTML = `<img src="${this.empresa.logo_url}" alt="${this.empresa.nome}" style="height: 50px;">`;
    }

    // Hero - usar foto da empresa ou foto padrão
    const heroSection = document.getElementById('hero');
    const backgroundUrl = this.empresa.foto_capa_url || '/bgnew.png';
    heroSection.style.backgroundImage = `url('${backgroundUrl}')`;
    heroSection.style.backgroundSize = 'cover';
    heroSection.style.backgroundPosition = 'center';
    heroSection.style.backgroundAttachment = 'fixed';

    document.getElementById('heroTitle').textContent = `Agende Sua Vistoria com ${this.empresa.nome}`;
    document.getElementById('heroSubtitle').textContent = this.empresa.descricao || 'Rápido, fácil e com o melhor preço.';

    // Sobre
    if (this.empresa.descricao) {
      document.getElementById('sobre').style.display = 'block';
      document.getElementById('sobreDescricao').innerHTML = this.empresa.descricao.replace(/\n/g, '<br>');
    }

    // Endereço e contato
    if (this.empresa.endereco) {
      document.getElementById('empresaEndereco').textContent =
        `${this.empresa.endereco}, ${this.empresa.cidade} - ${this.empresa.estado}`;
    }

    if (this.empresa.telefone) {
      document.getElementById('empresaTelefone').textContent = this.empresa.telefone;
    }

    if (this.empresa.email) {
      document.getElementById('empresaEmail').textContent = this.empresa.email;
    }

    if (this.empresa.horario_funcionamento) {
      document.getElementById('empresaHorario').textContent = this.empresa.horario_funcionamento;
    }

    // Redes sociais
    this.renderSocialLinks();

    // Preços
    this.renderPricing();

    // WhatsApp
    if (this.empresa.whatsapp) {
      const whatsappBtn = document.getElementById('whatsappFloat');
      whatsappBtn.href = `https://wa.me/55${this.empresa.whatsapp.replace(/\D/g, '')}`;
      whatsappBtn.style.display = 'flex';
    }

    // Footer
    document.getElementById('footerNome').textContent = this.empresa.nome;
    document.getElementById('footerDescricao').textContent = this.empresa.descricao || 'Seu parceiro de confiança em vistorias veiculares';

    const footerContato = document.getElementById('footerContato');
    footerContato.innerHTML = `
      <h4>Contato</h4>
      ${this.empresa.telefone ? `<p>📱 ${this.empresa.telefone}</p>` : ''}
      ${this.empresa.email ? `<p>📧 ${this.empresa.email}</p>` : ''}
    `;

    const footerHorario = document.getElementById('footerHorario');
    if (this.empresa.horario_funcionamento) {
      footerHorario.innerHTML = `
        <h4>Horário de Atendimento</h4>
        <p>${this.empresa.horario_funcionamento}</p>
      `;
    }

    document.getElementById('footerCopyright').textContent =
      `© ${new Date().getFullYear()} ${this.empresa.nome}. Todos os direitos reservados.`;

    // Aplicar cores personalizadas
    this.applyCustomColors();
  }

  applyCustomColors() {
    const corPrimaria = this.empresa.cor_primaria || '#2563eb';
    const corSecundaria = this.empresa.cor_secundaria || '#1e40af';

    const styles = `
      :root {
        --brand-primary: ${corPrimaria};
        --brand-secondary: ${corSecundaria};
      }

      .btn-primary {
        background-color: ${corPrimaria};
        border-color: ${corPrimaria};
      }

      .btn-primary:hover {
        background-color: ${corSecundaria};
        border-color: ${corSecundaria};
      }

      .nav-link:hover,
      .nav-item.active {
        color: ${corPrimaria};
      }

      .menu-card-blue {
        background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%);
      }
    `;

    document.getElementById('dynamicStyles').textContent = styles;
  }

  renderSocialLinks() {
    const socialContainer = document.getElementById('empresaSocial');
    const links = [];

    if (this.empresa.facebook_url) {
      links.push(`
        <a href="${this.empresa.facebook_url}" class="social-icon" target="_blank" aria-label="Facebook">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
        </a>
      `);
    }

    if (this.empresa.whatsapp) {
      const whatsappNumber = this.empresa.whatsapp.replace(/\D/g, '');
      links.push(`
        <a href="https://wa.me/55${whatsappNumber}" class="social-icon" target="_blank" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      `);
    }

    if (this.empresa.instagram_url) {
      links.push(`
        <a href="${this.empresa.instagram_url}" class="social-icon" target="_blank" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
      `);
    }

    if (links.length > 0) {
      socialContainer.innerHTML = links.join('');
      socialContainer.style.display = 'flex';
    }
  }

  renderPricing() {
    const pricingGrid = document.getElementById('pricingGrid');

    // Formatar preço em reais (valores estão em centavos)
    const formatPrice = (valor) => {
      return (valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const precos = [
      {
        tipo: 'Vistoria Cautelar',
        preco: this.empresa.preco_cautelar || 15000,
        descricao: 'Laudo completo de vistoria cautelar',
        featured: true,
        items: ['Laudo completo', 'Validade jurídica', 'Proteção contra multas', 'Atendimento rápido']
      },
      {
        tipo: 'Transferência',
        preco: this.empresa.preco_transferencia || 12000,
        descricao: 'Vistoria para transferência de veículo',
        featured: false,
        items: ['Laudo técnico', 'Documentação completa', 'Reconhecido DETRAN', 'Processo rápido']
      },
      {
        tipo: 'Outros Serviços',
        preco: this.empresa.preco_outros || 10000,
        descricao: 'Consulte outros tipos de vistoria',
        featured: false,
        items: ['Pré Cautelar', 'Vistoria periódica', 'Laudo para seguro', 'Outros laudos']
      }
    ];

    pricingGrid.innerHTML = precos.map((item, index) => `
      <div class="pricing-card ${item.featured ? 'featured' : ''} stagger-item" style="background: #ffffff; border-radius: 16px; padding: 2rem; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); ${item.featured ? 'border: 2px solid var(--brand-primary);' : ''}">
        ${item.featured ? '<div class="discount-badge" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #78350f; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 12px;">Mais Popular</div>' : ''}
        <h3 style="color: #1a1a1a; font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">${item.tipo}</h3>
        <div class="price" style="color: var(--brand-primary); font-size: 2.5rem; font-weight: 700; margin: 1rem 0;">R$ ${formatPrice(item.preco)}</div>
        <div class="price-detail" style="color: #666666; margin-bottom: 1rem; font-size: 0.95rem;">${item.descricao}</div>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0; color: #333333;">
          ${item.items.map(i => `<li style="padding: 8px 0; color: #333333;">✓ ${i}</li>`).join('')}
        </ul>
        <a href="#agendamento" class="btn ${item.featured ? 'btn-primary' : 'btn-secondary'} btn-select-service" data-service="${index === 0 ? 'cautelar' : index === 1 ? 'transferencia' : 'outros'}" style="width: 100%; display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; ${item.featured ? 'background: var(--brand-primary); color: white; border: none;' : 'background: white; color: #333; border: 1px solid #ddd;'}">Agendar</a>
      </div>
    `).join('');

    // Adicionar event listeners aos botões
    setTimeout(() => {
      pricingGrid.querySelectorAll('.btn-select-service').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const serviceType = btn.dataset.service;
          sessionStorage.setItem('selectedService', serviceType);

          const agendamentoSection = document.getElementById('agendamento');
          if (agendamentoSection) {
            agendamentoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }, 100);
  }

  renderCarrossel(imagens) {
    if (!imagens || imagens.length === 0) return;

    const galeriaSection = document.getElementById('galeria');
    galeriaSection.style.display = 'block';

    const carrosselContainer = document.getElementById('empresaCarrossel');
    carrosselContainer.innerHTML = `
      <div class="carousel-track">
        ${imagens.map(img => `
          <div class="carousel-item">
            <img src="${img.imagem_url}" alt="Foto ${img.ordem + 1}">
          </div>
        `).join('')}
      </div>
      <button class="carousel-btn carousel-prev">‹</button>
      <button class="carousel-btn carousel-next">›</button>
    `;

    this.initCarousel();
  }

  initCarousel() {
    const track = document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    if (!track) return;

    let currentIndex = 0;
    const items = track.querySelectorAll('.carousel-item');
    const itemCount = items.length;

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    prevBtn?.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + itemCount) % itemCount;
      updateCarousel();
    });

    nextBtn?.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % itemCount;
      updateCarousel();
    });

    // Auto-play
    setInterval(() => {
      currentIndex = (currentIndex + 1) % itemCount;
      updateCarousel();
    }, 5000);
  }

  initScheduleForm() {
    const scheduleApp = document.getElementById('scheduleApp');

    if (scheduleApp) {
      // Passar empresa_id para o formulário de agendamento
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
    document.body.style.opacity = '1';
  }

  showError(message) {
    const loading = document.getElementById('pageLoading');
    if (loading) {
      loading.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2 style="color: #ef4444;">Erro</h2>
          <p>${message}</p>
          <a href="/" class="btn btn-primary" style="margin-top: 20px;">Voltar para Home</a>
        </div>
      `;
    }
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  new EmpresaPage();
});
