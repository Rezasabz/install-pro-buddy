#!/usr/bin/env python3
"""
Migration to add partner history table for tracking partner changes over time
"""
import sqlite3
from datetime import datetime

def migrate_partner_history():
    conn = sqlite3.connect('installment_business.db')
    cursor = conn.cursor()
    
    try:
        # Create partner_history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS partner_history (
                id TEXT PRIMARY KEY,
                partner_id TEXT NOT NULL,
                name TEXT NOT NULL,
                capital REAL NOT NULL,
                available_capital REAL NOT NULL DEFAULT 0,
                initial_profit REAL NOT NULL DEFAULT 0,
                monthly_profit REAL NOT NULL DEFAULT 0,
                share REAL NOT NULL DEFAULT 0,
                action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
                action_date TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        
        # Create index for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_partner_history_partner_id 
            ON partner_history(partner_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_partner_history_action_date 
            ON partner_history(action_date)
        """)
        
        # Populate history with existing partners
        cursor.execute("SELECT * FROM partners")
        existing_partners = cursor.fetchall()
        
        for partner in existing_partners:
            partner_id, name, capital, available_capital, initial_profit, monthly_profit, share, created_at = partner
            
            # Add creation record to history
            cursor.execute("""
                INSERT INTO partner_history 
                (id, partner_id, name, capital, available_capital, initial_profit, monthly_profit, share, action, action_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', ?, ?)
            """, (
                f"{partner_id}_created_{created_at}",
                partner_id,
                name,
                capital,
                available_capital,
                initial_profit,
                monthly_profit,
                share,
                created_at,
                created_at
            ))
        
        conn.commit()
        print("✅ Partner history table created and populated successfully")
        
    except Exception as e:
        print(f"❌ Error creating partner history table: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_partner_history()