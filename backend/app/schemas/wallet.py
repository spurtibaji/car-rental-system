from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class WalletTopUpRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, le=100000)
    payment_method: str = Field("upi", pattern="^(upi|card|netbanking)$")


class WalletTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str  # 'credit' | 'debit'
    amount: float
    balance_after: float
    label: str
    booking_id: Optional[str] = None
    date: datetime = Field(alias="created_at")


class WalletResponse(BaseModel):
    balance: float
    user_id: str
    transactions: List[WalletTransactionResponse] = []
