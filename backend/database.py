from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import uuid

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./route53.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_id)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    account_id = Column(String, default=lambda: str(uuid.uuid4())[:12].upper())
    created_at = Column(DateTime, default=datetime.utcnow)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=generate_id)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="Public")  # Public or Private
    comment = Column(Text, default="")
    caller_reference = Column(String, unique=True)
    record_count = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    records = relationship("DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan")


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=generate_id)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    ttl = Column(Integer, default=300)
    value = Column(Text, nullable=False)  # JSON array of values
    routing_policy = Column(String, default="Simple")
    alias = Column(Boolean, default=False)
    comment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")


def create_tables():
    Base.metadata.create_all(bind=engine)
