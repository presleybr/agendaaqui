/**
 * Rotas de autenticação para usuários de empresas (Painel CRM)
 * Base: /api/empresa/auth
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authEmpresa } = require('../middleware/authEmpresa');

/**
 * POST /api/empresa/auth/login
 * Realizar login no painel da empresa
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário com dados da empresa
    const result = await db.query(`
      SELECT
        u.id, u.nome, u.email, u.senha_hash, u.role, u.ativo, u.primeiro_acesso,
        e.id as empresa_id, e.nome as empresa_nome, e.slug as empresa_slug,
        e.logo_url, e.cor_primaria, e.cor_secundaria, e.status as empresa_status
      FROM usuarios_empresa u
      JOIN empresas e ON u.empresa_id = e.id
      WHERE u.email = $1
    `, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      console.log(`Login falhou: email não encontrado - ${email}`);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const usuario = result.rows[0];

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário desativado. Entre em contato com o suporte.' });
    }

    // Verificar se empresa está ativa
    if (usuario.empresa_status !== 'ativo') {
      return res.status(401).json({
        error: 'Empresa inativa ou suspensa. Entre em contato com o suporte.',
        status: usuario.empresa_status
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      console.log(`Login falhou: senha incorreta - ${email}`);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Atualizar último acesso
    await db.query(
      'UPDATE usuarios_empresa SET ultimo_acesso = NOW() WHERE id = $1',
      [usuario.id]
    );

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        empresa_id: usuario.empresa_id,
        email: usuario.email,
        role: usuario.role,
        tipo: 'empresa' // Importante: diferencia de tokens de admin do sistema
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log de atividade (não bloqueante - erro aqui não deve impedir o login)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao, ip_address)
        VALUES ($1, $2, 'login', 'Login realizado com sucesso', $3)
      `, [usuario.empresa_id, usuario.id, req.ip]);
    } catch (logErr) {
      console.error('Erro ao registrar log de login (não bloqueante):', logErr.message);
    }

    console.log(`Login bem-sucedido: ${usuario.email} (empresa: ${usuario.empresa_nome})`);

    res.json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        primeiro_acesso: usuario.primeiro_acesso
      },
      empresa: {
        id: usuario.empresa_id,
        nome: usuario.empresa_nome,
        slug: usuario.empresa_slug,
        logo: usuario.logo_url,
        cor_primaria: usuario.cor_primaria,
        cor_secundaria: usuario.cor_secundaria
      }
    });

  } catch (err) {
    console.error('Erro no login empresa:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/empresa/auth/me
 * Verificar token e retornar dados do usuário logado
 */
