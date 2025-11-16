# 🚀 راهنمای سریع راه‌اندازی

## ✅ تغییرات انجام شده

### Frontend حالا به FastAPI Backend متصل شده:
- ✅ `src/lib/apiStore.ts` - اتصال به FastAPI
- ✅ `src/lib/storeProvider.ts` - Provider برای استفاده از API
- ✅ همه صفحات آپدیت شدن (async functions)
- ✅ `.env` فایل ساخته شده

### داده‌ها حالا در SQLite ذخیره می‌شن:
- ✅ Backend FastAPI با SQLite
- ✅ Database: `backend/installment_business.db`
- ✅ همه API endpoints آماده

## 🛠️ راه‌اندازی (2 مرحله)

### 1️⃣ Backend (Terminal 1):
```bash
cd install-pro-buddy/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

✅ Backend اجرا شد: `http://localhost:8000`

### 2️⃣ Frontend (Terminal 2):
```bash
cd install-pro-buddy
npm install
npm run dev
```

✅ Frontend اجرا شد: `http://localhost:8080`

## 🎯 تست

1. مرورگر رو باز کن: `http://localhost:8080`
2. Console رو باز کن (F12)
3. یک شریک اضافه کن
4. بررسی کن که داده در SQLite ذخیره شده

### چک کردن Database:
```bash
cd install-pro-buddy/backend
sqlite3 installment_business.db
SELECT * FROM partners;
.exit
```

## 📊 API Documentation

Backend اجرا شده؟ مستندات رو ببین:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔧 عیب‌یابی

### مشکل: Backend اجرا نمی‌شه
```bash
# نصب dependencies
pip install fastapi uvicorn sqlalchemy

# اجرا مستقیم
python main.py
```

### مشکل: Frontend اجرا نمی‌شه
```bash
# نصب dependencies
npm install

# اجرا با cmd (اگر PowerShell مشکل داره)
cmd /c "npm run dev"
```

### مشکل: API وصل نمی‌شه
1. Backend اجرا شده؟ `http://localhost:8000/health`
2. `.env` فایل وجود داره؟
3. `VITE_API_URL=http://localhost:8000` درست تنظیم شده؟

## 📁 ساختار فایل‌ها

```
install-pro-buddy/
├── backend/
│   ├── main.py                    # FastAPI app
│   ├── database.py                # SQLite setup
│   ├── models.py                  # Database models
│   ├── routers/                   # API endpoints
│   └── installment_business.db    # SQLite database
├── src/
│   ├── lib/
│   │   ├── apiStore.ts           # API calls
│   │   └── storeProvider.ts      # Store provider
│   └── pages/                     # React pages (updated)
└── .env                           # Environment variables
```

## 🎉 موفقیت!

اگر همه چیز درست کار کرد:
- ✅ Backend: `http://localhost:8000`
- ✅ Frontend: `http://localhost:8080`
- ✅ Database: `backend/installment_business.db`
- ✅ داده‌ها در SQLite ذخیره می‌شن

## 📝 نکات مهم

1. **Backend باید اول اجرا بشه** (قبل از Frontend)
2. **Database خودکار ساخته می‌شه** (اولین بار)
3. **CORS تنظیم شده** (Frontend می‌تونه به Backend وصل بشه)
4. **Error handling اضافه شده** (اگر مشکلی بود، toast نشون می‌ده)

## 🔄 Development Workflow

1. Backend رو اجرا کن (یکبار)
2. Frontend رو اجرا کن (یکبار)
3. تغییرات رو بده (hot reload)
4. Database رو چک کن (SQLite)

## 🆘 کمک

اگر مشکلی داشتی:
1. Backend logs رو چک کن
2. Frontend console رو ببین
3. Network tab رو بررسی کن
4. Database رو چک کن

---

**نکته**: حالا همه داده‌ها در SQLite ذخیره می‌شن، نه localStorage! 🎉
