from fastapi import APIRouter, HTTPException
from typing import List
import uuid

from database import get_db
from models import Installment, InstallmentCreate, InstallmentUpdate

router = APIRouter()

@router.get("/", response_model=List[Installment])
def get_installments():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM installments ORDER BY due_date ASC")
        return [dict(row) for row in cursor.fetchall()]

@router.get("/sale/{sale_id}", response_model=List[Installment])
def get_installments_by_sale(sale_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM installments WHERE sale_id = ? ORDER BY installment_number ASC", (sale_id,))
        return [dict(row) for row in cursor.fetchall()]

@router.post("/", response_model=Installment)
def create_installment(installment: InstallmentCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        installment_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO installments (id, sale_id, installment_number, principal_amount, interest_amount,
                                    total_amount, remaining_debt, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (installment_id, installment.sale_id, installment.installment_number, installment.principal_amount,
              installment.interest_amount, installment.total_amount, installment.remaining_debt, installment.due_date))
        
        cursor.execute("SELECT * FROM installments WHERE id = ?", (installment_id,))
        return dict(cursor.fetchone())

@router.put("/{installment_id}", response_model=Installment)
def update_installment(installment_id: str, installment: InstallmentUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        values = []
        for field, value in installment.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            values.append(value)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(installment_id)
        cursor.execute(f"UPDATE installments SET {', '.join(updates)} WHERE id = ?", values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Installment not found")
        
        cursor.execute("SELECT * FROM installments WHERE id = ?", (installment_id,))
        return dict(cursor.fetchone())

@router.delete("/{installment_id}")
def delete_installment(installment_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM installments WHERE id = ?", (installment_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Installment not found")
        return {"message": "Installment deleted successfully"}
