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

### 2) Build and run
- `docker compose --env-file .env up --build -d`

### 3) Open services
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- Django admin: `http://localhost:8000/admin/`

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
