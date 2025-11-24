from pydantic import BaseModel, Field, ConfigDict
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
    available_capital: Optional[float] = Field(None, alias='availableCapital')
    initial_profit: Optional[float] = Field(None, alias='initialProfit')
    monthly_profit: Optional[float] = Field(None, alias='monthlyProfit')
    share: Optional[float] = None

    model_config = ConfigDict(populate_by_name=True)

class Partner(PartnerBase):
    id: str
    available_capital: float = Field(..., alias='availableCapital')
    initial_profit: float = Field(..., alias='initialProfit')
    monthly_profit: float = Field(..., alias='monthlyProfit')
    created_at: str = Field(..., alias='createdAt')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Phone Models
class PhoneBase(BaseModel):
    brand: str
    model: str
    imei: str
    purchase_price: float = Field(..., alias='purchasePrice')
    selling_price: float = Field(..., alias='sellingPrice')

    model_config = ConfigDict(populate_by_name=True)

class PhoneCreate(PhoneBase):
    status: Literal['available', 'sold'] = 'available'
    purchase_date: str = Field(..., alias='purchaseDate')

    model_config = ConfigDict(populate_by_name=True)

class PhoneUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    imei: Optional[str] = None
    purchase_price: Optional[float] = Field(None, alias='purchasePrice')
    selling_price: Optional[float] = Field(None, alias='sellingPrice')
    status: Optional[Literal['available', 'sold']] = None
    purchase_date: Optional[str] = Field(None, alias='purchaseDate')

    model_config = ConfigDict(populate_by_name=True)

class Phone(PhoneBase):
    id: str
    status: str
    purchase_date: str = Field(..., alias='purchaseDate')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Customer Models
class CustomerBase(BaseModel):
    name: str
    phone: str
    national_id: str = Field(..., alias='nationalId')
    address: str

    model_config = ConfigDict(populate_by_name=True)

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = Field(None, alias='nationalId')
    address: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class Customer(CustomerBase):
    id: str
    created_at: str = Field(..., alias='createdAt')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Sale Models
class SaleBase(BaseModel):
    customer_id: str = Field(..., alias='customerId')
    phone_id: str = Field(..., alias='phoneId')
    announced_price: float = Field(..., alias='announcedPrice')
    purchase_price: float = Field(..., alias='purchasePrice')
    down_payment: float = Field(..., alias='downPayment')
    installment_months: int = Field(..., alias='installmentMonths')
    monthly_interest_rate: float = Field(0.04, alias='monthlyInterestRate')
    initial_profit: float = Field(..., alias='initialProfit')

    model_config = ConfigDict(populate_by_name=True)

class SaleCreate(SaleBase):
    sale_date: str = Field(..., alias='saleDate')
    status: Literal['active', 'completed', 'defaulted'] = 'active'

    model_config = ConfigDict(populate_by_name=True)

class SaleUpdate(BaseModel):
    status: Optional[Literal['active', 'completed', 'defaulted']] = None

class Sale(SaleBase):
    id: str
    sale_date: str = Field(..., alias='saleDate')
    status: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Installment Models
class InstallmentBase(BaseModel):
    sale_id: str = Field(..., alias='saleId')
    installment_number: int = Field(..., alias='installmentNumber')
    principal_amount: float = Field(..., alias='principalAmount')
    interest_amount: float = Field(..., alias='interestAmount')
    total_amount: float = Field(..., alias='totalAmount')
    remaining_debt: float = Field(..., alias='remainingDebt')
    due_date: str = Field(..., alias='dueDate')

    model_config = ConfigDict(populate_by_name=True)

class InstallmentCreate(InstallmentBase):
    status: Literal['pending', 'paid', 'overdue'] = 'pending'

class InstallmentUpdate(BaseModel):
    status: Optional[Literal['pending', 'paid', 'overdue']] = None
    paid_date: Optional[str] = Field(None, alias='paidDate')

    model_config = ConfigDict(populate_by_name=True)

class Installment(InstallmentBase):
    id: str
    paid_date: Optional[str] = Field(None, alias='paidDate')
    status: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Transaction Models
class TransactionBase(BaseModel):
    partner_id: str = Field(..., alias='partnerId')
    type: Literal['capital_add', 'capital_withdraw', 'initial_profit_withdraw', 'monthly_profit_withdraw', 'profit_to_capital']
    amount: float
    description: str
    profit_type: Optional[Literal['initial', 'monthly', 'both']] = Field(None, alias='profitType')

    model_config = ConfigDict(populate_by_name=True)

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: str
    date: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Investor Models
class InvestorBase(BaseModel):
    name: str
    phone: str
    national_id: str = Field(..., alias='nationalId')
    investment_amount: float = Field(..., alias='investmentAmount')
    profit_rate: float = Field(4.0, alias='profitRate')

    model_config = ConfigDict(populate_by_name=True)

class InvestorCreate(InvestorBase):
    start_date: str = Field(..., alias='startDate')
    status: Literal['active', 'inactive'] = 'active'

    model_config = ConfigDict(populate_by_name=True)

class InvestorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = Field(None, alias='nationalId')
    investment_amount: Optional[float] = Field(None, alias='investmentAmount')
    profit_rate: Optional[float] = Field(None, alias='profitRate')
    total_profit: Optional[float] = Field(None, alias='totalProfit')
    status: Optional[Literal['active', 'inactive']] = None

    model_config = ConfigDict(populate_by_name=True)

class Investor(InvestorBase):
    id: str
    total_profit: float = Field(..., alias='totalProfit')
    start_date: str = Field(..., alias='startDate')
    status: str
    created_at: str = Field(..., alias='createdAt')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Investor Transaction Models
class InvestorTransactionBase(BaseModel):
    investor_id: str = Field(..., alias='investorId')
    type: Literal['profit_payment', 'investment_add', 'investment_withdraw']
    amount: float
    description: str

    model_config = ConfigDict(populate_by_name=True)

class InvestorTransactionCreate(InvestorTransactionBase):
    pass

class InvestorTransaction(InvestorTransactionBase):
    id: str
    date: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# User/Auth Models
class UserBase(BaseModel):
    full_name: str = Field(..., alias='fullName')
    mobile: str

    model_config = ConfigDict(populate_by_name=True)

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    mobile: str
    password: str

class User(UserBase):
    id: str
    created_at: str = Field(..., alias='createdAt')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Expense Models
class ExpenseBase(BaseModel):
    date: str
    type: str
    amount: float
    description: str

    model_config = ConfigDict(populate_by_name=True)

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    date: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class Expense(ExpenseBase):
    id: str
    created_at: str = Field(..., alias='createdAt')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)