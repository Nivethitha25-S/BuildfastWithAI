from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserUpdateLanguageRequest,
    UserProfileUpdateRequest,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == request.email.lower()))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    hashed_pwd = hash_password(request.password)
    user = User(
        name=request.name.strip(),
        email=request.email.lower().strip(),
        password_hash=hashed_pwd,
        preferred_language=request.preferred_language or "en",
        role=request.role or "citizen"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        preferred_language=user.preferred_language,
        role=user.role
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email.lower().strip()))
    user = result.scalars().first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        preferred_language=user.preferred_language,
        role=user.role
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request.name is not None:
        current_user.name = request.name.strip()
    if request.preferred_language is not None:
        current_user.preferred_language = request.preferred_language
    if request.profile_details is not None:
        details = request.profile_details
        if len(details) > 40:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many profile fields.")
        for key, value in details.items():
            if not key or len(key) > 60:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid profile field: {key}")
            if value is not None and len(str(value)) > 300:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Value too long for {key}")
        current_user.profile_details = {k: str(v) for k, v in details.items() if v is not None}
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/update-language", response_model=UserResponse)
async def update_language(
    request: UserUpdateLanguageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.preferred_language = request.preferred_language
    await db.commit()
    await db.refresh(current_user)
    return current_user
