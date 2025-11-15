# 🔧 رفع مشکلات Deploy

## مشکل: crypto.randomUUID در Production

### علت:
`crypto.randomUUID()` فقط در این شرایط کار می‌کنه:
- ✅ HTTPS (محیط secure)
- ✅ localhost
- ✅ مرورگرهای جدید (Chrome 92+, Firefox 95+, Safari 15.4+)

در production روی HTTP یا مرورگرهای قدیمی‌تر، این خطا رو می‌ده:
```
TypeError: crypto.randomUUID is not a function
```

### راه‌حل:
یک polyfill اضافه کردیم که در همه محیط‌ها کار می‌کنه.

## فایل‌های تغییر یافته:

### 1. `src/lib/uuid.ts` (جدید)
```typescript
export function generateUUID(): string {
  // Try native first
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to polyfill
    }
  }

  // Polyfill for older browsers or HTTP
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### 2. `src/lib/store.ts`
تمام `crypto.randomUUID()` به `generateUUID()` تبدیل شد.

## تست

### قبل از Deploy:
```bash
# Build کردن
npm run build

# تست build شده
npm run preview
```

### بعد از Deploy:
1. سایت رو باز کن
2. Console رو چک کن (F12)
3. یک شریک جدید اضافه کن
4. باید بدون خطا کار کنه

## مشکلات دیگر Production

### 1. HTTPS اجباری
اگر می‌خوای از `crypto.randomUUID` اصلی استفاده کنی، باید HTTPS داشته باشی.

**راه‌حل:**
- استفاده از Cloudflare (رایگان)
- Let's Encrypt SSL
- Netlify/Vercel (HTTPS خودکار)

### 2. Environment Variables
مطمئن شو که `.env` در production تنظیم شده:
```env
VITE_API_URL=https://your-api-domain.com
```

### 3. CORS
اگر backend جدا هست، CORS رو تنظیم کن:
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Build Optimization
```bash
# بهینه‌سازی build
npm run build

# چک کردن سایز
ls -lh dist/assets/
```

اگر فایل‌ها خیلی بزرگ بودن:
- Code splitting
- Tree shaking
- Lazy loading
- Image optimization

## Checklist Deploy

- [ ] Build بدون خطا
- [ ] Preview تست شده
- [ ] Environment variables تنظیم شدن
- [ ] HTTPS فعاله (یا polyfill UUID کار می‌کنه)
- [ ] CORS درست تنظیم شده
- [ ] Database connection کار می‌کنه
- [ ] همه صفحات تست شدن
- [ ] موبایل تست شده
- [ ] مرورگرهای مختلف تست شدن

## پلتفرم‌های توصیه شده

### Frontend:
- **Vercel** (توصیه می‌شه) - HTTPS خودکار، سریع
- **Netlify** - رایگان، آسون
- **Cloudflare Pages** - سریع، CDN جهانی

### Backend:
- **Railway** - آسون، Docker support
- **Render** - رایگان، خوب
- **Fly.io** - سریع، global
- **DigitalOcean App Platform** - قابل اعتماد

### Database:
- **SQLite** - برای MVP کافیه
- **PostgreSQL** - برای production بهتره
- **Supabase** - PostgreSQL managed + API

## مانیتورینگ

بعد از deploy، این‌ها رو چک کن:
- Error tracking (Sentry)
- Performance (Google Analytics)
- Uptime monitoring (UptimeRobot)
- Logs (Logtail, Papertrail)

## Rollback

اگر مشکلی پیش اومد:
```bash
# Git rollback
git revert HEAD
git push

# یا deploy نسخه قبلی
git checkout previous-commit
git push -f
```

## پشتیبانی

اگر مشکلی داشتی:
1. Console browser رو چک کن
2. Network tab رو بررسی کن
3. Backend logs رو ببین
4. Database connection رو تست کن
