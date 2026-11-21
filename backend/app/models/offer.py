import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    Integer,
    Date,
    DateTime,
)
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Offer(Base):
    __tablename__ = "offers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=False)
    discount = Column(Numeric(10, 2), nullable=False)
    type = Column(String(20), nullable=False)  # 'percent' | 'flat'
    min_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    valid_till = Column(Date, nullable=False)
    category = Column(String(50), nullable=True)  # optional category restriction (e.g. 'Electric', 'Luxury')
    color = Column(String(20), nullable=False, default="#e8291e")
    max_uses = Column(Integer, default=1000, nullable=False)
    current_uses = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
