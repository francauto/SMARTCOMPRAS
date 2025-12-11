# Etapa 1: Build
FROM node:22-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Limita o uso de memória do Node.js para 1.5GB
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências com limite de memória
RUN npm ci --only=production --maxsockets=1

# Copia o restante dos arquivos
COPY . .

# Build da aplicação Next.js com limite de memória
RUN npm run build

# Etapa 2: Produção
FROM node:22-alpine AS runner

# Define o diretório de trabalho
WORKDIR /app

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários do builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Define permissões
RUN chown -R nextjs:nodejs /app

# Muda para usuário não-root
USER nextjs

# Expõe a porta
EXPOSE 5173

# Define variável de ambiente para a porta
ENV PORT=5173
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
