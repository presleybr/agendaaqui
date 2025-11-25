import api from './api.js';

/**
 * Serviço para gerenciar configurações multi-tenant
 */
class TenantService {
  constructor() {
    this.currentTenant = null;
    this.config = null;
  }

  /**
   * Extrai o slug do tenant do PATH (ex: /empresa1/... -> "empresa1")
   */
  extractTenantFromPath() {
    const path = window.location.pathname;

    // Ignorar rotas reservadas
    const reserved = ['admin', 'api', 'login', 'super-admin'];

    // Extrair primeira parte do path
    // /empresa1/... -> "empresa1"
    // /empresa1 -> "empresa1"
    const match = path.match(/^\/([^\/]+)/);

    if (!match) return null;

    const slug = match[1];

    // Ignorar rotas reservadas e arquivos estáticos
    if (reserved.includes(slug) || slug.includes('.')) {
      return null;
    }

    return slug;
  }

  /**
   * Extrai o subdomínio do URL atual
   */
  extractSubdomain() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // Localhost (desenvolvimento)
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return parts.length > 1 ? parts[0] : null;
    }

    // Para Render (.onrender.com)
    // Ex: empresa1.agendaaqui-frontend.onrender.com -> ['empresa1', 'agendaaqui-frontend', 'onrender', 'com']
    if (hostname.includes('.onrender.com')) {
      if (parts.length > 3) {
        const subdomain = parts[0];
        // Ignorar subdomínios reservados
        if (subdomain === 'www' || subdomain === 'admin' || subdomain === 'api') {
          return null;
        }
        return subdomain;
      }
      // agendaaqui-frontend.onrender.com -> sem subdomínio
      return null;
    }

    // Para agendaaquivistorias.com.br (domínio .com.br)
    if (hostname.includes('agendaaquivistorias.com.br')) {
      // agendavistorias.agendaaquivistorias.com.br -> ['agendavistorias', 'agendaaquivistorias', 'com', 'br']
      if (parts.length > 4) {
        return parts[0];
      }
      // agendaaquivistorias.com.br -> sem subdomínio
      return null;
    }

    // Domínios normais (.com, .net, etc)
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  /**
   * Extrai o slug do tenant (suporta subdomain OU path)
   */
  extractTenantSlug() {
    // Prioridade: PATH > SUBDOMAIN
    // Ex: domain.com/empresa1 OU empresa1.domain.com
    const pathSlug = this.extractTenantFromPath();
    if (pathSlug) {
      return pathSlug;
    }

    return this.extractSubdomain();
  }

  /**
   * Verifica se está em um contexto de tenant (subdomínio OU path)
   */
  isTenant() {
    const slug = this.extractTenantSlug();
    return slug && slug !== 'www' && slug !== 'admin';
  }

  /**
   * Carrega as configurações do tenant atual
   */
  async loadTenantConfig() {
    if (!this.isTenant()) {
      console.log('📍 Não está em um contexto de tenant');
      return null;
    }

    try {
      const tenantSlug = this.extractTenantSlug();
      console.log(`🏢 Carregando configurações do tenant: ${tenantSlug}`);
      console.log(`   Método de detecção: ${this.extractTenantFromPath() ? 'PATH' : 'SUBDOMAIN'}`);

      // Fazer requisição para API passando o slug
      const response = await api.get(`/tenant/config?slug=${tenantSlug}`);
      this.config = response.data;
      this.currentTenant = tenantSlug;

      console.log('✅ Configurações do tenant carregadas:', this.config);
      return this.config;
    } catch (error) {
      console.error('❌ Erro ao carregar configurações do tenant:', error);

      if (error.response?.status === 404) {
        throw new Error('Empresa não encontrada. Verifique se o slug está correto.');
      }

      if (error.response?.status === 403) {
        throw new Error('Esta empresa está inativa ou suspensa.');
      }

      throw new Error('Erro ao carregar configurações da empresa');
    }
  }

  /**
   * Retorna as configurações atuais do tenant
   */
  getConfig() {
    return this.config;
  }

  /**
   * Retorna os preços do tenant
   */
  getPrecos() {
    if (!this.config?.precos) {
      // Preços padrão se não houver configuração
      return {
        cautelar: 15000,
        transferencia: 12000,
        outros: 10000
      };
    }
    return this.config.precos;
  }

  /**
   * Retorna os horários de funcionamento
   */
  getHorarios() {
    if (!this.config?.horarios) {
      // Horários padrão
      return {
        inicio: '08:00:00',
        fim: '18:00:00',
        intervalo_minutos: 60
      };
    }
    return this.config.horarios;
  }

  /**
   * Retorna o nome da empresa
   */
  getNomeEmpresa() {
    return this.config?.nome || 'Agenda Aqui';
  }

  /**
   * Retorna o slug da empresa
   */
  getSlug() {
    return this.currentTenant;
  }

  /**
   * Formata preço de centavos para reais
   */
  formatarPreco(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

// Exportar instância única (singleton)
const tenantService = new TenantService();
export default tenantService;
