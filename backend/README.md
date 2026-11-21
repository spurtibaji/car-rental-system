# DriveNow Car Rental — Production Backend API

A production-ready REST backend for the DriveNow Car Rental application built with **Python 3.12+**, **FastAPI**, **SQLAlchemy 2**, **Alembic**, **Pydantic v2**, and **MySQL 8+**.

---

## 🚀 Key Features

- **Tamper-Proof Quote & Booking Engine**: Every price, discount, duration charge, driver fee, wallet deduction, and security deposit is recalculated strictly on the server.
- **Double-Booking Prevention**: Database transactions with pessimistic row locking (`SELECT ... FOR UPDATE`) guarantee that concurrent booking requests cannot double-book a car for overlapping intervals.
- **KYC Verification Enforcement**: Bookings require verified identity status (`verified`). Unverified users are rejected with actionable error guidance.
- **Atomic Wallet Ledger**: User wallet balances and transactions are tracked in double-entry style ledger records (`credit` / `debit` with `balance_after`), ensuring consistency during bookings, cancellations, and top-ups.
- **24/7 Roadside Assistance**: Emergency requests automatically calculate response ETAs, generate unique reference IDs (e.g. `RA-743912`), and support status lifecycle tracking.
- **AI Trip Planner**: Smart car matching based on passengers, journey days, purpose, terrain (Hills, Coastal, City), budget, and automated fuel/electricity cost calculations.
- **Role-Based Admin Panel**: Protected endpoints for fleet management, car availability toggling, customer account suspension/activation, KYC approval/rejection, maintenance tracking, and financial revenue analytics.
- **CORS Configured for Vite**: Seamlessly accepts requests from `http://localhost:8443` and `http://localhost:5173`.
- **Security & Reliability**: Passwords hashed with bcrypt, access tokens and refresh tokens signed with PyJWT, sliding-window rate limiting for auth and emergency endpoints, structured logging, and full exception handling.

---

