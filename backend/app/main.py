from fastapi import FastAPI

from app.routes import vendors

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