# Correção de Permissões - Pastas PDFs e Uploads

## Problema
```
EACCES: permission denied, open '/app/pdfs/despesas_2221.pdf'
```

O container backend não consegue criar arquivos PDFs porque as pastas `uploads` e `pdfs` não têm permissão de escrita.

---

## Solução (Execute no servidor 211.2.100.245)

### 1. Acesse o servidor de produção via SSH:
```bash
ssh root@211.2.100.245
```

### 2. Navegue até a pasta do projeto:
```bash
cd /home/local
```

### 3. Pare o stack no Portainer (ou via docker-compose):
```bash
docker-compose -f smartcompras/docker-compose.yml down
```

### 4. Crie e corrija permissões das pastas:
```bash
# Criar pastas se não existirem
mkdir -p smartcompras/backend/uploads
mkdir -p smartcompras/backend/pdfs

# Dar permissão total (necessário porque o container usa UID node)
chmod -R 777 smartcompras/backend/uploads
chmod -R 777 smartcompras/backend/pdfs

# Verificar permissões
ls -la smartcompras/backend/ | grep -E "uploads|pdfs"
```

**Deve mostrar:**
```
drwxrwxrwx   2 root root    4096 Dec 11 16:30 pdfs
drwxrwxrwx   2 root root    4096 Dec 11 16:30 uploads
```

### 5. Suba o stack novamente:
```bash
docker-compose -f smartcompras/docker-compose.yml up -d
```

---

## Alternativa (Se preferir permissões mais seguras):

Em vez de `777`, você pode usar o UID do usuário node dentro do container:

```bash
# Descobrir o UID do node no container
docker run --rm smartcompras-backend id node

# Se retornar UID 1000, use:
chown -R 1000:1000 smartcompras/backend/uploads
chown -R 1000:1000 smartcompras/backend/pdfs
chmod -R 755 smartcompras/backend/uploads
chmod -R 755 smartcompras/backend/pdfs
```

---

## Verificar se funcionou:

Após reiniciar o container, tente imprimir novamente e monitore os logs:

```bash
docker logs -f smartcompras-backend
```

Deve aparecer:
```
✅ PDF gerado com sucesso: /app/pdfs/despesas_2221.pdf
🖨️ Enviando para impressora...
```
