
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_roles


router = APIRouter(prefix="/vendors", tags=["Vendors"])


# Request schema for creating a vendor
class VendorCreate(BaseModel):
    vendor_name: str = Field(min_length=1, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    tax_id: str | None = Field(default=None, max_length=30)
    address: str | None = None

    @field_validator("vendor_name")
    @classmethod
    def validate_vendor_name(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Vendor name cannot be blank")

        return value


# Request schema for updating a vendor
class VendorUpdate(VendorCreate):
    pass


# Response schema
class VendorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    vendor_id: int
    vendor_name: str
    email: EmailStr | None
    phone: str | None
    tax_id: str | None
    address: str | None
    is_active: bool


# Create a new vendor - ADMIN only
@router.post(
    "/",
    response_model=VendorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vendor(
    vendor: VendorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    query = text("""
        INSERT INTO vendors (
            vendor_name,
            email,
            phone,
            tax_id,
            address
        )
        VALUES (
            :vendor_name,
            :email,
            :phone,
            :tax_id,
            :address
        )
        RETURNING
            vendor_id,
            vendor_name,
            email,
            phone,
            tax_id,
            address,
            is_active
    """)

    try:
        result = db.execute(query, vendor.model_dump())
        new_vendor = result.mappings().one()
        db.commit()

        return new_vendor

    except IntegrityError as error:
        db.rollback()

        if getattr(error.orig, "sqlstate", None) == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vendor with this tax ID already exists.",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create vendor due to a database constraint.",
        )


# Get all vendors - ADMIN and STAFF
@router.get("/", response_model=list[VendorResponse])
def get_vendors(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "STAFF")),
):
    result = db.execute(text("""
        SELECT
            vendor_id,
            vendor_name,
            email,
            phone,
            tax_id,
            address,
            is_active
        FROM vendors
        ORDER BY vendor_id DESC
    """))

    return result.mappings().all()


# Get a vendor by ID - ADMIN and STAFF
@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "STAFF")),
):
    result = db.execute(
        text("""
            SELECT
                vendor_id,
                vendor_name,
                email,
                phone,
                tax_id,
                address,
                is_active
            FROM vendors
            WHERE vendor_id = :vendor_id
        """),
        {"vendor_id": vendor_id},
    )

    vendor = result.mappings().first()

    if vendor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found",
        )

    return vendor


# Update vendor details - ADMIN only
@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: int,
    vendor: VendorUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    query = text("""
        UPDATE vendors
        SET
            vendor_name = :vendor_name,
            email = :email,
            phone = :phone,
            tax_id = :tax_id,
            address = :address
        WHERE vendor_id = :vendor_id
          AND is_active = TRUE
        RETURNING
            vendor_id,
            vendor_name,
            email,
            phone,
            tax_id,
            address,
            is_active
    """)

    values = vendor.model_dump()
    values["vendor_id"] = vendor_id

    try:
        result = db.execute(query, values)
        updated_vendor = result.mappings().first()

        if updated_vendor is None:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active vendor not found",
            )

        db.commit()
        return updated_vendor

    except IntegrityError as error:
        db.rollback()

        if getattr(error.orig, "sqlstate", None) == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vendor with this tax ID already exists.",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to update vendor due to a database constraint.",
        )


# Soft-delete a vendor - ADMIN only
@router.delete(
    "/{vendor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    result = db.execute(
        text("""
            UPDATE vendors
            SET is_active = FALSE
            WHERE vendor_id = :vendor_id
              AND is_active = TRUE
        """),
        {"vendor_id": vendor_id},
    )

    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active vendor not found",
        )

    db.commit()
    return None
