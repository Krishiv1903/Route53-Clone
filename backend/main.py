from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import create_tables
from routers import auth_router, hosted_zones, dns_records
import os

app = FastAPI(
    title="Route53 Clone API",
    description="AWS Route53 Clone - FastAPI Backend",
    version="1.0.0"
)

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
def startup():
    create_tables()

# Routers
app.include_router(auth_router.router, prefix="/api")
app.include_router(hosted_zones.router, prefix="/api")
app.include_router(dns_records.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Route53 Clone API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
