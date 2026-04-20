const Cliente = require('../models/Cliente');

class ClienteController {
  static async getAll(req, res) {
    try {
      const { limit, offset, empresa_id } = req.query;
      const empresaFiltro = empresa_id ? parseInt(empresa_id) : undefined;

      const clientes = await Cliente.findAll(
        limit ? parseInt(limit) : 100,
        offset ? parseInt(offset) : 0,
        empresaFiltro
      );

      const total = await Cliente.count(empresaFiltro);

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
      const empresaFiltro = req.query.empresa_id ? parseInt(req.query.empresa_id) : undefined;
      const cliente = await Cliente.findById(id, empresaFiltro);

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
      const { nome, telefone, email, cpf, empresa_id } = req.body;

      if (!nome || !telefone || !cpf) {
        return res.status(400).json({
          error: 'Nome, telefone e CPF são obrigatórios'
        });
      }

      const empresaFiltro = empresa_id ? parseInt(empresa_id) : undefined;

      const existingCliente = await Cliente.findByCPF(cpf, empresaFiltro);
      if (existingCliente) {
        return res.status(400).json({
          error: 'Já existe um cliente cadastrado com este CPF'
        });
      }

      if (email) {
        const existingEmail = await Cliente.findByEmail(email, empresaFiltro);
        if (existingEmail) {
          return res.status(400).json({
            error: 'Já existe um cliente cadastrado com este email'
          });
        }
      }

      const cliente = await Cliente.create({ nome, telefone, email, cpf, empresa_id: empresaFiltro });
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
      const empresaFiltro = req.query.empresa_id ? parseInt(req.query.empresa_id) : undefined;

      const existingCliente = await Cliente.findById(id, empresaFiltro);
      if (!existingCliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      if (!nome || !telefone) {
        return res.status(400).json({
          error: 'Nome e telefone são obrigatórios'
        });
      }

      if (email && email !== existingCliente.email) {
        const existingEmail = await Cliente.findByEmail(email, empresaFiltro);
        if (existingEmail && existingEmail.id !== parseInt(id)) {
          return res.status(400).json({
            error: 'Este email já está cadastrado para outro cliente'
          });
        }
      }

      const cliente = await Cliente.update(id, { nome, telefone, email }, empresaFiltro);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const empresaFiltro = req.query.empresa_id ? parseInt(req.query.empresa_id) : undefined;

      const cliente = await Cliente.findById(id, empresaFiltro);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      await Cliente.delete(id, empresaFiltro);
      res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
  }
}

module.exports = ClienteController;
