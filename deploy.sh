#!/usr/bin/env bash
# =============================================================================
# Chrono Clairvoyant — Deploy automatizzato
# =============================================================================
# Uso:
#   ./deploy.sh                    # deploy completo (pull + build + run)
#   ./deploy.sh --no-pull          # salta git pull (utile in CI)
#   ./deploy.sh --env /path/.env   # percorso env file custom
#
# Prerequisiti sul server:
#   - Docker >= 24
#   - docker compose (plugin V2)
#   - git
#   - Porta 80 e 443 aperte nel firewall
#   - Record DNS A del dominio puntato all'IP del server
# =============================================================================
set -euo pipefail

# ── Colori ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

log()   { echo -e "${CYAN}[$(date '+%H:%M:%S')] $*${RESET}"; }
ok()    { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓ $*${RESET}"; }
warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠ $*${RESET}"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ✗ $*${RESET}" >&2; exit 1; }

# ── Default ──────────────────────────────────────────────────────────────────
SKIP_PULL=false
ENV_FILE=".env.production"

# ── Argomenti ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-pull)  SKIP_PULL=true ;;
    --env)      ENV_FILE="$2"; shift ;;
    --help|-h)
      grep '^#' "$0" | grep -v '#!/' | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) warn "Argomento sconosciuto: $1" ;;
  esac
  shift
done

# ── Verifica prerequisiti ────────────────────────────────────────────────────
check_cmd() {
  command -v "$1" &>/dev/null || error "Comando '$1' non trovato. Installalo prima di procedere."
}
check_cmd docker
check_cmd git
docker compose version &>/dev/null || error "'docker compose' (plugin V2) non disponibile."

# ── Carica variabili d'ambiente ──────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  error "File env non trovato: $ENV_FILE\nCopia .env.production.example in $ENV_FILE e compila i valori."
fi

log "Carico variabili da $ENV_FILE"
set -o allexport
# shellcheck disable=SC1090
source "$ENV_FILE"
set +o allexport

# ── Validazione variabili obbligatorie ───────────────────────────────────────
REQUIRED_VARS=(DOMAIN VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY VITE_SUPABASE_PROJECT_ID)
for var in "${REQUIRED_VARS[@]}"; do
  [[ -z "${!var:-}" ]] && error "Variabile '$var' non impostata in $ENV_FILE"
done
ok "Variabili d'ambiente validate"

# ── Directory di lavoro = cartella dello script ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
log "Directory: $SCRIPT_DIR"

# ── Git pull ─────────────────────────────────────────────────────────────────
if [[ "$SKIP_PULL" == false ]]; then
  log "Aggiorno il repository..."
  git fetch --all --prune
  BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
  git pull origin "$BRANCH"
  COMMIT=$(git rev-parse --short HEAD)
  ok "Codice aggiornato → commit $COMMIT (branch $BRANCH)"
else
  warn "Git pull saltato (--no-pull)"
fi

# ── Build immagine Docker ─────────────────────────────────────────────────────
IMAGE="chrono-clairvoyant:latest"
BUILD_TAG="chrono-clairvoyant:$(git rev-parse --short HEAD 2>/dev/null || date +%s)"

log "Build immagine Docker..."
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
  --tag "$IMAGE" \
  --tag "$BUILD_TAG" \
  --file Dockerfile \
  . 2>&1 | sed 's/^/  /'

ok "Immagine costruita: $BUILD_TAG"

# ── Deploy con zero-downtime ──────────────────────────────────────────────────
log "Avvio container con docker compose..."
COMPOSE_ENV_FILE="$ENV_FILE" docker compose up -d --remove-orphans

# ── Health check ─────────────────────────────────────────────────────────────
log "Attendo che il container sia healthy..."
TIMEOUT=60
ELAPSED=0
while [[ $ELAPSED -lt $TIMEOUT ]]; do
  STATUS=$(docker compose ps --format json app 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health','unknown'))" 2>/dev/null \
    || echo "unknown")

  if [[ "$STATUS" == "healthy" ]]; then
    ok "Container healthy!"
    break
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

if [[ $ELAPSED -ge $TIMEOUT ]]; then
  warn "Health check timeout. Controlla i log: docker compose logs -f app"
fi

# ── Cleanup immagini vecchie ──────────────────────────────────────────────────
log "Rimuovo immagini dangling..."
docker image prune -f &>/dev/null && ok "Pulizia completata"

# ── Riepilogo ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  Deploy completato!${RESET}"
echo -e "${GREEN}  URL:    https://${DOMAIN}${RESET}"
echo -e "${GREEN}  Immagine: ${BUILD_TAG}${RESET}"
echo -e "${GREEN}  Log:   docker compose logs -f app${RESET}"
echo -e "${GREEN}════════════════════════════════════════════════════════${RESET}"
