/**
 * WhatsApp Service - Baileys Integration
 * Gerencia sessoes WhatsApp por empresa com persistencia no PostgreSQL
 */

const {
  default: makeWASocket,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  initAuthCreds,
  BufferJSON,
  proto
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const db = require('../config/database');

const logger = pino({ level: 'silent' });

class WhatsAppManager {
  constructor() {
    // Map<empresa_id, { socket, qrCode, status, retryCount }>
    this.sessions = new Map();
  }

  /**
   * Cria um auth state adapter que persiste no PostgreSQL.
   * Usa BufferJSON para serializar corretamente os Buffers que o Baileys
   * armazena em creds/keys (noise keys, Curve25519, HKDF secrets, etc).
   */
  async usePostgresAuthState(empresaId) {
    const row = await db.query(
      'SELECT session_data, session_keys FROM whatsapp_config WHERE empresa_id = $1',
      [empresaId]
    );

    // session_data e JSONB; re-stringify + reviver restaura Buffers.
    const rawCreds = row.rows[0]?.session_data;
    const rawKeys = row.rows[0]?.session_keys;

    let creds = rawCreds
      ? JSON.parse(JSON.stringify(rawCreds), BufferJSON.reviver)
      : initAuthCreds();

    const keys = rawKeys
      ? JSON.parse(JSON.stringify(rawKeys), BufferJSON.reviver)
      : {};

    const saveCreds = async () => {
      await db.query(
        'UPDATE whatsapp_config SET session_data = $1, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = $2',
        [JSON.stringify(creds, BufferJSON.replacer), empresaId]
      );
    };

    const saveKeys = async () => {
      await db.query(
        'UPDATE whatsapp_config SET session_keys = $1, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = $2',
        [JSON.stringify(keys, BufferJSON.replacer), empresaId]
      );
    };

    return {
      state: {
        creds,
        keys: {
          get: (type, ids) => {
            const data = {};
            for (const id of ids) {
              let value = keys[`${type}-${id}`];
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }
            return data;
          },
          set: async (data) => {
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id];
                const key = `${category}-${id}`;
                if (value) keys[key] = value;
                else delete keys[key];
              }
            }
            await saveKeys();
          }
        }
      },
      saveCreds
    };
  }

  /**
   * Inicializa sessao Baileys para uma empresa
   */
  async initSession(empresaId) {
    // Se ja existe sessao ativa, retorna
    const existing = this.sessions.get(empresaId);
    if (existing && existing.status === 'connected') {
      return { status: 'connected' };
    }

    // Garante que existe registro no whatsapp_config
    await db.query(`
      INSERT INTO whatsapp_config (empresa_id) VALUES ($1)
      ON CONFLICT (empresa_id) DO NOTHING
    `, [empresaId]);

    const { state, saveCreds } = await this.usePostgresAuthState(empresaId);
    const { version } = await fetchLatestBaileysVersion();

    const sessionData = {
      socket: null,
      qrCode: null,
      status: 'connecting',
      retryCount: 0
    };
    this.sessions.set(empresaId, sessionData);

    await this.updateConnectionStatus(empresaId, 'connecting');

    const sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: false,
      browser: ['AgendaAqui', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: false
    });

    sessionData.socket = sock;

    // Baileys muta state.creds in-place; saveCreds persiste o objeto atual.
    sock.ev.on('creds.update', saveCreds);

    // Evento de conexao
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        sessionData.qrCode = qr;
        sessionData.status = 'qr';
        await this.updateConnectionStatus(empresaId, 'qr');
      }

      if (connection === 'open') {
        sessionData.qrCode = null;
        sessionData.status = 'connected';
        sessionData.retryCount = 0;
        await this.updateConnectionStatus(empresaId, 'connected');
        await db.query(
          'UPDATE whatsapp_config SET last_connected_at = CURRENT_TIMESTAMP, last_error = NULL WHERE empresa_id = $1',
          [empresaId]
        );
        console.log(`[WhatsApp] Empresa ${empresaId} conectada`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        sessionData.status = 'disconnected';
        sessionData.qrCode = null;

        if (shouldReconnect && sessionData.retryCount < 5) {
          sessionData.retryCount++;
          const delay = Math.min(1000 * Math.pow(2, sessionData.retryCount), 60000);
          console.log(`[WhatsApp] Empresa ${empresaId} reconectando em ${delay}ms (tentativa ${sessionData.retryCount})`);
          await this.updateConnectionStatus(empresaId, 'reconnecting');
          setTimeout(() => this.initSession(empresaId), delay);
        } else {
          // Logged out ou max retries - limpa sessao
          console.log(`[WhatsApp] Empresa ${empresaId} desconectada definitivamente`);
          await this.clearSession(empresaId);
        }
      }
    });

    return { status: 'connecting' };
  }

  /**
   * Retorna QR code atual e status
   */
  getQRCode(empresaId) {
    const session = this.sessions.get(empresaId);
    return {
      qr: session?.qrCode || null,
      status: session?.status || 'disconnected'
    };
  }

  /**
   * Retorna status da conexao
   */
  async getStatus(empresaId) {
    const session = this.sessions.get(empresaId);
    const config = await db.query(
      'SELECT connection_status, last_connected_at, last_error FROM whatsapp_config WHERE empresa_id = $1',
      [empresaId]
    );

    return {
      memoryStatus: session?.status || 'disconnected',
      dbStatus: config.rows[0]?.connection_status || 'disconnected',
      lastConnected: config.rows[0]?.last_connected_at,
      lastError: config.rows[0]?.last_error
    };
  }

  /**
   * Envia mensagem WhatsApp
   */
  async sendMessage(empresaId, phone, message) {
    const session = this.sessions.get(empresaId);
    if (!session || session.status !== 'connected') {
      throw new Error('WhatsApp nao conectado');
    }

    // Formata numero para formato WhatsApp (55XXXXXXXXXXX@s.whatsapp.net)
    const jid = this.formatJID(phone);

    try {
      await session.socket.sendMessage(jid, { text: message });
      return { success: true };
    } catch (error) {
      console.error(`[WhatsApp] Erro ao enviar mensagem empresa ${empresaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Envia midia (imagem ou documento) com legenda opcional.
   * mimetype define o tipo: image/* vira image, outros viram document.
   */
  async sendMedia(empresaId, phone, buffer, { filename, mimetype, caption } = {}) {
    const session = this.sessions.get(empresaId);
    if (!session || session.status !== 'connected') {
      throw new Error('WhatsApp nao conectado');
    }

    const jid = this.formatJID(phone);
    const isImage = mimetype && mimetype.startsWith('image/');

    const payload = isImage
      ? { image: buffer, caption: caption || '' }
      : { document: buffer, mimetype: mimetype || 'application/octet-stream', fileName: filename || 'arquivo', caption: caption || '' };

    try {
      await session.socket.sendMessage(jid, payload);
      return { success: true };
    } catch (error) {
      console.error(`[WhatsApp] Erro ao enviar midia empresa ${empresaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Desconecta sessao
   */
  async disconnect(empresaId) {
    const session = this.sessions.get(empresaId);
    if (session?.socket) {
      try {
        await session.socket.logout();
      } catch (e) {
        // Ignora erro se ja desconectado
      }
      session.socket.end();
    }
    await this.clearSession(empresaId);
  }

  /**
   * Limpa sessao do banco e memoria
   */
  async clearSession(empresaId) {
    this.sessions.delete(empresaId);
    await db.query(
      `UPDATE whatsapp_config
       SET session_data = NULL, session_keys = NULL, connection_status = 'disconnected', updated_at = CURRENT_TIMESTAMP
       WHERE empresa_id = $1`,
      [empresaId]
    );
  }

  /**
   * Atualiza status no banco
   */
  async updateConnectionStatus(empresaId, status, error = null) {
    await db.query(
      `UPDATE whatsapp_config SET connection_status = $1, last_error = $2, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = $3`,
      [status, error, empresaId]
    );
  }

  /**
   * Formata telefone para JID do WhatsApp
   */
  formatJID(phone) {
    // Remove tudo que nao e numero
    let clean = phone.replace(/\D/g, '');
    // Adiciona codigo do pais se nao tiver
    if (!clean.startsWith('55')) {
      clean = '55' + clean;
    }
    return clean + '@s.whatsapp.net';
  }

  /**
   * Verifica se empresa esta conectada
   */
  isConnected(empresaId) {
    const session = this.sessions.get(empresaId);
    return session?.status === 'connected';
  }
}

// Singleton
const whatsAppManager = new WhatsAppManager();

module.exports = whatsAppManager;
