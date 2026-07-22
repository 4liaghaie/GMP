FROM nginx:1.29.8-alpine

RUN apk add --no-cache openssl

COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY 40-init-tls.sh /docker-entrypoint.d/40-init-tls.sh

RUN chmod +x /docker-entrypoint.d/40-init-tls.sh
