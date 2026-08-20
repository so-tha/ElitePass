#!/bin/bash

# Script para corrigir permissões do Docker

echo "🔧 Corrigindo permissões do Docker..."

# Opção 1: Adicionar usuário atual ao grupo docker
echo "1️⃣  Adicionando $USER ao grupo docker..."
sudo usermod -aG docker $USER

# Opção 2: Iniciar o daemon Docker se não estiver rodando
echo "2️⃣  Garantindo que Docker está rodando..."
sudo systemctl start docker || sudo service docker start

# Opção 3: Aplicar novo grupo sem fazer logout
echo "3️⃣  Ativando novo grupo..."
newgrp docker

echo ""
echo "✅ Permissões corrigidas!"
echo ""
echo "Se ainda não funcionar:"
echo "  1. Faça logout e login novamente"
echo "  2. Ou use: sudo bash docker-init.sh"
echo ""
echo "Testando Docker..."
docker ps
