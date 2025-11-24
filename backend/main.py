from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database import init_db
from routers import partners, phones, customers, sales, installments, transactions, investors, auth, expenses

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Mobile Installment Business API",
    description="API for managing mobile phone installment sales",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(partners.router, prefix="/api/partners", tags=["Partners"])
app.include_router(phones.router, prefix="/api/phones", tags=["Phones"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
app.include_router(installments.router, prefix="/api/installments", tags=["Installments"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(investors.router, prefix="/api/investors", tags=["Investors"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])

@app.get("/")
def read_root():
    return {
        "message": "Mobile Installment Business API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
