import sqlite3
import os
import bcrypt
import uuid
from datetime import datetime

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.path.join(SCRIPT_DIR, "installment_business.db")

def create_default_admin():
    """Create a default admin user"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Admin credentials
    admin_mobile = "09123456789"
    admin_password = "admin123"
    admin_name = "مدیر سیستم"
    
    # Check if admin already exists
    cursor.execute("SELECT id FROM users WHERE mobile = ?", (admin_mobile,))
    existing = cursor.fetchone()
    
    if existing:
        print(f"⚠️  کاربر با شماره {admin_mobile} قبلاً وجود دارد")
        print(f"   برای تغییر رمز عبور، از اسکریپت reset_password.py استفاده کنید")
        conn.close()
        return
    
    # Hash password
    hashed = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO users (id, full_name, mobile, password, role, is_active, created_at)
        VALUES (?, ?, ?, ?, 'admin', 1, ?)
    """, (admin_id, admin_name, admin_mobile, hashed.decode('utf-8'), created_at))
    
    conn.commit()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ کاربر ادمین با موفقیت ساخته شد!")
    print("="*60)
    print(f"\n📱 شماره موبایل: {admin_mobile}")
    print(f"🔑 رمز عبور: {admin_password}")
    print(f"👤 نام: {admin_name}")
    print(f"🛡️  نقش: مدیر سیستم (Admin)")
    print("\n⚠️  توجه: لطفاً پس از اولین ورود، رمز عبور را تغییر دهید!")
    print("="*60 + "\n")

if __name__ == "__main__":
    create_default_admin()
