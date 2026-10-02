import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class EligibilityCheck(Base):
    __tablename__ = "eligibility_checks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)  # "ELIGIBLE", "NOT_ELIGIBLE", "UNCERTAIN"
    conditions = Column(Text, nullable=True)  # JSON-encoded string of conditions evaluated
    missing_info = Column(Text, nullable=True)  # JSON-encoded string of missing information
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    message = relationship("Message", back_populates="eligibility_check")

class ActionPlan(Base):
    __tablename__ = "action_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    steps_json = Column(Text, nullable=False)  # JSON-encoded list of ordered next steps
    deadline = Column(String(255), nullable=True)  # Deadline string extracted exactly from doc
    deadline_source_page = Column(Integer, nullable=True)
    required_documents_json = Column(Text, nullable=True)  # JSON-encoded checklist of documents
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    message = relationship("Message", back_populates="action_plan")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 for positive, -1 for negative
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    message = relationship("Message", back_populates="feedback")
    user = relationship("User", back_populates="feedback")
