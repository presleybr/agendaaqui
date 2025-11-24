const Cliente = require('../models/Cliente');

class ClienteController {
  static async getAll(req, res) {
    try {
      const { limit, offset } = req.query;

      const clientes = await Cliente.findAll(
        limit ? parseInt(limit) : 100,
        offset ? parseInt(offset) : 0
      );

      const total = await Cliente.count();

      res.json({
        clientes,
        total,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      });
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const cliente = Cliente.findById(id);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  static async create(req, res) {
    try {
      const { nome, telefone, email, cpf } = req.body;

      // Validar campos obrigatórios
      if (!nome || !telefone || !cpf) {
        return res.status(400).json({
          error: 'Nome, telefone e CPF são obrigatórios'
        });
      }

      // Verificar se CPF já existe
      const existingCliente = Cliente.findByCPF(cpf);
      if (existingCliente) {
        return res.status(400).json({
          error: 'Já existe um cliente cadastrado com este CPF'
        });
      }

      // Verificar se email já existe (se fornecido)
      if (email) {
        const existingEmail = Cliente.findByEmail(email);
        if (existingEmail) {
          return res.status(400).json({
            error: 'Já existe um cliente cadastrado com este email'
          });
        }
      }

      const cliente = Cliente.create({ nome, telefone, email, cpf });
      res.status(201).json(cliente);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { nome, telefone, email } = req.body;

      // Verificar se cliente existe
      const existingCliente = Cliente.findById(id);
      if (!existingCliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Validar campos obrigatórios
      if (!nome || !telefone) {
        return res.status(400).json({
          error: 'Nome e telefone são obrigatórios'
        });
      }

      // Verificar se email já está em uso por outro cliente (se fornecido)
      if (email && email !== existingCliente.email) {
        const existingEmail = Cliente.findByEmail(email);
        if (existingEmail && existingEmail.id !== parseInt(id)) {
          return res.status(400).json({
            error: 'Este email já está cadastrado para outro cliente'
          });
        }
      }

      const cliente = Cliente.update(id, { nome, telefone, email });
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se cliente existe
      const cliente = Cliente.findById(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // TODO: Verificar se cliente tem agendamentos antes de deletar
      // Para segurança, podemos impedir a exclusão se houver agendamentos

      Cliente.delete(id);
      res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
  }
}

module.exports = ClienteController;
