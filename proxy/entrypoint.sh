#!/bin/sh
set -e
CERT_DIR="/etc/nginx/certs"
CERT_KEY="$CERT_DIR/selfsigned.key"
CERT_CRT="$CERT_DIR/selfsigned.crt"

if [ ! -f "$CERT_KEY" ] || [ ! -f "$CERT_CRT" ]; then
  echo "Generating self-signed certificate..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$CERT_KEY" \
    -out "$CERT_CRT" \
    -subj "/CN=localhost"
else
  echo "Certificate already exists; skipping."
fi

exec nginx -g "daemon off;"