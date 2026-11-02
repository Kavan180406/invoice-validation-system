from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.execute(
        text("""
            SELECT user_id, full_name, email, password_hash, role, is_active
            FROM users
            WHERE email = :email
        """),
        {"email": form_data.username}
    ).mappings().first()

    if (
        not user
        or not user["is_active"]
        or not verify_password(form_data.password, user["password_hash"])
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token(user["user_id"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"]
        }
    }


@router.get("/me")
def read_current_user(
    current_user=Depends(get_current_user)
):
    return current_user