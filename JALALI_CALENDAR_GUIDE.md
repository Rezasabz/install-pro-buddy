# 📅 راهنمای تقویم شمسی

## کامپوننت‌های اضافه شده

### 1. `JalaliDatePicker` - انتخابگر تاریخ شمسی
کامپوننت کامل با تقویم گرافیکی

### 2. `JalaliDateInput` - ورودی ساده تاریخ
Input ساده برای وارد کردن تاریخ به صورت دستی

### 3. توابع تبدیل تاریخ در `jalali.ts`
- `gregorianToJalali()` - میلادی به شمسی
- `jalaliToGregorian()` - شمسی به میلادی
- `formatJalaliDate()` - فرمت بلند (15 مرداد 1402)
- `formatJalaliShort()` - فرمت کوتاه (1402/05/15)
- و توابع دیگر...

## استفاده

### مثال 1: JalaliDatePicker

```tsx
import { JalaliDatePicker } from '@/components/JalaliDatePicker';
import { useState } from 'react';

function MyComponent() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <JalaliDatePicker
      value={date}
      onChange={setDate}
      placeholder="انتخاب تاریخ"
    />
  );
}
```

### مثال 2: JalaliDateInput

```tsx
import { JalaliDateInput } from '@/components/JalaliDatePicker';

function MyComponent() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <JalaliDateInput
      value={date}
      onChange={setDate}
      placeholder="1402/05/15"
    />
  );
}
```

### مثال 3: استفاده در فرم

```tsx
import { JalaliDatePicker } from '@/components/JalaliDatePicker';
import { Label } from '@/components/ui/label';

function SaleForm() {
  const [saleDate, setSaleDate] = useState<Date>(new Date());

  const handleSubmit = () => {
    // saleDate یک Date object هست که می‌تونی ذخیره کنی
    console.log(saleDate.toISOString());
  };

  return (
    <div>
      <Label>تاریخ فروش</Label>
      <JalaliDatePicker
        value={saleDate}
        onChange={setSaleDate}
      />
    </div>
  );
}
```

### مثال 4: نمایش تاریخ شمسی

```tsx
import { dateToJalali, formatJalaliDate } from '@/lib/jalali';
import { toPersianDigits } from '@/lib/persian';

function ShowDate({ date }: { date: Date }) {
  const jalali = dateToJalali(date);
  
  return (
    <div>
      {/* فرمت بلند */}
      <p>{formatJalaliDate(jalali)}</p>
      {/* خروجی: 15 مرداد 1402 */}
      
      {/* فرمت کوتاه */}
      <p>{toPersianDigits(formatJalaliShort(jalali))}</p>
      {/* خروجی: ۱۴۰۲/۰۵/۱۵ */}
    </div>
  );
}
```

## توابع مفید

### تبدیل تاریخ

```typescript
import { 
  gregorianToJalali, 
  jalaliToGregorian,
  dateToJalali 
} from '@/lib/jalali';

// میلادی به شمسی
const jalali = gregorianToJalali(2024, 8, 6);
// { year: 1403, month: 5, day: 16 }

// شمسی به میلادی
const gregorian = jalaliToGregorian(1403, 5, 16);
// Date object

// Date به شمسی
const today = dateToJalali(new Date());
// { year: 1403, month: 5, day: 16 }
```

### فرمت کردن

```typescript
import { 
  formatJalaliDate, 
  formatJalaliShort 
} from '@/lib/jalali';

const date = { year: 1403, month: 5, day: 16 };

// فرمت بلند
formatJalaliDate(date);
// "16 مرداد 1403"

// فرمت کوتاه
formatJalaliShort(date);
// "1403/05/16"
```

### محاسبات تاریخ

```typescript
import { 
  addDaysToJalali, 
  addMonthsToJalali,
  getDaysInJalaliMonth,
  isJalaliLeapYear
} from '@/lib/jalali';

const date = { year: 1403, month: 5, day: 16 };

// اضافه کردن 10 روز
const newDate = addDaysToJalali(date, 10);

// اضافه کردن 2 ماه
const futureDate = addMonthsToJalali(date, 2);

// تعداد روزهای ماه
const days = getDaysInJalaliMonth(1403, 5); // 31

// سال کبیسه؟
const isLeap = isJalaliLeapYear(1403); // true/false
```

