import sqlite3
import os

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.path.join(SCRIPT_DIR, "installment_business.db")

def migrate_phones_table():
    """Add new fields to phones table"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(phones)")
    columns = [row[1] for row in cursor.fetchall()]
    
    # Add new columns if they don't exist
    new_columns = [
        ("color", "TEXT"),
        ("storage", "TEXT"),
        ("condition", "TEXT DEFAULT 'new'"),
        ("purchase_source", "TEXT"),
        ("notes", "TEXT"),
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in columns:
            try:
                cursor.execute(f"ALTER TABLE phones ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added column: {col_name}")
            except sqlite3.OperationalError as e:
                print(f"⚠️  Column {col_name} might already exist: {e}")
    
    conn.commit()
    conn.close()
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate_phones_table()
