import sqlite3
import os
import bcrypt
import sys

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.path.join(SCRIPT_DIR, "installment_business.db")

def reset_password(mobile: str, new_password: str):
    """Reset password for a user"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id, full_name, role FROM users WHERE mobile = ?", (mobile,))
    user = cursor.fetchone()
    
    if not user:
        print(f"\n❌ کاربری با شماره {mobile} یافت نشد!")
        conn.close()
        return False
    
    user_id, full_name, role = user
    
    # Hash new password
    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    
    # Update password
    cursor.execute("""
        UPDATE users SET password = ? WHERE id = ?
    """, (hashed.decode('utf-8'), user_id))
    
    conn.commit()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ رمز عبور با موفقیت تغییر کرد!")
    print("="*60)
    print(f"\n👤 نام: {full_name}")
    print(f"📱 شماره موبایل: {mobile}")
    print(f"🛡️  نقش: {'مدیر سیستم' if role == 'admin' else 'شریک'}")
    print(f"🔑 رمز عبور جدید: {new_password}")
    print("="*60 + "\n")
    
    return True

def main():
    print("\n" + "="*60)
    print("🔐 تغییر رمز عبور کاربر")
    print("="*60 + "\n")
    
    # Get mobile number
    if len(sys.argv) > 1:
        mobile = sys.argv[1]
    else:
        mobile = input("📱 شماره موبایل کاربر (مثال: 09123456789): ").strip()
    
    # Get new password
    if len(sys.argv) > 2:
        new_password = sys.argv[2]
    else:
        new_password = input("🔑 رمز عبور جدید (حداقل 4 کاراکتر): ").strip()
    
    # Validate
    if not mobile or len(mobile) != 11 or not mobile.startswith('09'):
        print("\n❌ شماره موبایل نامعتبر است!")
        return
    
    if not new_password or len(new_password) < 4:
        print("\n❌ رمز عبور باید حداقل 4 کاراکتر باشد!")
        return
    
    # Reset password
    reset_password(mobile, new_password)

if __name__ == "__main__":
    main()
