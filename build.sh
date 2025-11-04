#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Iniciando build do projeto..."

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

# Detectar qual banco usar (PostgreSQL se DATABASE_URL existe, senão SQLite)
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️ Detectado PostgreSQL (DATABASE_URL configurado)"
  echo "🗄️ Executando migrações para PostgreSQL..."
  npm run migrate:postgres
else
  echo "🗄️ Detectado SQLite (DATABASE_URL não configurado)"
  echo "🗄️ Executando migrações para SQLite..."
  npm run migrate

  # Criar usuário admin inicial (só para SQLite, PostgreSQL já cria no migrate)
  echo "👤 Criando usuário admin inicial..."
  npm run seed
fi

# Voltar para a raiz e instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd ../frontend
npm install

# Build do frontend
echo "🏗️ Fazendo build do frontend..."
npm run build

echo "✅ Build concluído com sucesso!"
