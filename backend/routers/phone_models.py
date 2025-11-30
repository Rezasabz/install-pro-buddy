from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from database import get_db
from pydantic import BaseModel

router = APIRouter()

class CustomPhoneModel(BaseModel):
    id: str
    brand: str
    model: str
    created_at: str

class CustomPhoneModelCreate(BaseModel):
    brand: str
    model: str

@router.get("/", response_model=List[CustomPhoneModel])
def get_custom_models():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM custom_phone_models ORDER BY brand, model")
        return [dict(row) for row in cursor.fetchall()]

@router.get("/{brand}", response_model=List[str])
def get_models_by_brand(brand: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT model FROM custom_phone_models WHERE brand = ? ORDER BY model", (brand,))
        return [row['model'] for row in cursor.fetchall()]

@router.post("/", response_model=CustomPhoneModel)
def add_custom_model(model_data: CustomPhoneModelCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # چک کردن اینکه مدل قبلا وجود نداشته باشه
        cursor.execute(
            "SELECT id FROM custom_phone_models WHERE brand = ? AND model = ?",
            (model_data.brand, model_data.model)
        )
        existing = cursor.fetchone()
        
        if existing:
            # اگر وجود داشت، همون رو برگردون
            cursor.execute("SELECT * FROM custom_phone_models WHERE id = ?", (existing['id'],))
            return dict(cursor.fetchone())
        
        # اضافه کردن مدل جدید
        model_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO custom_phone_models (id, brand, model, created_at)
            VALUES (?, ?, ?, ?)
        """, (model_id, model_data.brand, model_data.model, created_at))
        
        cursor.execute("SELECT * FROM custom_phone_models WHERE id = ?", (model_id,))
        return dict(cursor.fetchone())

@router.delete("/{model_id}")
def delete_custom_model(model_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM custom_phone_models WHERE id = ?", (model_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Model not found")
        return {"message": "Model deleted successfully"}
