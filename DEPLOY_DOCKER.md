# Production Docker deployment for gomrokmp.com

This stack runs PostgreSQL, Django/Gunicorn, Next.js, Nginx, and Certbot in Docker. Only Nginx publishes host ports. HTTP is redirected to HTTPS, and Certbot renews the Let’s Encrypt certificate automatically.

## 1. Configure DNS

Create these DNS records before starting the stack:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `194.48.198.250` |
| A | `www` | `194.48.198.250` |

Remove conflicting `A` or `AAAA` records. Verify both names resolve to the VPS:

```bash
dig +short gomrokmp.com A
dig +short www.gomrokmp.com A
```

Both commands must return `194.48.198.250`. Let’s Encrypt cannot issue the certificate until public DNS is correct and port 80 reaches this VPS.

## 2. Stop the old host Nginx

The Docker Nginx service owns ports 80 and 443. Disable the existing host service before deployment:

```bash
sudo nginx -t
sudo systemctl disable --now nginx
sudo ss -ltnp | grep -E ':80|:443'
```

The final command should not show another process listening on ports 80 or 443.

## 3. Create production environment files

For a fresh deployment, create the files from the templates:

```bash
cp .env.docker.example .env
cp backend/.env.docker.example backend/.env.docker
```

For an existing deployment, do not overwrite the current `.env` files. Keep the existing `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` values so the application continues using the current database. Add the new `DOMAIN`, `LETSENCRYPT_EMAIL`, HTTPS URL, and Django security variables manually.

Generate secrets containing URL-safe hexadecimal characters:

```bash
openssl rand -hex 32
openssl rand -hex 48
```

Edit `.env`:

```dotenv
DOMAIN=gomrokmp.com
LETSENCRYPT_EMAIL=YOUR_REAL_EMAIL

POSTGRES_DB=gmp
POSTGRES_USER=gmp
POSTGRES_PASSWORD=PASTE_THE_32_BYTE_VALUE

PYPI_INDEX_URL=https://pypi.org/simple
NEXT_PUBLIC_API_BASE=https://gomrokmp.com/api
NEXT_PUBLIC_RUBIKA_LINK=YOUR_FULL_RUBIKA_LINK
NEXT_PUBLIC_BALE_USERNAME=YOUR_BALE_USERNAME
MEDIA_HOST_PATH=/var/www/gmp-media
```

Edit `backend/.env.docker` and replace `DJANGO_SECRET_KEY` with the generated 48-byte value. Keep `DJANGO_DEBUG=0`. Never commit either production environment file.

Before changing an existing deployment, take a database backup using its current container and credentials. With the old default setup this is typically:

```bash
mkdir -p backups
docker exec reged-db pg_dump -U postgres -d customs_dev -Fc > backups/before-https.dump
```

Adjust the container, user, and database names if your existing `.env` uses different values. Confirm the backup file is not empty before continuing.

## 4. Prepare uploaded media

```bash
sudo mkdir -p /var/www/gmp-media
sudo find /var/www/gmp-media -type d -exec chmod 755 {} \;
sudo find /var/www/gmp-media -type f -exec chmod 644 {} \;
```

If uploads still exist only inside an old container, copy them before removing it:

```bash
docker cp reged-backend:/app/media/. /var/www/gmp-media/
```

## 5. Open the firewall

Keep SSH open and expose only web traffic. Ports 3000, 8000, and 5432 must not be publicly accessible:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 6. Validate and deploy

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

Nginx starts with a one-day temporary certificate. Certbot then requests the trusted certificate using the HTTP webroot challenge and Nginx reloads automatically after the certificate files change.

Watch first issuance:

```bash
docker compose logs -f nginx certbot
```

After issuance, verify:

```bash
curl -I http://gomrokmp.com
curl -I https://gomrokmp.com
docker compose exec certbot certbot certificates
```

The HTTP response must redirect to `https://gomrokmp.com`, and the HTTPS certificate must cover both `gomrokmp.com` and `www.gomrokmp.com`.

## 7. Create or verify the administrator

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py check --deploy
```

## Certificate renewal

The Certbot service checks every 12 hours. It only renews when required, copies the renewed certificate into the shared TLS volume, and Nginx detects and reloads it within 60 seconds.

Inspect renewal logs:

```bash
docker compose logs --since=24h certbot nginx
```

## Updating the application

```bash
git pull
docker compose build
docker compose up -d
docker image prune -f
```

`NEXT_PUBLIC_*` values are embedded during the frontend build, so rebuild the frontend after changing them.

## Backups

Back up both PostgreSQL and uploaded files:

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U gmp -d gmp -Fc > backups/gmp.dump
sudo tar -C /var/www -czf backups/gmp-media.tar.gz gmp-media
```

Do not use `docker compose down -v` in production. It deletes the database, static, and certificate volumes.

## Useful diagnostics

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose logs --tail=200 nginx
docker compose logs --tail=200 certbot
docker compose exec nginx nginx -t
docker compose exec backend python manage.py check --deploy
```

If certificate issuance fails, confirm both DNS records resolve to this VPS, ports 80/443 are open, and no host process conflicts with Docker.

If the backend build reports an HTTP `402` from `mirror-pypi.runflare.com`, ensure the latest `backend/Dockerfile` is present and `.env` contains the official package index, then rebuild the backend package layer:

```dotenv
PYPI_INDEX_URL=https://pypi.org/simple
```

```bash
docker compose build --no-cache backend
docker compose up -d
```
