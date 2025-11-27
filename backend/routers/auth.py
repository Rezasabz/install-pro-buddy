from fastapi import APIRouter, HTTPException
import uuid
import bcrypt
from datetime import datetime

from database import get_db
from models import User, UserLogin

router = APIRouter()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

# Register endpoint removed - only admin can create users

@router.post("/login", response_model=User)
def login(credentials: UserLogin):
    """Login user"""
    if not credentials.mobile or not credentials.password:
        raise HTTPException(status_code=400, detail="لطفاً شماره موبایل و رمز عبور را وارد کنید")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, full_name, mobile, password, role, partner_id, is_active, created_at
            FROM users
            WHERE mobile = ?
        """, (credentials.mobile,))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="شماره موبایل یا رمز عبور اشتباه است")
        
        user = dict(row)
        
        # Check if user is active
        if not user.get('is_active', 1):
            raise HTTPException(status_code=403, detail="حساب کاربری شما غیرفعال شده است")
        
        # Verify password
        if not verify_password(credentials.password, user['password']):
            raise HTTPException(status_code=401, detail="شماره موبایل یا رمز عبور اشتباه است")
        
        return {
            "id": user['id'],
            "fullName": user['full_name'],
            "mobile": user['mobile'],
            "role": user.get('role', 'admin'),
            "partnerId": user.get('partner_id'),
            "isActive": bool(user.get('is_active', 1)),
            "createdAt": user['created_at']
        }
