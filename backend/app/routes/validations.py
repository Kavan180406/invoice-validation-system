
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db


router = APIRouter(prefix="/validations", tags=["Invoice Validation"])


class ValidationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    validation_id: int
    invoice_id: int
    validated_by: int | None
    validation_status: str
    risk_score: Decimal
    validation_message: str | None


@router.post("/{invoice_id}", response_model=ValidationResponse)
def validate_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    invoice_query = text("""
        SELECT
            i.invoice_id,
            i.vendor_id,
            i.invoice_date,
            i.due_date,
            i.total_amount,
            i.status,
            v.vendor_name,
            v.is_active
        FROM invoices i
        JOIN vendors v ON i.vendor_id = v.vendor_id
        WHERE i.invoice_id = :invoice_id
    """)

    try:
        invoice = db.execute(
            invoice_query,
            {"invoice_id": invoice_id},
        ).mappings().first()

        if invoice is None:
            raise HTTPException(
                status_code=404,
                detail="Invoice not found",
            )

        risk_score = 0
        issues = []

        if invoice["total_amount"] <= 0:
            risk_score += 50
            issues.append("Invoice amount must be greater than zero")

        if (
            invoice["due_date"] is not None
            and invoice["due_date"] < invoice["invoice_date"]
        ):
            risk_score += 40
            issues.append("Due date cannot be earlier than invoice date")

        if not invoice["is_active"]:
            risk_score += 30
            issues.append("Vendor is inactive")

        if invoice["status"] in ("REJECTED", "FLAGGED"):
            risk_score += 40
            issues.append(
                f"Invoice currently has status {invoice['status']}"
            )

        risk_score = min(risk_score, 100)

        if risk_score >= 50:
            validation_status = "FAILED"
        elif risk_score > 0:
            validation_status = "FLAGGED"
        else:
            validation_status = "PASSED"

        validation_message = (
            "; ".join(issues)
            if issues
            else "Invoice passed all validation checks."
        )

        insert_query = text("""
            INSERT INTO validations (
                invoice_id,
                validation_status,
                risk_score,
                validation_message
            )
            VALUES (
                :invoice_id,
                :validation_status,
                :risk_score,
                :validation_message
            )
            RETURNING
                validation_id,
                invoice_id,
                validated_by,
                validation_status,
                risk_score,
                validation_message
        """)

        result = db.execute(
            insert_query,
            {
                "invoice_id": invoice_id,
                "validation_status": validation_status,
                "risk_score": risk_score,
                "validation_message": validation_message,
            },
        )

        validation = result.mappings().one()
        db.commit()

        return validation

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while validating invoice.",
        )
