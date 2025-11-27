/**
 * Super Admin API Service
 * Centraliza todas as chamadas à API do Super Admin
 */

import { scheduleService } from './api.js';

const API_URL = scheduleService.API_URL;

// Helper para fazer requests autenticados
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin';
    throw new Error('Sessão expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

// ============================================
// DASHBOARD
// ============================================
export const dashboardApi = {
  async getDashboard() {
    return authFetch(`${API_URL}/super-admin/dashboard`);
  }
};

// ============================================
// EMPRESAS
// ============================================
export const empresasApi = {
  async listar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = params ? `${API_URL}/super-admin/empresas?${params}` : `${API_URL}/super-admin/empresas`;
    return authFetch(url);
  },

  async buscarPorId(id) {
    return authFetch(`${API_URL}/super-admin/empresas/${id}`);
  },

  async criar(dados) {
    return authFetch(`${API_URL}/admin/empresas`, {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  },

  async atualizar(id, dados) {
    return authFetch(`${API_URL}/super-admin/empresas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  },

  async deletar(id) {
    return authFetch(`${API_URL}/super-admin/empresas/${id}`, {
      method: 'DELETE'
    });
  },

  async alterarStatus(id, status) {
    return authFetch(`${API_URL}/super-admin/empresas/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async listarUsuarios(empresaId) {
    return authFetch(`${API_URL}/super-admin/empresas/${empresaId}/usuarios`);
  },

  async criarUsuario(empresaId, dados) {
    return authFetch(`${API_URL}/super-admin/empresas/${empresaId}/usuarios`, {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }
};

// ============================================
// AGENDAMENTOS
// ============================================
export const agendamentosApi = {
  async listar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = params ? `${API_URL}/super-admin/agendamentos?${params}` : `${API_URL}/super-admin/agendamentos`;
    return authFetch(url);
  },

  async buscarPorId(id) {
    return authFetch(`${API_URL}/super-admin/agendamentos/${id}`);
  },

  async alterarStatus(id, status) {
    return authFetch(`${API_URL}/super-admin/agendamentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

// ============================================
// CLIENTES
// ============================================
export const clientesApi = {
  async listar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = params ? `${API_URL}/super-admin/clientes?${params}` : `${API_URL}/super-admin/clientes`;
    return authFetch(url);
  }
};

// ============================================
// PAGAMENTOS E SPLITS
// ============================================
export const pagamentosApi = {
  async listar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = params ? `${API_URL}/super-admin/pagamentos?${params}` : `${API_URL}/super-admin/pagamentos`;
    return authFetch(url);
  },

  async listarSplits(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = params ? `${API_URL}/super-admin/splits?${params}` : `${API_URL}/super-admin/splits`;
    return authFetch(url);
  },

  async atualizarSplit(id, dados) {
    return authFetch(`${API_URL}/super-admin/splits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dados)
    });
  }
};

// ============================================
// CONFIGURAÇÕES
// ============================================
export const configuracoesApi = {
  async get() {
    return authFetch(`${API_URL}/super-admin/configuracoes`);
  },

  async salvar(dados) {
    return authFetch(`${API_URL}/super-admin/configuracoes`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  }
};

// ============================================
// RELATÓRIOS
// ============================================
export const relatoriosApi = {
  async getResumo(dataInicio, dataFim) {
    return authFetch(`${API_URL}/super-admin/relatorios/resumo?data_inicio=${dataInicio}&data_fim=${dataFim}`);
  }
};

// ============================================
// USUÁRIOS
// ============================================
export const usuariosApi = {
  async resetSenha(userId) {
    return authFetch(`${API_URL}/super-admin/usuarios/${userId}/reset-senha`, {
      method: 'POST'
    });
  },

  async alterarAtivo(userId, ativo) {
    return authFetch(`${API_URL}/super-admin/usuarios/${userId}/ativo`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo })
    });
  }
};

// Export default com todos os módulos
export default {
  dashboard: dashboardApi,
  empresas: empresasApi,
  agendamentos: agendamentosApi,
  clientes: clientesApi,
  pagamentos: pagamentosApi,
  configuracoes: configuracoesApi,
  relatorios: relatoriosApi,
  usuarios: usuariosApi
};
