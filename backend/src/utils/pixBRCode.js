/**
 * Gerador de "PIX Copia e Cola" (EMV BR Code) estático.
 * Padrão: Manual de Padrões para Iniciação do Pix - BCB.
 * Sem API, sem dependências externas. Montagem de string + CRC16-CCITT.
 */

function sanitize(str, maxLen) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .,\-\/]/g, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeTxid(str) {
  if (!str) return '***';
  const cleaned = String(str).replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
  return cleaned.length > 0 ? cleaned : '***';
}

function field(id, value) {
  const v = String(value);
  const len = String(v.length).padStart(2, '0');
  return `${id}${len}${v}`;
}

function crc16ccitt(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * @param {object} params
 * @param {string} params.pixKey - chave PIX (CPF, CNPJ, email, telefone ou aleatória)
 * @param {string} params.merchantName - nome do recebedor (max 25 chars ASCII)
 * @param {string} params.merchantCity - cidade (max 15 chars ASCII)
 * @param {number} [params.amount] - valor em reais (ex: 150.00). Se omitido, gera código sem valor.
 * @param {string} [params.txid] - identificador (max 25 alfanum). Default '***'.
 * @returns {string} BR Code "copia e cola"
 */
function generateBRCode({ pixKey, merchantName, merchantCity, amount, txid }) {
  if (!pixKey) throw new Error('pixKey é obrigatório');

  const name = sanitize(merchantName || 'EMPRESA', 25) || 'EMPRESA';
  const city = sanitize(merchantCity || 'BRASIL', 15) || 'BRASIL';
  const safeTxid = sanitizeTxid(txid);

  const merchantAccount =
    field('00', 'br.gov.bcb.pix') +
    field('01', String(pixKey).trim());

  const additionalData = field('05', safeTxid);

  let payload = '';
  payload += field('00', '01');                 // Payload Format Indicator
  payload += field('26', merchantAccount);      // Merchant Account Info (PIX)
  payload += field('52', '0000');               // Merchant Category Code
  payload += field('53', '986');                // Currency (BRL)
  if (amount && Number(amount) > 0) {
    payload += field('54', Number(amount).toFixed(2));
  }
  payload += field('58', 'BR');                 // Country
  payload += field('59', name);                 // Merchant Name
  payload += field('60', city);                 // Merchant City
  payload += field('62', additionalData);       // Additional Data Field
  payload += '6304';                            // CRC header (ID + length)

  return payload + crc16ccitt(payload);
}

module.exports = { generateBRCode, crc16ccitt };