router.get('/me', authEmpresa, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id, u.nome, u.email, u.role, u.primeiro_acesso, u.ultimo_acesso,
        e.id as empresa_id, e.nome as empresa_nome, e.slug,
        e.logo_url, e.cor_primaria, e.cor_secundaria
      FROM usuarios_empresa u
      JOIN empresas e ON u.empresa_id = e.id
      WHERE u.id = $1
    `, [req.usuarioEmpresa.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const data = result.rows[0];

    res.json({
      usuario: {
        id: data.id,
        nome: data.nome,
        email: data.email,
        role: data.role,
        primeiro_acesso: data.primeiro_acesso,
        ultimo_acesso: data.ultimo_acesso
      },
      empresa: {
        id: data.empresa_id,
        nome: data.empresa_nome,
        slug: data.slug,
        logo: data.logo_url,
        cor_primaria: data.cor_primaria,
        cor_secundaria: data.cor_secundaria
      }
    });

  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * POST /api/empresa/auth/alterar-senha
 * Alterar senha do usuário logado
 */
router.post('/alterar-senha', authEmpresa, async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (nova_senha.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
    }

    // Buscar senha atual
    const result = await db.query(
      'SELECT senha_hash FROM usuarios_empresa WHERE id = $1',
      [req.usuarioEmpresa.id]
    );

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senha_atual, result.rows[0].senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualizar senha
    const novaHash = await bcrypt.hash(nova_senha, 10);
    await db.query(
      'UPDATE usuarios_empresa SET senha_hash = $1, primeiro_acesso = false, updated_at = NOW() WHERE id = $2',
      [novaHash, req.usuarioEmpresa.id]
    );

    // Log (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao, ip_address)
        VALUES ($1, $2, 'alterar_senha', 'Senha alterada pelo usuário', $3)
      `, [req.empresa_id, req.usuarioEmpresa.id, req.ip]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

    res.json({ success: true, message: 'Senha alterada com sucesso' });

  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * POST /api/empresa/auth/verificar-email
 * Verifica se email existe e se é primeiro acesso
 */
router.post('/verificar-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await db.query(`
      SELECT
        u.id, u.nome, u.email, u.primeiro_acesso, u.ativo,
        e.id as empresa_id, e.nome as empresa_nome, e.status as empresa_status
      FROM usuarios_empresa u
      JOIN empresas e ON u.empresa_id = e.id
      WHERE u.email = $1
    `, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email não encontrado no sistema' });
    }

    const usuario = result.rows[0];

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }

    if (usuario.empresa_status !== 'ativo' && usuario.empresa_status !== 'trial') {
      return res.status(401).json({ error: 'Empresa inativa ou suspensa' });
    }

    res.json({
      existe: true,
      primeiro_acesso: usuario.primeiro_acesso,
      nome: usuario.nome,
      empresa_nome: usuario.empresa_nome
    });

  } catch (err) {
    console.error('Erro ao verificar email:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/empresa/auth/criar-senha
 * Criar senha no primeiro acesso
 */
router.post('/criar-senha', async (req, res) => {
  try {
    const { email, senha, confirmar_senha } = req.body;

    if (!email || !senha || !confirmar_senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (senha !== confirmar_senha) {
      return res.status(400).json({ error: 'As senhas não conferem' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Buscar usuário
    const result = await db.query(`
      SELECT
        u.id, u.primeiro_acesso, u.ativo,
        e.id as empresa_id, e.nome as empresa_nome, e.slug, e.status as empresa_status,
        e.logo_url, e.cor_primaria, e.cor_secundaria
      FROM usuarios_empresa u
      JOIN empresas e ON u.empresa_id = e.id
      WHERE u.email = $1
    `, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email não encontrado' });
    }

    const usuario = result.rows[0];

    if (!usuario.primeiro_acesso) {
      return res.status(400).json({ error: 'Senha já foi definida. Use o login normal.' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }

    if (usuario.empresa_status !== 'ativo' && usuario.empresa_status !== 'trial') {
      return res.status(401).json({ error: 'Empresa inativa ou suspensa' });
    }

    // Criar hash da senha
    const senha_hash = await bcrypt.hash(senha, 10);

    // Atualizar usuário
    await db.query(`
      UPDATE usuarios_empresa
      SET senha_hash = $1, primeiro_acesso = false, updated_at = NOW()
      WHERE id = $2
    `, [senha_hash, usuario.id]);

    // Buscar dados completos do usuário para gerar token
    const userResult = await db.query(
      'SELECT id, nome, email, role FROM usuarios_empresa WHERE id = $1',
      [usuario.id]
    );
    const userData = userResult.rows[0];

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        empresa_id: usuario.empresa_id,
        email: email.toLowerCase().trim(),
        role: userData.role,
        tipo: 'empresa'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao, ip_address)
        VALUES ($1, $2, 'criar_senha', 'Senha criada no primeiro acesso', $3)
      `, [usuario.empresa_id, usuario.id, req.ip]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

    console.log(`Primeiro acesso: senha criada para ${email} (empresa: ${usuario.empresa_nome})`);

    res.json({
      success: true,
      message: 'Senha criada com sucesso!',
      token,
      usuario: {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        role: userData.role,
        primeiro_acesso: false
      },
      empresa: {
        id: usuario.empresa_id,
        nome: usuario.empresa_nome,
        slug: usuario.slug,
        logo: usuario.logo_url,
        cor_primaria: usuario.cor_primaria,
        cor_secundaria: usuario.cor_secundaria
      }
    });

  } catch (err) {
    console.error('Erro ao criar senha:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/empresa/auth/logout
 * Registrar logout (o token é invalidado no cliente)
 */
router.post('/logout', authEmpresa, async (req, res) => {
  try {
    // Log de atividade (não bloqueante)
    try {
      await db.query(`
        INSERT INTO log_atividades_empresa (empresa_id, usuario_id, acao, descricao, ip_address)
        VALUES ($1, $2, 'logout', 'Logout realizado', $3)
      `, [req.empresa_id, req.usuarioEmpresa.id, req.ip]);
    } catch (logErr) {
      console.error('Erro ao registrar log (não bloqueante):', logErr.message);
    }

    res.json({ success: true, message: 'Logout realizado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * POST /api/empresa/auth/recuperar-senha
 * Solicitar recuperação de senha (envia email)
 */
router.post('/recuperar-senha', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se email existe
    const result = await db.query(
      'SELECT id, nome, empresa_id FROM usuarios_empresa WHERE email = $1 AND ativo = true',
      [email.toLowerCase().trim()]
    );

    // Sempre retorna sucesso para não revelar se email existe
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para recuperar a senha.'
      });
    }

    // TODO: Implementar envio de email com token de recuperação
    // Por enquanto, apenas loga
    console.log(`Solicitação de recuperação de senha para: ${email}`);

    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá instruções para recuperar a senha.'
    });

  } catch (err) {
    console.error('Erro na recuperação de senha:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
