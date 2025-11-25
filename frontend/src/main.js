import { ScheduleForm } from './components/ScheduleForm.js';
import { scheduleService } from './services/api.js';
import tenantService from './services/tenant.js';

// Multi-Tenant Configuration
async function initTenantConfig() {
  console.log('🔍 Verificando se é tenant...');
  console.log('   Hostname:', window.location.hostname);
  console.log('   isTenant():', tenantService.isTenant());
  console.log('   Subdomain extracted:', tenantService.extractSubdomain());

  if (tenantService.isTenant()) {
    try {
      console.log('🏢 Sistema multi-tenant detectado!');
      console.log('📡 Carregando configurações do tenant...');

      const config = await tenantService.loadTenantConfig();

      console.log('📦 Configurações recebidas:', config);

      if (!config) {
        throw new Error('Configurações do tenant não foram carregadas');
      }

      // Personalizar título da página
      document.title = `${config.nome} - Agende sua Vistoria Online`;
      console.log('✅ Título atualizado:', document.title);

      // Atualizar nome da empresa nos elementos da página
      const nomeEmpresa = document.querySelectorAll('.empresa-nome');
      console.log(`📝 Atualizando ${nomeEmpresa.length} elementos .empresa-nome`);
      nomeEmpresa.forEach(el => {
        el.textContent = config.nome;
      });

      // Atualizar meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.content = `Agende sua vistoria veicular com ${config.nome} de forma rápida e fácil.`;
      }

      console.log('✅ Configurações do tenant aplicadas com sucesso!');
      console.log('   Nome:', config.nome);
      console.log('   Slug:', config.slug);
      console.log('   Preços:', config.precos);
      console.log('   Horários:', config.horarios);

      return config;
    } catch (error) {
      console.error('❌ Erro ao carregar configurações do tenant:', error);
      console.error('   Error details:', error.response?.data || error.message);

      // Mostrar mensagem de erro ao usuário
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #f44336; color: white; padding: 15px; text-align: center; z-index: 9999; font-family: system-ui;';
      errorDiv.innerHTML = `
        <strong>⚠️ ${error.message}</strong><br>
        <small>Verifique se a empresa está cadastrada no sistema.</small>
      `;
      document.body.insertBefore(errorDiv, document.body.firstChild);

      return null;
    }
  } else {
    console.log('🌐 Modo padrão (não é tenant)');
    return null;
  }
}

// Inicializar configurações do tenant antes de tudo (aguardar conclusão)
const tenantConfigPromise = initTenantConfig();

// YouTube Background Video - Loop sem tela preta
let player;
let bottomPlayer;

function onYouTubeIframeAPIReady() {
  // Hero video (top)
  player = new YT.Player('heroVideoPlayer', {
    videoId: 'h00jrLVISGo',
    playerVars: {
      autoplay: 1,
      controls: 0,
      showinfo: 0,
      modestbranding: 1,
      loop: 1,
      fs: 0,
      cc_load_policy: 0,
      iv_load_policy: 3,
      autohide: 1,
      mute: 1,
      playsinline: 1,
      rel: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });

  // Bottom video (scheduling to footer)
  bottomPlayer = new YT.Player('bottomVideoPlayer', {
    videoId: 'h00jrLVISGo',
    playerVars: {
      autoplay: 0,
      controls: 0,
      showinfo: 0,
      modestbranding: 1,
      loop: 1,
      fs: 0,
      cc_load_policy: 0,
      iv_load_policy: 3,
      autohide: 1,
      mute: 1,
      playsinline: 1,
      rel: 0
    },
    events: {
      onReady: onBottomPlayerReady,
      onStateChange: onBottomPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.mute();
  event.target.playVideo();
}

function onPlayerStateChange(event) {
  // Quando o vídeo terminar, reiniciar imediatamente
  if (event.data === YT.PlayerState.ENDED) {
    player.seekTo(0);
    player.playVideo();
  }
}

function onBottomPlayerReady(event) {
  event.target.mute();
  // Don't autoplay - will be controlled by scroll
}

function onBottomPlayerStateChange(event) {
  // Quando o vídeo terminar, reiniciar imediatamente
  if (event.data === YT.PlayerState.ENDED) {
    bottomPlayer.seekTo(0);
    bottomPlayer.playVideo();
  }
}

// Carregar YouTube IFrame API
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Expor função para o YouTube API
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// Single DOMContentLoaded event listener to prevent multiple initializations
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOM Content Loaded - Initializing app...');

  // IMPORTANTE: Aguardar configurações do tenant carregarem primeiro!
  console.log('⏳ Aguardando configurações do tenant...');
  await tenantConfigPromise;
  console.log('✅ Configurações do tenant prontas (ou não é tenant)');

  // Initialize scheduling form
  new ScheduleForm('scheduleApp');

  // Load pricing cards (agora com configurações do tenant se houver)
  await loadPricingCards();

  // Initialize scroll reveal animations
  setTimeout(initScrollReveal, 100);

  // Initialize header, navigation and mobile menu
  initHeader();

  // Initialize reviews carousel
  initReviewsCarousel();

  // Initialize bottom video control
  initBottomVideoControl();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('✅ App initialization complete');
});

// Scroll Reveal Animations with Intersection Observer
function initScrollReveal() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);

  // Observe all reveal elements
  document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    observer.observe(el);
  });

  // Stagger animation for grid items
  document.querySelectorAll('.stagger-container').forEach(container => {
    const items = container.querySelectorAll('.stagger-item');
    items.forEach((item, index) => {
      setTimeout(() => {
        const itemObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
            }
          });
        }, observerOptions);

        itemObserver.observe(item);
      }, index * 100); // 100ms delay between items
    });
  });
}

