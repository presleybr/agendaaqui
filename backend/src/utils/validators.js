const { body, param, query } = require('express-validator');

const validators = {
  agendamento: [
    body('cliente.nome').trim().notEmpty().withMessage('Nome do cliente é obrigatório'),
    body('cliente.telefone').trim().notEmpty().withMessage('Telefone é obrigatório'),
    body('cliente.email').isEmail().withMessage('Email inválido'),
    body('cliente.cpf').custom((v) => {
      if (!v) throw new Error('CPF obrigatório');
      const digits = String(v).replace(/\D/g, '');
      if (digits.length !== 11) throw new Error('CPF inválido');
      return true;
    }),
    body('veiculo.placa').trim().notEmpty().withMessage('Placa é obrigatória'),
    body('veiculo.marca').trim().notEmpty().withMessage('Marca é obrigatória'),
    body('veiculo.modelo').trim().notEmpty().withMessage('Modelo é obrigatório'),
    body('veiculo.ano').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Ano inválido'),
    body('tipo_vistoria').optional().trim().notEmpty().withMessage('Tipo de vistoria inválido'),
    body('data').isDate().withMessage('Data inválida'),
    body('horario').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário inválido')
  ],

  login: [
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').notEmpty().withMessage('Senha é obrigatória')
  ],

  updateStatus: [
    param('id').isInt().withMessage('ID inválido'),
    body('status').isIn(['pendente', 'confirmado', 'realizado', 'cancelado']).withMessage('Status inválido')
  ],

  clienteUpdate: [
    param('id').isInt().withMessage('ID inválido'),
    body('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('telefone').optional().trim().notEmpty().withMessage('Telefone não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido')
  ],

  configuracao: [
    body('horario_inicio').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário de início inválido'),
    body('horario_fim').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário de fim inválido'),
    body('preco_cautelar').optional().isInt({ min: 0 }).withMessage('Preço inválido'),
    body('preco_transferencia').optional().isInt({ min: 0 }).withMessage('Preço inválido'),
    body('preco_outros').optional().isInt({ min: 0 }).withMessage('Preço inválido')
  ]
};

module.exports = validators;
