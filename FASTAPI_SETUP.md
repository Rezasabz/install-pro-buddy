# 🚀 راهنمای کامل راه‌اندازی با FastAPI

## ✅ آماده‌سازی Backend

### مرحله 1: نصب Python
```bash
# چک کردن نسخه Python
python --version
# باید 3.8 یا بالاتر باشه
```

اگر Python نداری، از [python.org](https://www.python.org/downloads/) دانلود کن.

### مرحله 2: راه‌اندازی Backend

```bash
# رفتن به پوشه backend
cd backend

# ساخت virtual environment
python -m venv venv

# فعال‌سازی (Windows)
venv\Scripts\activate

# فعال‌سازی (Mac/Linux)
source venv/bin/activate

# نصب dependencies
pip install -r requirements.txt

# اجرای سرور
python main.py
```

سرور روی `http://localhost:8000` اجرا می‌شه.

### مرحله 3: تست Backend

مرورگر رو باز کن و برو به:
- http://localhost:8000 - صفحه اصلی
- http://localhost:8000/docs - Swagger UI (مستندات تعاملی)
- http://localhost:8000/health - Health check

## ✅ آماده‌سازی Frontend

### مرحله 1: نصب Dependencies

```bash
# برگشت به پوشه اصلی
cd ..

# نصب packages
npm install
```

### مرحله 2: تنظیم Environment

فایل `.env` از قبل آماده شده و نیازی به تغییر نداره:
```env
VITE_API_URL=http://localhost:8000
```

### مرحله 3: اجرای Frontend

```bash
npm run dev
```

Frontend روی `http://localhost:8080` اجرا می‌شه.

## 🎯 استفاده

1. **Backend** روی پورت 8000 اجرا می‌شه
2. **Frontend** روی پورت 8080 اجرا می‌شه
3. Frontend به Backend متصل می‌شه و داده‌ها رو از API می‌گیره
4. داده‌ها در فایل `backend/installment_business.db` ذخیره می‌شن

## 📊 ساختار پروژه

```
install-pro-buddy/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Entry point
│   ├── database.py            # SQLite setup
│   ├── models.py              # Pydantic models
│   ├── requirements.txt       # Python dependencies
│   ├── routers/               # API endpoints
│   │   ├── partners.py
│   │   ├── phones.py
│   │   ├── customers.py
│   │   ├── sales.py
│   │   ├── installments.py
│   │   └── transactions.py
│   └── installment_business.db  # SQLite database
│
├── src/                       # React Frontend
│   ├── pages/                 # صفحات
│   ├── components/            # کامپوننت‌ها
│   └── lib/                   # Utilities
│
└── .env                       # تنظیمات محیط

```

## 🔧 توسعه

### اضافه کردن Endpoint جدید:

1. مدل رو در `models.py` تعریف کن
2. Router جدید در `routers/` بساز
3. Router رو در `main.py` اضافه کن

### تغییر Database Schema:

فایل `database.py` رو ویرایش کن و سرور رو restart کن.

## 🐛 عیب‌یابی

### Backend اجرا نمی‌شه:
```bash
# مطمئن شو که virtual environment فعاله
# باید (venv) رو در ترمینال ببینی

# دوباره dependencies رو نصب کن
pip install -r requirements.txt
```

### Frontend به Backend وصل نمی‌شه:
- مطمئن شو Backend روی پورت 8000 اجراست
- فایل `.env` رو چک کن
- Console مرورگر رو برای خطاها بررسی کن

### Database خطا می‌ده:
- فایل `installment_business.db` رو پاک کن
- Backend رو restart کن (خودکار دوباره ساخته می‌شه)

## 🎉 تمام!

حالا یک سیستم کامل با:
- ✅ Backend: FastAPI + SQLite
- ✅ Frontend: React + TypeScript
- ✅ API Documentation: Swagger UI
- ✅ Database: SQLite (فایل محلی)

همه چیز آماده استفاده است!
