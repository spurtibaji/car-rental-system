from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.kyc_service import KYCService
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.user import (
    UserResponse,
    UserUpdateRequest,
    KYCDocumentResponse,
    KYCSubmitRequest,
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/profile", tags=["Profile & KYC"])


@router.get("", response_model=ApiResponse[UserResponse])
def get_profile(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    wallet_balance = float(current_user.wallet.balance) if current_user.wallet else 0.0
    return ApiResponse(
        message="Profile retrieved successfully",
        data=UserResponse(
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
        ),
    )


@router.patch("", response_model=ApiResponse[UserResponse])
@router.put("", response_model=ApiResponse[UserResponse])
def update_profile(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update personal profile details (name, phone, dob, address, licence)."""
    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(current_user, field, val)

    # Check profile completion
    if current_user.name and current_user.phone and current_user.address and current_user.licence_number:
        current_user.profile_complete = True

    db.commit()
    db.refresh(current_user)

    wallet_balance = float(current_user.wallet.balance) if current_user.wallet else 0.0
    return ApiResponse(
        message="Profile updated successfully",
        data=UserResponse(
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
        ),
    )


@router.post("/kyc/documents", response_model=ApiResponse[KYCDocumentResponse])
async def upload_kyc_document(
    document_type: str = Form(
        ...,
        pattern="^(driving_license|driving_licence|aadhaar|licence_front|licence_back|aadhaar_front|aadhaar_back|selfie|passport|other)$",
    ),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a KYC identity document (driving licence, Aadhaar, selfie)."""
    kyc_service = KYCService(db)
    doc = await kyc_service.upload_document(
        user=current_user, document_type=document_type, file=file
    )
    return ApiResponse(
        message="KYC document uploaded successfully",
        data=doc,
    )


@router.post("/kyc/submit", response_model=ApiResponse[UserResponse])
def submit_kyc(
    data: Optional[KYCSubmitRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit uploaded documents for admin KYC verification."""
    kyc_service = KYCService(db)
    licence_no = data.licence_number if data else None
    user = kyc_service.submit_kyc(user=current_user, licence_number=licence_no)

    wallet_balance = float(user.wallet.balance) if user.wallet else 0.0
    return ApiResponse(
        message="KYC documents submitted for review",
        data=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            date_of_birth=user.date_of_birth,
            address=user.address,
            licence_number=user.licence_number,
            kyc_status=user.kyc_status,
            status=user.status,
            profile_complete=user.profile_complete,
            wallet_balance=wallet_balance,
            created_at=user.created_at,
            updated_at=user.updated_at,
        ),
    )


@router.get("/kyc", response_model=ApiResponse[List[KYCDocumentResponse]])
def get_kyc_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all uploaded KYC documents for the current user."""
    kyc_service = KYCService(db)
    docs = kyc_service.list_user_documents(current_user.id)
    return ApiResponse(
        message="KYC documents retrieved successfully",
        data=docs,
    )


@router.get("/kyc/documents/{document_id}/view")
def view_kyc_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Serve a user's uploaded KYC document file directly (inline for images/PDFs)."""
    kyc_service = KYCService(db)
    doc = kyc_service.get_document(document_id)
    if not doc:
        raise NotFoundException("Document not found")
    if doc.user_id != current_user.id:
        raise ForbiddenException("Access denied to this document")

    file_path = Path(doc.file_path)
    if not file_path.is_file():
        raise NotFoundException("Document file not found on server")

    return FileResponse(
        path=str(file_path),
        media_type=doc.mime_type or "application/octet-stream",
        filename=doc.file_name,
        content_disposition_type="inline",
    )
