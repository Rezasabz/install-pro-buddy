from fastapi import APIRouter, HTTPException
import uuid
import hashlib
from datetime import datetime

from database import get_db
from models import User, UserCreate, UserLogin

router = APIRouter()

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    # In production, use bcrypt or argon2
    return hashlib.sha256((password + "salt_key_2024").encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed_password

@router.post("/register", response_model=User)
def register(user_data: UserCreate):
    """Register a new user"""
    # Validation
    if len(user_data.full_name.strip()) < 3:
        raise HTTPException(status_code=400, detail="نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد")
    
    if not user_data.mobile.startswith('09') or len(user_data.mobile) != 11:
        raise HTTPException(status_code=400, detail="شماره موبایل نامعتبر است")
    
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if mobile already exists
        cursor.execute("SELECT id FROM users WHERE mobile = ?", (user_data.mobile,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="این شماره موبایل قبلاً ثبت شده است")
        
        # Create new user
        user_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        hashed_password = hash_password(user_data.password)
        
        cursor.execute("""
            INSERT INTO users (id, full_name, mobile, password, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, user_data.full_name.strip(), user_data.mobile, hashed_password, created_at))
        
        return {
            "id": user_id,
            "fullName": user_data.full_name.strip(),
            "mobile": user_data.mobile,
            "createdAt": created_at
        }

@router.post("/login", response_model=User)
def login(credentials: UserLogin):
    """Login user"""
    if not credentials.mobile or not credentials.password:
        raise HTTPException(status_code=400, detail="لطفاً شماره موبایل و رمز عبور را وارد کنید")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, full_name, mobile, password, created_at
            FROM users
            WHERE mobile = ?
        """, (credentials.mobile,))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="شماره موبایل یا رمز عبور اشتباه است")
        
        user = dict(row)
        
        # Verify password
        if not verify_password(credentials.password, user['password']):
            raise HTTPException(status_code=401, detail="شماره موبایل یا رمز عبور اشتباه است")
        
        return {
            "id": user['id'],
            "fullName": user['full_name'],
            "mobile": user['mobile'],
            "createdAt": user['created_at']
        }

@router.get("/users", response_model=list[User])
def get_all_users():
    """Get all users (for admin purposes)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, full_name as fullName, mobile, created_at as createdAt
            FROM users
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
