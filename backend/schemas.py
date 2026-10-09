from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# Auth schemas
class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    account_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Hosted Zone schemas
class HostedZoneCreate(BaseModel):
    name: str
    type: str = "Public"
    comment: Optional[str] = ""


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None
    type: Optional[str] = None


class HostedZoneResponse(BaseModel):
    id: str
    name: str
    type: str
    comment: str
    caller_reference: str
    record_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class HostedZoneListResponse(BaseModel):
    zones: List[HostedZoneResponse]
    total: int
    page: int
    page_size: int


# DNS Record schemas
class DNSRecordCreate(BaseModel):
    name: str
    type: str
    ttl: Optional[int] = 300
    value: str  # JSON string of values
    routing_policy: Optional[str] = "Simple"
    alias: Optional[bool] = False
    comment: Optional[str] = ""


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ttl: Optional[int] = None
    value: Optional[str] = None
    routing_policy: Optional[str] = None
    alias: Optional[bool] = None
    comment: Optional[str] = None


class DNSRecordResponse(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    type: str
    ttl: int
    value: str
    routing_policy: str
    alias: bool
    comment: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DNSRecordListResponse(BaseModel):
    records: List[DNSRecordResponse]
    total: int
    page: int
    page_size: int
