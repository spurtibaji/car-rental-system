"""Initial database migration for DriveNow Car Rental.

Revision ID: 001_initial
Revises: None
Create Date: 2026-09-06 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), unique=True, index=True, nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), default="customer", nullable=False, index=True),
        sa.Column("date_of_birth", sa.Date, nullable=True),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("licence_number", sa.String(50), nullable=True),
        sa.Column("kyc_status", sa.String(20), default="not_uploaded", nullable=False, index=True),
        sa.Column("status", sa.String(20), default="active", nullable=False),
        sa.Column("profile_complete", sa.Boolean, default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 2. refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("token", sa.String(500), unique=True, index=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean, default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 3. cars
    op.create_table(
        "cars",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, index=True),
        sa.Column("brand", sa.String(50), nullable=False, index=True),
        sa.Column("model", sa.String(50), nullable=False, index=True),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("category", sa.String(50), nullable=False, index=True),
        sa.Column("hourly_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("daily_price", sa.Numeric(10, 2), nullable=False, index=True),
        sa.Column("weekly_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("seats", sa.Integer, nullable=False, index=True),
        sa.Column("fuel", sa.String(20), nullable=False, index=True),
        sa.Column("transmission", sa.String(20), nullable=False, index=True),
        sa.Column("mileage", sa.Numeric(6, 2), nullable=False, default=0.0),
        sa.Column("image", sa.String(500), nullable=False),
        sa.Column("available", sa.Boolean, default=True, nullable=False, index=True),
        sa.Column("rating", sa.Numeric(3, 2), default=0.0, nullable=False),
        sa.Column("review_count", sa.Integer, default=0, nullable=False),
        sa.Column("color", sa.String(50), nullable=False),
        sa.Column("engine_cc", sa.Integer, default=0, nullable=False),
        sa.Column("top_speed", sa.Integer, default=0, nullable=False),
        sa.Column("security_deposit", sa.Numeric(10, 2), nullable=False, default=5000.0),
        sa.Column("popular", sa.Boolean, default=False, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 4. car_images
    op.create_table(
        "car_images",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("car_id", sa.String(50), sa.ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("display_order", sa.Integer, default=0, nullable=False),
    )

    # 5. car_features
    op.create_table(
        "car_features",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("car_id", sa.String(50), sa.ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("feature", sa.String(100), nullable=False),
    )

    # 6. locations
    op.create_table(
        "locations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(150), unique=True, index=True, nullable=False),
        sa.Column("city", sa.String(100), nullable=False, index=True),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 7. offers
    op.create_table(
        "offers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("discount", sa.Numeric(10, 2), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("min_amount", sa.Numeric(10, 2), nullable=False, default=0.0),
        sa.Column("valid_till", sa.Date, nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("color", sa.String(20), nullable=False),
        sa.Column("max_uses", sa.Integer, default=1000, nullable=False),
        sa.Column("current_uses", sa.Integer, default=0, nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 8. bookings
    op.create_table(
        "bookings",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("car_id", sa.String(50), sa.ForeignKey("cars.id"), nullable=False, index=True),
        sa.Column("pickup_location_id", sa.String(36), sa.ForeignKey("locations.id"), nullable=True),
        sa.Column("drop_location_id", sa.String(36), sa.ForeignKey("locations.id"), nullable=True),
        sa.Column("pickup_location_name", sa.String(150), nullable=False),
        sa.Column("drop_location_name", sa.String(150), nullable=False),
        sa.Column("pickup_date", sa.Date, nullable=False, index=True),
        sa.Column("return_date", sa.Date, nullable=False, index=True),
        sa.Column("pickup_time", sa.String(10), default="10:00", nullable=False),
        sa.Column("return_time", sa.String(10), default="10:00", nullable=False),
        sa.Column("duration_type", sa.String(20), nullable=False),
        sa.Column("duration_value", sa.Integer, nullable=False),
        sa.Column("with_driver", sa.Boolean, default=False, nullable=False),
        sa.Column("driver_fee", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("base_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("wallet_amount", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("security_deposit", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("final_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_method", sa.String(30), default="upi", nullable=False),
        sa.Column("payment_status", sa.String(30), default="completed", nullable=False),
        sa.Column("status", sa.String(30), default="confirmed", nullable=False, index=True),
        sa.Column("coupon_code", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 9. booking_price_breakdowns
    op.create_table(
        "booking_price_breakdowns",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(50), sa.ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("duration_units", sa.Integer, nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("driver_charge", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("coupon_discount", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("wallet_deduction", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("deposit_charge", sa.Numeric(10, 2), default=0.0, nullable=False),
        sa.Column("total_payable", sa.Numeric(10, 2), nullable=False),
        sa.Column("details_json", sa.Text, nullable=True),
    )

    # 10. payments
    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(50), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_method", sa.String(50), nullable=False),
        sa.Column("transaction_reference", sa.String(100), unique=True, index=True, nullable=False),
        sa.Column("status", sa.String(30), default="successful", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 11. wallet_accounts
    op.create_table(
        "wallet_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True),
        sa.Column("balance", sa.Numeric(12, 2), default=0.0, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 12. wallet_transactions
    op.create_table(
        "wallet_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("wallet_id", sa.String(36), sa.ForeignKey("wallet_accounts.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("balance_after", sa.Numeric(12, 2), nullable=False),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("booking_id", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 13. kyc_documents
    op.create_table(
        "kyc_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("document_type", sa.String(50), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("status", sa.String(20), default="pending", nullable=False, index=True),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 14. roadside_requests
    op.create_table(
        "roadside_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("reference_id", sa.String(30), unique=True, index=True, nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("booking_id", sa.String(50), sa.ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("issue_type", sa.String(50), nullable=False, index=True),
        sa.Column("location", sa.Text, nullable=False),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("eta", sa.String(50), default="20-30 min", nullable=False),
        sa.Column("status", sa.String(30), default="requested", nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 15. maintenance_records
    op.create_table(
        "maintenance_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("car_id", sa.String(50), sa.ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("car_name", sa.String(100), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("status", sa.String(30), default="pending", nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 16. reviews
    op.create_table(
        "reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("car_id", sa.String(50), sa.ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("booking_id", sa.String(50), sa.ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("comment", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 17. audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("action", sa.String(100), nullable=False, index=True),
        sa.Column("resource_type", sa.String(100), nullable=False, index=True),
        sa.Column("resource_id", sa.String(100), nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column("details", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("reviews")
    op.drop_table("maintenance_records")
    op.drop_table("roadside_requests")
    op.drop_table("kyc_documents")
    op.drop_table("wallet_transactions")
    op.drop_table("wallet_accounts")
    op.drop_table("payments")
    op.drop_table("booking_price_breakdowns")
    op.drop_table("bookings")
    op.drop_table("offers")
    op.drop_table("locations")
    op.drop_table("car_features")
    op.drop_table("car_images")
    op.drop_table("cars")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
