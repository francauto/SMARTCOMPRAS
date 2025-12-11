#!/bin/bash
set -e

echo "=========================================="
echo "Inicializando banco de dados..."
echo "Database: ${MYSQL_DATABASE}"
echo "=========================================="

# O MySQL já cria o banco automaticamente via MYSQL_DATABASE
# Este script serve apenas para futuras customizações