// Scroll reveal initialization moved to main DOMContentLoaded listener above

// Header Scroll Effect & Mobile Menu
function initHeader() {
  const header = document.getElementById('siteHeader');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mainNav = document.querySelector('.main-nav');

  // Add scroll effect
  window.addEventListener('scroll', () => {
    // Header fica claro logo ao começar a scrollar
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuToggle.classList.toggle('active');
      mainNav.classList.toggle('active');
    });
  }

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// Header, reviews carousel and bottom video initialization moved to main DOMContentLoaded listener above

// Control bottom video visibility based on scroll
function initBottomVideoControl() {
  const bottomVideoBg = document.getElementById('bottomVideoBg');
  const schedulingSection = document.getElementById('agendamento');

  if (!bottomVideoBg || !schedulingSection) return;

  let bottomVideoPlaying = false;

  window.addEventListener('scroll', () => {
    const schedulingTop = schedulingSection.offsetTop;
    const scrollPosition = window.scrollY + window.innerHeight;

    // Show bottom video when user scrolls to scheduling section
    if (scrollPosition >= schedulingTop + 200) {
      if (!bottomVideoBg.classList.contains('visible')) {
        bottomVideoBg.classList.add('visible');
        // Start playing when visible
        if (bottomPlayer && !bottomVideoPlaying) {
          bottomPlayer.playVideo();
          bottomVideoPlaying = true;
        }
      }
    } else {
      if (bottomVideoBg.classList.contains('visible')) {
        bottomVideoBg.classList.remove('visible');
        // Pause when hidden
        if (bottomPlayer && bottomVideoPlaying) {
          bottomPlayer.pauseVideo();
          bottomVideoPlaying = false;
        }
      }
    }
  });
}

// Reviews Carousel
function initReviewsCarousel() {
  const track = document.querySelector('.reviews-carousel-track');
  const items = document.querySelectorAll('.carousel-item');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const dotsContainer = document.querySelector('.carousel-dots');

  if (!track || items.length === 0) return;

  let currentIndex = 0;
  let itemsPerPage = getItemsPerPage();
  let isDragging = false;
  let startPos = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationID = 0;

  // Desabilitar seleção de texto nos cards
  track.style.userSelect = 'none';
  track.style.webkitUserSelect = 'none';
  track.style.msUserSelect = 'none';

  // Create dots
  const totalPages = Math.ceil(items.length / itemsPerPage);
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }

  function getItemsPerPage() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function updateCarousel(smooth = true) {
    const itemWidth = items[0].offsetWidth;
    const gap = parseInt(getComputedStyle(track).gap) || 24;
    const offset = -(currentIndex * itemsPerPage * (itemWidth + gap));

    if (smooth) {
      track.style.transition = 'transform 0.3s ease-out';
    } else {
      track.style.transition = 'none';
    }

    track.style.transform = `translateX(${offset}px)`;
    currentTranslate = offset;
    prevTranslate = offset;

    // Update dots
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });

    // Botões sempre habilitados (loop infinito)
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
  }

  function nextSlide() {
    // Loop infinito: volta para o início quando chegar no final
    if (currentIndex >= totalPages - 1) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }
    updateCarousel();
  }

  function prevSlide() {
    // Loop infinito: vai para o final quando está no início
    if (currentIndex <= 0) {
      currentIndex = totalPages - 1;
    } else {
      currentIndex--;
    }
    updateCarousel();
  }

  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);

  // Touch events
  track.addEventListener('touchstart', touchStart);
  track.addEventListener('touchend', touchEnd);
  track.addEventListener('touchmove', touchMove);

  // Mouse events
  track.addEventListener('mousedown', touchStart);
  track.addEventListener('mouseup', touchEnd);
  track.addEventListener('mouseleave', touchEnd);
  track.addEventListener('mousemove', touchMove);

  function touchStart(event) {
    isDragging = true;
    startPos = getPositionX(event);
    animationID = requestAnimationFrame(animation);
    track.style.cursor = 'grabbing';
  }

  function touchEnd() {
    isDragging = false;
    cancelAnimationFrame(animationID);
    track.style.cursor = 'grab';

    const movedBy = currentTranslate - prevTranslate;

    // Se arrastou mais de 100px, muda de slide
    if (movedBy < -100 && currentIndex < totalPages - 1) {
      currentIndex++;
    } else if (movedBy > 100 && currentIndex > 0) {
      currentIndex--;
    } else if (movedBy < -100 && currentIndex >= totalPages - 1) {
      // Loop: volta pro início
      currentIndex = 0;
    } else if (movedBy > 100 && currentIndex <= 0) {
      // Loop: vai pro final
      currentIndex = totalPages - 1;
    }

    updateCarousel();
  }

  function touchMove(event) {
    if (isDragging) {
      const currentPosition = getPositionX(event);
      currentTranslate = prevTranslate + currentPosition - startPos;
    }
  }

  function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
  }

  function animation() {
    if (isDragging) {
      track.style.transition = 'none';
      track.style.transform = `translateX(${currentTranslate}px)`;
      requestAnimationFrame(animation);
    }
  }

  // Prevenir comportamento padrão de arrastar imagens
  items.forEach(item => {
    const images = item.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('dragstart', (e) => e.preventDefault());
    });
  });

  // Handle resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newItemsPerPage = getItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        itemsPerPage = newItemsPerPage;
        currentIndex = 0;

        // Recreate dots
        dotsContainer.innerHTML = '';
        const newTotalPages = Math.ceil(items.length / itemsPerPage);
        for (let i = 0; i < newTotalPages; i++) {
          const dot = document.createElement('button');
          dot.classList.add('carousel-dot');
          if (i === 0) dot.classList.add('active');
          dot.addEventListener('click', () => goToSlide(i));
          dotsContainer.appendChild(dot);
        }

        updateCarousel();
      }
    }, 250);
  });

  // Cursor grab
  track.style.cursor = 'grab';

  updateCarousel();
}