## 🛠 Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (0.110+)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Validation & Serialization**: [Pydantic v2](https://docs.pydantic.dev/) + [Pydantic-Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- **Database Driver**: [PyMySQL](https://pymysql.readthedocs.io/) (with automatic SQLite fallback for local development/testing)
- **Authentication**: PyJWT + bcrypt
- **Testing**: [pytest](https://docs.pytest.org/) + `pytest-asyncio` + `httpx` (40 comprehensive unit and integration tests)

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI application entry point, CORS, lifespan, handlers
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings (.env loading)
│   │   ├── security.py          # bcrypt password hashing, PyJWT tokens
│   │   ├── logging.py           # Structured JSON and console logging
│   │   ├── rate_limiter.py      # Thread-safe sliding window rate limiter
│   │   └── exceptions.py        # Domain exceptions (AppException, KYCRequired, etc.)
│   ├── db/
│   │   ├── base.py              # DeclarativeBase
│   │   └── session.py           # Engine connection, connection pooling, get_db dependency
│   ├── models/                  # SQLAlchemy 2 normalized models
│   │   ├── user.py              # User, RefreshToken
│   │   ├── car.py               # Car, CarImage, CarFeature
│   │   ├── location.py          # Location
│   │   ├── offer.py             # Offer / Coupon
│   │   ├── booking.py           # Booking, BookingPriceBreakdown
│   │   ├── payment.py           # Payment
│   │   ├── wallet.py            # WalletAccount, WalletTransaction
│   │   ├── kyc.py               # KYCDocument
│   │   ├── roadside.py          # RoadsideRequest
│   │   ├── maintenance.py       # MaintenanceRecord
│   │   ├── review.py            # Review
│   │   └── audit_log.py         # AuditLog
│   ├── schemas/                 # Pydantic v2 schemas (camelCase output matching frontend)
│   │   ├── common.py            # ApiResponse, PaginatedResponse, ErrorResponse
│   │   ├── auth.py              # RegisterRequest, LoginRequest, TokenResponse
│   │   ├── user.py              # UserResponse, UserUpdateRequest, KYCDocumentResponse
│   │   ├── car.py               # CarResponse, CarCreateRequest, AvailabilityCheck
│   │   ├── location.py          # LocationResponse
│   │   ├── offer.py             # OfferResponse, CouponValidateResponse
│   │   ├── booking.py           # BookingQuoteResponse, BookingResponse, Tracking
│   │   ├── wallet.py            # WalletResponse, WalletTransactionResponse
│   │   ├── roadside.py          # RoadsideResponse, RoadsideCreateRequest
│   │   ├── trip_planner.py      # TripPlannerRequest, TripRecommendationItem
│   │   ├── maintenance.py       # MaintenanceRecordResponse
│   │   └── admin.py             # AdminDashboardResponse, CustomerResponse, Revenue
│   ├── repositories/            # Data access layer with row-level locks
│   │   ├── base.py
│   │   ├── user_repo.py
│   │   ├── car_repo.py
│   │   ├── booking_repo.py
│   │   ├── wallet_repo.py
│   │   ├── offer_repo.py
│   │   ├── roadside_repo.py
│   │   ├── maintenance_repo.py
│   │   └── audit_repo.py
│   ├── services/                # Business logic, calculations, policy validation
│   │   ├── auth_service.py
│   │   ├── car_service.py
│   │   ├── booking_service.py
│   │   ├── wallet_service.py
│   │   ├── offer_service.py
│   │   ├── trip_planner_service.py
│   │   ├── roadside_service.py
│   │   ├── admin_service.py
│   │   └── kyc_service.py
│   ├── api/
│   │   ├── deps.py              # get_db, get_current_user, get_current_admin
│   │   └── v1/                  # REST endpoints matching frontend
│   │       ├── api.py           # Router aggregation
│   │       ├── auth.py
│   │       ├── cars.py
│   │       ├── locations.py
│   │       ├── offers.py
│   │       ├── bookings.py
│   │       ├── profile.py
│   │       ├── wallet.py
│   │       ├── trip_planner.py
│   │       ├── roadside.py
│   │       └── admin.py
│   └── middleware/
│       ├── error_handler.py     # Global exception formatting
│       ├── rate_limit_middleware.py
│       └── audit_middleware.py  # X-Request-ID and timing headers
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py
├── scripts/
│   └── seed.py                  # Database seed script matching frontend mock data
├── tests/                       # 40 Unit and integration tests
├── uploads/                     # Storage directory for KYC documents
├── requirements.txt
├── .env.example
├── .env
├── Dockerfile
└── docker-compose.yml
```

---

## ⚙️ Installation & Setup

### Option 1: Run with Docker Compose (Recommended for Production)

Starts MySQL 8 and the backend service in isolated containers with automated migrations and seed data:

```bash
cd backend
docker-compose up --build
```

The API will be available at:
- **API Base**: `http://localhost:8000`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/api/v1/docs`
- **ReDoc Documentation**: `http://localhost:8000/api/v1/redoc`

---

### Option 2: Local Virtual Environment Setup

1. **Navigate to the backend directory and create a virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate the virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update the `DATABASE_URL` with your MySQL credentials:
   ```ini
   DATABASE_URL="mysql+pymysql://root:yourpassword@localhost:3306/car_rental"
   ```
   *(Note: If MySQL is not running or credentials are not yet set, the backend automatically uses a local SQLite development database `car_rental_dev.db` so development can proceed uninterrupted!)*

5. **Run Migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Seed Initial Data**:
   Populates 12 cars, 5 offers, 12 locations, 6 customers, 4 bookings, 4 maintenance records, and 1 admin user:
   ```bash
   python scripts/seed.py
   ```

7. **Start Development Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 🧪 Running Automated Tests

Run the complete test suite (40 unit and integration tests) using `pytest`:

```bash
pytest -v
```

All tests run in an isolated in-memory SQLite database (`StaticPool`), testing:
- User registration, duplicate email handling, login, token refresh, and logout
- Car search, filtering (category, fuel, transmission, seats, price), and sorting
- Car details retrieval, real availability checking, and related car suggestions
- Quote calculations (hourly, daily, weekly), driver fees, and deposit calculations
- Coupon validation rules (percentage vs. flat, minimum order, category restriction)
- KYC verification enforcement (rejection of unverified customers)
- Double-booking prevention via row-level database locking
- Atomic wallet balance deductions and cancellation refunds
- Emergency roadside assistance requests and status lifecycle
- AI trip planner recommendation algorithm and fuel cost calculations
- Admin role authorization (403 Forbidden for customer tokens)
- Admin dashboard statistics, car CRUD, customer management, KYC review, and maintenance tracking

---

## 🔑 Default Seed Accounts

| Role | Email | Password | Status | KYC Status | Initial Wallet |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@drivenow.com` | `Admin@123` | Active | Verified | — |
| **Customer** | `rahul@email.com` | `Password@123` | Active | Verified | ₹2,500.00 |
| **Customer** | `priya@email.com` | `Password@123` | Active | Verified | ₹1,500.00 |
| **Customer** | `amit@email.com` | `Password@123` | Active | Pending | ₹500.00 |
| **Customer** | `sneha@email.com` | `Password@123` | Active | Pending | ₹0.00 |
| **Customer** | `vikram@email.com` | `Password@123` | Active | Verified | ₹4,200.00 |
| **Customer** | `ananya@email.com` | `Password@123` | Suspended | Rejected | ₹0.00 |

---

## 📡 API Reference & Example Payloads

All responses conform to a unified envelope structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

---

### 1. Authentication

#### `POST /api/v1/auth/register`
**Request**:
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+91 98765 00000",
  "password": "SecurePassword123!"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "token_type": "bearer",
      "expires_in": 3600
    },
    "user": {
      "id": "u-b8c12a7d",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "+91 98765 00000",
      "role": "customer",
      "kyc_status": "not_uploaded",
      "wallet_balance": 0.0
    }
  }
}
```

#### `POST /api/v1/auth/login`
**Request**:
```json
{
  "email": "rahul@email.com",
  "password": "Password@123"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "token_type": "bearer",
      "expires_in": 3600
    },
    "user": {
      "id": "c-001",
      "name": "Rahul Sharma",
      "email": "rahul@email.com",
      "role": "customer",
      "kyc_status": "verified",
      "wallet_balance": 2500.0
    }
  }
}
```

---

### 2. Cars

#### `GET /api/v1/cars`
Supports query parameters: `search`, `category`, `fuel`, `brand`, `transmission`, `min_seats`, `available_only`, `max_price`, `duration_type` (`hourly` | `daily` | `weekly`), `sort_by` (`popular` | `price-asc` | `price-desc` | `rating`), `page`, `page_size`.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Cars retrieved successfully",
  "data": [
    {
      "id": "creta-1",
      "name": "Hyundai Creta",
      "brand": "Hyundai",
      "model": "Creta",
      "year": 2024,
      "category": "SUV",
      "price": {
        "hourly": 500.0,
        "daily": 3500.0,
        "weekly": 21000.0
      },
      "seats": 5,
      "fuel": "Diesel",
      "transmission": "Automatic",
      "mileage": 17.0,
      "image": "https://images.unsplash.com/photo-1674110997072-41f11b7d4ae7?w=800&h=500&fit=crop&auto=format",
      "images": [
        "https://images.unsplash.com/photo-1674110997072-41f11b7d4ae7?w=800&h=500&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1711921127505-f4a8727329a5?w=800&h=500&fit=crop&auto=format"
      ],
      "available": true,
      "rating": 4.8,
      "reviews": 312,
      "features": ["Panoramic Sunroof", "360 Camera", "ADAS", "Ventilated Seats", "Bose Sound"],
      "color": "Abyss Black",
      "engineCC": 1493,
      "topSpeed": 185,
      "deposit": 10000.0,
      "popular": true
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

#### `GET /api/v1/cars/creta-1/availability?pickup_date=2026-10-01&return_date=2026-10-05`
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Car is available for selected dates",
  "data": {
    "car_id": "creta-1",
    "is_available": true,
    "pickup_date": "2026-10-01",
    "return_date": "2026-10-05",
    "conflicting_bookings_count": 0,
    "message": "Car is available for selected dates"
  }
}
```

---

### 3. Offers & Coupon Validation

#### `POST /api/v1/offers/validate`
**Request**:
```json
{
  "code": "WEEKEND50",
  "car_id": "creta-1",
  "amount": 7000.0
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Coupon WEEKEND50 applied successfully",
  "data": {
    "valid": true,
    "discount_amount": 500.0,
    "final_amount": 6500.0,
    "message": "Coupon WEEKEND50 applied successfully",
    "offer": {
      "id": "off-2",
      "code": "WEEKEND50",
      "title": "Weekend Getaway",
      "description": "Flat ₹500 off on weekend bookings",
      "discount": 500.0,
      "type": "flat",
      "minAmount": 2000.0,
      "validTill": "2026-10-31",
      "color": "#f59e0b"
    }
  }
}
```

---

### 4. Bookings & Checkout

#### `POST /api/v1/bookings/quote`
Recalculates every pricing component on the server:
**Request**:
```json
{
  "car_id": "creta-1",
  "pickup_date": "2026-10-10",
  "duration_type": "daily",
  "duration_value": 2,
  "with_driver": true,
  "coupon_code": "WEEKEND50",
  "use_wallet": true
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Booking quote calculated successfully",
  "data": {
    "car_id": "creta-1",
    "car_name": "Hyundai Creta",
    "unit_price": 3500.0,
    "duration_type": "daily",
    "duration_value": 2,
    "base_amount": 7000.0,
    "driver_fee": 1600.0,
    "subtotal": 8600.0,
    "coupon_discount": 500.0,
    "coupon_code": "WEEKEND50",
    "wallet_discount": 2500.0,
    "security_deposit": 10000.0,
    "final_amount": 5600.0,
    "total_payable": 15600.0,
    "is_available": true,
    "wallet_balance": 2500.0
  }
}
```

#### `POST /api/v1/bookings`
*(Requires `Authorization: Bearer <token>` and `verified` KYC status)*
**Request**:
```json
{
  "car_id": "creta-1",
  "pickup_location": "Mumbai Airport, T2",
  "drop_location": "Pune, Hinjewadi",
  "pickup_date": "2026-10-10",
  "return_date": "2026-10-12",
  "pickup_time": "10:00",
  "return_time": "10:00",
  "duration_type": "daily",
  "duration_value": 2,
  "with_driver": true,
  "coupon_code": "WEEKEND50",
  "use_wallet": true,
  "payment_method": "upi"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "data": {
    "id": "bk-8492015",
    "carId": "creta-1",
    "carName": "Hyundai Creta",
    "carImage": "https://images.unsplash.com/photo-1674110997072-41f11b7d4ae7?w=800&h=500&fit=crop&auto=format",
    "pickupLocation": "Mumbai Airport, T2",
    "dropLocation": "Pune, Hinjewadi",
    "pickupDate": "2026-10-10",
    "returnDate": "2026-10-12",
    "pickupTime": "10:00",
    "durationType": "daily",
    "durationValue": 2,
    "amount": 15600.0,
    "status": "confirmed",
    "withDriver": true,
    "couponApplied": "WEEKEND50",
    "discount": 500.0,
    "createdAt": "2026-09-06",
    "breakdown": {
      "unit_price": 3500.0,
      "duration_units": 2,
      "subtotal": 8600.0,
      "driver_charge": 1600.0,
      "coupon_discount": 500.0,
      "wallet_deduction": 2500.0,
      "deposit_charge": 10000.0,
      "total_payable": 15600.0
    }
  }
}
```

#### `GET /api/v1/bookings/bk-8492015/tracking`
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Tracking info retrieved successfully",
  "data": {
    "booking_id": "bk-8492015",
    "status": "confirmed",
    "current_stage_index": 0,
    "stages": [
      { "name": "Confirmed", "completed": true, "current": true },
      { "name": "Pickup Ready", "completed": false, "current": false },
      { "name": "Active", "completed": false, "current": false },
      { "name": "Returned", "completed": false, "current": false }
    ]
  }
}
```

---

### 5. Profile & KYC Documents

#### `GET /api/v1/profile`
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "c-001",
    "name": "Rahul Sharma",
    "email": "rahul@email.com",
    "phone": "+91 98765 43210",
    "role": "customer",
    "date_of_birth": "1995-06-15",
    "address": "42, Shivaji Nagar, Pune - 411005",
    "licence_number": "MH01 2019 1234567",
    "kyc_status": "verified",
    "status": "active",
    "profile_complete": true,
    "wallet_balance": 2500.0,
    "created_at": "2025-03-15T10:00:00Z",
    "updated_at": "2026-09-06T12:00:00Z"
  }
}
```

#### `POST /api/v1/profile/kyc/documents`
Form-Data upload with MIME type and size checks:
- `document_type`: `licence_front` | `licence_back` | `aadhaar_front` | `selfie`
- `file`: binary file (`.jpg`, `.png`, `.pdf`, max 5 MB)

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "KYC document uploaded successfully",
  "data": {
    "id": "doc-8a7192",
    "document_type": "licence_front",
    "file_name": "dl_front.jpg",
    "mime_type": "image/jpeg",
    "file_size": 248102,
    "status": "pending",
    "rejection_reason": null,
    "uploaded_at": "2026-09-06T12:30:00Z",
    "verified_at": null
  }
}
```

