# ──────────────────────────────
# مرحله بیلد خیلی کم‌مصرف
# ──────────────────────────────
FROM node:20-alpine AS builder

# محدودیت سخت‌گیرانه رم برای Node.js (این خط حیاتیه!)
ENV NODE_OPTIONS="--max-old-space-size=384"

WORKDIR /app

# اول فقط پکیج‌ها رو نصب کن (کش بشه و بعداً تکرار نشه)
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps --prefer-offline --no-audit --silent

# فقط فایل‌های لازم برای بیلد رو کپی کن
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY index.html ./
COPY public ./public
COPY src ./src

# بیلد با کمترین مصرف ممکن
RUN npm run build -- --mode production

# ──────────────────────────────
# مرحله نهایی (خیلی کوچک ~15-25 MB)
# ──────────────────────────────
FROM nginx:alpine AS production

# کپی فایل‌های بیلد شده
COPY --from=builder /app/dist /usr/share/nginx/html

# تنظیمات nginx بهینه (gzip + cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx رو با کمترین مصرف مموری اجرا کن
CMD ["nginx", "-g", "daemon off;"]