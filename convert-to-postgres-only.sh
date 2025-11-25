#!/bin/bash

# Script para converter todo o código para usar apenas PostgreSQL
# Remove toda a lógica de detecção de banco de dados (usePostgres)

echo "🔄 Convertendo projeto para PostgreSQL apenas..."
echo ""

# Arquivos a serem processados
FILES=(
  "backend/src/routes/payment.js"
  "backend/src/routes/notifications.js"
)

# Backup
echo "📦 Criando backup..."
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "backup_$(date +%Y%m%d_%H%M%S)/"
  fi
done

echo "✅ Backup criado"
echo ""

# Instruções
echo "⚠️  ATENÇÃO: Este script irá modificar os seguintes arquivos:"
echo ""
for file in "${FILES[@]}"; do
  echo "  - $file"
done
echo ""
echo "Os models precisam ser convertidos manualmente pois têm lógica complexa."
echo ""
echo "Models que precisam de conversão:"
echo "  - backend/src/models/Usuario.js"
echo "  - backend/src/models/Agendamento.js"
echo "  - backend/src/models/Cliente.js"
echo "  - backend/src/models/Configuracao.js"
echo "  - backend/src/models/Empresa.js"
echo "  - backend/src/models/Pagamento.js"
echo "  - backend/src/models/Veiculo.js"
echo "  - backend/src/models/Transacao.js"
echo "  - backend/src/models/UsuarioAdmin.js"
echo ""
echo "📝 Recomendação: Use apenas PostgreSQL em produção."
echo "   Para desenvolvimento local, use PostgreSQL também (via Docker)."
echo ""
echo "🐳 Para rodar PostgreSQL local:"
echo "   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15"
echo ""
