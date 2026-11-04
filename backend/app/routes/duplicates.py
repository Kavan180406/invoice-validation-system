
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.audit import log_audit_event
from app.auth import require_roles


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


class DuplicateReviewResponse(BaseModel):
    duplicate_check_id: int
    invoice_id: int
    matched_invoice_id: int
    review_status: str
    invoice_status: str


# =====================================================
# VIEW DUPLICATE RECORDS
# ADMIN AND STAFF
# =====================================================

@router.get("/", response_model=list[DuplicateResponse])
def get_duplicate_records(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "STAFF")),
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


# =====================================================
# DETECT DUPLICATES
# ADMIN AND STAFF
# =====================================================

@router.post("/{invoice_id}", response_model=list[DuplicateResponse])
def detect_duplicates(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "STAFF")),
):
    try:
        invoice = db.execute(
            text("""
                SELECT
                    invoice_id,
                    invoice_number,
                    vendor_id,
                    total_amount
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
                SELECT
                    invoice_id,
                    invoice_number,
                    vendor_id,
                    total_amount
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
            user=current_user,
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


# =====================================================
# CONFIRM DUPLICATE
# ADMIN ONLY
# =====================================================

@router.patch(
    "/{duplicate_check_id}/confirm",
    response_model=DuplicateReviewResponse,
)
def confirm_duplicate(
    duplicate_check_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    try:
        # Only records awaiting review can be confirmed.
        result = db.execute(
            text("""
                UPDATE duplicate_checks
                SET review_status = 'CONFIRMED'
                WHERE duplicate_check_id = :duplicate_check_id
                  AND review_status = 'UNDER_REVIEW'
                RETURNING
                    duplicate_check_id,
                    invoice_id,
                    matched_invoice_id,
                    review_status
            """),
            {"duplicate_check_id": duplicate_check_id},
        )

        duplicate = result.mappings().first()

        if duplicate is None:
            db.rollback()

            raise HTTPException(
                status_code=404,
                detail="Duplicate record not found or already reviewed.",
            )

        # Mark the newly submitted invoice as a duplicate.
        # The matched/original invoice keeps its existing status.
        invoice_result = db.execute(
            text("""
                UPDATE invoices
                SET
                    status = 'DUPLICATE',
                    updated_at = CURRENT_TIMESTAMP
                WHERE invoice_id = :invoice_id
                  AND is_active = TRUE
                RETURNING invoice_id
            """),
            {"invoice_id": duplicate["invoice_id"]},
        ).first()

        if invoice_result is None:
            db.rollback()

            raise HTTPException(
                status_code=404,
                detail="Invoice not found or already deleted.",
            )

        db.commit()

        log_audit_event(
            action="DUPLICATE_CONFIRMED",
            entity_type="invoice",
            entity_id=duplicate["invoice_id"],
            details={
                "duplicate_check_id": duplicate["duplicate_check_id"],
                "matched_invoice_id": duplicate["matched_invoice_id"],
                "review_status": "CONFIRMED",
                "invoice_status": "DUPLICATE",
            },
            user=current_user,
        )

        return {
            "duplicate_check_id": duplicate["duplicate_check_id"],
            "invoice_id": duplicate["invoice_id"],
            "matched_invoice_id": duplicate["matched_invoice_id"],
            "review_status": "CONFIRMED",
            "invoice_status": "DUPLICATE",
        }

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while confirming duplicate.",
        )


# =====================================================
# DISMISS DUPLICATE
# ADMIN ONLY
# =====================================================

@router.patch(
    "/{duplicate_check_id}/dismiss",
    response_model=DuplicateReviewResponse,
)
def dismiss_duplicate(
    duplicate_check_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    try:
        result = db.execute(
            text("""
                UPDATE duplicate_checks
                SET review_status = 'DISMISSED'
                WHERE duplicate_check_id = :duplicate_check_id
                  AND review_status = 'UNDER_REVIEW'
                RETURNING
                    duplicate_check_id,
                    invoice_id,
                    matched_invoice_id,
                    review_status
            """),
            {"duplicate_check_id": duplicate_check_id},
        )

        duplicate = result.mappings().first()

        if duplicate is None:
            db.rollback()

            raise HTTPException(
                status_code=404,
                detail="Duplicate record not found or already reviewed.",
            )

        # Dismissing a potential match does not change
        # the invoice's existing validation status.
        invoice_status = db.execute(
            text("""
                SELECT status
                FROM invoices
                WHERE invoice_id = :invoice_id
                  AND is_active = TRUE
            """),
            {"invoice_id": duplicate["invoice_id"]},
        ).scalar_one_or_none()

        if invoice_status is None:
            db.rollback()

            raise HTTPException(
                status_code=404,
                detail="Invoice not found or already deleted.",
            )

        db.commit()

        log_audit_event(
            action="DUPLICATE_DISMISSED",
            entity_type="invoice",
            entity_id=duplicate["invoice_id"],
            details={
                "duplicate_check_id": duplicate["duplicate_check_id"],
                "matched_invoice_id": duplicate["matched_invoice_id"],
                "review_status": "DISMISSED",
                "invoice_status": invoice_status,
            },
            user=current_user,
        )

        return {
            "duplicate_check_id": duplicate["duplicate_check_id"],
            "invoice_id": duplicate["invoice_id"],
            "matched_invoice_id": duplicate["matched_invoice_id"],
            "review_status": "DISMISSED",
            "invoice_status": invoice_status,
        }

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while dismissing duplicate.",
        )
