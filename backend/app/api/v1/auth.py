from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ApiResponse[dict], status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new customer account."""
    auth_service = AuthService(db)
    tokens, user = auth_service.register(data)
    wallet_balance = float(user.wallet.balance) if user.wallet else 0.0
    return ApiResponse(
        message="Registration successful",
        data={
            "tokens": tokens.model_dump(),
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "kyc_status": user.kyc_status,
                "wallet_balance": wallet_balance,
            },
        },
    )


@router.post("/login", response_model=ApiResponse[dict])
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password."""
    auth_service = AuthService(db)
    tokens, user = auth_service.login(data)
    wallet_balance = float(user.wallet.balance) if user.wallet else 0.0
    return ApiResponse(
        message="Login successful",
        data={
            "tokens": tokens.model_dump(),
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "kyc_status": user.kyc_status,
                "wallet_balance": wallet_balance,
            },
        },
    )


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh an access token using a valid refresh token."""
    auth_service = AuthService(db)
    new_tokens = auth_service.refresh(data.refresh_token)
    return ApiResponse(
        message="Token refreshed successfully",
        data=new_tokens,
    )


@router.post("/logout", response_model=ApiResponse[dict])
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revoke all refresh tokens for the authenticated user."""
    auth_service = AuthService(db)
    auth_service.logout(current_user.id)
    return ApiResponse(
        message="Logged out successfully",
        data={},
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    wallet_balance = float(current_user.wallet.balance) if current_user.wallet else 0.0
    user_data = UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        date_of_birth=current_user.date_of_birth,
        address=current_user.address,
        licence_number=current_user.licence_number,
        kyc_status=current_user.kyc_status,
        status=current_user.status,
        profile_complete=current_user.profile_complete,
        wallet_balance=wallet_balance,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
    return ApiResponse(
        message="Profile retrieved successfully",
        data=user_data,
    )
