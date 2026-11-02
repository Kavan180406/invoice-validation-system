
from getpass import getpass

from sqlalchemy import text

from app.database import SessionLocal
from app.auth import get_password_hash


def main():
    print("=== InvoiceGuard: Create ADMIN Account ===")

    full_name = input("Enter admin full name: ").strip()
    email = input("Enter admin email: ").strip().lower()
    password = getpass("Enter admin password: ")
    confirm_password = getpass("Confirm admin password: ")

    if not full_name or not email:
        print("Name and email are required.")
        return

    if len(password) < 8:
        print("Password must contain at least 8 characters.")
        return

    if password != confirm_password:
        print("Passwords do not match.")
        return

    db = SessionLocal()

    try:
        existing = db.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": email}
        ).first()

        if existing:
            print("An account with this email already exists.")
            return

        hashed_password = get_password_hash(password)

        db.execute(
            text("""
                INSERT INTO users
                    (full_name, email, password_hash, role, is_active)
                VALUES
                    (:full_name, :email, :password_hash, 'ADMIN', TRUE)
            """),
            {
                "full_name": full_name,
                "email": email,
                "password_hash": hashed_password
            }
        )

        db.commit()
        print("ADMIN account created successfully!")

    except Exception:
        db.rollback()
        print("Account creation failed. Check the database connection.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
