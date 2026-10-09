from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, User, HostedZone, DNSRecord, generate_id
from schemas import (
    HostedZoneCreate, HostedZoneUpdate, HostedZoneResponse, HostedZoneListResponse
)
from auth import get_current_user
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/hosted-zones", tags=["hosted-zones"])


def ensure_name_ends_with_dot(name: str) -> str:
    if not name.endswith("."):
        name = name + "."
    return name


@router.get("", response_model=HostedZoneListResponse)
def list_hosted_zones(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    zone_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(HostedZone).filter(HostedZone.user_id == current_user.id)

    if search:
        query = query.filter(HostedZone.name.ilike(f"%{search}%"))
    if zone_type:
        query = query.filter(HostedZone.type == zone_type)

    total = query.count()
    zones = query.order_by(HostedZone.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Update record counts
    for zone in zones:
        zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()

    return HostedZoneListResponse(
        zones=[HostedZoneResponse.model_validate(z) for z in zones],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(
    zone_data: HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    name = ensure_name_ends_with_dot(zone_data.name)

    # Check duplicate for this user
    existing = db.query(HostedZone).filter(
        HostedZone.name == name,
        HostedZone.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Hosted zone '{name}' already exists"
        )

    zone_id = generate_id()
    caller_ref = f"caller-{uuid.uuid4()}"

    zone = HostedZone(
        id=zone_id,
        name=name,
        type=zone_data.type,
        comment=zone_data.comment or "",
        caller_reference=caller_ref,
        user_id=current_user.id,
        record_count=2
    )
    db.add(zone)

    # Auto-create default NS and SOA records
    ns_record = DNSRecord(
        id=generate_id(),
        hosted_zone_id=zone_id,
        name=name,
        type="NS",
        ttl=172800,
        value='["ns-1.awsdns-1.com.", "ns-2.awsdns-2.net.", "ns-3.awsdns-3.org.", "ns-4.awsdns-4.co.uk."]',
        routing_policy="Simple",
        comment="Default NS record"
    )
    soa_record = DNSRecord(
        id=generate_id(),
        hosted_zone_id=zone_id,
        name=name,
        type="SOA",
        ttl=900,
        value=f'["ns-1.awsdns-1.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"]',
        routing_policy="Simple",
        comment="Default SOA record"
    )
    db.add(ns_record)
    db.add(soa_record)
    db.commit()
    db.refresh(zone)

    zone.record_count = 2
    return HostedZoneResponse.model_validate(zone)


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(HostedZone).filter(
        HostedZone.id == zone_id,
        HostedZone.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    return HostedZoneResponse.model_validate(zone)


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: str,
    zone_data: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(HostedZone).filter(
        HostedZone.id == zone_id,
        HostedZone.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    if zone_data.comment is not None:
        zone.comment = zone_data.comment
    if zone_data.type is not None:
        zone.type = zone_data.type

    db.commit()
    db.refresh(zone)
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    return HostedZoneResponse.model_validate(zone)


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zone = db.query(HostedZone).filter(
        HostedZone.id == zone_id,
        HostedZone.user_id == current_user.id
    ).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    db.delete(zone)
    db.commit()
