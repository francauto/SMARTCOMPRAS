# 🐳 SMARTCOMPRAS - Docker Stack Complete

Sistema completo com Frontend (Next.js), Backend (Node.js/Express) e MySQL com restore automático de backup.

---

## 🚀 Deploy Rápido no Portainer

### Arquivos Importantes:
- **`docker-compose.yml`** → Cole no Portainer Stack Editor
- **`portainer.env`** → Variáveis de ambiente (cole no Advanced mode)
- **`PORTAINER-ENV.md`** → Instruções detalhadas das variáveis

### Passos:

1. **Portainer** → **Stacks** → **Add Stack**
2. Nome: `smartcompras`
3. Cole o conteúdo de `docker-compose.yml`
4. Em **Environment variables**, modo **Advanced**, cole o conteúdo de `portainer.env` (editado com seus valores)
5. **Deploy the stack**
6. Aguarde 2-5 minutos
7. Acesse: `http://SEU_IP:5173`

📖 **Leia `PORTAINER-ENV.md` para instruções detalhadas das variáveis!**

---

## 🖥️ Deploy Local (Docker Compose)

### **Produção:**
```bash
# 1. Configure suas variáveis
cp .env.example .env
nano .env  # Edite com seus valores

# 2. Execute o script de deploy
chmod +x deploy.sh
./deploy.sh

# OU manualmente:
docker-compose up -d --build
```

### **Desenvolvimento (Backend no Docker, Frontend local):**
```bash
# 1. Suba backend + MySQL
docker-compose -f docker-compose.dev.yml up -d

# 2. Rode frontend local com hot reload
cd frontend
npm install
npm run dev
```

📖 **Veja `DEVELOPMENT.md` para guia completo de desenvolvimento local!**

---

## 📦 O que está incluído:

### Serviços:
- ✅ **MySQL 8.4** com restore automático do backup
- ✅ **Backend API** (Node.js + TypeScript + Express)
- ✅ **Frontend** (Next.js 16 + React 18)

### Features:
- ✅ Health checks em todos os serviços
- ✅ Volumes persistentes (dados do MySQL)
- ✅ Restart automático
- ✅ Network isolada
- ✅ Build otimizado multi-stage
- ✅ Usuários não-root (segurança)

---

## 🗄️ Backup Automático

O sistema automaticamente:
1. Baixa o backup do MinIO na primeira inicialização
2. Restaura no banco de dados MySQL
3. Remove o arquivo após restauração

**Script:** `init-db/01-download-backup.sh`

---

## 🌐 Portas Expostas

| Serviço  | Porta |
|----------|-------|
| Frontend | 5173  |
| Backend  | 3000  |
| MySQL    | 3306  |

---

## 📚 Documentação

- **`PORTAINER.md`** → Guia completo para Portainer
- **`PORTAINER-ENV.md`** → Como configurar variáveis de ambiente
- **`README.Docker.md`** → Guia detalhado Docker Compose
- **`DEVELOPMENT.md`** → Guia de desenvolvimento local (HOT RELOAD)
- **`.env.example`** → Template de variáveis de ambiente

---

## 🔧 Comandos Úteis

```bash
# Ver status
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f backend

# Reiniciar
docker-compose restart

# Parar
docker-compose stop

# Parar e remover (mantém volumes)
docker-compose down

# Parar e remover TUDO (incluindo dados!)
docker-compose down -v

# Rebuild após alterações
docker-compose up -d --build
```

---

## 🔐 Segurança

### Antes de usar em produção:

- [ ] Altere TODAS as senhas padrão
- [ ] Gere JWT_SECRET forte: `openssl rand -base64 32`
- [ ] Configure HTTPS (Nginx Proxy Manager)
- [ ] Configure firewall (apenas portas necessárias)
- [ ] Não exponha MySQL (porta 3306) publicamente
- [ ] Configure backups automáticos
- [ ] Use senhas de aplicativo para email

---

## 🎯 Estrutura de Arquivos

```
SMARTCOMPRAS/
├── docker-compose.yml          # Orquestração dos containers
├── .env.example                # Template de variáveis
├── portainer.env               # Variáveis para Portainer
├── deploy.sh                   # Script de deploy automático
├── init-db/
│   ├── 01-download-backup.sh   # Download e restore do backup
│   └── .gitkeep
├── backend/
│   ├── Dockerfile              # Build da API
│   ├── .dockerignore
│   ├── src/
│   ├── uploads/                # Arquivos enviados
│   └── pdfs/                   # PDFs gerados
├── frontend/
│   ├── Dockerfile              # Build do Next.js
│   ├── .dockerignore
│   └── src/
├── PORTAINER.md               # Guia Portainer
├── PORTAINER-ENV.md           # Guia de variáveis
└── README.Docker.md           # Documentação completa
```

---

## 📊 Verificar Status dos Serviços

### Health Checks:

Todos os serviços têm health checks automáticos:

```bash
# Ver status de saúde
docker inspect smartcompras-mysql | grep -A 5 Health
docker inspect smartcompras-backend | grep -A 5 Health
docker inspect smartcompras-frontend | grep -A 5 Health
```

### Testar Endpoints:

```bash
# Backend API
curl http://localhost:3000/api

# Frontend
curl http://localhost:5173

# MySQL
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

---

## 🐛 Troubleshooting Rápido

### Container não inicia:
```bash
docker-compose logs nome-do-servico
```

### Banco não conecta:
```bash
# Teste conexão
docker-compose exec mysql mysqladmin ping -u root -p

# Verifique se o banco existe
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

### Frontend não acessa Backend:
1. Verifique `NEXT_PUBLIC_API_URL` no .env
2. Use IP real do servidor, não `localhost`
3. Teste: `curl http://SEU_IP:3000/api`

---

## 🔄 Atualizar Aplicação

```bash
# 1. Parar containers
docker-compose down

# 2. Atualizar código (git pull, etc)
git pull

# 3. Rebuild e restart
docker-compose up -d --build

# 4. Verificar logs
docker-compose logs -f
```

---

## 📞 Suporte

Para problemas:
1. Verifique os logs: `docker-compose logs -f`
2. Consulte a documentação específica:
   - `PORTAINER.md` para Portainer
   - `README.Docker.md` para Docker Compose
3. Verifique health checks dos containers

---

## ⚡ Quick Start

### Portainer (Recomendado):
1. Abra `PORTAINER-ENV.md`
2. Copie as variáveis e substitua os valores
3. Cole no Portainer
4. Deploy!

### Docker Compose:
```bash
cp .env.example .env
nano .env  # Edite
./deploy.sh
```

---

**Desenvolvido com ❤️ pela equipe SmartCompras**

**Stack:** Next.js 16 + Node.js 22 + MySQL 8.4 + Docker
