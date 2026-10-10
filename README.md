# Route 53 Clone

link :- https://route53-clone-1-3iqg.onrender.com/

A Route 53-inspired DNS management interface with a Next.js frontend, FastAPI API, and SQLite persistence. Authentication is mocked for this project; it does not configure DNS or make AWS calls.

## Run Locally

Requirements: Node.js 20.9 or newer, Python 3.10 or newer, and npm.

In PowerShell, start the API:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
Set-Location backend
$env:JWT_SECRET_KEY = "local-development-secret"
$env:CORS_ORIGINS = "http://localhost:3000"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

In another terminal, start the frontend:

```powershell
Set-Location frontend
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api"
npm ci
npm run dev
```

Open `http://localhost:3000`, register an account, and use the Route 53 navigation. The API docs are available at `http://localhost:8000/docs`. The local SQLite database is created at `backend/route53.db` by default.

## Host With Docker Compose

Use a Linux VPS with a stable public IP, a domain pointed at that IP, Docker Engine, and the Compose plugin. Allow inbound TCP ports 80 and 443 (and UDP 443) in the VPS firewall. Copy `.env.example` to `.env`; set `PUBLIC_DOMAIN` to your domain, generate a long random `JWT_SECRET_KEY` (for example, `openssl rand -hex 32`), and set both `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL` to the HTTPS origin shown below. The API URL is baked into the frontend image at build time.

```sh
cp .env.example .env
# Edit .env with your domain and generated secret before starting.
docker compose up --build -d
```

The app is served at `https://<PUBLIC_DOMAIN>`. Caddy obtains and renews the TLS certificate and routes `/api/*` to FastAPI; only Caddy's ports are exposed publicly. Compose stores SQLite data in `route53-data` and Caddy certificates/configuration in their own named volumes, so restarts and image rebuilds preserve them. Back up these volumes regularly. Keep the stack to one API instance because SQLite is not configured for multi-instance access; deploy on a host with persistent Docker volumes, not an ephemeral filesystem.

## Architecture

- `frontend/`: Next.js App Router application, TypeScript, client-side auth/session state, Route 53 navigation, hosted-zone and record tables, filters, pagination, and CRUD dialogs.
- `backend/`: FastAPI REST API, SQLAlchemy persistence, password hashing, and bearer-token authentication.
- `docker-compose.yml` and `Caddyfile`: private frontend/API services behind HTTPS, plus persistent SQLite and TLS volumes.

### Database Schema

- `users`: username, email, password hash, account ID, and creation time.
- `hosted_zones`: owner, domain, public/private type, comment, caller reference, and record count. Deleting a zone cascades to its records.
- `dns_records`: hosted-zone reference, name, type, TTL, JSON-encoded values, routing policy, alias flag, comment, and timestamps. New zones receive default NS and SOA records.

All resources are scoped to the authenticated user through their hosted zones. Configure `DATABASE_URL` to choose the SQLAlchemy database URL; SQLite and PostgreSQL are supported. For Neon, set the provider's PostgreSQL connection string in the ignored local `.env` file. Configure `JWT_SECRET_KEY` and comma-separated `CORS_ORIGINS` in hosted environments.

### API Overview

All API routes are under `/api`; protected routes require `Authorization: Bearer <token>`.

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /hosted-zones` (search, type filter, pagination), `POST /hosted-zones`
- `GET /hosted-zones/{zone_id}`, `PUT /hosted-zones/{zone_id}`, `DELETE /hosted-zones/{zone_id}`
- `GET /hosted-zones/{zone_id}/records` (search, type filter, pagination), `POST /hosted-zones/{zone_id}/records`
- `GET /hosted-zones/{zone_id}/records/{record_id}`, `PUT /hosted-zones/{zone_id}/records/{record_id}`, `DELETE /hosted-zones/{zone_id}/records/{record_id}`

Supported user-managed record types are A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, and CAA. Health checks, traffic policies, resolver, profiles, and IP routing are interface placeholders.

## Production Frontend

For a local production server, set `NEXT_PUBLIC_API_URL` in the frontend build environment, then run `npm run build` followed by `npm start` from `frontend/`. `npm start` requires the production build to exist first.
