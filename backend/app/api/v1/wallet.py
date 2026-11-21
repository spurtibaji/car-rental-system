from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.wallet_service import WalletService
from app.schemas.wallet import (
    WalletResponse,
    WalletTransactionResponse,
    WalletTopUpRequest,
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("", response_model=ApiResponse[WalletResponse])
def get_wallet(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current wallet balance and transaction summary."""
    wallet_service = WalletService(db)
    wallet = wallet_service.get_wallet(current_user.id)
    return ApiResponse(
        message="Wallet details retrieved successfully",
        data=wallet,
    )


@router.get("/transactions", response_model=ApiResponse[List[WalletTransactionResponse]])
def get_wallet_transactions(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get complete ledger transaction history for user's wallet."""
    wallet_service = WalletService(db)
    txns = wallet_service.list_transactions(current_user.id)
    return ApiResponse(
        message="Wallet transactions retrieved successfully",
        data=txns,
    )


@router.post("/top-up", response_model=ApiResponse[WalletResponse])
def top_up_wallet(
    data: WalletTopUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Top up wallet balance with instant ledger credit."""
    wallet_service = WalletService(db)
    updated_wallet = wallet_service.top_up(
        user_id=current_user.id, amount=data.amount, payment_method=data.payment_method
    )
    return ApiResponse(
        message=f"₹{float(data.amount):,.2f} added to your wallet successfully",
        data=updated_wallet,
    )
