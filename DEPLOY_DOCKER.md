## Docker Deployment

### Files included
- `docker-compose.yml`
- `.env.docker.example`
- `backend/Dockerfile`
- `backend/entrypoint.sh`
- `backend/requirements.txt`
- `backend/.env.docker.example`
- `backend/.env.docker`
- `backend/.dockerignore`
- `frontend/Dockerfile`
- `frontend/.dockerignore`

### 1) Prepare env
1. Copy root env template:
   - `Copy-Item .env.docker.example .env`
2. Edit `.env` if you need custom DB credentials or API base URL.
3. Edit `backend/.env.docker` for Django settings (secret key, debug, CORS, SMS provider).
4. Keep `MEDIA_HOST_PATH=/var/www/gmp-media` in `.env` for production uploads, or change it to another host path that Nginx can read.

### 1.1) Prepare uploaded media directory
Create the host media directory before starting containers:

```bash
sudo mkdir -p /var/www/gmp-media
sudo chown -R www-data:www-data /var/www/gmp-media
sudo find /var/www/gmp-media -type d -exec chmod 755 {} \;
sudo find /var/www/gmp-media -type f -exec chmod 644 {} \;
```

If you already have uploads inside an old backend container, copy them out before recreating the container:

```bash
sudo mkdir -p /var/www/gmp-media
docker cp reged-backend:/app/media/. /var/www/gmp-media/
sudo chown -R www-data:www-data /var/www/gmp-media
sudo find /var/www/gmp-media -type d -exec chmod 755 {} \;
sudo find /var/www/gmp-media -type f -exec chmod 644 {} \;
```

### 2) Build and run
- `docker compose --env-file .env up --build -d`

### 3) Open services
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- Django admin: `http://localhost:8000/admin/`

### 3.1) Nginx media routing
Production Nginx must serve uploaded media from the same host path used by `MEDIA_HOST_PATH`:

```nginx
location /media/ {
    alias /var/www/gmp-media/;
}
```

Put this block before `location /`, then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4) Create admin user
- `docker compose exec backend python manage.py createsuperuser`

### 5) Useful commands
- Logs: `docker compose logs -f`
- Stop: `docker compose down`
- Stop + remove DB volume: `docker compose down -v`

### Notes
- Backend runs migrations and collectstatic automatically at container startup.
- `NEXT_PUBLIC_API_BASE` is a build-time variable for Next.js. If you change it, rebuild frontend:
  - `docker compose --env-file .env up --build -d frontend`
