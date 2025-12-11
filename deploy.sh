#!/bin/bash
# ============================================
# Script de Deploy Rápido - SMARTCOMPRAS
# ============================================

set -e

echo "=========================================="
echo "🚀 SMARTCOMPRAS - Deploy Script"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    exit 1
fi

# Verifica se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado!${NC}"
    exit 1
fi

# Verifica se o arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado!${NC}"
    echo "Copiando .env.example para .env..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env com seus valores reais!${NC}"
    echo "Execute: nano .env"
    echo "Depois rode este script novamente."
    exit 1
fi

echo -e "${GREEN}✅ Docker e Docker Compose instalados${NC}"
echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
echo ""

# Pergunta se quer fazer pull das imagens
read -p "Deseja baixar as imagens base do Docker Hub? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Baixando imagens base..."
    docker-compose pull mysql
fi

echo ""
echo "=========================================="
echo "🏗️  Construindo e iniciando containers..."
echo "=========================================="

# Build e start
docker-compose up -d --build

echo ""
echo "=========================================="
echo "⏳ Aguardando serviços ficarem prontos..."
echo "=========================================="

# Aguarda MySQL
echo -n "Aguardando MySQL."
for i in {1..30}; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} --silent &> /dev/null; then
        echo -e "\n${GREEN}✅ MySQL pronto!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Aguarda Backend
echo -n "Aguardando Backend."
for i in {1..30}; do
    if docker-compose exec -T backend wget -qO- http://localhost:3000/api &> /dev/null; then
        echo -e "\n${GREEN}✅ Backend pronto!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Aguarda Frontend
echo -n "Aguardando Frontend."
for i in {1..30}; do
    if docker-compose exec -T frontend wget -qO- http://localhost:5173 &> /dev/null; then
        echo -e "\n${GREEN}✅ Frontend pronto!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "=========================================="
echo "📊 Status dos Containers"
echo "=========================================="
docker-compose ps

echo ""
echo "=========================================="
echo "🌐 Acesso aos Serviços"
echo "=========================================="
echo -e "${GREEN}Frontend:${NC}  http://localhost:5173"
echo -e "${GREEN}Backend:${NC}   http://localhost:3000/api"
echo -e "${GREEN}MySQL:${NC}     localhost:3306"
echo ""

echo "=========================================="
echo "📝 Comandos Úteis"
echo "=========================================="
echo "Ver logs:           docker-compose logs -f"
echo "Parar:              docker-compose stop"
echo "Reiniciar:          docker-compose restart"
echo "Parar e remover:    docker-compose down"
echo "Rebuild:            docker-compose up -d --build"
echo ""

echo -e "${GREEN}=========================================="
echo "✅ Deploy concluído com sucesso!"
echo "==========================================${NC}"