---

### 6. Wallet & Top-Up

#### `POST /api/v1/wallet/top-up`
**Request**:
```json
{
  "amount": 2000.0,
  "payment_method": "upi"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "₹2,000.00 added to your wallet successfully",
  "data": {
    "balance": 4500.0,
    "user_id": "c-001",
    "transactions": [
      {
        "id": "txn-0192",
        "type": "credit",
        "amount": 2000.0,
        "balance_after": 4500.0,
        "label": "Added via UPI",
        "booking_id": null,
        "created_at": "2026-09-06T13:00:00Z"
      }
    ]
  }
}
```

---

### 7. Roadside Emergency Assistance

#### `POST /api/v1/roadside/requests`
Rate-limited (5 req/min):
**Request**:
```json
{
  "issue_type": "flat-tyre",
  "location": "Near Expressway, 43 km from Pune — 18.5204° N, 73.8567° E",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "notes": "Rear tyre punctured, spare tyre jack missing"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Emergency assistance requested. Help is on the way!",
  "data": {
    "id": "ra-198273",
    "reference_id": "RA-481920",
    "issue_type": "flat-tyre",
    "location": "Near Expressway, 43 km from Pune — 18.5204° N, 73.8567° E",
    "latitude": 18.5204,
    "longitude": 73.8567,
    "notes": "Rear tyre punctured, spare tyre jack missing",
    "eta": "15-20 min",
    "status": "requested",
    "booking_id": null,
    "user_id": "c-001",
    "created_at": "2026-09-06T13:05:00Z",
    "updated_at": "2026-09-06T13:05:00Z"
  }
}
```

