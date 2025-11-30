#!/bin/bash

# اسکریپت بازیابی دیتابیس از بکاپ

BACKUP_DIR="/root/backups/installment-db"
DB_PATH="./data/installment_business.db"

# نمایش لیست بکاپ‌ها
echo "لیست بکاپ‌های موجود:"
echo "===================="
ls -lh "$BACKUP_DIR" | grep "backup_"

# دریافت نام فایل بکاپ از کاربر
echo ""
read -p "نام فایل بکاپ را وارد کنید (مثال: backup_20231130_020000.db.gz): " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "خطا: فایل بکاپ پیدا نشد!"
    exit 1
fi

# تایید بازیابی
read -p "آیا مطمئن هستید که میخواهید دیتابیس فعلی را با این بکاپ جایگزین کنید؟ (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "عملیات لغو شد."
    exit 0
fi

# توقف backend
echo "توقف backend..."
docker compose stop backend

# بکاپ از دیتابیس فعلی (احتیاط)
echo "بکاپ احتیاطی از دیتابیس فعلی..."
cp "$DB_PATH" "${DB_PATH}.before_restore_$(date +%Y%m%d_%H%M%S)"

# بازیابی
echo "بازیابی دیتابیس..."
gunzip -c "$BACKUP_DIR/$BACKUP_FILE" > "$DB_PATH"

# راه‌اندازی مجدد backend
echo "راه‌اندازی مجدد backend..."
docker compose start backend

echo "بازیابی با موفقیت انجام شد!"
