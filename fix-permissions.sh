#!/bin/bash

# Script para corrigir permissões das pastas pdfs e uploads no servidor de produção
# Execute no servidor 211.2.100.245 onde o Portainer está rodando

echo "🔧 Corrigindo permissões das pastas uploads e pdfs..."

# Caminho base do projeto (ajuste conforme necessário)
PROJECT_PATH="/home/local/smartcompras"

# Criar pastas se não existirem
mkdir -p "${PROJECT_PATH}/backend/uploads"
mkdir -p "${PROJECT_PATH}/backend/pdfs"

# Dar permissão total para o usuário node (UID 1000 normalmente)
# ou permissão 777 temporariamente
chmod -R 777 "${PROJECT_PATH}/backend/uploads"
chmod -R 777 "${PROJECT_PATH}/backend/pdfs"

# Verificar permissões
echo ""
echo "📋 Permissões atuais:"
ls -la "${PROJECT_PATH}/backend/" | grep -E "uploads|pdfs"

echo ""
echo "✅ Permissões corrigidas!"
echo ""
echo "⚠️  Agora recrie o container backend no Portainer:"
echo "   docker-compose down backend"
echo "   docker-compose up -d backend"
