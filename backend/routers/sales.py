from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from database import get_db
from models import Sale, SaleCreate, SaleUpdate

router = APIRouter()

@router.get("/", response_model=List[Sale])
def get_sales():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sales ORDER BY sale_date DESC")
        return [dict(row) for row in cursor.fetchall()]

@router.post("/", response_model=Sale)
def create_sale(sale: SaleCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        sale_id = str(uuid.uuid4())
        sale_date = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO sales (id, customer_id, phone_id, announced_price, purchase_price, down_payment,
                             installment_months, monthly_interest_rate, initial_profit, sale_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        """, (sale_id, sale.customer_id, sale.phone_id, sale.announced_price, sale.purchase_price,
              sale.down_payment, sale.installment_months, sale.monthly_interest_rate, sale.initial_profit, sale_date))
        
        # Update phone status to sold
        cursor.execute("UPDATE phones SET status = 'sold' WHERE id = ?", (sale.phone_id,))
        
        cursor.execute("SELECT * FROM sales WHERE id = ?", (sale_id,))
        return dict(cursor.fetchone())

@router.put("/{sale_id}", response_model=Sale)
def update_sale(sale_id: str, sale: SaleUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        values = []
        for field, value in sale.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            values.append(value)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(sale_id)
        cursor.execute(f"UPDATE sales SET {', '.join(updates)} WHERE id = ?", values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        cursor.execute("SELECT * FROM sales WHERE id = ?", (sale_id,))
        return dict(cursor.fetchone())

@router.delete("/{sale_id}")
def delete_sale(sale_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sales WHERE id = ?", (sale_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Sale not found")
        return {"message": "Sale deleted successfully"}
