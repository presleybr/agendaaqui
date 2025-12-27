/**
 * Configuração de Taxas do Sistema
 *
 * Aqui ficam todas as taxas cobradas:
 * - Taxa da plataforma (sua comissão)
 * - Taxa do PIX Asaas (custo da transferência)
 */

module.exports = {
  // Taxa cobrada pelo Asaas por transferência PIX (em centavos)
  // R$ 1,99 = 199 centavos
  TAXA_PIX_ASAAS: 199,

  // Taxa padrão da plataforma se não configurada na empresa (em centavos)
  // R$ 5,00 = 500 centavos
  TAXA_PLATAFORMA_PADRAO: 500,

  // Função para calcular o valor total que o cliente deve pagar
  calcularValorTotal: (valorVistoria, incluirTaxaPix = true) => {
    const taxaPix = incluirTaxaPix ? 199 : 0;
    return valorVistoria + taxaPix;
  },

  // Função para calcular o split completo
  calcularSplit: (valorTotal, taxaPlataforma) => {
    const TAXA_PIX = 199;

    // Valor que a empresa recebe = Total - Taxa Plataforma - Taxa PIX
    const valorEmpresa = valorTotal - taxaPlataforma - TAXA_PIX;

    return {
      valorTotal,
      taxaPlataforma,
      taxaPix: TAXA_PIX,
      valorEmpresa,
      detalhes: {
        valorTotal_formatado: `R$ ${(valorTotal / 100).toFixed(2)}`,
        taxaPlataforma_formatado: `R$ ${(taxaPlataforma / 100).toFixed(2)}`,
        taxaPix_formatado: `R$ ${(TAXA_PIX / 100).toFixed(2)}`,
        valorEmpresa_formatado: `R$ ${(valorEmpresa / 100).toFixed(2)}`
      }
    };
  }
};
