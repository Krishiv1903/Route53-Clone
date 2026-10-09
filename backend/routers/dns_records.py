from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db, User, HostedZone, DNSRecord, generate_id
from schemas import DNSRecordCreate, DNSRecordUpdate, DNSRecordResponse, DNSRecordListResponse
from auth import get_current_user
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/hosted-zones/{zone_id}/records", tags=["dns-records"])

VALID_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"]


def get_zone_or_404(zone_id: str, user_id: str, db: Session) -> HostedZone:
    zone = db.query(HostedZone).filter(
        HostedZone.id == zone_id,
        HostedZone.user_id == user_id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def normalize_record_name(name: str, zone_name: str) -> str:
    name = name.strip()
    zone_name = zone_name.rstrip(".")
    if not name or name == "@":
        return f"{zone_name}."

    if name.endswith("."):
        normalized = name.rstrip(".")
        if normalized.casefold() != zone_name.casefold() and not normalized.casefold().endswith(f".{zone_name}".casefold()):
            raise HTTPException(status_code=400, detail="Record name must be within the hosted zone")
        return f"{normalized}."

    if name.casefold() == zone_name.casefold() or name.casefold().endswith(f".{zone_name}".casefold()):
        return f"{name}."
    return f"{name}.{zone_name}."


def ensure_record_editable(record: DNSRecord) -> None:
    if record.type == "SOA":
        raise HTTPException(status_code=400, detail="The SOA record cannot be edited or deleted")


@router.get("", response_model=DNSRecordListResponse)
def list_records(
    zone_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    record_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_zone_or_404(zone_id, current_user.id, db)

    query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id)

    if search:
        query = query.filter(
            (DNSRecord.name.ilike(f"%{search}%")) | (DNSRecord.value.ilike(f"%{search}%"))
        )
    if record_type:
        query = query.filter(DNSRecord.type == record_type)

    total = query.count()
    records = query.order_by(DNSRecord.name, DNSRecord.type).offset((page - 1) * page_size).limit(page_size).all()

    return DNSRecordListResponse(
        records=[DNSRecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    zone_id: str,
    record_data: DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = get_zone_or_404(zone_id, current_user.id, db)

    if record_data.type.upper() not in VALID_RECORD_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid record type: {record_data.type}")

    record = DNSRecord(
        id=generate_id(),
        hosted_zone_id=zone_id,
        name=normalize_record_name(record_data.name, zone.name),
        type=record_data.type.upper(),
        ttl=record_data.ttl if record_data.ttl is not None else 300,
        value=record_data.value,
        routing_policy=record_data.routing_policy or "Simple",
        alias=record_data.alias or False,
        comment=record_data.comment or ""
    )
    db.add(record)

    # Update zone record count
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count() + 1

    db.commit()
    db.refresh(record)
    return DNSRecordResponse.model_validate(record)


@router.get("/{record_id}", response_model=DNSRecordResponse)
def get_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_zone_or_404(zone_id, current_user.id, db)

    record = db.query(DNSRecord).filter(
        DNSRecord.id == record_id,
        DNSRecord.hosted_zone_id == zone_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    return DNSRecordResponse.model_validate(record)


@router.put("/{record_id}", response_model=DNSRecordResponse)
def update_record(
    zone_id: str,
    record_id: str,
    record_data: DNSRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_zone_or_404(zone_id, current_user.id, db)

    record = db.query(DNSRecord).filter(
        DNSRecord.id == record_id,
        DNSRecord.hosted_zone_id == zone_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    ensure_record_editable(record)

    if record_data.name is not None:
        record.name = normalize_record_name(record_data.name, record.hosted_zone.name)
    if record_data.type is not None:
        if record_data.type.upper() not in VALID_RECORD_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid record type: {record_data.type}")
        record.type = record_data.type.upper()
    if record_data.ttl is not None:
        record.ttl = record_data.ttl
    if record_data.value is not None:
        record.value = record_data.value
    if record_data.routing_policy is not None:
        record.routing_policy = record_data.routing_policy
    if record_data.alias is not None:
        record.alias = record_data.alias
    if record_data.comment is not None:
        record.comment = record_data.comment

    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return DNSRecordResponse.model_validate(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = get_zone_or_404(zone_id, current_user.id, db)

    record = db.query(DNSRecord).filter(
        DNSRecord.id == record_id,
        DNSRecord.hosted_zone_id == zone_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    ensure_record_editable(record)
    db.delete(record)
    db.flush()
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_records_bulk(
    zone_id: str,
    record_ids: list,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = get_zone_or_404(zone_id, current_user.id, db)
    records = db.query(DNSRecord).filter(
        DNSRecord.id.in_(record_ids),
        DNSRecord.hosted_zone_id == zone_id
    ).all()
    if any(record.type == "SOA" for record in records):
        raise HTTPException(status_code=400, detail="The SOA record cannot be deleted")

    db.query(DNSRecord).filter(
        DNSRecord.id.in_(record_ids),
        DNSRecord.hosted_zone_id == zone_id
    ).delete(synchronize_session=False)
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()
