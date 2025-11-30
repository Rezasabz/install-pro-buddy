#!/usr/bin/env python3
"""
Migration: Add profit calculation columns to sales table
"""
import sqlite3

DATABASE_URL = "installment_business.db"

def migrate():
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # چک کردن اینکه ستون‌ها وجود دارن یا نه
        cursor.execute("PRAGMA table_info(sales)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # اضافه کردن ستون‌های جدید اگر وجود ندارن
        if 'profit_calculation_type' not in columns:
            print("Adding profit_calculation_type column...")
            cursor.execute("""
                ALTER TABLE sales 
                ADD COLUMN profit_calculation_type TEXT DEFAULT 'fixed_4_percent'
            """)
            print("✅ profit_calculation_type added")
        
        if 'custom_profit_rate' not in columns:
            print("Adding custom_profit_rate column...")
            cursor.execute("""
                ALTER TABLE sales 
                ADD COLUMN custom_profit_rate REAL DEFAULT 0.04
            """)
            print("✅ custom_profit_rate added")
        
        if 'total_profit' not in columns:
            print("Adding total_profit column...")
            cursor.execute("""
                ALTER TABLE sales 
                ADD COLUMN total_profit REAL DEFAULT 0
            """)
            print("✅ total_profit added")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
