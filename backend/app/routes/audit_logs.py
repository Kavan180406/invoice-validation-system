from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pymongo import DESCENDING
from pymongo.errors import PyMongoError

from app.audit import get_audit_collection

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("/")
def get_audit_logs():
    try:
        collection = get_audit_collection()
        records = collection.find().sort("timestamp", DESCENDING)

        result = []

        for record in records:
            record["_id"] = str(record["_id"])

            timestamp = record.get("timestamp")
            if isinstance(timestamp, datetime):
                if timestamp.tzinfo is None:
                    timestamp = timestamp.replace(tzinfo=timezone.utc)

                record["timestamp"] = timestamp.isoformat()

            result.append(record)

        return result

    except (PyMongoError, RuntimeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve audit logs."
        ) from exc