from decimal import Decimal
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.wallet import WalletAccount, WalletTransaction
from app.repositories.wallet_repo import WalletRepository
from app.schemas.wallet import WalletResponse, WalletTransactionResponse
from app.core.exceptions import AppException


class WalletService:
    def __init__(self, db: Session):
        self.db = db
        self.wallet_repo = WalletRepository(db)

    def get_wallet(self, user_id: str) -> WalletResponse:
        wallet = self.wallet_repo.get_or_create(user_id)
        txns = self.wallet_repo.list_transactions(user_id)
        return WalletResponse(
            balance=float(wallet.balance),
            user_id=user_id,
            transactions=[
                WalletTransactionResponse(
                    id=t.id,
                    type=t.type,
                    amount=float(t.amount),
                    balance_after=float(t.balance_after),
                    label=t.label,
                    booking_id=t.booking_id,
                    created_at=t.created_at,
                )
                for t in txns
            ],
        )

    def list_transactions(self, user_id: str) -> List[WalletTransactionResponse]:
        txns = self.wallet_repo.list_transactions(user_id)
        return [
            WalletTransactionResponse(
                id=t.id,
                type=t.type,
                amount=float(t.amount),
                balance_after=float(t.balance_after),
                label=t.label,
                booking_id=t.booking_id,
                created_at=t.created_at,
            )
            for t in txns
        ]

    def top_up(self, user_id: str, amount: Decimal, payment_method: str = "upi") -> WalletResponse:
        if amount <= 0:
            raise AppException("Top-up amount must be greater than zero", status_code=400)

        label = f"Added via {payment_method.upper()}"
        self.wallet_repo.credit(user_id=user_id, amount=amount, label=label)
        return self.get_wallet(user_id)

    def deduct(self, user_id: str, amount: Decimal, label: str, booking_id: str) -> WalletTransaction:
        return self.wallet_repo.debit(
            user_id=user_id, amount=amount, label=label, booking_id=booking_id
        )

    def refund(self, user_id: str, amount: Decimal, label: str, booking_id: str) -> WalletTransaction:
        return self.wallet_repo.credit(
            user_id=user_id, amount=amount, label=label, booking_id=booking_id
        )
