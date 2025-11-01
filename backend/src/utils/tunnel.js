const localtunnel = require('localtunnel');

let tunnel = null;
let reconnectTimer = null;
let isShuttingDown = false;

/**
 * Inicia o LocalTunnel com auto-reconnect
 */
async function startTunnel() {
  if (isShuttingDown) {
    console.log('🛑 Sistema está encerrando, não iniciando novo tunnel');
    return;
  }

  try {
    // Fecha tunnel existente se houver
    if (tunnel) {
      await closeTunnel();
    }

    const port = process.env.PORT || 3000;
    const subdomain = process.env.TUNNEL_SUBDOMAIN || undefined;

    console.log('🔌 Iniciando LocalTunnel...');
    console.log(`   Porta: ${port}`);
    if (subdomain) {
      console.log(`   Subdomínio: ${subdomain}`);
    }

    tunnel = await localtunnel({
      port: port,
      subdomain: subdomain
    });

    console.log('');
    console.log('================================================================');
    console.log('✅ LocalTunnel iniciado com sucesso!');
    console.log('================================================================');
    console.log('');
    console.log(`🌐 URL Pública: ${tunnel.url}`);
    console.log('');
    console.log('🔗 URL do Webhook:');
    console.log(`   ${tunnel.url}/api/webhook/mercadopago`);
    console.log('');
    console.log('⚠️  Configure esta URL no Mercado Pago como webhook!');
    console.log('📖 Guia: WEBHOOK_LOCAL_SETUP.md');
    console.log('');
    console.log('🔄 Modo: Sempre ativo com reconexão automática');
    console.log('================================================================');
    console.log('');

    // Listener para quando o tunnel fechar
    tunnel.on('close', () => {
      if (!isShuttingDown) {
        console.log('⚠️  LocalTunnel fechado inesperadamente');
        console.log('🔄 Reconectando em 5 segundos...');

        // Limpa o timer anterior se existir
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
        }

        // Agenda reconexão
        reconnectTimer = setTimeout(() => {
          startTunnel();
        }, 5000);
      }
    });

    // Listener para erros
    tunnel.on('error', (err) => {
      console.error('❌ Erro no LocalTunnel:', err.message);
      if (!isShuttingDown) {
        console.log('🔄 Tentando reconectar em 5 segundos...');

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
        }

        reconnectTimer = setTimeout(() => {
          startTunnel();
        }, 5000);
      }
    });

    // Heartbeat - verifica se o tunnel ainda está ativo a cada 15 segundos
    // Mantém o tunnel sempre ativo e reconecta automaticamente se necessário
    const heartbeat = setInterval(async () => {
      if (isShuttingDown) {
        clearInterval(heartbeat);
        return;
      }

      try {
        if (!tunnel || !tunnel.url) {
          console.log('⚠️  Tunnel não está respondendo');
          clearInterval(heartbeat);
          await startTunnel();
        } else {
          // Faz um ping silencioso no tunnel para mantê-lo ativo
          const https = require('https');
          const url = new URL(tunnel.url);

          const req = https.get({
            hostname: url.hostname,
            path: '/api/health',
            timeout: 5000
          }, () => {
            // Ping bem-sucedido, tunnel está ativo
          });

          req.on('error', () => {
            // Erro no ping, mas não precisa fazer nada
            // O listener de 'close' vai cuidar da reconexão se necessário
          });

          req.end();
        }
      } catch (error) {
        // Erro silencioso no heartbeat, não precisa logar
        // O listener de 'close' vai cuidar da reconexão
      }
    }, 15000);

  } catch (error) {
    console.error('❌ Erro ao iniciar LocalTunnel:', error.message);

    if (!isShuttingDown) {
      console.log('🔄 Tentando novamente em 10 segundos...');

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      reconnectTimer = setTimeout(() => {
        startTunnel();
      }, 10000);
    }
  }
}

/**
 * Fecha o tunnel gracefully
 */
async function closeTunnel() {
  if (tunnel) {
    console.log('🛑 Fechando LocalTunnel...');
    try {
      tunnel.close();
      tunnel = null;
    } catch (error) {
      console.error('❌ Erro ao fechar tunnel:', error.message);
    }
  }
}

/**
 * Shutdown graceful
 */
async function shutdown() {
  isShuttingDown = true;

  console.log('');
  console.log('🛑 Encerrando LocalTunnel...');

  // Cancela reconexões pendentes
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Fecha o tunnel
  await closeTunnel();

  console.log('✅ LocalTunnel encerrado com sucesso');
}

// Handlers para shutdown graceful
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
  startTunnel,
  closeTunnel,
  getTunnelUrl: () => tunnel?.url || null
};
