#!/usr/bin/env bash
# Sobe o app para teste em celular físico (WSL2), sem depender do tunnel ngrok do Expo:
# 1. abre um tunnel Cloudflare para o backend local (API)
# 2. abre um tunnel Cloudflare para o Metro bundler
# 3. inicia o Expo com EXPO_PUBLIC_API_URL apontando para o tunnel da API
# No Expo Go, abra a URL exps:// impressa no final.
set -euo pipefail

API_PORT="${API_PORT:-3001}"
METRO_PORT="${METRO_PORT:-8081}"

if ! curl -s --max-time 3 -o /dev/null "http://localhost:$API_PORT"; then
    echo "⚠ Backend não está respondendo em localhost:$API_PORT — suba a API antes."
    exit 1
fi

BIN="$HOME/.local/bin/cloudflared"
CLOUDFLARED="$(command -v cloudflared || true)"
if [ -z "$CLOUDFLARED" ]; then
    if [ ! -x "$BIN" ]; then
        echo "Baixando cloudflared..."
        mkdir -p "$HOME/.local/bin"
        curl -sL -o "$BIN" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
        chmod +x "$BIN"
    fi
    CLOUDFLARED="$BIN"
fi

wait_url() {
    local log=$1 url=""
    for _ in $(seq 1 30); do
        url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$log" | head -1 || true)"
        if [ -n "$url" ]; then echo "$url"; return 0; fi
        sleep 1
    done
    return 1
}

API_LOG="$(mktemp)"
METRO_LOG="$(mktemp)"

"$CLOUDFLARED" tunnel --url "http://localhost:$API_PORT" --no-autoupdate >"$API_LOG" 2>&1 &
API_PID=$!
"$CLOUDFLARED" tunnel --url "http://localhost:$METRO_PORT" --no-autoupdate >"$METRO_LOG" 2>&1 &
METRO_PID=$!
trap 'kill "$API_PID" "$METRO_PID" 2>/dev/null || true' EXIT

echo "Aguardando tunnels do Cloudflare..."
API_URL="$(wait_url "$API_LOG")"  || { echo "✗ Tunnel da API falhou:";   cat "$API_LOG";   exit 1; }
METRO_URL="$(wait_url "$METRO_LOG")" || { echo "✗ Tunnel do Metro falhou:"; cat "$METRO_LOG"; exit 1; }

METRO_HOST="${METRO_URL#https://}"

echo ""
echo "════════════════════════════════════════════════════"
echo "✓ API:   $API_URL/api"
echo "✓ Metro: $METRO_URL"
echo ""
echo "📱 No Expo Go, abra (Enter URL manually):"
echo ""
echo "    exps://$METRO_HOST"
echo ""
echo "════════════════════════════════════════════════════"
echo ""

EXPO_PUBLIC_API_URL="$API_URL/api" EXPO_PACKAGER_PROXY_URL="$METRO_URL" npx expo start --port "$METRO_PORT"
