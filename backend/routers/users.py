from fastapi import APIRouter, HTTPException
from typing import List
import uuid
import bcrypt
from datetime import datetime

from database import get_db
from models import User, UserCreate, UserUpdate

router = APIRouter()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@router.get("/", response_model=List[User])
def get_users():
    """Get all users (admin only)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, full_name, mobile, role, partner_id, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@router.post("/", response_model=User)
def create_user(user_data: UserCreate):
    """Create a new user (admin only)"""
    # Validation
    if len(user_data.full_name.strip()) < 3:
        raise HTTPException(status_code=400, detail="نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد")
    
    if not user_data.mobile.startswith('09') or len(user_data.mobile) != 11:
        raise HTTPException(status_code=400, detail="شماره موبایل نامعتبر است")
    
    if len(user_data.password) < 4:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۴ کاراکتر باشد")
    
    # If role is partner, partner_id is required
    if user_data.role == 'partner' and not user_data.partner_id:
        raise HTTPException(status_code=400, detail="برای کاربر شریک باید شریک مرتبط را انتخاب کنید")
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if mobile already exists
        cursor.execute("SELECT id FROM users WHERE mobile = ?", (user_data.mobile,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="این شماره موبایل قبلاً ثبت شده است")
        
        # If partner_id provided, verify it exists
        if user_data.partner_id:
            cursor.execute("SELECT id FROM partners WHERE id = ?", (user_data.partner_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="شریک مورد نظر یافت نشد")
        
        # Create new user
        user_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        hashed_password = hash_password(user_data.password)
        
        cursor.execute("""
            INSERT INTO users (id, full_name, mobile, password, role, partner_id, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        """, (user_id, user_data.full_name.strip(), user_data.mobile, hashed_password, 
              user_data.role, user_data.partner_id, created_at))
        
        return {
            "id": user_id,
            "fullName": user_data.full_name.strip(),
            "mobile": user_data.mobile,
            "role": user_data.role,
            "partnerId": user_data.partner_id,
            "isActive": True,
            "createdAt": created_at
        }

@router.put("/{user_id}", response_model=User)
def update_user(user_id: str, user_data: UserUpdate):
    """Update user (admin only)"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        existing_user = cursor.fetchone()
        if not existing_user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد")
        
        updates = []
        values = []
        
        if user_data.full_name is not None:
            if len(user_data.full_name.strip()) < 3:
                raise HTTPException(status_code=400, detail="نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد")
            updates.append("full_name = ?")
            values.append(user_data.full_name.strip())
        
        if user_data.mobile is not None:
            if not user_data.mobile.startswith('09') or len(user_data.mobile) != 11:
                raise HTTPException(status_code=400, detail="شماره موبایل نامعتبر است")
            # Check if mobile already exists for another user
            cursor.execute("SELECT id FROM users WHERE mobile = ? AND id != ?", (user_data.mobile, user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="این شماره موبایل قبلاً ثبت شده است")
            updates.append("mobile = ?")
            values.append(user_data.mobile)
        
        if user_data.password is not None:
            if len(user_data.password) < 4:
                raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۴ کاراکتر باشد")
            updates.append("password = ?")
            values.append(hash_password(user_data.password))
        
        if user_data.role is not None:
            updates.append("role = ?")
            values.append(user_data.role)
        
        if user_data.partner_id is not None:
            # Verify partner exists
            cursor.execute("SELECT id FROM partners WHERE id = ?", (user_data.partner_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="شریک مورد نظر یافت نشد")
            updates.append("partner_id = ?")
            values.append(user_data.partner_id)
        
        if user_data.is_active is not None:
            updates.append("is_active = ?")
            values.append(1 if user_data.is_active else 0)
        
        if not updates:
            raise HTTPException(status_code=400, detail="هیچ فیلدی برای بروزرسانی ارسال نشده است")
        
        values.append(user_id)
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", values)
        
        # Get updated user
        cursor.execute("""
            SELECT id, full_name, mobile, role, partner_id, is_active, created_at
            FROM users WHERE id = ?
        """, (user_id,))
        updated_user = dict(cursor.fetchone())
        
        return {
            "id": updated_user['id'],
            "fullName": updated_user['full_name'],
            "mobile": updated_user['mobile'],
            "role": updated_user['role'],
            "partnerId": updated_user.get('partner_id'),
            "isActive": bool(updated_user['is_active']),
            "createdAt": updated_user['created_at']
        }

@router.delete("/{user_id}")
def delete_user(user_id: str):
    """Delete user (admin only)"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد")
        
        # Prevent deleting the last admin
        if dict(user)['role'] == 'admin':
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
            admin_count = dict(cursor.fetchone())['count']
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="نمی‌توانید آخرین ادمین را حذف کنید")
        
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد")
        
        return {"message": "کاربر با موفقیت حذف شد"}
