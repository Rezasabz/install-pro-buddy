#!/usr/bin/env python3
"""
Migration to add status and deletedAt fields to partners table
"""
import sqlite3
from datetime import datetime

def migrate_partner_status():
    conn = sqlite3.connect('installment_business.db')
    cursor = conn.cursor()
    
    try:
        # Check if status column exists
        cursor.execute("PRAGMA table_info(partners)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'status' not in columns:
            cursor.execute("ALTER TABLE partners ADD COLUMN status TEXT DEFAULT 'active'")
            print("✅ Added status column to partners table")
        
        if 'deleted_at' not in columns:
            cursor.execute("ALTER TABLE partners ADD COLUMN deleted_at TEXT")
            print("✅ Added deleted_at column to partners table")
        
        # Set all existing partners to active
        cursor.execute("UPDATE partners SET status = 'active' WHERE status IS NULL")
        
        conn.commit()
        print("✅ Partner status migration completed successfully")
        
    except Exception as e:
        print(f"❌ Error migrating partner status: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_partner_status()