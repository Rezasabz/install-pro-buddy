# 🐳 راهنمای Docker

## پیش‌نیازها

1. **Docker Desktop** نصب باشه
   - دانلود از: https://www.docker.com/products/docker-desktop
   - بعد از نصب، Docker Desktop رو اجرا کن

2. **بررسی نصب:**
```bash
docker --version
docker-compose --version
```

## 🚀 اجرای سریع (Production)

### روش 1: با docker-compose

```bash
# Build و اجرای همه سرویس‌ها
docker-compose up --build

# یا در background
docker-compose up -d --build
```

بعد از اجرا:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### روش 2: اجرای جداگانه

```bash
# Build backend
cd backend
docker build -t installment-backend .

# Run backend
docker run -d -p 8000:8000 --name backend installment-backend

# Build frontend
cd ..
docker build -t installment-frontend .

# Run frontend
docker run -d -p 80:80 --name frontend installment-frontend
```

## 🛠️ Development Mode

برای توسعه با hot-reload:

```bash
# اجرا با docker-compose.dev.yml
docker-compose -f docker-compose.dev.yml up

# یا در background
docker-compose -f docker-compose.dev.yml up -d
```

در این حالت:
- **Frontend**: http://localhost:8080 (با hot-reload)
- **Backend**: http://localhost:8000 (با auto-reload)
- تغییرات کد به صورت خودکار اعمال می‌شن

## 📋 دستورات مفید

### مشاهده لاگ‌ها
```bash
# همه سرویس‌ها
docker-compose logs -f

# فقط backend
docker-compose logs -f backend

# فقط frontend
docker-compose logs -f frontend
```

### متوقف کردن
```bash
# متوقف کردن همه
docker-compose down

# متوقف و حذف volumes
docker-compose down -v
```

### Restart سرویس‌ها
```bash
# همه سرویس‌ها
docker-compose restart

# فقط backend
docker-compose restart backend
```

### دسترسی به container
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

### مشاهده وضعیت
```bash
# لیست containerها
docker-compose ps

# استفاده از منابع
docker stats
```

## 🗄️ مدیریت Database

Database در volume ذخیره می‌شه و بعد از restart حفظ می‌مونه.

### Backup گرفتن:
```bash
# کپی database از container
docker cp installment-backend:/app/installment_business.db ./backup.db
```

### Restore کردن:
```bash
# کپی database به container
docker cp ./backup.db installment-backend:/app/installment_business.db

# Restart backend
docker-compose restart backend
```

### پاک کردن database:
```bash
# حذف volume
docker-compose down -v

# اجرای مجدد (database جدید ساخته می‌شه)
docker-compose up -d
```

## 🔧 عیب‌یابی

### خطا: "port already in use"
```bash
# پیدا کردن process که از port استفاده می‌کنه
netstat -ano | findstr :8000
netstat -ano | findstr :80

# یا containerهای قبلی رو متوقف کن
docker-compose down
```

### خطا: "Cannot connect to Docker daemon"
- Docker Desktop رو اجرا کن
- منتظر بمون تا کاملاً start بشه

### Build مجدد بعد از تغییرات:
```bash
# Build مجدد بدون cache
docker-compose build --no-cache

# اجرا
docker-compose up -d
```

### پاک کردن همه چیز:
```bash
# متوقف و حذف همه
docker-compose down -v

# حذف images
docker rmi installment-backend installment-frontend

# پاک کردن کامل Docker
docker system prune -a --volumes
```

## 📦 Production Deployment

### 1. Build برای production:
```bash
docker-compose build
```

### 2. Push به registry (اختیاری):
```bash
# Tag کردن
docker tag installment-backend:latest your-registry/installment-backend:latest
docker tag installment-frontend:latest your-registry/installment-frontend:latest

# Push
docker push your-registry/installment-backend:latest
docker push your-registry/installment-frontend:latest
```

### 3. Deploy در سرور:
```bash
# در سرور
docker-compose pull
docker-compose up -d
```

## 🔐 Environment Variables

برای production، فایل `.env` بساز:

```env
# Backend
PYTHONUNBUFFERED=1

# Frontend
VITE_API_URL=http://your-domain.com/api
```

بعد اجرا کن:
```bash
docker-compose --env-file .env up -d
```

## 📊 Monitoring

### Health Check:
```bash
# Backend health
curl http://localhost:8000/health

# Container health
docker inspect --format='{{.State.Health.Status}}' installment-backend
```

### Resource Usage:
```bash
# Real-time stats
docker stats

# Logs size
docker-compose logs --tail=100 backend
```

## 🎯 Best Practices

1. **Development**: از `docker-compose.dev.yml` استفاده کن
2. **Production**: از `docker-compose.yml` استفاده کن
3. **Backup**: منظم از database backup بگیر
4. **Logs**: لاگ‌ها رو بررسی کن
5. **Updates**: images رو به‌روز نگه دار

## 📚 منابع

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI in Docker](https://fastapi.tiangolo.com/deployment/docker/)
- [Vite Docker Guide](https://vitejs.dev/guide/static-deploy.html)
