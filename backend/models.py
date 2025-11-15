from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# Partner Models
class PartnerBase(BaseModel):
    name: str
    capital: float
    share: float

class PartnerCreate(PartnerBase):
    pass

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    capital: Optional[float] = None
    available_capital: Optional[float] = None
    initial_profit: Optional[float] = None
    monthly_profit: Optional[float] = None
    share: Optional[float] = None

class Partner(PartnerBase):
    id: str
    available_capital: float
    initial_profit: float
    monthly_profit: float
    created_at: str

    class Config:
        from_attributes = True

# Phone Models
class PhoneBase(BaseModel):
    brand: str
    model: str
    imei: str
    purchase_price: float
    selling_price: float

class PhoneCreate(PhoneBase):
    pass

class PhoneUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    imei: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    status: Optional[Literal['available', 'sold']] = None

class Phone(PhoneBase):
    id: str
    status: str
    purchase_date: str

    class Config:
        from_attributes = True

# Customer Models
class CustomerBase(BaseModel):
    name: str
    phone: str
    national_id: str
    address: str

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    address: Optional[str] = None

class Customer(CustomerBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True

# Sale Models
class SaleBase(BaseModel):
    customer_id: str
    phone_id: str
    announced_price: float
    purchase_price: float
    down_payment: float
    installment_months: int
    monthly_interest_rate: float = 0.04
    initial_profit: float

class SaleCreate(SaleBase):
    pass

class SaleUpdate(BaseModel):
    status: Optional[Literal['active', 'completed', 'defaulted']] = None

class Sale(SaleBase):
    id: str
    sale_date: str
    status: str

    class Config:
        from_attributes = True

# Installment Models
class InstallmentBase(BaseModel):
    sale_id: str
    installment_number: int
    principal_amount: float
    interest_amount: float
    total_amount: float
    remaining_debt: float
    due_date: str

class InstallmentCreate(InstallmentBase):
    pass

class InstallmentUpdate(BaseModel):
    status: Optional[Literal['pending', 'paid', 'overdue']] = None
    paid_date: Optional[str] = None

class Installment(InstallmentBase):
    id: str
    paid_date: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# Transaction Models
class TransactionBase(BaseModel):
    partner_id: str
    type: Literal['capital_add', 'capital_withdraw', 'initial_profit_withdraw', 'monthly_profit_withdraw', 'profit_to_capital']
    amount: float
    description: str
    profit_type: Optional[Literal['initial', 'monthly', 'both']] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: str
    date: str

    class Config:
        from_attributes = True