async function loadPricingCards() {
  try {
    const prices = await scheduleService.getPrices();
    const pricingGrid = document.getElementById('pricingGrid');

    if (!pricingGrid) return;

    pricingGrid.innerHTML = `
      <div class="pricing-card featured stagger-item">
        <div class="discount-badge">Mais Popular</div>
        <h3>Vistoria Cautelar</h3>
        <div class="price">${prices.cautelar.valorFormatado}</div>
        <div class="price-detail">Proteção completa após a venda</div>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Laudo completo</li>
          <li style="padding: 8px 0;">✓ Validade jurídica</li>
          <li style="padding: 8px 0;">✓ Proteção contra multas</li>
          <li style="padding: 8px 0;">✓ Atendimento em 24h</li>
        </ul>
        <a href="#agendamento" class="btn btn-primary btn-select-service" data-service="cautelar" style="width: 100%;">Agendar</a>
      </div>

      <div class="pricing-card stagger-item">
        <h3>Vistoria Transferência</h3>
        <div class="price">${prices.transferencia.valorFormatado}</div>
        <div class="price-detail">Para transferência de propriedade</div>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Laudo técnico</li>
          <li style="padding: 8px 0;">✓ Documentação completa</li>
          <li style="padding: 8px 0;">✓ Reconhecido DETRAN</li>
          <li style="padding: 8px 0;">✓ Processo rápido</li>
        </ul>
        <a href="#agendamento" class="btn btn-secondary btn-select-service" data-service="transferencia" style="width: 100%;">Agendar</a>
      </div>

      <div class="pricing-card stagger-item">
        <h3>Outros Serviços</h3>
        <div class="price">A partir de ${prices.outros.valorFormatado}</div>
        <div class="price-detail">Consulte-nos para outros tipos</div>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✓ Pré Cautelar</li>
          <li style="padding: 8px 0;">✓ Vistoria periódica</li>
          <li style="padding: 8px 0;">✓ Laudo para seguro</li>
          <li style="padding: 8px 0;">✓ Outros laudos</li>
        </ul>
        <a href="#agendamento" class="btn btn-secondary btn-select-service" data-service="outros" style="width: 100%;">Agendar</a>
      </div>
    `;

    // Add event listeners to service selection buttons
    setTimeout(() => {
      document.querySelectorAll('.btn-select-service').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const serviceType = btn.dataset.service;

          // Store selected service in sessionStorage so the form can pick it up
          sessionStorage.setItem('selectedService', serviceType);

          // Try to set it directly if the select element exists
          const selectElement = document.getElementById('tipo_vistoria');
          if (selectElement) {
            selectElement.value = serviceType;

            // Trigger change event to update any listeners
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // Scroll to form
          const agendamentoSection = document.getElementById('agendamento');
          if (agendamentoSection) {
            agendamentoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }, 150);

    // Re-init scroll reveal for dynamically added cards
    setTimeout(initScrollReveal, 100);
  } catch (error) {
    console.error('Error loading pricing:', error);
  }
}

