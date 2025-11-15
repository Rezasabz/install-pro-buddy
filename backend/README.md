# FastAPI Backend - Mobile Installment Business

## 🚀 نصب و راه‌اندازی

### 1. نصب Python
مطمئن شو که Python 3.8+ نصب شده:
```bash
python --version
```

### 2. ساخت Virtual Environment
```bash
cd backend
python -m venv venv
```

### 3. فعال‌سازی Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 4. نصب Dependencies
```bash
pip install -r requirements.txt
```

### 5. اجرای سرور
```bash
python main.py
```

یا:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

بعد از اجرای سرور، به این آدرس‌ها برو:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🗄️ Database

- **Type**: SQLite
- **File**: `installment_business.db`
- **Location**: در همان پوشه backend

Database به صورت خودکار ساخته می‌شه و نیازی به migration نیست.

## 📡 API Endpoints

### Partners
- `GET /api/partners` - لیست همه شرکا
- `POST /api/partners` - افزودن شریک جدید
- `GET /api/partners/{id}` - دریافت یک شریک
- `PUT /api/partners/{id}` - بروزرسانی شریک
- `DELETE /api/partners/{id}` - حذف شریک

### Phones
- `GET /api/phones` - لیست همه گوشی‌ها
- `POST /api/phones` - افزودن گوشی جدید
- `PUT /api/phones/{id}` - بروزرسانی گوشی
- `DELETE /api/phones/{id}` - حذف گوشی

### Customers
- `GET /api/customers` - لیست همه مشتریان
- `POST /api/customers` - افزودن مشتری جدید
- `PUT /api/customers/{id}` - بروزرسانی مشتری
- `DELETE /api/customers/{id}` - حذف مشتری

### Sales
- `GET /api/sales` - لیست همه فروش‌ها
- `POST /api/sales` - ثبت فروش جدید
- `PUT /api/sales/{id}` - بروزرسانی فروش
- `DELETE /api/sales/{id}` - حذف فروش

### Installments
- `GET /api/installments` - لیست همه اقساط
- `GET /api/installments/sale/{sale_id}` - اقساط یک فروش
- `POST /api/installments` - افزودن قسط جدید
- `PUT /api/installments/{id}` - بروزرسانی قسط
- `DELETE /api/installments/{id}` - حذف قسط

### Transactions
- `GET /api/transactions` - لیست همه تراکنش‌ها
- `GET /api/transactions/partner/{partner_id}` - تراکنش‌های یک شریک
- `POST /api/transactions` - افزودن تراکنش جدید
- `DELETE /api/transactions/{id}` - حذف تراکنش

## 🔧 تنظیمات Frontend

در فایل `.env` فرانت‌اند:
```env
VITE_API_URL=http://localhost:8000
```

## 📝 نمونه Request

### افزودن شریک جدید:
```bash
curl -X POST "http://localhost:8000/api/partners" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "علی احمدی",
    "capital": 10000000,
    "share": 50
  }'
```

### دریافت لیست شرکا:
```bash
curl "http://localhost:8000/api/partners"
```

## 🛠️ Development

### ساختار پروژه:
```
backend/
├── main.py              # Entry point
├── database.py          # Database setup
├── models.py            # Pydantic models
├── requirements.txt     # Dependencies
├── routers/
│   ├── __init__.py
│   ├── partners.py
│   ├── phones.py
│   ├── customers.py
│   ├── sales.py
│   ├── installments.py
│   └── transactions.py
└── installment_business.db  # SQLite database (auto-created)
```

## 🔒 Security Notes

- فعلاً authentication نداره (برای MVP)
- CORS برای localhost:8080 و localhost:5173 فعاله
- برای production باید authentication اضافه کنی

## 🚀 Production Deployment

برای deploy در production:

1. تغییر CORS origins
2. اضافه کردن authentication
3. استفاده از PostgreSQL به جای SQLite
4. اضافه کردن rate limiting
5. استفاده از HTTPS

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
