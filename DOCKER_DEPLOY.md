# راهنمای Deploy با Docker

## مشکل CORS برطرف شد

### تغییرات انجام شده:

1. **Backend (main.py)**: 
   - CORS برای IP سرور تنظیم شد
   - `allow_credentials=True` فعال شد

2. **Frontend (auth.ts & apiStore.ts)**:
   - API_BASE_URL به رشته خالی تغییر کرد
   - حالا از relative URLs استفاده میکنه

3. **Dockerfile**:
   - VITE_API_URL به رشته خالی تغییر کرد
   - Build با relative URLs انجام میشه

4. **nginx.conf**:
   - Proxy برای `/api` به backend تنظیم شده

## نحوه Deploy:

### 1. Build کردن Images جدید:

```bash
# Backend
cd backend
docker build -t rezasabz/install-pro-buddy-backend:latest .
docker push rezasabz/install-pro-buddy-backend:latest

# Frontend
cd ..
docker build -t rezasabz/install-pro-buddy-frontend:latest .
docker push rezasabz/install-pro-buddy-frontend:latest
```

### 2. در سرور:

```bash
# Pull کردن images جدید
docker compose pull

# Restart کردن services
docker compose down
docker compose up -d

# چک کردن logs
docker compose logs -f
```

## نحوه کار:

- Frontend روی پورت 80 اجرا میشه
- Backend روی پورت 8000 اجرا میشه (فقط داخل docker network)
- Nginx درخواست‌های `/api/*` رو به backend proxy میکنه
- دیگه مشکل CORS نداریم چون همه از یک origin میان

## تست:

```bash
# تست backend
curl http://185.92.182.51/api/health

# تست frontend
curl http://185.92.182.51
```

## نکات مهم:

1. حتما images جدید رو build و push کن
2. در سرور حتما `docker compose pull` بزن
3. اگر هنوز مشکل داری، cache browser رو پاک کن
