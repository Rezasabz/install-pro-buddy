import sqlite3
from contextlib import contextmanager
from typing import Generator

DATABASE_URL = "installment_business.db"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for database connection"""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initialize database with tables"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Partners table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS partners (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                capital REAL NOT NULL DEFAULT 0,
                available_capital REAL NOT NULL DEFAULT 0,
                initial_profit REAL NOT NULL DEFAULT 0,
                monthly_profit REAL NOT NULL DEFAULT 0,
                share REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        
        # Phones table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS phones (
                id TEXT PRIMARY KEY,
                brand TEXT NOT NULL,
                model TEXT NOT NULL,
                imei TEXT NOT NULL UNIQUE,
                purchase_price REAL NOT NULL,
                selling_price REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'available',
                purchase_date TEXT NOT NULL
            )
        """)
        
        # Customers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                national_id TEXT NOT NULL,
                address TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        
        # Sales table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                phone_id TEXT NOT NULL,
                announced_price REAL NOT NULL,
                purchase_price REAL NOT NULL,
                down_payment REAL NOT NULL DEFAULT 0,
                installment_months INTEGER NOT NULL,
                monthly_interest_rate REAL NOT NULL DEFAULT 0.04,
                initial_profit REAL NOT NULL DEFAULT 0,
                sale_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (phone_id) REFERENCES phones(id)
            )
        """)
        
        # Installments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS installments (
                id TEXT PRIMARY KEY,
                sale_id TEXT NOT NULL,
                installment_number INTEGER NOT NULL,
                principal_amount REAL NOT NULL,
                interest_amount REAL NOT NULL,
                total_amount REAL NOT NULL,
                remaining_debt REAL NOT NULL,
                due_date TEXT NOT NULL,
                paid_date TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                FOREIGN KEY (sale_id) REFERENCES sales(id)
            )
        """)
        
        # Transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                partner_id TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT NOT NULL,
                profit_type TEXT,
                date TEXT NOT NULL,
                FOREIGN KEY (partner_id) REFERENCES partners(id)
            )
        """)
        
        # Investors table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS investors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                national_id TEXT NOT NULL,
                investment_amount REAL NOT NULL,
                profit_rate REAL NOT NULL DEFAULT 4.0,
                total_profit REAL NOT NULL DEFAULT 0,
                start_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL
            )
        """)
        
        # Investor Transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS investor_transactions (
                id TEXT PRIMARY KEY,
                investor_id TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT NOT NULL,
                date TEXT NOT NULL,
                FOREIGN KEY (investor_id) REFERENCES investors(id)
            )
        """)
        
        # Users table for authentication
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                mobile TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_phone ON sales(phone_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installments_sale ON installments(sale_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_partner ON transactions(partner_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_investor_transactions_investor ON investor_transactions(investor_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile)")
        
        conn.commit()
        print("✅ Database initialized successfully")
