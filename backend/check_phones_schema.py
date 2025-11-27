import sqlite3

conn = sqlite3.connect("installment_business.db")
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(phones)")
cols = cursor.fetchall()

print("Columns in phones table:")
for i, col in enumerate(cols, 1):
    print(f"{i}. {col[1]} ({col[2]})")

conn.close()
