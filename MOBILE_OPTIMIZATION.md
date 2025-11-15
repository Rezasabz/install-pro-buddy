# 📱 بهینه‌سازی موبایل

## تغییرات اعمال شده

### 1. **Layout و Navigation**
- ✅ منوی همبرگری برای موبایل
- ✅ Header sticky با ارتفاع مناسب
- ✅ دکمه‌های بزرگ‌تر برای لمس راحت‌تر (min 44px)

### 2. **Grid Layouts**
- ✅ Dashboard: 1 ستون در موبایل، 2 در تبلت، 4 در دسکتاپ
- ✅ Partners: 1 ستون در موبایل، 2 در تبلت، 3 در دسکتاپ
- ✅ فاصله‌های کمتر در موبایل (gap-3 به جای gap-4)

### 3. **Typography**
- ✅ اندازه فونت‌های responsive
- ✅ Line-height بهتر برای خوانایی
- ✅ فونت Vazirmatn با وزن‌های مناسب

### 4. **Dialogs و Modals**
- ✅ کامپوننت ResponsiveDialog (Dialog در دسکتاپ، Drawer در موبایل)
- ✅ ارتفاع محدود برای جلوگیری از overflow
- ✅ Scroll داخلی برای محتوای طولانی

### 5. **Cards و Components**
- ✅ Padding کمتر در موبایل
- ✅ فونت‌های کوچک‌تر
- ✅ دکمه‌های full-width در موبایل

### 6. **Touch Interactions**
- ✅ حداقل سایز 44x44px برای دکمه‌ها
- ✅ Tap highlight بهتر
- ✅ Smooth scrolling
- ✅ جلوگیری از text selection ناخواسته

## Breakpoints

```css
/* Mobile First */
sm: 640px   /* تبلت کوچک */
md: 768px   /* تبلت */
lg: 1024px  /* لپتاپ */
xl: 1280px  /* دسکتاپ */
2xl: 1536px /* دسکتاپ بزرگ */
```

## کلاس‌های Utility جدید

### Responsive Text:
```tsx
<h1 className="text-responsive-2xl">عنوان</h1>
<p className="text-responsive-base">متن</p>
```

### Responsive Padding:
```tsx
<div className="p-responsive">محتوا</div>
<div className="px-responsive">محتوا</div>
```

### Responsive Gap:
```tsx
<div className="gap-responsive">محتوا</div>
```

## نکات مهم

### 1. استفاده از ResponsiveDialog
```tsx
import { ResponsiveDialog } from "@/components/ResponsiveDialog";

<ResponsiveDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="عنوان"
>
  {/* محتوا */}
</ResponsiveDialog>
```

### 2. Grid Responsive
```tsx
{/* بد */}
<div className="grid grid-cols-3 gap-4">

{/* خوب */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
```

### 3. دکمه‌های موبایل
```tsx
{/* بد */}
<Button size="sm">متن</Button>

{/* خوب */}
<Button size="sm" className="min-h-[44px] w-full sm:w-auto">
  متن
</Button>
```

### 4. جداول در موبایل
```tsx
{/* استفاده از Card به جای Table */}
<div className="block md:hidden">
  {/* Card view برای موبایل */}
</div>
<div className="hidden md:block">
  {/* Table view برای دسکتاپ */}
</div>
```

## تست موبایل

### Chrome DevTools:
1. F12 برای باز کردن DevTools
2. Ctrl+Shift+M برای Toggle Device Toolbar
3. تست در سایزهای مختلف:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - iPad Pro (1024px)

### تست واقعی:
- روی گوشی واقعی تست کن
- Landscape و Portrait رو چک کن
- سرعت اینترنت کند رو تست کن

## مشکلات رایج و راه‌حل

### 1. دکمه‌ها خیلی کوچک
```tsx
// اضافه کردن min-height
className="min-h-[44px]"
```

### 2. متن خیلی بزرگ
```tsx
// استفاده از responsive text
className="text-sm sm:text-base"
```

### 3. Dialog خیلی بزرگ
```tsx
// استفاده از ResponsiveDialog یا محدود کردن ارتفاع
className="max-h-[90vh] overflow-y-auto"
```

### 4. Grid شلوغ
```tsx
// کاهش تعداد ستون‌ها
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

### 5. فاصله‌ها زیاد
```tsx
// استفاده از gap کمتر
className="gap-2 sm:gap-3 md:gap-4"
```

## چک‌لیست نهایی

- [ ] همه صفحات در موبایل تست شدن
- [ ] دکمه‌ها حداقل 44x44px هستن
- [ ] متن‌ها خوانا هستن
- [ ] Dialog ها responsive هستن
- [ ] Grid ها در موبایل 1-2 ستون هستن
- [ ] Navigation در موبایل کار می‌کنه
- [ ] فرم‌ها راحت پر می‌شن
- [ ] Scroll smooth هست
- [ ] Loading states وجود دارن
- [ ] Error messages واضح هستن

## Performance

### Lighthouse Score هدف:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

### بهینه‌سازی‌های اضافی:
1. Lazy loading برای تصاویر
2. Code splitting
3. Compression (gzip/brotli)
4. CDN برای assets
5. Service Worker برای offline

## منابع

- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-typography)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Web.dev Mobile Performance](https://web.dev/mobile/)
