#!/bin/bash

# اسکریپت بکاپ خودکار دیتابیس
# این اسکریپت هر روز ساعت 2 صبح اجرا میشه

# تنظیمات
BACKUP_DIR="/root/backups/installment-db"
DB_PATH="./data/installment_business.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.db"
KEEP_DAYS=30  # نگهداری بکاپ‌های 30 روز اخیر

# ساخت پوشه بکاپ اگر وجود نداره
mkdir -p "$BACKUP_DIR"

# بکاپ گرفتن
echo "$(date): شروع بکاپ..."
cp "$DB_PATH" "$BACKUP_FILE"

# فشرده‌سازی
gzip "$BACKUP_FILE"
echo "$(date): بکاپ با موفقیت ذخیره شد: ${BACKUP_FILE}.gz"

# حذف بکاپ‌های قدیمی (بیشتر از 30 روز)
find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +$KEEP_DAYS -delete
echo "$(date): بکاپ‌های قدیمی حذف شدند"

# نمایش حجم بکاپ
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "$(date): حجم بکاپ: $BACKUP_SIZE"

# نمایش تعداد بکاپ‌های موجود
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
echo "$(date): تعداد بکاپ‌های موجود: $BACKUP_COUNT"
