from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
import uuid
from datetime import datetime

from database import get_db
from models import (
    Investor,
    InvestorCreate,
    InvestorUpdate,
    InvestorTransaction,
    InvestorTransactionCreate
)

class CapitalAdjustRequest(BaseModel):
    amount: float
    description: str = ""

router = APIRouter()

@router.get("/", response_model=List[Investor])
def get_investors():
    """Get all investors"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, phone, national_id as nationalId, 
                   investment_amount as investmentAmount, profit_rate as profitRate,
                   total_profit as totalProfit, start_date as startDate,
                   status, created_at as createdAt
            FROM investors
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@router.post("/", response_model=Investor)
def create_investor(investor: InvestorCreate):
    """Create a new investor"""
    investor_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO investors (
                id, name, phone, national_id, investment_amount, profit_rate,
                total_profit, start_date, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            investor_id,
            investor.name,
            investor.phone,
            investor.national_id,
            investor.investment_amount,
            investor.profit_rate,
            0.0,  # total_profit starts at 0
            investor.start_date,
            investor.status,
            created_at
        ))
        
        return {
            "id": investor_id,
            "name": investor.name,
            "phone": investor.phone,
            "nationalId": investor.national_id,
            "investmentAmount": investor.investment_amount,
            "profitRate": investor.profit_rate,
            "totalProfit": 0.0,
            "startDate": investor.start_date,
            "status": investor.status,
            "createdAt": created_at
        }

@router.get("/{investor_id}", response_model=Investor)
def get_investor(investor_id: str):
    """Get a specific investor"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, phone, national_id as nationalId,
                   investment_amount as investmentAmount, profit_rate as profitRate,
                   total_profit as totalProfit, start_date as startDate,
                   status, created_at as createdAt
            FROM investors
            WHERE id = ?
        """, (investor_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        return dict(row)

@router.put("/{investor_id}", response_model=Investor)
def update_investor(investor_id: str, investor: InvestorUpdate):
    """Update an investor"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Build update query dynamically
        updates = []
        values = []
        
        if investor.name is not None:
            updates.append("name = ?")
            values.append(investor.name)
        if investor.phone is not None:
            updates.append("phone = ?")
            values.append(investor.phone)
        if investor.national_id is not None:
            updates.append("national_id = ?")
            values.append(investor.national_id)
        if investor.investment_amount is not None:
            updates.append("investment_amount = ?")
            values.append(investor.investment_amount)
        if investor.profit_rate is not None:
            updates.append("profit_rate = ?")
            values.append(investor.profit_rate)
        if investor.total_profit is not None:
            updates.append("total_profit = ?")
            values.append(investor.total_profit)
        if investor.status is not None:
            updates.append("status = ?")
            values.append(investor.status)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(investor_id)
        query = f"UPDATE investors SET {', '.join(updates)} WHERE id = ?"
        
        cursor.execute(query, values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        # Return updated investor
        return get_investor(investor_id)

@router.delete("/{investor_id}")
def delete_investor(investor_id: str):
    """Delete an investor"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM investors WHERE id = ?", (investor_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        # Also delete related transactions
        cursor.execute("DELETE FROM investor_transactions WHERE investor_id = ?", (investor_id,))
        
        return {"message": "Investor deleted successfully"}

# Investor Transactions endpoints
@router.get("/transactions/all", response_model=List[InvestorTransaction])
def get_all_investor_transactions():
    """Get all investor transactions"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, investor_id as investorId, type, amount, description, date
            FROM investor_transactions
            ORDER BY date DESC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@router.get("/{investor_id}/transactions", response_model=List[InvestorTransaction])
def get_investor_transactions(investor_id: str):
    """Get transactions for a specific investor"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, investor_id as investorId, type, amount, description, date
            FROM investor_transactions
            WHERE investor_id = ?
            ORDER BY date DESC
        """, (investor_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@router.post("/transactions/", response_model=InvestorTransaction)
def create_investor_transaction(transaction: InvestorTransactionCreate):
    """Create a new investor transaction"""
    transaction_id = str(uuid.uuid4())
    date = datetime.now().isoformat()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO investor_transactions (
                id, investor_id, type, amount, description, date
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            transaction_id,
            transaction.investor_id,
            transaction.type,
            transaction.amount,
            transaction.description,
            date
        ))
        
        return {
            "id": transaction_id,
            "investorId": transaction.investor_id,
            "type": transaction.type,
            "amount": transaction.amount,
            "description": transaction.description,
            "date": date
        }

@router.post("/{investor_id}/capital/adjust", response_model=Investor)
def adjust_investor_capital(investor_id: str, request: CapitalAdjustRequest):
    """Add or withdraw capital from an investor"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get current investor
        cursor.execute("""
            SELECT investment_amount
            FROM investors
            WHERE id = ?
        """, (investor_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        current_amount = row['investment_amount']
        new_amount = current_amount + request.amount
        
        if new_amount < 0:
            raise HTTPException(status_code=400, detail="Capital cannot be negative")
        
        # Update investor capital
        cursor.execute("""
            UPDATE investors
            SET investment_amount = ?
            WHERE id = ?
        """, (new_amount, investor_id))
        
        # Create transaction
        transaction_id = str(uuid.uuid4())
        transaction_date = datetime.now().isoformat()
        transaction_type = 'investment_add' if request.amount > 0 else 'investment_withdraw'
        transaction_description = request.description or (
            f"افزایش سرمایه {request.amount:,.0f} تومان" if request.amount > 0 
            else f"برداشت سرمایه {abs(request.amount):,.0f} تومان"
        )
        
        cursor.execute("""
            INSERT INTO investor_transactions (
                id, investor_id, type, amount, description, date
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            transaction_id,
            investor_id,
            transaction_type,
            abs(request.amount),
            transaction_description,
            transaction_date
        ))
        
        conn.commit()
        
        # Return updated investor
        return get_investor(investor_id)