---

### 8. AI Trip Planner

#### `POST /api/v1/trip-planner/recommendations`
**Request**:
```json
{
  "destination": "Lonavala",
  "passengers": 4,
  "days": 2,
  "purpose": "Family Trip",
  "budget": 10000.0,
  "need_driver": false
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Trip recommendations generated successfully",
  "data": {
    "destination": "Lonavala",
    "distance_round_trip_km": 130,
    "terrain": "Hills",
    "days": 2,
    "passengers": 4,
    "purpose": "Family Trip",
    "budget": 10000.0,
    "recommendations": [
      {
        "car": {
          "id": "creta-1",
          "name": "Hyundai Creta",
          "brand": "Hyundai",
          "category": "SUV",
          "price": { "hourly": 500.0, "daily": 3500.0, "weekly": 21000.0 },
          "seats": 5,
          "fuel": "Diesel",
          "transmission": "Automatic",
          "mileage": 17.0,
          "rating": 4.8
        },
        "rental_cost": 7000.0,
        "driver_cost": 0.0,
        "fuel_cost": 803.0,
        "total_estimated_cost": 7803.0,
        "is_best_match": true,
        "match_reasons": [
          "High ground clearance ideal for hills",
          "Automatic transmission for effortless hill climbs",
          "Comfortable seating with ample luggage capacity"
        ]
      }
    ]
  }
}
```

