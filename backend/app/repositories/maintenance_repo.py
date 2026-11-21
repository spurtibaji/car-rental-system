from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.maintenance import MaintenanceRecord, MaintenanceStatus
from app.repositories.base import BaseRepository


class MaintenanceRepository(BaseRepository[MaintenanceRecord]):
    def __init__(self, db: Session):
        super().__init__(MaintenanceRecord, db)

    def list_all_records(self, skip: int = 0, limit: int = 50) -> Tuple[List[MaintenanceRecord], int]:
        query = self.db.query(MaintenanceRecord)
        total = query.count()
        records = query.order_by(desc(MaintenanceRecord.date)).offset(skip).limit(limit).all()
        return records, total

    def get_total_maintenance_cost(self) -> float:
        cost = self.db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).scalar()
        return float(cost)

    def count_active_maintenance(self) -> int:
        return (
            self.db.query(MaintenanceRecord)
            .filter(MaintenanceRecord.status != MaintenanceStatus.COMPLETED)
            .count()
        )
