import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.kyc import KYCDocument, KYCDocumentStatus
from app.models.user import User, KYCStatus
from app.schemas.user import KYCDocumentResponse
from app.core.config import settings
from app.core.exceptions import AppException, EntityNotFoundException


class KYCService:
    def __init__(self, db: Session):
        self.db = db

    async def upload_document(
        self, user: User, document_type: str, file: UploadFile
    ) -> KYCDocumentResponse:
        # 1. Validate MIME type
        if file.content_type not in settings.ALLOWED_KYC_MIME_TYPES:
            raise AppException(
                f"Unsupported file type: {file.content_type}. Allowed: {', '.join(settings.ALLOWED_KYC_MIME_TYPES)}",
                status_code=400,
            )

        # 2. Read contents and validate size
        contents = await file.read()
        file_size = len(contents)
        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise AppException(
                f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB",
                status_code=400,
            )

        # 3. Create upload destination directory
        upload_dir = Path(settings.UPLOAD_DIR) / "kyc"
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 4. Generate secure unique filename
        ext = Path(file.filename or "doc.jpg").suffix.lower()
        if not ext:
            ext = ".jpg" if "jpeg" in file.content_type or "jpg" in file.content_type else ".pdf"

        secure_filename = f"{user.id}_{uuid.uuid4().hex[:12]}{ext}"
        target_path = upload_dir / secure_filename

        with open(target_path, "wb") as f:
            f.write(contents)

        # 5. Save database record
        doc = KYCDocument(
            user_id=user.id,
            document_type=document_type,
            file_path=str(target_path),
            file_name=file.filename or secure_filename,
            mime_type=file.content_type,
            file_size=file_size,
            status=KYCDocumentStatus.PENDING,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        return KYCDocumentResponse(
            id=doc.id,
            document_type=doc.document_type,
            file_name=doc.file_name,
            mime_type=doc.mime_type,
            file_size=doc.file_size,
            status=doc.status,
            rejection_reason=doc.rejection_reason,
            uploaded_at=doc.uploaded_at,
            verified_at=doc.verified_at,
            file_url=f"{settings.API_V1_STR}/profile/kyc/documents/{doc.id}/view",
        )

    def submit_kyc(self, user: User, licence_number: Optional[str] = None) -> User:
        if licence_number:
            user.licence_number = licence_number.strip()

        # Update KYC status to pending review
        user.kyc_status = KYCStatus.PENDING
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_user_documents(self, user_id: str) -> List[KYCDocumentResponse]:
        docs = (
            self.db.query(KYCDocument)
            .filter(KYCDocument.user_id == user_id)
            .order_by(KYCDocument.uploaded_at.desc())
            .all()
        )
        return [
            KYCDocumentResponse(
                id=d.id,
                document_type=d.document_type,
                file_name=d.file_name,
                mime_type=d.mime_type,
                file_size=d.file_size,
                status=d.status,
                rejection_reason=d.rejection_reason,
                uploaded_at=d.uploaded_at,
                verified_at=d.verified_at,
                file_url=f"{settings.API_V1_STR}/profile/kyc/documents/{d.id}/view",
            )
            for d in docs
        ]

    def get_document(self, document_id: str) -> Optional[KYCDocument]:
        return self.db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
