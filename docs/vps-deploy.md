# VPS Deploy

This is the fastest clean path to run the backend on a VPS for client demos or staging.

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

## Production Gaps Still Outside This Doc

- TLS and certificate setup
- log rotation and monitoring
- database backups
- real Stripe webhook endpoint verification
- real live transport provider setup
- store-release mobile env separation