## جایگزینی در پروژه

### قبل (با Input عادی):
```tsx
<Input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
```

### بعد (با JalaliDatePicker):
```tsx
<JalaliDatePicker
  value={date}
  onChange={setDate}
/>
```

## نکات مهم

### 1. ذخیره در Database
همیشه تاریخ رو به صورت ISO string ذخیره کن:
```typescript
const dateToSave = date.toISOString();
// "2024-08-06T12:00:00.000Z"
```

### 2. نمایش به کاربر
برای نمایش، تبدیل به شمسی کن:
```typescript
const jalali = dateToJalali(new Date(savedDate));
const display = formatJalaliDate(jalali);
```

### 3. محاسبه سررسید اقساط
```typescript
import { addMonthsToJalali, jalaliToGregorian } from '@/lib/jalali';

// تاریخ فروش
const saleDate = dateToJalali(new Date());

// محاسبه سررسید قسط اول (1 ماه بعد)
const firstInstallment = addMonthsToJalali(saleDate, 1);
const dueDate = jalaliToGregorian(
  firstInstallment.year,
  firstInstallment.month,
  firstInstallment.day
);
```

### 4. Validation
```typescript
import { parseJalaliDate } from '@/lib/jalali';

const userInput = "1403/05/16";
const parsed = parseJalaliDate(userInput);

if (parsed) {
  // تاریخ معتبر
  const gregorian = jalaliToGregorian(parsed.year, parsed.month, parsed.day);
} else {
  // تاریخ نامعتبر
  alert('تاریخ وارد شده صحیح نیست');
}
```

## استایل سفارشی

```tsx
<JalaliDatePicker
  value={date}
  onChange={setDate}
  className="w-full"
  placeholder="تاریخ را انتخاب کنید"
/>
```

## مثال کامل: فرم فروش

```tsx
import { useState } from 'react';
import { JalaliDatePicker } from '@/components/JalaliDatePicker';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function SaleForm() {
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 روز بعد
  );

  const handleSubmit = () => {
    const sale = {
      saleDate: saleDate.toISOString(),
      firstInstallmentDate: firstInstallmentDate.toISOString(),
      // ... سایر فیلدها
    };
    
    // ذخیره در database
    console.log(sale);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>تاریخ فروش</Label>
        <JalaliDatePicker
          value={saleDate}
          onChange={setSaleDate}
        />
      </div>

      <div>
        <Label>تاریخ سررسید قسط اول</Label>
        <JalaliDatePicker
          value={firstInstallmentDate}
          onChange={setFirstInstallmentDate}
        />
      </div>

      <Button type="submit">ثبت فروش</Button>
    </form>
  );
}
```

## نام ماه‌ها و روزها

```typescript
import { jalaliMonthNames, jalaliDayNames } from '@/lib/jalali';

// ماه‌ها
jalaliMonthNames[0]; // "فروردین"
jalaliMonthNames[4]; // "مرداد"

// روزها
jalaliDayNames[0]; // "شنبه"
jalaliDayNames[6]; // "جمعه"
```

## تست

```typescript
// تست تبدیل
const jalali = gregorianToJalali(2024, 8, 6);
console.log(jalali); // { year: 1403, month: 5, day: 16 }

const gregorian = jalaliToGregorian(1403, 5, 16);
console.log(gregorian); // Date object برای 2024-08-06
```

## پشتیبانی

- ✅ تبدیل دقیق میلادی به شمسی و بالعکس
- ✅ سال‌های کبیسه
- ✅ محاسبات تاریخ (اضافه/کم کردن روز/ماه)
- ✅ فرمت‌های مختلف نمایش
- ✅ اعداد فارسی
- ✅ نام ماه‌ها و روزها به فارسی
- ✅ Validation ورودی
- ✅ UI زیبا و responsive
