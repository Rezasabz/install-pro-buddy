FROM node:20-alpine AS builder

# محدودیت رم (حیاتی)
ENV NODE_OPTIONS="--max-old-space-size=384"

WORKDIR /app

# فقط dependencyهای اصلی + vite رو نصب کن (devDependencies لازم نیست)
COPY package*.json ./
RUN npm ci --only=production && \
    npm install vite --no-save   # فقط vite رو موقت نصب می‌کنه

# کپی سورس
COPY . .

# تنظیم environment variable برای build
# استفاده از relative URL برای proxy از طریق nginx
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

# بیلد (حالا vite پیدا می‌شه)
RUN npm run build

# مرحله نهایی
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]