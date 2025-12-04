import axios from 'axios';

// Detectar automaticamente a URL da API
function getApiUrl() {
  console.log('🔍 Detectando URL da API...');
  console.log('   window.location.hostname:', window.location.hostname);
  console.log('   window.location.href:', window.location.href);
  console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL);

  // Se tiver variável de ambiente VITE_API_URL, usar ela
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log('✅ Usando VITE_API_URL:', apiUrl);
    return apiUrl;
  }

  // Se estiver em produção (não localhost), usar caminho relativo
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    const apiUrl = '/api';
    console.log('🌐 Produção detectada! Usando caminho relativo:', apiUrl);
    return apiUrl;
  }

  // Se estiver sendo acessado via LocalTunnel
  if (window.location.hostname.includes('loca.lt')) {
    const backendHostname = window.location.hostname.replace('agendamento-app', 'agendamento-api');
    const apiUrl = `https://${backendHostname}/api`;
    console.log('🌐 LocalTunnel detectado! Usando API:', apiUrl);
    return apiUrl;
  }

  // Caso contrário, usar localhost (desenvolvimento)
  const apiUrl = 'http://localhost:3000/api';
  console.log('🏠 Modo local. Usando API:', apiUrl);
  return apiUrl;
}

const API_URL = getApiUrl();
console.log('✅ API_URL configurada como:', API_URL);

// Backend URL para imagens (remove /api do final)
const BACKEND_URL = API_URL.replace(/\/api$/, '');

/**
 * Converte URLs de imagem relativas para absolutas do backend
 * @param {string} url - URL da imagem (pode ser relativa ou absoluta)
 * @returns {string|null} URL absoluta da imagem ou null se nao houver URL
 */
export function getImageUrl(url) {
  if (!url) return null;

  // Se ja eh uma URL absoluta (http/https), retorna como esta
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Se eh uma URL relativa, adiciona o backend URL
  // Remove barra inicial se existir para evitar duplicacao
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return `${BACKEND_URL}/${cleanUrl}`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('🚀 API Request:', config.method.toUpperCase(), config.url);
  return config;
}, (error) => {
  console.error('❌ API Request Error:', error);
  return Promise.reject(error);
});

// Interceptor de resposta para debug
api.interceptors.response.use((response) => {
  console.log('✅ API Response:', response.config.url, response.data);
  // Return just the data instead of the full response object
  return response.data;
}, (error) => {
  console.error('❌ API Response Error:', error.config?.url, {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  // Log validation errors specifically
  if (error.response?.status === 400 && error.response?.data?.errors) {
    console.error('🔍 Validation Errors:', error.response.data.errors);
  }

  // Auto-logout on invalid token (401 Unauthorized)
  if (error.response?.status === 401) {
    const errorMessage = error.response?.data?.error || '';
    if (errorMessage.includes('Token inválido') || errorMessage.includes('Token expirado') || errorMessage.includes('Token mal formatado')) {
      console.warn('⚠️ Token inválido detectado. Fazendo logout automático...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirecionar para login apenas se não estiver já na tela de login do admin
      const isAdminPage = window.location.pathname.includes('admin');
      const loginScreenVisible = document.getElementById('loginScreen')?.style.display !== 'none';

      if (!isAdminPage) {
        window.location.href = '/admin';
      } else if (!loginScreenVisible) {
        // Só recarrega se não estiver já mostrando a tela de login
        window.location.reload();
      }
      // Se já está na tela de login, não faz nada
    }
  }

  return Promise.reject(error);
});

export const scheduleService = {
  API_URL: API_URL, // Expose API_URL for components

  // Get available dates
  async getAvailableDates(days = 30) {
    return await api.get(`/availability/dates?days=${days}`);
  },

  // Get available time slots for a specific date
  async getAvailableSlots(date) {
    return await api.get(`/availability/slots?data=${date}`);
  },

  // Check if specific slot is available
  async checkAvailability(date, time) {
    return await api.get(`/availability/check?data=${date}&horario=${time}`);
  },

  // Get prices (usa preços do tenant se disponível)
  async getPrices() {
    // Tentar importar tenantService dinamicamente
    try {
      const { default: tenantService } = await import('./tenant.js');

      if (tenantService.isTenant() && tenantService.getConfig()) {
        const precos = tenantService.getPrecos();
        console.log('💰 Usando preços do tenant:', precos);
        // Retornar no formato esperado pelo ScheduleForm
        return {
          cautelar: { valor: precos.cautelar },
          transferencia: { valor: precos.transferencia },
          outros: { valor: precos.outros }
        };
      }
    } catch (error) {
      console.log('⚠️ TenantService não disponível, usando preços padrão da API');
    }

    // Fallback para preços padrão da API
    return await api.get('/availability/prices');
  },

  // Create new appointment
  async createAppointment(data) {
    return await api.post('/agendamentos', data);
  },

  // Get appointment by protocol
  async getByProtocol(protocol) {
    return await api.get(`/agendamentos/protocolo/${protocol}`);
  }
};

export const authService = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, senha: password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
    }
    return data;
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async me() {
    return await api.get('/auth/me');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default api;
