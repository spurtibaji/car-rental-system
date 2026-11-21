from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.wallet import WalletAccount, WalletTransaction, WalletTransactionType
from app.core.exceptions import InsufficientWalletBalanceException
from app.repositories.base import BaseRepository


class WalletRepository(BaseRepository[WalletAccount]):
    def __init__(self, db: Session):
        super().__init__(WalletAccount, db)

    def get_or_create(self, user_id: str) -> WalletAccount:
        wallet = self.db.query(WalletAccount).filter(WalletAccount.user_id == user_id).first()
        if not wallet:
            wallet = WalletAccount(user_id=user_id, balance=Decimal("0.00"))
            self.db.add(wallet)
            self.db.commit()
            self.db.refresh(wallet)
        return wallet

    def get_for_update(self, user_id: str) -> WalletAccount:
        """Lock wallet row for atomic balance update."""
        wallet = (
            self.db.query(WalletAccount)
            .filter(WalletAccount.user_id == user_id)
            .with_for_update()
            .first()
        )
        if not wallet:
            wallet = WalletAccount(user_id=user_id, balance=Decimal("0.00"))
            self.db.add(wallet)
            self.db.flush()
        return wallet

    def credit(
        self,
        user_id: str,
        amount: Decimal,
        label: str,
        booking_id: Optional[str] = None,
    ) -> WalletTransaction:
        """Atomically credit amount to user's wallet with ledger entry."""
        wallet = self.get_for_update(user_id)
        new_balance = wallet.balance + amount
        wallet.balance = new_balance

        txn = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.CREDIT,
            amount=amount,
            balance_after=new_balance,
            label=label,
            booking_id=booking_id,
        )
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(txn)
        return txn

    def debit(
        self,
        user_id: str,
        amount: Decimal,
        label: str,
        booking_id: Optional[str] = None,
    ) -> WalletTransaction:
        """Atomically debit amount from user's wallet with ledger entry."""
        wallet = self.get_for_update(user_id)
        if wallet.balance < amount:
            raise InsufficientWalletBalanceException(
                available=float(wallet.balance),
                required=float(amount),
            )

        new_balance = wallet.balance - amount
        wallet.balance = new_balance

        txn = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.DEBIT,
            amount=amount,
            balance_after=new_balance,
            label=label,
            booking_id=booking_id,
        )
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(txn)
        return txn

    def list_transactions(self, user_id: str, skip: int = 0, limit: int = 50) -> List[WalletTransaction]:
        wallet = self.get_or_create(user_id)
        return (
            self.db.query(WalletTransaction)
            .filter(WalletTransaction.wallet_id == wallet.id)
            .order_by(desc(WalletTransaction.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
