# 🔧 راهنمای رفع مشکلات داده

## مشکل: سرمایه "در گردش" اشتباه نمایش داده می‌شه

### علت:
وقتی شریک جدید اضافه می‌کنی، `availableCapital` باید برابر `capital` باشه (چون هنوز خریدی نداشتی).
ولی اگر داده‌های قدیمی مشکل داشته باشن، ممکنه اعداد اشتباه نمایش داده بشن.

### راه‌حل خودکار:
یک تابع `fixPartnerData()` اضافه شده که خودکار در App.tsx اجرا می‌شه و:
- ✅ `availableCapital` بیشتر از `capital` رو اصلاح می‌کنه
- ✅ مقادیر منفی رو صفر می‌کنه
- ✅ `initialProfit` و `monthlyProfit` undefined رو صفر می‌کنه

### راه‌حل دستی:

#### 1. پاک کردن داده‌های مشکل‌دار:
```javascript
// در Console مرورگر (F12)
localStorage.clear()
location.reload()
```

#### 2. رفع دستی:
```javascript
// در Console
import { fixPartnerData } from './lib/fixData'
fixPartnerData()
```

#### 3. Export/Import داده‌ها:
```javascript
// Export
import { exportData } from './lib/fixData'
exportData()

// Import
import { importData } from './lib/fixData'
// بعد فایل رو انتخاب کن
```

## چک کردن داده‌ها

### در Console:
```javascript
// دیدن همه شرکا
JSON.parse(localStorage.getItem('partners'))

// دیدن یک شریک خاص
const partners = JSON.parse(localStorage.getItem('partners'))
partners.find(p => p.name === 'رضا')
```

### مقادیر صحیح:
```javascript
{
  "id": "...",
  "name": "رضا",
  "capital": 10000000,           // سرمایه اولیه
  "availableCapital": 10000000,  // باید برابر capital باشه (اگر خریدی نداشتی)
  "initialProfit": 0,            // سود اولیه (تفاوت قیمت)
  "monthlyProfit": 0,            // سود ماهانه (4%)
  "share": 25,                   // درصد سهم
  "createdAt": "2024-..."
}
```

### مقادیر بعد از خرید گوشی 5 میلیونی:
```javascript
{
  "capital": 10000000,           // سرمایه اولیه (تغییر نمی‌کنه)
  "availableCapital": 7500000,   // 10M - (5M * 50%) = 7.5M
  "initialProfit": 0,            // هنوز فروشی نداشتیم
  "monthlyProfit": 0             // هنوز قسطی پرداخت نشده
}
```

### مقادیر بعد از فروش با سود 2 میلیون:
```javascript
{
  "capital": 10000000,
  "availableCapital": 7500000,
  "initialProfit": 1000000,      // 2M * 50% = 1M (سهم این شریک)
  "monthlyProfit": 0
}
```

### مقادیر بعد از پرداخت قسط با سود 200 هزار:
```javascript
{
  "capital": 10000000,
  "availableCapital": 8750000,   // 7.5M + (2.5M * 50%) = 8.75M (اصل برگشت)
  "initialProfit": 1000000,
  "monthlyProfit": 100000        // 200K * 50% = 100K (سهم این شریک)
}
```

## دستورات مفید Console

### 1. دیدن همه داده‌ها:
```javascript
console.table(JSON.parse(localStorage.getItem('partners')))
console.table(JSON.parse(localStorage.getItem('sales')))
console.table(JSON.parse(localStorage.getItem('installments')))
```

### 2. محاسبه دستی:
```javascript
const partners = JSON.parse(localStorage.getItem('partners'))
const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0)
const totalAvailable = partners.reduce((sum, p) => sum + p.availableCapital, 0)
const totalUsed = totalCapital - totalAvailable

console.log('سرمایه کل:', totalCapital)
console.log('در دسترس:', totalAvailable)
console.log('در گردش:', totalUsed)
```

### 3. رفع مشکل یک شریک خاص:
```javascript
const partners = JSON.parse(localStorage.getItem('partners'))
const partner = partners.find(p => p.name === 'رضا')

// اصلاح availableCapital
partner.availableCapital = partner.capital

// ذخیره
localStorage.setItem('partners', JSON.stringify(partners))
location.reload()
```

## جلوگیری از مشکلات آینده

### 1. همیشه از Dashboard استفاده کن:
- دکمه "بارگذاری داده‌های نمونه" فقط برای تست
- دکمه "پاک کردن همه داده‌ها" با احتیاط

### 2. قبل از تغییرات مهم، Backup بگیر:
```javascript
// در Console
import { exportData } from './lib/fixData'
exportData()
```

### 3. بعد از هر خرید/فروش، چک کن:
- سرمایه در دسترس کم شده؟
- سود اضافه شده؟
- اقساط درست ساخته شدن؟

## تست صحت داده‌ها

### تست 1: شریک جدید
```
1. شریک جدید اضافه کن (مثلاً 10 میلیون)
2. چک کن: availableCapital = 10M ✅
3. چک کن: در گردش = 0 ✅
```

### تست 2: خرید گوشی
```
1. گوشی 5 میلیونی بخر
2. چک کن: availableCapital کم شده ✅
3. چک کن: در گردش = 5M ✅
```

### تست 3: فروش
```
1. گوشی رو 7 میلیون بفروش
2. چک کن: initialProfit = 2M ✅
3. چک کن: اقساط ساخته شدن ✅
```

### تست 4: پرداخت قسط
```
1. یک قسط رو پرداخت کن
2. چک کن: availableCapital زیاد شده (اصل برگشت) ✅
3. چک کن: monthlyProfit زیاد شده (سود 4%) ✅
```

## پشتیبانی

اگر مشکلی حل نشد:
1. Screenshot از Console بگیر
2. Export داده‌ها رو بگیر
3. localStorage رو پاک کن و از نو شروع کن
