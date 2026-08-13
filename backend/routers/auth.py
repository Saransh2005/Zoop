import random
import string
import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserOut, Token

SECRET_KEY = "zoom-clone-super-secret-jwt-key-for-auth"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
SALT = "zoom_clone_salt_2026_"

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def generate_pmi() -> str:
    """Generate a unique 10-digit Personal Meeting ID: XXX-XXX-XXXX"""
    parts = [
        ''.join(random.choices(string.digits, k=3)),
        ''.join(random.choices(string.digits, k=3)),
        ''.join(random.choices(string.digits, k=4)),
    ]
    return '-'.join(parts)


def get_password_hash(password: str) -> str:
    return hashlib.sha256((SALT + password).encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    actual_token = token
    if not actual_token and authorization and authorization.startswith("Bearer "):
        actual_token = authorization.split(" ")[1]

    if not actual_token:
        return None

    try:
        payload = jwt.decode(actual_token, SECRET_KEY, algorithms=[ALGORITHM])
        raw_sub = payload.get("sub")
        if raw_sub is None:
            return None
        user_id = int(raw_sub)
    except (jwt.PyJWTError, ValueError, TypeError):
        return None

    return db.query(User).filter(User.id == user_id).first()


@router.post("/signup", response_model=Token, status_code=201)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    # Check existing user
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    # Generate unique Personal Meeting ID
    pmi = generate_pmi()
    while db.query(User).filter(User.personal_meeting_id == pmi).first():
        pmi = generate_pmi()

    user = User(
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        personal_meeting_id=pmi,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user
