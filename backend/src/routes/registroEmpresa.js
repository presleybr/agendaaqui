/**
 * Rota pública para auto-cadastro de empresas
 *
 * Permite que clientes criem suas próprias empresas
 * através de um link público (sem autenticação)
 *
 * POST /api/registro/empresa
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const Empresa = require('../models/Empresa');

/**
 * POST /api/registro/empresa
 * Cria uma nova empresa via auto-cadastro
 */
router.post('/empresa', async (req, res) => {
  try {
    const {
      // Etapa 1: Dados básicos
      nome,
      slug,
      cnpj,
      email,
      telefone,
      senha, // Senha criada pelo cliente

      // Etapa 2: Endereço
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,

      // Etapa 3: PIX
      chave_pix,
      tipo_chave_pix,

      // Etapa 4: Personalização
      descricao,
      cor_primaria,
      cor_secundaria,
      logo_url,

      // Etapa 5: Preços
      precos_vistoria,

      // Etapa 6: Horários
      horario_inicio,
      horario_fim,
      intervalo_minutos,
      dias_trabalho,

      // Etapa 7: Redes sociais (opcional)
      whatsapp,
      instagram_url,
      facebook_url
    } = req.body;

    // ============ VALIDAÇÕES ============

    // Campos obrigatórios
    if (!nome || !slug || !email || !chave_pix || !senha) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, slug, email, chave_pix, senha',
        campos_faltando: {
          nome: !nome,
          slug: !slug,
          email: !email,
          chave_pix: !chave_pix,
          senha: !senha
        }
      });
    }

    // Validar senha
    if (senha.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter no mínimo 6 caracteres',
        campo: 'senha'
      });
    }

    // Validar formato do slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: 'O endereço da sua página deve conter apenas letras minúsculas, números e hífen',
        campo: 'slug'
      });
    }

    // Verificar se slug já existe
    const empresaExistente = await Empresa.findBySlug(slug);
    if (empresaExistente) {
      return res.status(400).json({
        error: 'Este endereço já está em uso. Escolha outro.',
        campo: 'slug'
      });
    }

    // Verificar se email já existe
    const emailExistente = await db.query(
      'SELECT id FROM empresas WHERE email = $1',
      [email]
    );
    if (emailExistente.rows.length > 0) {
      return res.status(400).json({
        error: 'Este email já está cadastrado. Faça login ou use outro email.',
        campo: 'email'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido',
        campo: 'email'
      });
    }

    // Validar CNPJ se fornecido
    if (cnpj) {
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      if (cnpjLimpo.length !== 14) {
        return res.status(400).json({
          error: 'CNPJ inválido',
          campo: 'cnpj'
        });
      }

      // Verificar se CNPJ já existe
      const cnpjExistente = await db.query(
        'SELECT id FROM empresas WHERE cnpj = $1',
        [cnpj]
      );
      if (cnpjExistente.rows.length > 0) {
        return res.status(400).json({
          error: 'Este CNPJ já está cadastrado',
          campo: 'cnpj'
        });
      }
    }

    // ============ CRIAR EMPRESA ============

    console.log('📝 Novo cadastro de empresa:', nome);

    const empresa = await Empresa.create({
      nome,
      slug,
      cnpj: cnpj || null,
      email,
      telefone: telefone || null,

      // Endereço
      cep: cep || null,
      endereco: endereco ? `${endereco}${numero ? ', ' + numero : ''}${complemento ? ' - ' + complemento : ''}` : null,
      cidade: cidade || null,
      estado: estado || null,

      // PIX
      chave_pix,

      // Personalização
      descricao: descricao || null,
      cor_primaria: cor_primaria || '#2563eb',
      cor_secundaria: cor_secundaria || '#1e40af',
      logo_url: logo_url || null,

      // Horários
      horario_inicio: horario_inicio || '08:00',
      horario_fim: horario_fim || '18:00',
      intervalo_minutos: intervalo_minutos || 60,
      dias_trabalho: dias_trabalho || '1,2,3,4,5,6',

      // Redes sociais
      whatsapp: whatsapp || null,
      whatsapp_numero: whatsapp ? whatsapp.replace(/\D/g, '') : null,
      instagram_url: instagram_url || null,
      facebook_url: facebook_url || null,

      // Status inicial
      status: 'ativo',
      plano: 'basico',

      // Comissão padrão
      percentual_plataforma: 500 // R$ 5,00
    });

    console.log('✅ Empresa criada:', empresa.id);

    // ============ CRIAR PREÇOS DE VISTORIA ============

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
        `, [
          empresa.id,
          preco.categoria,
          preco.nome_exibicao || preco.categoria,
          preco.descricao || '',
          preco.preco,
          preco.ordem || 0
        ]);
      }
      console.log('✅ Preços de vistoria criados');
    } else {
      // Criar preços padrão
      const precosPadrao = [
        { categoria: 'cautelar', nome: 'Vistoria Cautelar', preco: 15000, ordem: 1 },
        { categoria: 'transferencia', nome: 'Transferência', preco: 12000, ordem: 2 },
        { categoria: 'revistoria', nome: 'Revistoria', preco: 10000, ordem: 3 }
      ];

      for (const preco of precosPadrao) {
        await db.query(`
          INSERT INTO precos_vistoria (empresa_id, categoria, nome_exibicao, preco, ordem, ativo)
          VALUES ($1, $2, $3, $4, $5, true)
          ON CONFLICT (empresa_id, categoria) DO NOTHING
        `, [empresa.id, preco.categoria, preco.nome, preco.preco, preco.ordem]);
      }
      console.log('✅ Preços padrão criados');
    }

    // ============ CRIAR USUÁRIO ADMIN ============

    const senhaHash = await bcrypt.hash(senha, 10);
    const nomeUsuario = nome.split(' ')[0] + ' Admin';

    const usuarioResult = await db.query(`
      INSERT INTO usuarios_empresa (empresa_id, nome, email, senha_hash, role, ativo, primeiro_acesso)
      VALUES ($1, $2, $3, $4, 'admin', true, false)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, nome, email, role
    `, [empresa.id, nomeUsuario, email, senhaHash]);

    const usuarioCriado = usuarioResult.rows[0];
    console.log('✅ Usuário admin criado:', usuarioCriado?.email);

    // ============ RESPOSTA DE SUCESSO ============

    res.status(201).json({
      success: true,
      message: 'Empresa cadastrada com sucesso!',
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        slug: empresa.slug,
        email: empresa.email
      },
      urls: {
        pagina_publica: `https://agendaaquivistorias.com.br/${slug}`,
        painel_admin: `https://agendaaquivistorias.com.br/painel-empresa.html`
      },
      acesso: {
        email: email,
        mensagem: 'Use a senha que você criou durante o cadastro'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao registrar empresa:', error);
    res.status(500).json({
      error: 'Erro ao cadastrar empresa. Tente novamente.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/registro/verificar-slug/:slug
 * Verifica se um slug está disponível
 */
router.get('/verificar-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Validar formato
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.json({
        disponivel: false,
        erro: 'Use apenas letras minúsculas, números e hífen'
      });
    }

    // Verificar se existe
    const empresa = await Empresa.findBySlug(slug);

    res.json({
      slug,
      disponivel: !empresa,
      url_preview: !empresa ? `agendaaquivistorias.com.br/${slug}` : null
    });

  } catch (error) {
    console.error('Erro ao verificar slug:', error);
    res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
  }
});

/**
 * GET /api/registro/verificar-email/:email
 * Verifica se um email já está cadastrado
 */
router.get('/verificar-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await db.query(
      'SELECT id FROM empresas WHERE email = $1',
      [email]
    );

    res.json({
      email,
      disponivel: result.rows.length === 0
    });

  } catch (error) {
    console.error('Erro ao verificar email:', error);
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
});

/**
 * GET /api/registro/buscar-cep/:cep
 * Busca endereço pelo CEP
 */
router.get('/buscar-cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params;
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido' });
    }

    // Usar API ViaCEP
    const fetch = require('node-fetch');
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();

    if (data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado' });
    }

    res.json({
      cep: data.cep,
      endereco: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf
    });

  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    res.status(500).json({ error: 'Erro ao buscar CEP' });
  }
});

module.exports = router;
