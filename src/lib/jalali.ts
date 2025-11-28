// تبدیل تاریخ میلادی به شمسی و بالعکس

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

// تبدیل میلادی به شمسی
export function gregorianToJalali(gYear: number, gMonth: number, gDay: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  
  let jy = gYear <= 1600 ? 0 : 979;
  gYear -= gYear <= 1600 ? 621 : 1600;
  
  const gy2 = gMonth > 2 ? gYear + 1 : gYear;
  let days = 365 * gYear + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + 
             Math.floor((gy2 + 399) / 400) - 80 + gDay + g_d_m[gMonth - 1];
  
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  
  return { year: jy, month: jm, day: jd };
}

// تبدیل شمسی به میلادی
export function jalaliToGregorian(jYear: number, jMonth: number, jDay: number): Date {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  
  let gy = jYear <= 979 ? 621 : 1600;
  jYear -= jYear <= 979 ? 0 : 979;
  
  let days = 365 * jYear + Math.floor(jYear / 33) * 8 + Math.floor((jYear % 33 + 3) / 4) + 78 + jDay +
             (jMonth < 7 ? (jMonth - 1) * 31 : (jMonth - 7) * 30 + 186);
  
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  
  let leap = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    else leap = false;
  }
  
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  
  if (days >= 366) {
    leap = false;
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }
  
  let gm = 0;
  for (let i = 0; g_d_m[i + 1] <= days; i++) gm = i + 1;
  const gd = days - g_d_m[gm] + 1;
  gm++;
  
  // استفاده از UTC برای جلوگیری از مشکلات timezone
  const date = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
  return date;
}

// تبدیل Date به JalaliDate
export function dateToJalali(date: Date): JalaliDate {
  return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// فرمت کردن تاریخ شمسی
export function formatJalaliDate(date: JalaliDate): string {
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  return `${date.day} ${monthNames[date.month - 1]} ${date.year}`;
}

// فرمت کوتاه (1402/05/15)
export function formatJalaliShort(date: JalaliDate): string {
  const y = date.year.toString();
  const m = date.month.toString().padStart(2, '0');
  const d = date.day.toString().padStart(2, '0');
  return `${y}/${m}/${d}`;
}

// Parse کردن تاریخ از string
export function parseJalaliDate(dateStr: string): JalaliDate | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  
  return { year, month, day };
}

// نام ماه‌های فارسی
export const jalaliMonthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// نام روزهای هفته
export const jalaliDayNames = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

// تعداد روزهای هر ماه
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // بهمن و اسفند
  return isJalaliLeapYear(year) ? 30 : 29;
}

// سال کبیسه شمسی
export function isJalaliLeapYear(year: number): boolean {
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  const gy = year + 621;
  const leap = -14;
  let jp = breaks[0];
  
  let jump = 0;
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (year < jm) break;
    jp = jm;
  }
  
  let n = year - jp;
  if (jump - n < 6) n = n - jump + (Math.floor((jump + 4) / 33) * 33);
  
  let leapJ = ((n + 1) % 33 - 1) % 4;
  if (leapJ === -1) leapJ = 4;
  
  return leapJ === 0;
}

// اضافه کردن روز به تاریخ شمسی
export function addDaysToJalali(date: JalaliDate, days: number): JalaliDate {
  const gDate = jalaliToGregorian(date.year, date.month, date.day);
  gDate.setDate(gDate.getDate() + days);
  return dateToJalali(gDate);
}

// اضافه کردن ماه به تاریخ شمسی
export function addMonthsToJalali(date: JalaliDate, months: number): JalaliDate {
  let newMonth = date.month + months;
  let newYear = date.year;
  
  while (newMonth > 12) {
    newMonth -= 12;
    newYear++;
  }
  
  while (newMonth < 1) {
    newMonth += 12;
    newYear--;
  }
  
  const maxDay = getDaysInJalaliMonth(newYear, newMonth);
  const newDay = Math.min(date.day, maxDay);
  
  return { year: newYear, month: newMonth, day: newDay };
}

// اضافه کردن ماه به تاریخ میلادی با در نظر گرفتن تقویم شمسی
export function addMonthsToDate(date: Date, months: number): Date {
  // تبدیل به شمسی
  const jalali = dateToJalali(date);
  
  // اضافه کردن ماه
  const newJalali = addMonthsToJalali(jalali, months);
  
  // تبدیل به میلادی
  return jalaliToGregorian(newJalali.year, newJalali.month, newJalali.day);
}