---

### 9. Admin Panel

#### `GET /api/v1/admin/dashboard`
*(Requires Admin Bearer token)*
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Admin dashboard retrieved successfully",
  "data": {
    "stats": {
      "totalRevenue": 2847500.0,
      "monthlyRevenue": 312800.0,
      "activeBookings": 23,
      "totalCars": 12,
      "availableCars": 11,
      "totalCustomers": 6,
      "pendingKYC": 2,
      "revenueGrowth": 18.5
    },
    "monthly_revenue": [
      { "month": "2026-01", "month_name": "Jan", "amount": 131376.0, "percentage": 42 },
      { "month": "2026-02", "month_name": "Feb", "amount": 181424.0, "percentage": 58 },
      { "month": "2026-03", "month_name": "Mar", "amount": 118864.0, "percentage": 38 },
      { "month": "2026-04", "month_name": "Apr", "amount": 225216.0, "percentage": 72 },
      { "month": "2026-05", "month_name": "May", "amount": 203320.0, "percentage": 65 },
      { "month": "2026-06", "month_name": "Jun", "amount": 275264.0, "percentage": 88 },
      { "month": "2026-07", "month_name": "Jul", "amount": 297160.0, "percentage": 95 },
      { "month": "2026-08", "month_name": "Aug", "amount": 222088.0, "percentage": 71 },
      { "month": "2026-09", "month_name": "Sep", "amount": 256496.0, "percentage": 82 },
      { "month": "2026-10", "month_name": "Oct", "amount": 237728.0, "percentage": 76 },
      { "month": "2026-11", "month_name": "Nov", "amount": 284648.0, "percentage": 91 },
      { "month": "2026-12", "month_name": "Dec", "amount": 312800.0, "percentage": 100 }
    ],
    "recent_bookings_count": 4
  }
}
```

---

## 🔒 Security & Best Practices Implemented

1. **Passwords**: Never stored in plaintext; hashed using `bcrypt` with salt rounds.
2. **Tokens**: Signed HMAC-SHA256 JWTs with nonces (`jti`), subject IDs, and distinct token types (`access` vs `refresh`).
3. **Pessimistic Concurrency**: `with_for_update()` row-level locks prevent race conditions during booking checkouts and wallet deductions.
4. **MIME & Size Enforcement**: Uploaded KYC identity documents are strictly validated by MIME type (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) and capped at 5 MB. Files are renamed with cryptographically secure random UUIDs.
5. **Private URLs Protected**: Raw server filesystem paths are never leaked in public JSON payloads.
6. **Audit Trails**: Every administrative change (car additions/deletions, availability modifications, customer suspensions, KYC verifications, maintenance records) is recorded into `audit_logs` with timestamps, admin ID, and JSON details.
