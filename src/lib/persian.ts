// تبدیل اعداد انگلیسی به فارسی
export function toPersianDigits(num: number | string | undefined): string {
  if (num === undefined || num === null) return '۰';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// فرمت کردن عدد با جداکننده هزارگان
export function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '۰';
  }
  // تبدیل به عدد و سپس فرمت
  const number = Number(num);
  return number.toLocaleString('fa-IR');
}

// فرمت کردن مبلغ با تومان
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '۰ تومان';
  }
  return `${formatNumber(amount)} تومان`;
}

// تبدیل تاریخ میلادی به شمسی (ساده)
export function toJalaliDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('fa-IR').format(d);
}

// محاسبه درصد
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

// محاسبه سود بر اساس نسبت سرمایه
export function calculateProfit(totalProfit: number, partnerShare: number): number {
  return Math.round(totalProfit * (partnerShare / 100));
}
