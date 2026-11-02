
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo import DESCENDING
from pymongo.errors import PyMongoError

from app.audit import get_audit_collection
from app.auth import require_roles


router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


# Audit summary - ADMIN only
@router.get("/summary")
def get_audit_summary(
    current_user=Depends(require_roles("ADMIN")),
):
    try:
        collection = get_audit_collection()

        pipeline = [
            {
                "$group": {
                    "_id": "$action",
                    "total_count": {"$sum": 1}
                }
            },
            {
                "$sort": {"total_count": -1}
            }
        ]

        summary = list(collection.aggregate(pipeline))

        return [
            {
                "action": item["_id"],
                "total_count": item["total_count"]
            }
            for item in summary
        ]

    except (PyMongoError, RuntimeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to generate audit summary."
        ) from exc


# View audit logs - ADMIN only
@router.get("/")
def get_audit_logs(
    current_user=Depends(require_roles("ADMIN")),
):
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
