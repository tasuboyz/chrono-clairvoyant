# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Dipendenze prima del codice (cache layer ottimizzato)
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Variabili d'ambiente Vite (baked-in a build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

COPY . .
RUN npm run build

# ─── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM caddy:2-alpine

# Copia file statici buildati
COPY --from=builder /app/dist /srv

# Copia configurazione Caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/robots.txt || exit 1
