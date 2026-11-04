
import os
import logging
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

load_dotenv()

logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "invoiceguard")

_client = None
_audit_collection = None


def get_audit_collection():
    global _client, _audit_collection

    if not MONGODB_URL:
        raise RuntimeError("MONGODB_URL is not configured.")

    if _audit_collection is None:
        _client = MongoClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )
        _audit_collection = _client[MONGODB_DATABASE][
            "invoice_audit_logs"
        ]

    return _audit_collection


def log_audit_event(
    action: str,
    entity_type: str,
    entity_id: int | str,
    details: dict | None = None,
    user: dict | None = None
):
    try:
        collection = get_audit_collection()

        audit_record = {
            "action": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "details": details or {},
            "user_id": user.get("user_id") if user else None,
            "user_name": user.get("full_name") if user else "System",
            "user_email": user.get("email") if user else None,
            "user_role": user.get("role") if user else None,
            "timestamp": datetime.now(timezone.utc)
        }

        collection.insert_one(audit_record)
        logger.info("Audit event recorded: %s", action)

    except (PyMongoError, RuntimeError) as exc:
        logger.error("Failed to record audit event: %s", exc)


def close_audit_connection():
    global _client, _audit_collection

    if _client is not None:
        _client.close()

    _client = None
    _audit_collection = None
