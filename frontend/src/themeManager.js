/**
 * Theme Manager - Light/Dark Mode System
 *
 * Gerencia o tema do sistema com suporte a:
 * - Detecção automática de preferência do sistema
 * - Persistência da escolha do usuário no localStorage
 * - Transições suaves entre temas
 * - Toggle button reutilizável
 */

const ThemeManager = {
  STORAGE_KEY: 'agendaaqui-theme',

  /**
   * Inicializa o tema baseado na preferência salva ou do sistema
   */
  init() {
    // Aplicar tema antes do DOM carregar para evitar flash
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Escutar mudanças na preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Só aplicar se o usuário não tiver uma preferência salva
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    // Quando DOM estiver pronto, configurar os toggles
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupToggles());
    } else {
      this.setupToggles();
    }
  },

  /**
   * Alterna entre os temas light e dark
   */
  toggle() {
    // Adicionar classe de transição
    document.documentElement.classList.add('theme-transitioning');

    // Alternar tema
    const isDark = document.documentElement.classList.toggle('dark');

    // Salvar preferência
    localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');

    // Remover classe de transição após a animação
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);

    return isDark;
  },

  /**
   * Define um tema específico
   */
  setTheme(theme) {
    document.documentElement.classList.add('theme-transitioning');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem(this.STORAGE_KEY, theme);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  },

  /**
   * Retorna o tema atual
   */
  getTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },

  /**
   * Verifica se está no modo escuro
   */
  isDark() {
    return document.documentElement.classList.contains('dark');
  },

  /**
   * Configura todos os toggles de tema na página
   */
  setupToggles() {
    document.querySelectorAll('.theme-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => this.toggle());
    });
  },

  /**
   * Cria e injeta um botão toggle de tema
   * @param {HTMLElement} container - Container onde o toggle será inserido
   * @param {Object} options - Opções de configuração
   */
  createToggle(container, options = {}) {
    const { position = 'append', className = '' } = options;

    const toggle = document.createElement('button');
    toggle.className = `theme-toggle ${className}`.trim();
    toggle.setAttribute('aria-label', 'Alternar tema claro/escuro');
    toggle.setAttribute('title', 'Alternar tema');
    toggle.innerHTML = `
      <!-- Sol (Light Mode) -->
      <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <!-- Lua (Dark Mode) -->
      <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;

    toggle.addEventListener('click', () => this.toggle());

    if (position === 'prepend') {
      container.prepend(toggle);
    } else {
      container.appendChild(toggle);
    }

    return toggle;
  },

  /**
   * Retorna o HTML do toggle para inserção manual
   */
  getToggleHTML() {
    return `
      <button class="theme-toggle" aria-label="Alternar tema claro/escuro" title="Alternar tema">
        <!-- Sol (Light Mode) -->
        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <!-- Lua (Dark Mode) -->
        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    `;
  }
};

// Inicializar imediatamente para evitar flash de tema errado
ThemeManager.init();

// Exportar para uso em módulos
export default ThemeManager;
