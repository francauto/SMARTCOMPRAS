# 🚀 DEPLOY PORTAINER - SMARTCOMPRAS

## ✅ PASSO A PASSO SIMPLIFICADO

### 1️⃣ Acesse o Portainer
- URL: `http://seu-servidor:9000`
- Faça login

### 2️⃣ Criar Stack
- Menu **Stacks** → **+ Add stack**
- Nome: `smartcompras`
- Build method: **Web editor**

### 3️⃣ Cole o docker-compose.yml
Copie TODO o conteúdo do arquivo `docker-compose.yml` e cole no editor.

### 4️⃣ Configure Variáveis (Advanced mode)
Em **Environment variables**, selecione **Advanced mode** e cole:

```env
MYSQL_ROOT_PASSWORD=Fr@nc@ut00132!
MYSQL_DATABASE=smartcompras
MYSQL_USER=smartcompras_user
MYSQL_PASSWORD=Fr@nc@ut00132!
JWT_SECRET=18aa35b55c07eb41059a43b775adac8e
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM=SmartCompras <seu-email@gmail.com>
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
GOOGLE_AI_API_KEY=
BESTDRIVE_API_URL=
BESTDRIVE_API_KEY=
```

**⚠️ IMPORTANTE: Substitua:**
- `seu-email@gmail.com` → Seu email real
- `sua-senha-de-app` → Senha de app do Gmail

**ℹ️ NOTA:** A comunicação frontend ↔ backend é **interna** via `http://backend:3000`

### 5️⃣ Deploy
- Clique em **Deploy the stack**
- Aguarde 2-5 minutos

### 6️⃣ Acessar
- Frontend: `http://SEU_IP:5173`
- Backend: `http://SEU_IP:3000/api`

---

## 📝 NOTAS IMPORTANTES

### Comunicação Interna:
- Frontend → Backend: `http://backend:3000` (rede Docker interna)
- Você **NÃO** precisa configurar IP externo
- Tudo funciona automaticamente dentro da rede `smartcompras-network`

### Gmail - Senha de App:
1. https://myaccount.google.com/apppasswords
2. Gere senha de 16 caracteres
3. Use em `EMAIL_PASSWORD`

### Portas expostas:
- `3000` → Backend API
- `5173` → Frontend
- `3306` → MySQL (apenas admin)

---

## ✅ Pronto!
Após o deploy, acesse `http://SEU_IP:5173` e faça login.
