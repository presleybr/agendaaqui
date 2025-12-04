const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendConfirmacaoAgendamento(agendamento) {
    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
      to: agendamento.cliente_email,
      subject: `Confirmação de Agendamento - Protocolo ${agendamento.protocolo}`,
      html: this.getConfirmacaoTemplate(agendamento)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de confirmação enviado para ${agendamento.cliente_email}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  async sendLembrete(agendamento) {
    const mailOptions = {
      from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
      to: agendamento.cliente_email,
      subject: `Lembrete: Vistoria Amanhã - ${agendamento.protocolo}`,
      html: this.getLembreteTemplate(agendamento)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de lembrete enviado para ${agendamento.cliente_email}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  getConfirmacaoTemplate(agendamento) {
    // Extrair data e horário do timestamp data_hora
    const dataHora = new Date(agendamento.data_hora || agendamento.data);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horarioFormatado = agendamento.horario || dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const precoFormatado = ((agendamento.valor || agendamento.preco || 0) / 100).toFixed(2);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .button { background: #28a745; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.BUSINESS_NAME}</h1>
            <p>Confirmação de Agendamento</p>
          </div>
          <div class="content">
            <p>Olá <strong>${agendamento.cliente_nome}</strong>,</p>
            <p>Seu agendamento foi confirmado com sucesso!</p>

            <div class="info-box">
              <h3>📋 Detalhes do Agendamento</h3>
              <p><strong>Protocolo:</strong> ${agendamento.protocolo}</p>
              <p><strong>Data:</strong> ${dataFormatada}</p>
              <p><strong>Horário:</strong> ${horarioFormatado}</p>
              <p><strong>Tipo:</strong> ${agendamento.tipo_vistoria}</p>
              <p><strong>Valor:</strong> R$ ${precoFormatado}</p>
            </div>

            <div class="info-box">
              <h3>🚗 Veículo</h3>
              <p><strong>Placa:</strong> ${agendamento.veiculo_placa}</p>
              <p><strong>Veículo:</strong> ${agendamento.veiculo_marca} ${agendamento.veiculo_modelo}</p>
              <p><strong>Ano:</strong> ${agendamento.veiculo_ano}</p>
            </div>

            ${agendamento.endereco_vistoria ? `
            <div class="info-box">
              <h3>📍 Local</h3>
              <p>${agendamento.endereco_vistoria}</p>
            </div>
            ` : ''}

            <p><strong>⚠️ Importante:</strong> Chegue com 10 minutos de antecedência e traga toda a documentação do veículo.</p>
          </div>

          <div class="footer">
            <p>Dúvidas? Entre em contato:</p>
            <p>📱 ${process.env.BUSINESS_PHONE}</p>
            <p>📧 ${process.env.BUSINESS_EMAIL}</p>
            <p style="margin-top: 20px; color: #999;">
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getLembreteTemplate(agendamento) {
    // Extrair data e horário do timestamp data_hora
    const dataHora = new Date(agendamento.data_hora || agendamento.data);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horarioFormatado = agendamento.horario || dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Lembrete de Vistoria</h1>
            <p>Sua vistoria está agendada para amanhã!</p>
          </div>
          <div class="content">
            <p>Olá <strong>${agendamento.cliente_nome}</strong>,</p>
            <p>Este é um lembrete de que sua vistoria está agendada para <strong>amanhã</strong>.</p>

            <div class="info-box">
              <h3>📋 Detalhes</h3>
              <p><strong>Protocolo:</strong> ${agendamento.protocolo}</p>
              <p><strong>Data:</strong> ${dataFormatada}</p>
              <p><strong>Horário:</strong> ${horarioFormatado}</p>
              <p><strong>Veículo:</strong> ${agendamento.veiculo_marca} ${agendamento.veiculo_modelo} - ${agendamento.veiculo_placa}</p>
            </div>

            <p><strong>📝 Checklist:</strong></p>
            <ul>
              <li>Documento do veículo (CRLV)</li>
              <li>Documento pessoal com foto</li>
              <li>Chave do veículo</li>
              <li>Chegue 10 minutos antes</li>
            </ul>

            <p>Precisa remarcar? Entre em contato conosco o quanto antes.</p>
          </div>

          <div class="footer">
            <p>📱 ${process.env.BUSINESS_PHONE}</p>
            <p>📧 ${process.env.BUSINESS_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
