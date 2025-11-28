# راه حل سریع مشکل CORS

## مشکل:
Frontend هنوز به `http://185.92.182.51:8000` درخواست میزنه چون image قدیمی هست.

## راه حل:

### گزینه 1: Build و Push کردن Images جدید (توصیه میشه)

```bash
# 1. Backend را build کن
cd install-pro-buddy/backend
docker build -t rezasabz/install-pro-buddy-backend:latest .
docker push rezasabz/install-pro-buddy-backend:latest

# 2. Frontend را build کن
cd ..
docker build -t rezasabz/install-pro-buddy-frontend:latest .
docker push rezasabz/install-pro-buddy-frontend:latest

# 3. در سرور:
docker compose pull
docker compose down
docker compose up -d
```

### گزینه 2: Build مستقیم در سرور (سریع‌تر)

```bash
# در سرور:
cd /path/to/project

# Uncomment خطوط build در docker-compose.yml
# سپس:
docker compose down
docker compose build
docker compose up -d
```

### گزینه 3: استفاده از docker-compose.dev.yml

```bash
# در سرور:
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d
```

## تست:

```bash
# تست API از طریق nginx
curl http://185.92.182.51/api/health

# باید برگردونه:
# {"status":"healthy"}
```

## نکته مهم:

بعد از build جدید، حتما cache browser رو پاک کن یا Ctrl+Shift+R بزن.
