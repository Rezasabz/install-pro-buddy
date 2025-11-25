from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from database import get_db
from models import Expense, ExpenseCreate, ExpenseUpdate

router = APIRouter()

@router.get("/", response_model=List[Expense])
def get_expenses():
    """Get all expenses"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, date, type, amount, description, created_at as createdAt
            FROM expenses
            ORDER BY date DESC, created_at DESC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@router.get("/{expense_id}", response_model=Expense)
def get_expense(expense_id: str):
    """Get a specific expense"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, date, type, amount, description, created_at as createdAt
            FROM expenses
            WHERE id = ?
        """, (expense_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        return dict(row)

@router.post("/", response_model=Expense)
def create_expense(expense: ExpenseCreate):
    """Create a new expense"""
    expense_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO expenses (id, date, type, amount, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            expense_id,
            expense.date,
            expense.type,
            expense.amount,
            expense.description,
            created_at
        ))
        
        return {
            "id": expense_id,
            "date": expense.date,
            "type": expense.type,
            "amount": expense.amount,
            "description": expense.description,
            "createdAt": created_at
        }

@router.put("/{expense_id}", response_model=Expense)
def update_expense(expense_id: str, expense: ExpenseUpdate):
    """Update an expense"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Build update query dynamically
        updates = []
        values = []
        
        if expense.date is not None:
            updates.append("date = ?")
            values.append(expense.date)
        if expense.type is not None:
            updates.append("type = ?")
            values.append(expense.type)
        if expense.amount is not None:
            updates.append("amount = ?")
            values.append(expense.amount)
        if expense.description is not None:
            updates.append("description = ?")
            values.append(expense.description)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(expense_id)
        query = f"UPDATE expenses SET {', '.join(updates)} WHERE id = ?"
        
        cursor.execute(query, values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Return updated expense
        return get_expense(expense_id)

@router.delete("/{expense_id}")
def delete_expense(expense_id: str):
    """Delete an expense"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        return {"message": "Expense deleted successfully"}

