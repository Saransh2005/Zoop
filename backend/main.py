from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import Meeting
from routers import meetings, participants, auth, websockets
from seed import seed as seed_db

# Create tables
Base.metadata.create_all(bind=engine)

# Seed DB only if meetings table is empty
def should_seed() -> bool:
    db = SessionLocal()
    try:
        return db.query(Meeting).count() == 0
    finally:
        db.close()

if should_seed():
    seed_db()

app = FastAPI(
    title="Zoom Clone API",
    description="Backend API for the Zoom Clone web application",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(participants.router)
app.include_router(websockets.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Zoom Clone API"}


@app.get("/")
def root():
    return {"message": "Zoom Clone API is running. Visit /docs for API documentation."}
