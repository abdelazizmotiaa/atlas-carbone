# =============================================================
# Atlas Carbone - Dockerfile Multi-Stage Production
# =============================================================

# Étape 1 : Build du client React / Vite
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Étape 2 : Production Runner Node.js 22
FROM node:22-alpine AS runner
WORKDIR /app

# Dépendances système minimales
RUN apk add --no-cache curl tzdata
ENV TZ=Africa/Casablanca
ENV NODE_ENV=production
ENV PORT=5000

# Copie du backend
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

COPY server/ ./
COPY --from=client-builder /app/client/dist /app/client/dist
COPY data/catalog_seed.json /app/data/catalog_seed.json

# Volume persistant pour la base de données SQLite WAL et les uploads
VOLUME ["/app/server/data", "/app/server/uploads"]

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "--loader", "tsx", "src/server.ts"]
