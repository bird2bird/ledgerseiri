#!/usr/bin/env bash
set -euo pipefail

# ========= Config =========
REPO_URL="https://github.com/bird2bird/ledgerseiri.git"
APP_DIR="/opt/ledgerseiri/apps/web-static"
NGINX_SITE_AVAIL="/etc/nginx/sites-available/ledgerseiri"
NGINX_SITE_EN="/etc/nginx/sites-enabled/ledgerseiri"
DOMAIN_MAIN="ledgerseiri.com"
DOMAIN_WWW="www.ledgerseiri.com"

# Certbot default path (already issued)
CERT_FULLCHAIN="/etc/letsencrypt/live/${DOMAIN_MAIN}/fullchain.pem"
CERT_PRIVKEY="/etc/letsencrypt/live/${DOMAIN_MAIN}/privkey.pem"

echo "==> [1/7] Prepare directories"
sudo mkdir -p "$(dirname "$APP_DIR")"
sudo chown -R "$USER:$USER" /opt/ledgerseiri

echo "==> [2/7] Clone or update repo"
if [ ! -d "$APP_DIR/.git" ]; then
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch --all --prune
  git -C "$APP_DIR" reset --hard origin/main || git -C "$APP_DIR" reset --hard origin/master
fi

echo "==> [3/7] Basic sanity check"
test -f "$APP_DIR/index.html" || { echo "ERROR: index.html not found in $APP_DIR"; exit 1; }

echo "==> [4/7] Write Nginx site config (static + reserved /api/)"
# Backup old config if exists
if [ -f "$NGINX_SITE_AVAIL" ]; then
  sudo cp -a "$NGINX_SITE_AVAIL" "${NGINX_SITE_AVAIL}.$(date +%Y%m%d%H%M%S).bak"
fi

sudo tee "$NGINX_SITE_AVAIL" >/dev/null <<EOF
# --- HTTP: redirect to HTTPS ---
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_MAIN} ${DOMAIN_WWW};
  return 301 https://${DOMAIN_MAIN}\$request_uri;
}

# --- HTTPS: www -> apex redirect (recommended) ---
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_WWW};

  ssl_certificate     ${CERT_FULLCHAIN};
  ssl_certificate_key ${CERT_PRIVKEY};

  return 301 https://${DOMAIN_MAIN}\$request_uri;
}

# --- HTTPS: main site ---
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_MAIN};

  ssl_certificate     ${CERT_FULLCHAIN};
  ssl_certificate_key ${CERT_PRIVKEY};

  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;

  root ${APP_DIR};
  index index.html;

  # Reserved API prefix (no backend yet)
  location /api/ {
    return 404;
  }

  # Static routing + SPA fallback
  location / {
    try_files \$uri \$uri/ /index.html;
  }

  # Cache static assets
  location ~* \\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?)\$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
    try_files \$uri =404;
  }
}
EOF

echo "==> [5/7] Enable site + disable default"
sudo ln -sf "$NGINX_SITE_AVAIL" "$NGINX_SITE_EN"
sudo rm -f /etc/nginx/sites-enabled/default || true

echo "==> [6/7] Nginx config test + reload"
sudo nginx -t
sudo systemctl reload nginx

echo "==> [7/7] Smoke test"
curl -I "https://${DOMAIN_MAIN}/" | head -n 5
echo "OK. Static site deployed from: ${APP_DIR}"
