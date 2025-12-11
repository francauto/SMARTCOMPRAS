# ============================================
# BACKEND DOCKERFILE - SMARTCOMPRAS
# ============================================

# Etapa 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências do sistema necessárias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configura Puppeteer para usar o Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Instala TypeScript e dependências de build
RUN npm install -D typescript ts-node @types/node

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# ============================================
# Etapa 2: Produção
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Instala dependências do sistema para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget

# Configura Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backenduser

# Copia node_modules do builder
COPY --from=builder /app/node_modules ./node_modules

# Copia código compilado
COPY --from=builder /app/dist ./dist

# Copia arquivos necessários
COPY --from=builder /app/package*.json ./

# Cria diretórios para uploads e PDFs
RUN mkdir -p uploads pdfs && \
    chown -R backenduser:nodejs /app

# Muda para usuário não-root
USER backenduser

# Expõe a porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

# Comando para iniciar
CMD ["node", "dist/server.js"]
