from typing import Optional, Literal, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

UserRole = Literal["student", "citizen", "farmer", "business"]

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    preferred_language: Optional[str] = "en"
    role: UserRole = "citizen"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    preferred_language: str
    role: str = "citizen"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    preferred_language: str
    role: str = "citizen"
    profile_details: Optional[Dict[str, str]] = None
    created_at: datetime

class UserUpdateLanguageRequest(BaseModel):
    preferred_language: str = Field(..., min_length=2, max_length=20)

class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    preferred_language: Optional[str] = Field(None, min_length=2, max_length=20)
    profile_details: Optional[Dict[str, str]] = Field(
        None,
        description="Role-specific profile fields (max 40 keys, values <= 300 chars)",
    )
