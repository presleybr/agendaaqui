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

  return Promise.reject(error);
});

export const scheduleService = {
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

  // Get prices
  async getPrices() {
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
