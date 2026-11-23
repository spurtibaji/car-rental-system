"""Ensure booking duration fields exist in previously created databases.

Revision ID: 002_booking_duration
Revises: 001_initial
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_booking_duration"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("bookings")
    }

    if "duration_type" not in columns:
        op.add_column(
            "bookings",
            sa.Column("duration_type", sa.String(20), nullable=False, server_default="daily"),
        )
    if "duration_value" not in columns:
        op.add_column(
            "bookings",
            sa.Column("duration_value", sa.Integer(), nullable=False, server_default="1"),
        )


def downgrade() -> None:
    # These columns may have existed before this compatibility migration.
    pass
