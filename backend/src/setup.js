require('dotenv').config();

const UsuarioAdmin = require('./models/UsuarioAdmin');
const { up } = require('./migrations/004-multitenant');

async function setup() {
  console.log('🚀 Iniciando setup do sistema multi-tenant...\n');

  try {
    // Executar migrations
    console.log('📦 Executando migrations...');
    await up();
    console.log('✅ Migrations executadas com sucesso!\n');

    // Criar usuário admin padrão
    console.log('👤 Criando usuário admin padrão...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@agendaaqui.com.br';
    const adminSenha = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminNome = process.env.ADMIN_NAME || 'Administrador';

    // Verificar se já existe
    const adminExistente = await UsuarioAdmin.findByEmail(adminEmail);

    if (adminExistente) {
      console.log('⚠️  Usuário admin já existe:', adminEmail);
    } else {
      const admin = await UsuarioAdmin.create({
        nome: adminNome,
        email: adminEmail,
        senha: adminSenha,
        role: 'super_admin'
      });

      console.log('✅ Usuário admin criado com sucesso!');
      console.log('');
      console.log('📝 CREDENCIAIS DO ADMIN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminSenha}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
      console.log('');
    }

    console.log('');
    console.log('🎉 Setup concluído com sucesso!');
    console.log('');
    console.log('📌 Próximos passos:');
    console.log('   1. Acesse o painel admin em: https://seudominio.com/admin');
    console.log('   2. Faça login com as credenciais acima');
    console.log('   3. Configure a chave PIX do sistema em Configurações');
    console.log('   4. Cadastre sua primeira empresa');
    console.log('');
    console.log('💡 Para criar empresas:');
    console.log('   POST /api/admin/empresas');
    console.log('   {');
    console.log('     "nome": "Nome da Empresa",');
    console.log('     "slug": "slug-da-empresa",  // usado no subdomínio');
    console.log('     "email": "contato@empresa.com",');
    console.log('     "pix_key": "chave@pix.com",');
    console.log('     "pix_type": "email"  // cpf, cnpj, email, telefone, random');
    console.log('   }');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no setup:', error);
    process.exit(1);
  }
}

setup();
