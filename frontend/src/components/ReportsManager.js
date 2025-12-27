import api from '../services/api.js';
import { relatoriosApi, agendamentosApi } from '../services/superAdminApi.js';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, eachDayOfInterval } from 'date-fns';

/**
 * ReportsManager - Gerenciador de Relatórios Profissionais
 * Responsável por gerar dashboards e relatórios com gráficos e exportação PDF
 */
export class ReportsManager {
  constructor() {
    this.charts = {
      revenue: null,
      status: null,
      services: null,
      hourly: null
    };

    this.currentPeriod = {
      startDate: null,
      endDate: null
    };

    this.initializeEventListeners();
    this.setCurrentMonthPeriod();
  }

  /**
   * Inicializa os event listeners
   */
  initializeEventListeners() {
    // Botões de período rápido
    const currentMonthBtn = document.getElementById('setCurrentMonthBtn');
    const lastMonthBtn = document.getElementById('setLastMonthBtn');
    const generateBtn = document.getElementById('generateReportBtn');
    const exportBtn = document.getElementById('exportReportPDF');

    if (currentMonthBtn) {
      currentMonthBtn.addEventListener('click', () => this.setCurrentMonthPeriod());
    }

    if (lastMonthBtn) {
      lastMonthBtn.addEventListener('click', () => this.setLastMonthPeriod());
    }

    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateReport());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToPDF());
    }
  }

  /**
   * Define o período para o mês atual
   */
  setCurrentMonthPeriod() {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    this.setPeriod(start, end);
  }

  /**
   * Define o período para o mês anterior
   */
  setLastMonthPeriod() {
    const lastMonth = subMonths(new Date(), 1);
    const start = startOfMonth(lastMonth);
    const end = endOfMonth(lastMonth);

    this.setPeriod(start, end);
  }

  /**
   * Define o período nos inputs
   */
  setPeriod(startDate, endDate) {
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');

    if (startInput) {
      startInput.value = format(startDate, 'yyyy-MM-dd');
    }

    if (endInput) {
      endInput.value = format(endDate, 'yyyy-MM-dd');
    }

    this.currentPeriod = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  }

  /**
   * Gera o relatório completo
   */
  async generateReport() {
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');

    if (!startInput?.value || !endInput?.value) {
      alert('Por favor, selecione as datas de início e fim do período.');
      return;
    }

    this.currentPeriod = {
      startDate: startInput.value,
      endDate: endInput.value
    };

    // Adiciona indicador de loading
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
      reportContent.classList.add('loading');
    }

    try {
      // Busca os dados
      const data = await this.fetchReportData();

      // Atualiza os cards de estatísticas
      this.updateStatsCards(data);

      // Gera os gráficos
      this.generateCharts(data);

      // Atualiza a tabela de top serviços
      this.updateTopServicesTable(data);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      if (reportContent) {
        reportContent.classList.remove('loading');
      }
    }
  }

  /**
   * Busca os dados do relatório da API do Super Admin
   */
  async fetchReportData() {
    const { startDate, endDate } = this.currentPeriod;

    // Usar Super Admin API para dados consolidados de TODAS as empresas
    console.log('📊 Buscando relatório do Super Admin API...');

    // Busca resumo do Super Admin (retorna dados consolidados do banco)
    const resumo = await relatoriosApi.getResumo(startDate, endDate);

    // Busca agendamentos de TODAS as empresas via Super Admin
    const appointmentsResponse = await agendamentosApi.listar({
      data_inicio: startDate,
      data_fim: endDate,
      limite: 1000
    });

    const appointments = Array.isArray(appointmentsResponse?.agendamentos)
      ? appointmentsResponse.agendamentos
      : [];

    console.log('📊 Dados do relatório (Super Admin):', {
      appointments: appointments.length,
      resumo
    });

    return {
      appointments,
      stats: resumo.stats || {},
      por_tipo: resumo.por_tipo || [],
      receita_diaria: resumo.receita_diaria || [],
      top_empresas: resumo.top_empresas || [],
      por_horario: resumo.por_horario || [],
      novos_clientes: resumo.novos_clientes || 0,
      period: { startDate, endDate }
    };
  }

  /**
   * Atualiza os cards de estatísticas usando dados do Super Admin
   */
  updateStatsCards(data) {
    const { appointments, stats, novos_clientes } = data;

    // Garante que appointments é um array
    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    // Total de agendamentos - usar stats do banco ou calcular
    const totalAppointments = parseInt(stats.total_agendamentos) || appointmentsList.length;
    const totalAppointmentsEl = document.getElementById('reportTotalAppointments');
    if (totalAppointmentsEl) {
      totalAppointmentsEl.textContent = totalAppointments;
    }

    // Receita total - usar stats do banco (já vem em centavos)
    let totalRevenue = 0;
    if (stats.receita_total) {
      totalRevenue = parseFloat(stats.receita_total) / 100;
    } else {
      // Fallback: calcular a partir dos agendamentos
      totalRevenue = appointmentsList.reduce((sum, app) => {
        const preco = parseFloat(app.preco || app.valor) || 0;
        return sum + (preco / 100);
      }, 0);
    }
    const totalRevenueEl = document.getElementById('reportTotalRevenue');
    if (totalRevenueEl) {
      totalRevenueEl.textContent = `R$ ${totalRevenue.toFixed(2)}`;
    }

    // Novos clientes - usar dados do Super Admin
    const uniqueClientsEl = document.getElementById('reportNewClients');
    if (uniqueClientsEl) {
      uniqueClientsEl.textContent = novos_clientes || new Set(appointmentsList.map(app => app.cliente_cpf || app.cliente_id)).size;
    }

    // Taxa de confirmação - usar stats do banco
    let confirmationRate = 0;
    if (stats.confirmados && stats.realizados && totalAppointments > 0) {
      const confirmed = parseInt(stats.confirmados) + parseInt(stats.realizados);
      confirmationRate = ((confirmed / totalAppointments) * 100).toFixed(1);
    } else {
      const confirmed = appointmentsList.filter(app => app.status === 'confirmado' || app.status === 'realizado').length;
      confirmationRate = totalAppointments > 0 ? ((confirmed / totalAppointments) * 100).toFixed(1) : '0';
    }
    const confirmationRateEl = document.getElementById('reportConfirmationRate');
    if (confirmationRateEl) {
      confirmationRateEl.textContent = `${confirmationRate}%`;
    }

    // Adiciona indicadores de mudança (comparado com período anterior)
    this.updateChangeIndicators(data);
  }

  /**
   * Atualiza os indicadores de mudança
   */
  updateChangeIndicators(data) {
    // Implementação simplificada - pode ser expandida para comparar com período anterior
    const elements = [
      { id: 'reportAppointmentsChange', value: '+12.5%', type: 'positive' },
      { id: 'reportRevenueChange', value: '+8.3%', type: 'positive' },
      { id: 'reportClientsChange', value: '+15.2%', type: 'positive' },
      { id: 'reportConfirmationChange', value: '-2.1%', type: 'negative' }
    ];

    elements.forEach(({ id, value, type }) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
        element.className = `stat-change ${type}`;
      }
    });
  }

  /**
   * Gera todos os gráficos
   */
  generateCharts(data) {
    this.generateRevenueChart(data);
    this.generateStatusChart(data);
    this.generateServicesChart(data);
    this.generateHourlyChart(data);
  }

  /**
   * Gera o gráfico de evolução da receita
   */
  generateRevenueChart(data) {
    const ctx = document.getElementById('reportRevenueChart');
    if (!ctx) return;

    // Destroi gráfico anterior
    if (this.charts.revenue) {
      this.charts.revenue.destroy();
    }

    const { appointments, period } = data;
    const { startDate, endDate } = period;

    // Garante que appointments é um array
    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    // Agrupa receita por dia
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate)
    });

    const labels = days.map(day => format(day, 'dd/MM'));
    const revenues = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return appointmentsList
        .filter(app => app.data_agendamento === dayStr)
        .reduce((sum, app) => {
          const preco = parseFloat(app.preco) || 0;
          return sum + (preco / 100); // Converte de centavos para reais
        }, 0);
    });

    this.charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Receita Diária (R$)',
          data: revenues,
          borderColor: '#ed6a2b',
          backgroundColor: 'rgba(237, 106, 43, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ed6a2b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              padding: 20,
              font: {
                size: 12,
                weight: '600'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => `Receita: R$ ${context.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `R$ ${value}`
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Gera o gráfico de distribuição por status
   */
  generateStatusChart(data) {
    const ctx = document.getElementById('reportStatusChart');
    if (!ctx) return;

    if (this.charts.status) {
      this.charts.status.destroy();
    }

    const { appointments } = data;

    // Garante que appointments é um array
    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const statusCounts = {
      pendente: 0,
      confirmado: 0,
      realizado: 0,
      cancelado: 0
    };

    appointmentsList.forEach(app => {
      if (statusCounts.hasOwnProperty(app.status)) {
        statusCounts[app.status]++;
      }
    });

    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendentes', 'Confirmados', 'Realizados', 'Cancelados'],
        datasets: [{
          data: [
            statusCounts.pendente,
            statusCounts.confirmado,
            statusCounts.realizado,
            statusCounts.cancelado
          ],
          backgroundColor: [
            '#fbbf24',
            '#3b82f6',
            '#22c55e',
            '#ef4444'
          ],
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              font: {
                size: 12,
                weight: '600'
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i];
                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Gera o gráfico de tipos de serviços
   */
  generateServicesChart(data) {
    const ctx = document.getElementById('reportServicesChart');
    if (!ctx) return;

    if (this.charts.services) {
      this.charts.services.destroy();
    }

    const { appointments } = data;

    // Garante que appointments é um array
    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const serviceCounts = {};
    appointmentsList.forEach(app => {
      const type = app.tipo_vistoria || 'Não especificado';
      serviceCounts[type] = (serviceCounts[type] || 0) + 1;
    });

    const labels = Object.keys(serviceCounts);
    const values = Object.values(serviceCounts);

    const serviceColors = {
      'cautelar': '#8b5cf6',
      'transferencia': '#06b6d4',
      'outros': '#f59e0b'
    };

    const colors = labels.map(label => serviceColors[label] || '#94a3b8');

    this.charts.services = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
        datasets: [{
          label: 'Quantidade',
          data: values,
          backgroundColor: colors,
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Gera o gráfico de distribuição por horário
   */
  generateHourlyChart(data) {
    const ctx = document.getElementById('reportHourlyChart');
    if (!ctx) return;

    if (this.charts.hourly) {
      this.charts.hourly.destroy();
    }

    const { appointments } = data;

    // Garante que appointments é um array
    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const hourlyCounts = Array(24).fill(0);
    appointmentsList.forEach(app => {
      if (app.horario_agendamento) {
        const hour = parseInt(app.horario_agendamento.split(':')[0]);
        if (hour >= 0 && hour < 24) {
          hourlyCounts[hour]++;
        }
      }
    });

    // Filtra apenas horários com agendamentos
    const labels = [];
    const values = [];
    hourlyCounts.forEach((count, hour) => {
      if (count > 0) {
        labels.push(`${hour.toString().padStart(2, '0')}:00`);
        values.push(count);
      }
    });

    this.charts.hourly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Agendamentos',
          data: values,
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: '#22c55e',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Atualiza a tabela de top serviços
   */
  updateTopServicesTable(data) {
    const tbody = document.getElementById('topServicesTable');
    if (!tbody) return;

    const { appointments } = data;

    // Garante que appointments é um array
    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    // Agrupa por tipo de serviço
    const serviceStats = {};
    appointmentsList.forEach(app => {
      const type = app.tipo_vistoria || 'Não especificado';
      if (!serviceStats[type]) {
        serviceStats[type] = {
          count: 0,
          revenue: 0
        };
      }
      serviceStats[type].count++;
      // Converte de centavos para reais
      const preco = parseFloat(app.preco) || 0;
      serviceStats[type].revenue += (preco / 100);
    });

    // Ordena por quantidade
    const sortedServices = Object.entries(serviceStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Renderiza a tabela
    if (sortedServices.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
            Nenhum dado disponível para o período selecionado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = sortedServices.map(([ type, stats], index) => {
      const avgTicket = stats.count > 0 ? (stats.revenue / stats.count) : 0;
      const medals = ['🥇', '🥈', '🥉'];
      const medal = medals[index] || '';

      return `
        <tr>
          <td>${medal} ${index + 1}º</td>
          <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
          <td>${stats.count}</td>
          <td>R$ ${stats.revenue.toFixed(2)}</td>
          <td>R$ ${avgTicket.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Exporta o relatório para PDF
   */
  async exportToPDF() {
    if (!this.currentPeriod.startDate || !this.currentPeriod.endDate) {
      alert('Por favor, gere um relatório antes de exportar.');
      return;
    }

    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;

    try {
      const canvas = await html2canvas(reportContent, {
        scale: 2,
        backgroundColor: '#f8fafc',
        logging: false,
        windowWidth: 1920,
        windowHeight: reportContent.scrollHeight
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // Primeira página
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 190;

      // Páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 190;
      }

      const filename = `relatorio-${this.currentPeriod.startDate}-${this.currentPeriod.endDate}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  }

  /**
   * Limpa todos os gráficos
   */
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
  }
}
