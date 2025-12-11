#!/bin/bash
# ============================================
# Script para baixar e restaurar backup do MySQL
# ============================================

set -e

BACKUP_URL="http://console.minio.francautolabs.com.br/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2JhY2t1cHMvMjAyNS0xMi0xMVQxM18wMF8wMC4yMjVaLnNxbD9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPVk5VUxOU0pWRjQ3UkNBODdPMk9EJTJGMjAyNTEyMTElMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMjExVDE0MjIyNVomWC1BbXotRXhwaXJlcz00MzE5NiZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSlpPVlZNVGxOS1ZrWTBOMUpEUVRnM1R6SlBSQ0lzSW1WNGNDSTZNVGMyTlRVd05Ua3dNQ3dpY0dGeVpXNTBJam9pWVdSdGFXNGlmUS5GZFZOQWk2aWtQdWpPWDd2NFBFTEJJaVpUZ0lxSGpIMEVlSFdTZ3hNX3o3UXI1TFhLam9ScDRqdXN6a1llV1ZXOWVVQU9oRE9wbndZNXdHd0owYXYzZyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPTgxYjRiOWU1YmY2YWM4ZTQ5ZTE0Yzk4YjVmMmVmZGQxMTk5Y2IwNzk5OGE2ZWQ5YmRkZWI4NjNiM2MwYTE1OTc"
BACKUP_FILE="/docker-entrypoint-initdb.d/backup.sql"

echo "=========================================="
echo "Baixando backup do banco de dados..."
echo "=========================================="

# Baixa o backup
wget -O "$BACKUP_FILE" "$BACKUP_URL" || {
    echo "ERRO: Falha ao baixar o backup!"
    echo "Tentando usar backup local se existir..."
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "ERRO: Nenhum backup disponível!"
        exit 1
    fi
}

echo "=========================================="
echo "Backup baixado com sucesso!"
echo "Aguardando MySQL inicializar..."
echo "=========================================="

# Aguarda o MySQL estar pronto
until mysqladmin ping -h "localhost" -u "root" -p"${MYSQL_ROOT_PASSWORD}" --silent; do
    echo "Aguardando MySQL..."
    sleep 2
done

echo "=========================================="
echo "Importando backup para o banco de dados..."
echo "=========================================="

# Importa o backup
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$BACKUP_FILE"

echo "=========================================="
echo "Banco de dados restaurado com sucesso!"
echo "=========================================="

# Limpa o arquivo de backup para economizar espaço
rm -f "$BACKUP_FILE"

echo "Backup removido para economizar espaço."
