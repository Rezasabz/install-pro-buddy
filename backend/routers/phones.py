from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from database import get_db
from models import Phone, PhoneCreate, PhoneUpdate

router = APIRouter()

@router.get("/", response_model=List[Phone])
def get_phones():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM phones ORDER BY purchase_date DESC")
        return [dict(row) for row in cursor.fetchall()]

@router.post("/", response_model=Phone)
def create_phone(phone: PhoneCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if IMEI already exists
        cursor.execute("SELECT id FROM phones WHERE imei = ?", (phone.imei,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail=f"گوشی با IMEI {phone.imei} قبلاً ثبت شده است")
        
        phone_id = str(uuid.uuid4())
        purchase_date = phone.purchase_date if phone.purchase_date else datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO phones (id, brand, model, imei, purchase_price, selling_price, status, purchase_date, 
                              color, storage, condition, purchase_source, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (phone_id, phone.brand, phone.model, phone.imei, phone.purchase_price, phone.selling_price, 
              phone.status, purchase_date, phone.color, phone.storage, phone.condition, 
              phone.purchase_source, phone.notes))
        
        cursor.execute("SELECT * FROM phones WHERE id = ?", (phone_id,))
        return dict(cursor.fetchone())

@router.put("/{phone_id}", response_model=Phone)
def update_phone(phone_id: str, phone: PhoneUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        values = []
        for field, value in phone.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            values.append(value)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(phone_id)
        cursor.execute(f"UPDATE phones SET {', '.join(updates)} WHERE id = ?", values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Phone not found")
        
        cursor.execute("SELECT * FROM phones WHERE id = ?", (phone_id,))
        return dict(cursor.fetchone())

@router.delete("/{phone_id}")
def delete_phone(phone_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM phones WHERE id = ?", (phone_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Phone not found")
        return {"message": "Phone deleted successfully"}
