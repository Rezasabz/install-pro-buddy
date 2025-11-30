from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime
import calendar

from database import get_db
from models import Sale, SaleCreate, SaleUpdate

def add_months_to_date(date: datetime, months: int) -> datetime:
    """Add months to a date properly handling month boundaries"""
    year = date.year
    month = date.month + months
    day = date.day
    
    # Handle year overflow
    while month > 12:
        month -= 12
        year += 1
    
    while month < 1:
        month += 12
        year -= 1
    
    # Handle day overflow (e.g., Jan 31 + 1 month should be Feb 28/29)
    max_day = calendar.monthrange(year, month)[1]
    if day > max_day:
        day = max_day
    
    return datetime(year, month, day, date.hour, date.minute, date.second, date.microsecond)

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
        # استفاده از تاریخ ارسال شده از frontend یا تاریخ امروز اگر ارسال نشده
        sale_date = sale.sale_date if sale.sale_date else datetime.now().isoformat()
        
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
