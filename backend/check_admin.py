import sqlite3
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.path.join(SCRIPT_DIR, "installment_business.db")

conn = sqlite3.connect(DATABASE_URL)
cursor = conn.cursor()

cursor.execute("SELECT mobile, full_name, role FROM users WHERE role = 'admin'")
admins = cursor.fetchall()

print("Admin users:")
for admin in admins:
    print(f"  Mobile: {admin[0]}, Name: {admin[1]}, Role: {admin[2]}")

if not admins:
    print("  No admin users found!")

conn.close()
