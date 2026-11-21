from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field, AliasChoices


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = Field(None, validation_alias=AliasChoices("date_of_birth", "dob"))
    address: Optional[str] = Field(None, max_length=255)
    licence_number: Optional[str] = Field(None, validation_alias=AliasChoices("licence_number", "licenceNumber"))


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    licence_number: Optional[str] = None
    kyc_status: str
    status: str
    profile_complete: bool
    wallet_balance: float = 0.0
    created_at: datetime
    updated_at: datetime


class KYCDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_type: str
    file_name: str
    mime_type: str
    file_size: int
    status: str
    rejection_reason: Optional[str] = None
    uploaded_at: datetime
    verified_at: Optional[datetime] = None
    file_url: Optional[str] = None


class KYCSubmitRequest(BaseModel):
    licence_number: Optional[str] = None
