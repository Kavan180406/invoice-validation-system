from fastapi import FastAPI

from app.routes import audit_logs, duplicates, invoices, validations, vendors

app = FastAPI(
    title="InvoiceGuard API",
    description="Invoice Validation and Duplicate Detection System",
    version="1.0.0"
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