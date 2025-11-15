from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from database import get_db
from models import Transaction, TransactionCreate

router = APIRouter()

@router.get("/", response_model=List[Transaction])
def get_transactions():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions ORDER BY date DESC")
        return [dict(row) for row in cursor.fetchall()]

@router.get("/partner/{partner_id}", response_model=List[Transaction])
def get_transactions_by_partner(partner_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE partner_id = ? ORDER BY date DESC", (partner_id,))
        return [dict(row) for row in cursor.fetchall()]

@router.post("/", response_model=Transaction)
def create_transaction(transaction: TransactionCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        transaction_id = str(uuid.uuid4())
        date = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO transactions (id, partner_id, type, amount, description, profit_type, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (transaction_id, transaction.partner_id, transaction.type, transaction.amount,
              transaction.description, transaction.profit_type, date))
        
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
        return dict(cursor.fetchone())

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted successfully"}
