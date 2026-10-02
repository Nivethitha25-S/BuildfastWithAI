import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    preferred_language = Column(String(20), default="en", nullable=False)
    role = Column(String(20), default="citizen", nullable=False)  # student | citizen | farmer | business
    profile_details = Column(JSON, nullable=True)  # role-specific profile fields (dict of str -> str)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
