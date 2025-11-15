from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from database import get_db
from models import Partner, PartnerCreate, PartnerUpdate

router = APIRouter()

@router.get("/", response_model=List[Partner])
def get_partners():
    """Get all partners"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM partners ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@router.post("/", response_model=Partner)
def create_partner(partner: PartnerCreate):
    """Create a new partner"""
    with get_db() as conn:
        cursor = conn.cursor()
        partner_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO partners (id, name, capital, available_capital, initial_profit, monthly_profit, share, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (partner_id, partner.name, partner.capital, partner.capital, 0, 0, partner.share, created_at))
        
        cursor.execute("SELECT * FROM partners WHERE id = ?", (partner_id,))
        row = cursor.fetchone()
        return dict(row)

@router.get("/{partner_id}", response_model=Partner)
def get_partner(partner_id: str):
    """Get a specific partner"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM partners WHERE id = ?", (partner_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Partner not found")
        return dict(row)

@router.put("/{partner_id}", response_model=Partner)
def update_partner(partner_id: str, partner: PartnerUpdate):
    """Update a partner"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Build update query dynamically
        updates = []
        values = []
        for field, value in partner.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            values.append(value)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(partner_id)
        query = f"UPDATE partners SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        cursor.execute("SELECT * FROM partners WHERE id = ?", (partner_id,))
        row = cursor.fetchone()
        return dict(row)

@router.delete("/{partner_id}")
def delete_partner(partner_id: str):
    """Delete a partner"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM partners WHERE id = ?", (partner_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Partner not found")
        return {"message": "Partner deleted successfully"}
