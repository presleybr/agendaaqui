const UsuarioAdmin = require('../models/UsuarioAdmin');
const Empresa = require('../models/Empresa');
const Transacao = require('../models/Transacao');
const Configuracao = require('../models/Configuracao');
const { generateToken } = require('../middleware/authAdmin');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Senha padrão para novos usuários
const SENHA_PADRAO = '123456';

class AdminController {
  // ============ AUTENTICAÇÃO ============
  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const admin = await UsuarioAdmin.findByEmail(email);

      if (!admin) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (admin.status !== 'ativo') {
        return res.status(401).json({ error: 'Usuário inativo' });
      }

      const senhaValida = await UsuarioAdmin.verifyPassword(senha, admin.senha_hash);

      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = generateToken(admin.id);

      await UsuarioAdmin.updateLastAccess(admin.id);

      res.json({
        token,
        admin: {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Erro no login admin:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  static async getMe(req, res) {
    try {
      res.json({ admin: req.admin });
    } catch (error) {
      console.error('Erro ao buscar admin:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do admin' });
    }
  }

  // ============ DASHBOARD ============
  static async getDashboard(req, res) {
    try {
      // Buscar resumo geral do sistema
      const resumoTransacoes = await Transacao.getResumoSistema();

      // Buscar todas as empresas
      const empresas = await Empresa.findAll();

      // Buscar configurações do sistema
      const configuracoes = {
        taxa_inicial: parseInt(await Configuracao.get('taxa_inicial') || '500'),
        taxa_apos_30_dias: parseInt(await Configuracao.get('taxa_apos_30_dias') || '700'),
        dias_taxa_inicial: parseInt(await Configuracao.get('dias_taxa_inicial') || '30'),
        pix_sistema_key: await Configuracao.get('pix_sistema_key') || '',
        pix_sistema_type: await Configuracao.get('pix_sistema_type') || 'email'
      };

      // Calcular estatísticas das empresas
      const empresasComStats = await Promise.all(
        empresas.map(async (empresa) => {
          const stats = await Empresa.getStats(empresa.id);
          const diasFuncionamento = await Empresa.getDiasFuncionamento(empresa.id);

          return {
            ...empresa,
            stats,
            diasFuncionamento
          };
        })
      );

      res.json({
        resumo: resumoTransacoes,
        empresas: empresasComStats,
        configuracoes,
        totais: {
          empresas_ativas: empresas.filter(e => e.status === 'ativo').length,
          empresas_total: empresas.length
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
  }

  // ============ GERENCIAMENTO DE EMPRESAS ============
  static async listarEmpresas(req, res) {
    try {
      const { status } = req.query;
      const empresas = await Empresa.findAll({ status });

      const empresasComStats = await Promise.all(
        empresas.map(async (empresa) => {
          const stats = await Empresa.getStats(empresa.id);
          const diasFuncionamento = await Empresa.getDiasFuncionamento(empresa.id);

          return {
            ...empresa,
            stats,
            diasFuncionamento
          };
        })
      );

      res.json({ empresas: empresasComStats });
    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      res.status(500).json({ error: 'Erro ao listar empresas' });
    }
  }

  static async criarEmpresa(req, res) {
    try {
      const {
        nome,
        slug,
        cnpj,
        email,
        telefone,
        chave_pix,
        precos_vistoria,
        plano,
        ...outrosDados
      } = req.body;

      // Validações
      if (!nome || !slug || !email || !chave_pix) {
        return res.status(400).json({
          error: 'Campos obrigatórios: nome, slug, email, chave_pix'
        });
      }

      // Verificar se slug já existe
      const empresaExistente = await Empresa.findBySlug(slug);
      if (empresaExistente) {
        return res.status(400).json({ error: 'Slug já está em uso' });
      }

      // Validar slug (apenas letras minúsculas, números e hífen)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
          error: 'Slug deve conter apenas letras minúsculas, números e hífen'
        });
      }

      // Criar empresa
      const empresa = await Empresa.create({
        nome,
        slug,
        cnpj,
        email,
        telefone,
        chave_pix,
        status: 'ativo',
        plano: plano || 'basico',
        ...outrosDados
      });

      // Criar preços de vistoria se fornecidos
      if (precos_vistoria && Array.isArray(precos_vistoria) && precos_vistoria.length > 0) {
        for (const preco of precos_vistoria) {
          await db.query(`
            INSERT INTO precos_vistoria (empresa_id, categoria, nome_exibicao, descricao, preco, ordem, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            ON CONFLICT (empresa_id, categoria) DO UPDATE SET
              nome_exibicao = EXCLUDED.nome_exibicao,
              descricao = EXCLUDED.descricao,
              preco = EXCLUDED.preco,
              ordem = EXCLUDED.ordem
          `, [empresa.id, preco.categoria, preco.nome_exibicao, preco.descricao, preco.preco, preco.ordem]);
        }
      }

      // Criar usuário admin automaticamente para a empresa
      const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
      const nomeUsuario = nome.split(' ')[0] + ' Admin'; // Ex: "Vistoria Admin"

      const usuarioResult = await db.query(`
        INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
        VALUES ($1, $2, $3, $4, 'admin', true, true)
        ON CONFLICT (email) DO NOTHING
        RETURNING id, nome, email, role
      `, [empresa.id, nomeUsuario, email, senhaHash]);

      const usuarioCriado = usuarioResult.rows[0];

      res.status(201).json({
        message: 'Empresa criada com sucesso',
        mensagem: 'Empresa criada com sucesso',
        empresa,
        usuario: usuarioCriado ? {
          ...usuarioCriado,
          senha_padrao: SENHA_PADRAO,
          aviso: 'Usuário deve alterar a senha no primeiro acesso'
        } : null,
        url: `https://agendaaquivistorias.com.br/${slug}`,
        subdominio: `${slug}.${req.get('host')}`
      });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      res.status(500).json({ error: 'Erro ao criar empresa' });
    }
  }

  static async atualizarEmpresa(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // Se estiver alterando o slug, verificar se já existe
      if (dados.slug && dados.slug !== empresa.slug) {
        const empresaExistente = await Empresa.findBySlug(dados.slug);
        if (empresaExistente) {
          return res.status(400).json({ error: 'Slug já está em uso' });
        }

        // Validar slug
        if (!/^[a-z0-9-]+$/.test(dados.slug)) {
          return res.status(400).json({
            error: 'Slug deve conter apenas letras minúsculas, números e hífen'
          });
        }
      }

      const empresaAtualizada = await Empresa.update(id, dados);

      res.json({
        message: 'Empresa atualizada com sucesso',
        empresa: empresaAtualizada
      });
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
  }

  static async deletarEmpresa(req, res) {
    try {
      const { id } = req.params;

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // Verificar se tem agendamentos/pagamentos pendentes
      const stats = await Empresa.getStats(id);
      if (stats.total_agendamentos > 0) {
        return res.status(400).json({
          error: 'Não é possível deletar empresa com agendamentos. Desative-a ao invés disso.'
        });
      }

      await Empresa.delete(id);

      res.json({ message: 'Empresa deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      res.status(500).json({ error: 'Erro ao deletar empresa' });
    }
  }

  static async getEmpresa(req, res) {
    try {
      const { id } = req.params;

      const empresa = await Empresa.findById(id);
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      const stats = await Empresa.getStats(id);
      const diasFuncionamento = await Empresa.getDiasFuncionamento(id);
      const transacoes = await Transacao.findByEmpresa(id, { limit: 10 });

      res.json({
        empresa,
        stats,
        diasFuncionamento,
        transacoes
      });
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  }

  // ============ CONFIGURAÇÕES DO SISTEMA ============
  static async getConfiguracoes(req, res) {
    try {
      const configuracoes = await Configuracao.getAll();
      res.json({ configuracoes });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  }

  static async atualizarConfiguracoes(req, res) {
    try {
      const configs = req.body;

      await Configuracao.setMultiple(configs);

      res.json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }

  // ============ TRANSAÇÕES ============
  static async listarTransacoes(req, res) {
    try {
      const { empresa_id, tipo, status } = req.query;

      let transacoes;
      if (empresa_id) {
        transacoes = await Transacao.findByEmpresa(empresa_id, { tipo, status });
      } else {
        // Buscar todas as transações (implementar método no modelo se necessário)
        const resumo = await Transacao.getResumoSistema();
        transacoes = [];
      }

      res.json({ transacoes });
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      res.status(500).json({ error: 'Erro ao listar transações' });
    }
  }
}

module.exports = AdminController;
