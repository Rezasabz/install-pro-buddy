from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from database import get_db
from models import Customer, CustomerCreate, CustomerUpdate

router = APIRouter()

@router.get("/", response_model=List[Customer])
def get_customers():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM customers ORDER BY created_at DESC")
        return [dict(row) for row in cursor.fetchall()]

@router.post("/", response_model=Customer)
def create_customer(customer: CustomerCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        customer_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO customers (id, name, phone, national_id, address, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (customer_id, customer.name, customer.phone, customer.national_id, customer.address, created_at))
        
        cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
        return dict(cursor.fetchone())

@router.put("/{customer_id}", response_model=Customer)
def update_customer(customer_id: str, customer: CustomerUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        values = []
        for field, value in customer.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            values.append(value)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(customer_id)
        cursor.execute(f"UPDATE customers SET {', '.join(updates)} WHERE id = ?", values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
        return dict(cursor.fetchone())

@router.delete("/{customer_id}")
def delete_customer(customer_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        return {"message": "Customer deleted successfully"}
