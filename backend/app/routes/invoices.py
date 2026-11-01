
from datetime import date
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db


router = APIRouter(prefix="/invoices", tags=["Invoices"])


InvoiceStatus = Literal[
    "PENDING", "VERIFIED", "DUPLICATE", "REJECTED", "FLAGGED"
]


class InvoiceCreate(BaseModel):
    invoice_number: str = Field(min_length=1, max_length=50)
    vendor_id: int = Field(gt=0)
    uploaded_by: int | None = Field(default=None, gt=0)
    invoice_date: date
    due_date: date | None = None
    total_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    status: InvoiceStatus = "PENDING"
    description: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.due_date and self.due_date < self.invoice_date:
            raise ValueError("Due date cannot be earlier than invoice date")
        return self

    @model_validator(mode="after")
    def validate_invoice_number(self):
        self.invoice_number = self.invoice_number.strip()
        if not self.invoice_number:
            raise ValueError("Invoice number cannot be blank")
        return self


class InvoiceUpdate(InvoiceCreate):
    pass


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invoice_id: int
    invoice_number: str
    vendor_id: int
    uploaded_by: int | None
    invoice_date: date
    due_date: date | None
    total_amount: Decimal
    currency: str
    status: str
    description: str | None


@router.post(
    "/",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
):
    query = text("""
        INSERT INTO invoices (
            invoice_number, vendor_id, uploaded_by,
            invoice_date, due_date, total_amount,
            currency, status, description
        )
        VALUES (
            :invoice_number, :vendor_id, :uploaded_by,
            :invoice_date, :due_date, :total_amount,
            :currency, :status, :description
        )
        RETURNING
            invoice_id, invoice_number, vendor_id, uploaded_by,
            invoice_date, due_date, total_amount,
            currency, status, description
    """)

    try:
        result = db.execute(query, invoice.model_dump())
        new_invoice = result.mappings().one()
        db.commit()
        return new_invoice

    except IntegrityError as error:
        db.rollback()
        sqlstate = getattr(error.orig, "sqlstate", None)

        if sqlstate == "23503":
            raise HTTPException(
                status_code=400,
                detail="Referenced vendor or user does not exist.",
            )

        raise HTTPException(
            status_code=400,
            detail="Invoice violates a database constraint.",
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while creating invoice.",
        )


@router.get("/", response_model=list[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT
            invoice_id, invoice_number, vendor_id, uploaded_by,
            invoice_date, due_date, total_amount,
            currency, status, description
        FROM invoices
        ORDER BY invoice_id DESC
    """))

    return result.mappings().all()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        text("""
            SELECT
                invoice_id, invoice_number, vendor_id, uploaded_by,
                invoice_date, due_date, total_amount,
                currency, status, description
            FROM invoices
            WHERE invoice_id = :invoice_id
        """),
        {"invoice_id": invoice_id},
    )

    invoice = result.mappings().first()

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    invoice: InvoiceUpdate,
    db: Session = Depends(get_db),
):
    query = text("""
        UPDATE invoices
        SET
            invoice_number = :invoice_number,
            vendor_id = :vendor_id,
            uploaded_by = :uploaded_by,
            invoice_date = :invoice_date,
            due_date = :due_date,
            total_amount = :total_amount,
            currency = :currency,
            status = :status,
            description = :description,
            updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = :invoice_id
        RETURNING
            invoice_id, invoice_number, vendor_id, uploaded_by,
            invoice_date, due_date, total_amount,
            currency, status, description
    """)

    values = invoice.model_dump()
    values["invoice_id"] = invoice_id

    try:
        result = db.execute(query, values)
        updated_invoice = result.mappings().first()

        if updated_invoice is None:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail="Invoice not found",
            )

        db.commit()
        return updated_invoice

    except IntegrityError as error:
        db.rollback()

        if getattr(error.orig, "sqlstate", None) == "23503":
            raise HTTPException(
                status_code=400,
                detail="Referenced vendor or user does not exist.",
            )

        raise HTTPException(
            status_code=400,
            detail="Invoice violates a database constraint.",
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while updating invoice.",
        )


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        text("""
            DELETE FROM invoices
            WHERE invoice_id = :invoice_id
        """),
        {"invoice_id": invoice_id},
    )

    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    db.commit()
    return None
