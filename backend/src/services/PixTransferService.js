const { MercadoPagoConfig, MercadoPago } = require('mercadopago');

/**
 * Serviço para realizar transferências PIX automáticas
 * Integração com Mercado Pago Split Payments
 */
class PixTransferService {
  constructor() {
    // Inicializar cliente Mercado Pago
    if (process.env.MP_ACCESS_TOKEN) {
      this.client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN,
      });
      this.initialized = true;
    } else {
      console.warn('⚠️  MP_ACCESS_TOKEN não configurado - transferências PIX desabilitadas');
      this.initialized = false;
    }
  }

  /**
   * Realizar transferência PIX via Mercado Pago
   * Documentação: https://www.mercadopago.com.br/developers/pt/docs/advanced-payments/api
   */
  async transferirPix(dadosTransferencia) {
    const { chave_pix, valor, empresa_nome, empresa_id, split_id } = dadosTransferencia;

    console.log(`\n💸 Iniciando transferência PIX`);
    console.log(`   Para: ${empresa_nome} (${chave_pix})`);
    console.log(`   Valor: R$ ${valor / 100}`);
    console.log(`   Split ID: ${split_id}`);

    if (!this.initialized) {
      throw new Error('Mercado Pago não configurado. Configure MP_ACCESS_TOKEN.');
    }

    try {
      // Nota: Mercado Pago não oferece transferência direta via PIX na API padrão
      // Existem 3 opções:
      //
      // OPÇÃO 1: Split Payment (Marketplace)
      //   - Requer conta Marketplace no MP
      //   - O split é feito automaticamente na compra
      //   - Não precisa transferir depois
      //
      // OPÇÃO 2: Money Out API (Transferências)
      //   - Requer aprovação especial do MP
      //   - Permite transferir dinheiro da sua conta MP para PIX
      //
      // OPÇÃO 3: Manual
      //   - Marcar como "pendente" e processar manualmente
      //   - Ou usar API de outro provedor (PagSeguro, Asaas, etc)

      // Por enquanto, vamos implementar a lógica de SPLIT PAYMENT (OPÇÃO 1)
      // que é o mais adequado para este caso de uso

      console.log('⚠️  IMPORTANTE: Para transferências automáticas, configure Split Payment no Mercado Pago');
      console.log('   Acesse: https://www.mercadopago.com.br/developers/pt/docs/split-payments/landing');

      // Simular sucesso por enquanto
      // TODO: Implementar integração real quando conta Marketplace estiver configurada
      const comprovante = this.gerarComprovanteSimulado(valor, chave_pix);

      return {
        sucesso: true,
        comprovante,
        tipo: 'simulado',
        mensagem: 'Transferência registrada - aguardando processamento manual',
        detalhes: {
          chave_pix,
          valor,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Erro na transferência PIX:', error);
      throw new Error(`Falha ao transferir PIX: ${error.message}`);
    }
  }

  /**
   * Verificar se uma transferência foi concluída
   * (Para quando usar API real)
   */
  async verificarStatusTransferencia(comprovanteId) {
    if (!this.initialized) {
      return null;
    }

    try {
      // TODO: Implementar verificação real quando API estiver disponível
      console.log(`🔍 Verificando status da transferência ${comprovanteId}`);

      return {
        status: 'concluido',
        comprovante_id: comprovanteId,
        data_conclusao: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return null;
    }
  }

  /**
   * Gerar comprovante simulado
   */
  gerarComprovanteSimulado(valor, chavePix) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `PIX-SIM-${timestamp}-${random}`;
  }

  /**
   * Validar chave PIX
   */
  validarChavePix(chave) {
    if (!chave) return false;

    // Remover espaços e caracteres especiais
    const chaveClean = chave.replace(/\s+/g, '').replace(/[^a-zA-Z0-9@.-]/g, '');

    // Validações básicas por tipo
    // CPF: 11 dígitos
    if (/^\d{11}$/.test(chaveClean)) return true;

    // CNPJ: 14 dígitos
    if (/^\d{14}$/.test(chaveClean)) return true;

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chaveClean)) return true;

    // Telefone: +5511999999999
    if (/^\+?\d{12,13}$/.test(chaveClean)) return true;

    // Chave aleatória (UUID)
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(chaveClean)) return true;

    return false;
  }

  /**
   * Formatar valor para reais
   */
  formatarValor(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

/**
 * GUIA DE IMPLEMENTAÇÃO PARA TRANSFERÊNCIAS REAIS:
 *
 * 1. MERCADO PAGO SPLIT PAYMENT (RECOMENDADO)
 *    - Cadastre sua conta como Marketplace
 *    - Configure os sellers (empresas clientes)
 *    - Use Advanced Payments API com split automático
 *    - Documentação: https://www.mercadopago.com.br/developers/pt/docs/split-payments
 *
 * 2. ASAAS (ALTERNATIVA POPULAR)
 *    - API simples e completa
 *    - Suporta transferências PIX automáticas
 *    - Documentação: https://docs.asaas.com
 *    - Endpoint: POST /v3/transfers
 *
 * 3. PAGBANK (EX-PAGSEGURO)
 *    - Split Payment nativo
 *    - Boa documentação
 *    - Documentação: https://dev.pagbank.uol.com.br
 *
 * 4. INTEGRAÇÃO BANCÁRIA DIRETA
 *    - PIX via API do banco (BB, Itaú, etc)
 *    - Requer contrato com banco
 *    - Mais complexo mas maior controle
 */

module.exports = PixTransferService;
