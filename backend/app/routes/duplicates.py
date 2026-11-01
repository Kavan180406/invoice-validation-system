
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.audit import log_audit_event


router = APIRouter(
    prefix="/duplicates",
    tags=["Duplicate Detection"]
)


class DuplicateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    duplicate_check_id: int
    invoice_id: int
    matched_invoice_id: int
    similarity_score: float
    detection_reason: str | None
    review_status: str


@router.get("/", response_model=list[DuplicateResponse])
def get_duplicate_records(
    db: Session = Depends(get_db),
):
    try:
        result = db.execute(
            text("""
                SELECT
                    duplicate_check_id,
                    invoice_id,
                    matched_invoice_id,
                    similarity_score,
                    detection_reason,
                    review_status
                FROM duplicate_checks
                ORDER BY checked_at DESC
            """)
        ).mappings().all()

        return result

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching duplicate records."
        )


@router.post("/{invoice_id}", response_model=list[DuplicateResponse])
def detect_duplicates(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    try:
        invoice = db.execute(
            text("""
                SELECT invoice_id, invoice_number, vendor_id, total_amount
                FROM invoices
                WHERE invoice_id = :invoice_id
                  AND is_active = TRUE
            """),
            {"invoice_id": invoice_id},
        ).mappings().first()

        if invoice is None:
            raise HTTPException(
                status_code=404,
                detail="Active invoice not found",
            )

        candidates = db.execute(
            text("""
                SELECT invoice_id, invoice_number, vendor_id, total_amount
                FROM invoices
                WHERE invoice_id <> :invoice_id
                  AND is_active = TRUE
            """),
            {"invoice_id": invoice_id},
        ).mappings().all()

        matches = []

        for candidate in candidates:
            score = 0
            reasons = []

            if candidate["vendor_id"] == invoice["vendor_id"]:
                score += 40
                reasons.append("Same vendor")

            if (
                candidate["invoice_number"].strip().lower()
                == invoice["invoice_number"].strip().lower()
            ):
                score += 40
                reasons.append("Same invoice number")

            if candidate["total_amount"] == invoice["total_amount"]:
                score += 20
                reasons.append("Same invoice amount")

            if score >= 60:
                result = db.execute(
                    text("""
                        INSERT INTO duplicate_checks (
                            invoice_id,
                            matched_invoice_id,
                            similarity_score,
                            detection_reason
                        )
                        VALUES (
                            :invoice_id,
                            :matched_invoice_id,
                            :similarity_score,
                            :detection_reason
                        )
                        ON CONFLICT (invoice_id, matched_invoice_id)
                        DO UPDATE SET
                            similarity_score = EXCLUDED.similarity_score,
                            detection_reason = EXCLUDED.detection_reason,
                            checked_at = CURRENT_TIMESTAMP
                        RETURNING
                            duplicate_check_id,
                            invoice_id,
                            matched_invoice_id,
                            similarity_score,
                            detection_reason,
                            review_status
                    """),
                    {
                        "invoice_id": invoice_id,
                        "matched_invoice_id": candidate["invoice_id"],
                        "similarity_score": score,
                        "detection_reason": "; ".join(reasons),
                    },
                )

                matches.append(result.mappings().one())

        db.commit()

        log_audit_event(
            action="DUPLICATE_CHECKED",
            entity_type="invoice",
            entity_id=invoice_id,
            details={
                "matches_found": len(matches),
                "matched_invoice_ids": [
                    match["matched_invoice_id"] for match in matches
                ],
            },
        )

        return matches

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error during duplicate detection.",
        )
