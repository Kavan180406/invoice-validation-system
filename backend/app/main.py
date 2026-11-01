
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import audit_logs, duplicates, invoices, validations, vendors

app = FastAPI(
    title="InvoiceGuard API",
    description="Invoice Validation and Duplicate Detection System",
    version="1.0.0"
)

# Allow the local Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "InvoiceGuard Backend is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


app.include_router(vendors.router)
app.include_router(invoices.router)
app.include_router(validations.router)
app.include_router(duplicates.router)
app.include_router(audit_logs.router)
