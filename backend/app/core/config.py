import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )

    PROJECT_NAME: str = "DriveNow Car Rental API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database Configuration
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/car_rental"
    # Fallback to SQLite if MySQL is not reachable during local dev or tests
    DATABASE_FALLBACK_URL: str = f"sqlite:///{BASE_DIR / 'car_rental_dev.db'}"

    # Security & Auth
    JWT_SECRET: str = "drivenow_super_secret_jwt_key_car_rental_platform_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:8443,http://localhost:5173,http://localhost:5174,http://127.0.0.1:8443,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:3000,http://localhost:3001"

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # File Storage (KYC)
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_KYC_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
    ]

    # Rate Limits
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10
    ROADSIDE_RATE_LIMIT_PER_MINUTE: int = 5


settings = Settings()
