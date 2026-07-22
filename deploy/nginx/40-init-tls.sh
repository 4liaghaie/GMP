#!/bin/sh
set -eu

TLS_DIR=/etc/nginx/tls
CERT_FILE="$TLS_DIR/fullchain.pem"
KEY_FILE="$TLS_DIR/privkey.pem"

mkdir -p "$TLS_DIR"

# Let Nginx start before the first ACME certificate has been issued.
if [ ! -s "$CERT_FILE" ] || [ ! -s "$KEY_FILE" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=${DOMAIN:-localhost}" >/dev/null 2>&1
  chmod 600 "$KEY_FILE"
  chmod 644 "$CERT_FILE"
fi

# Certbot atomically replaces these files. Reload Nginx when their checksum changes.
(
  checksum="$(sha256sum "$CERT_FILE" "$KEY_FILE")"
  while sleep 60; do
    next_checksum="$(sha256sum "$CERT_FILE" "$KEY_FILE" 2>/dev/null || true)"
    if [ -n "$next_checksum" ] && [ "$next_checksum" != "$checksum" ]; then
      checksum="$next_checksum"
      nginx -s reload
    fi
  done
) &
