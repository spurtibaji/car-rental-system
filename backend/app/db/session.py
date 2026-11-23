from typing import Generator
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

connect_args = {}
engine_kwargs = {}

if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
else:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_size": 10,
        "max_overflow": 20,
    })

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        **engine_kwargs,
    )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Connected to primary database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
except Exception as exc:
    logger.warning(
        f"Primary database connection failed ({exc}). Falling back to local development database: {settings.DATABASE_FALLBACK_URL}"
    )
    engine = create_engine(
        settings.DATABASE_FALLBACK_URL,
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def ensure_booking_duration_columns() -> None:
    """Add booking duration columns to databases created before they were introduced."""
    inspector = inspect(engine)
    if not inspector.has_table("bookings"):
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("bookings")
    }
    statements = []
    if "duration_type" not in existing_columns:
        statements.append(
            "ALTER TABLE bookings ADD COLUMN duration_type "
            "VARCHAR(20) NOT NULL DEFAULT 'daily'"
        )
    if "duration_value" not in existing_columns:
        statements.append(
            "ALTER TABLE bookings ADD COLUMN duration_value "
            "INTEGER NOT NULL DEFAULT 1"
        )

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))
        logger.info("Added missing booking duration columns to the database.")


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
