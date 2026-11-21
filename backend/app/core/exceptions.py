from typing import Any, Dict, Optional
from fastapi import status


class AppException(Exception):
    """Base exception for application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class BadRequestException(AppException):
    def __init__(self, message: str = "Invalid request"):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class EntityNotFoundException(AppException):
    def __init__(self, entity: str, identifier: Any):
        super().__init__(
            message=f"{entity} with id '{identifier}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
        )


class BookingConflictException(AppException):
    def __init__(self, message: str = "Car is already booked for the requested interval"):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
        )


class KYCRequiredException(AppException):
    def __init__(self, message: str = "A verified KYC document is required before booking a car"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class InsufficientWalletBalanceException(AppException):
    def __init__(self, available: float, required: float):
        super().__init__(
            message=f"Insufficient wallet balance. Available: ₹{available}, Required: ₹{required}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class InvalidCouponException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )
