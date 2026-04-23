# VPS Deploy

This is the fastest clean path to run the backend on a VPS for client demos or staging.

This repo's backend is a Next.js API server. On the VPS in your screenshots it runs via:

- Path: `/var/www/amize-backend`
- Service: `amize-backend` (systemd)
- Port: `4001`

## Prerequisites

- Ubuntu 22.04 or similar Linux VPS
- Node.js 20+
- MariaDB or MySQL
- PM2
- Nginx
- domain or server IP

## Backend Setup

```bash
cd /var/www
git clone <your-repo-url> amize
cd amize/amize-next-master
npm ci
cp .env.production.example .env.production
```

Fill `.env.production` with the real database and provider values.

### If Your VPS Folder Is NOT a Git Repo

If `git pull` fails with `fatal: not a git repository`, you have two options:

1. Make the change directly on the VPS (fastest for 1-2 files)
2. Upload the updated backend folder from your laptop to the VPS (scp/rsync)

For the "Google auth route change" and "remove token logging" fixes, editing directly on the VPS is fastest.

## Database

```bash
npx prisma generate
npx prisma migrate deploy
```

## Start With PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
npm run health:check
```

## Health Checks

After startup, verify:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/ready
npm run health:check
```

Expected:

- `/health` returns `200` when the backend is healthy, `503` when degraded
- `/ready` returns `200` only when the socket manager is initialized and healthy
- `npm run health:check` runs both checks against `APP_BASE_URL` or `http://127.0.0.1:3000`

## Nginx Reverse Proxy

Example:

```nginx
server {
    listen 80;
    server_name your-domain.example;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Minimum Demo Checklist

- backend reachable from phone and laptop
- database migrations applied
- `/health` returns `200`
- `/ready` returns `200`
- `APP_BASE_URL` set if health checks should target the public domain instead of localhost
- `FRONTEND_URL` set correctly for socket CORS
- Stripe, Firebase, and mail envs set only if those flows are being demoed

## Exact VPS Commands (Your Current Setup: systemd + /var/www/amize-backend)

### 1. Confirm the backend is up

```bash
sudo systemctl status amize-backend --no-pager
curl -i http://127.0.0.1:4001/api/config
```

### 2. Remove JWT token logging (security + log spam fix)

Your backend currently prints JWTs in `lib/auth.ts`. Remove those logs:

```bash
cd /var/www/amize-backend
sudo grep -n \"console\\.log\" lib/auth.ts
sudo sed -i '/console\\.log(token)/d' lib/auth.ts
sudo sed -i '/console\\.log(decoded)/d' lib/auth.ts
```

### 3. Google auth: allow multiple client IDs (Android + Web)

Set env vars (choose one):

Option A (recommended):

```bash
# in your .env (or systemd Environment=)
GOOGLE_CLIENT_IDS=WEB_CLIENT_ID,ANDROID_CLIENT_ID
```

Option B (Android-only):

```bash
GOOGLE_CLIENT_ID=ANDROID_CLIENT_ID
```

Then update `app/api/auth/google/route.ts` to verify against `GOOGLE_CLIENT_IDS` when present:

```bash
cd /var/www/amize-backend
sudo nano app/api/auth/google/route.ts
```

What to change in code:

- Build `allowedAudiences` from `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_IDS`
- Use `verifyIdToken({ idToken, audience: allowedAudiences })`

### 4. Install/build/restart

If `npm ci` fails due to peer-deps (swagger-ui-react vs react 19), use legacy peer deps:

```bash
cd /var/www/amize-backend
npm ci --legacy-peer-deps || npm install --legacy-peer-deps
npm run build
sudo systemctl restart amize-backend
sudo systemctl status amize-backend --no-pager
```

### 5. CORS preflight sanity check

```bash
curl -i -X OPTIONS http://82.112.238.182:4001/api/auth/google \
  -H \"Origin: http://localhost:8081\" \
  -H \"Access-Control-Request-Method: POST\"
```

You should see `access-control-allow-origin` in the response.

### 6. If your disk is almost full (builds may fail)

```bash
df -h
sudo journalctl --vacuum-time=7d
sudo npm cache clean --force
```

## Production Gaps Still Outside This Doc

- TLS and certificate setup
- log rotation and monitoring
- database backups
- real Stripe webhook endpoint verification
- real live transport provider setup
- store-release mobile env separation
