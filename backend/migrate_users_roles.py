import sqlite3
import os
import bcrypt

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.path.join(SCRIPT_DIR, "installment_business.db")

def migrate_users_table():
    """Add role and partner_id fields to users table"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    
    # Add new columns if they don't exist
    if "role" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'")
        print("✅ Added column: role")
    
    if "partner_id" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN partner_id TEXT")
        print("✅ Added column: partner_id")
    
    if "is_active" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")
        print("✅ Added column: is_active")
    
    # Check if default admin exists
    cursor.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    admin = cursor.fetchone()
    
    if not admin:
        # Create default admin user
        import uuid
        from datetime import datetime
        
        admin_id = str(uuid.uuid4())
        admin_mobile = "09123456789"
        admin_password = "admin123"
        admin_name = "مدیر سیستم"
        
        # Hash password
        hashed = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
        
        cursor.execute("""
            INSERT INTO users (id, full_name, mobile, password, role, is_active, created_at)
            VALUES (?, ?, ?, ?, 'admin', 1, ?)
        """, (admin_id, admin_name, admin_mobile, hashed.decode('utf-8'), datetime.now().isoformat()))
        
        print(f"\n✅ Created default admin user:")
        print(f"   Mobile: {admin_mobile}")
        print(f"   Password: {admin_password}")
        print(f"   ⚠️  Please change this password after first login!")
    
    conn.commit()
    conn.close()
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate_users_table()
