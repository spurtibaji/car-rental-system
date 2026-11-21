import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import hash_password, create_access_token
from app.models.user import User, UserRole, KYCStatus, UserStatus
from app.models.car import Car, CarFeature
from app.models.location import Location
from app.models.offer import Offer
from app.models.wallet import WalletAccount, WalletTransaction, WalletTransactionType

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        # Seed test locations
        loc1 = Location(id="loc-1", name="Mumbai Airport, T2", city="Mumbai", is_active=True)
        loc2 = Location(id="loc-2", name="Pune, Hinjewadi", city="Pune", is_active=True)
        loc3 = Location(id="loc-3", name="Bandra, Mumbai", city="Mumbai", is_active=True)
        db.add_all([loc1, loc2, loc3])

        # Seed test admin
        admin = User(
            id="test-admin-1",
            name="Super Admin",
            email="admin.test@drivenow.com",
            password_hash=hash_password("AdminPass123!"),
            role=UserRole.ADMIN,
            kyc_status=KYCStatus.VERIFIED,
            status=UserStatus.ACTIVE,
            profile_complete=True,
        )
        db.add(admin)

        # Seed verified customer
        customer = User(
            id="test-customer-1",
            name="Rahul Sharma",
            email="rahul.test@email.com",
            phone="+91 98765 43210",
            password_hash=hash_password("CustomerPass123!"),
            role=UserRole.CUSTOMER,
            kyc_status=KYCStatus.VERIFIED,
            status=UserStatus.ACTIVE,
            licence_number="MH01 2020 12345",
            profile_complete=True,
        )
        db.add(customer)
        db.flush()

        # Seed wallet for customer
        wallet = WalletAccount(id="wallet-1", user_id=customer.id, balance=Decimal("5000.00"))
        db.add(wallet)
        db.flush()

        # Seed unverified customer for KYC testing
        unverified = User(
            id="test-customer-2",
            name="New User",
            email="newuser.test@email.com",
            password_hash=hash_password("CustomerPass123!"),
            role=UserRole.CUSTOMER,
            kyc_status=KYCStatus.NOT_UPLOADED,
            status=UserStatus.ACTIVE,
            profile_complete=False,
        )
        db.add(unverified)
        db.flush()
        db.add(WalletAccount(id="wallet-2", user_id=unverified.id, balance=Decimal("0.00")))

        # Seed dedicated unverified customer for booking rejection test
        always_unverified = User(
            id="test-customer-unverified",
            name="Always Unverified",
            email="always.unverified@email.com",
            password_hash=hash_password("CustomerPass123!"),
            role=UserRole.CUSTOMER,
            kyc_status=KYCStatus.NOT_UPLOADED,
            status=UserStatus.ACTIVE,
            profile_complete=False,
        )
        db.add(always_unverified)
        db.flush()
        db.add(WalletAccount(id="wallet-unverified", user_id=always_unverified.id, balance=Decimal("0.00")))


        # Seed test cars
        car1 = Car(
            id="test-creta-1",
            name="Hyundai Creta",
            brand="Hyundai",
            model="Creta",
            year=2024,
            category="SUV",
            hourly_price=Decimal("500.00"),
            daily_price=Decimal("3500.00"),
            weekly_price=Decimal("21000.00"),
            seats=5,
            fuel="Diesel",
            transmission="Automatic",
            mileage=Decimal("17.00"),
            image="https://example.com/creta.jpg",
            available=True,
            rating=Decimal("4.80"),
            review_count=100,
            color="Black",
            engine_cc=1493,
            top_speed=185,
            security_deposit=Decimal("10000.00"),
            popular=True,
        )
        car2 = Car(
            id="test-swift-1",
            name="Maruti Swift",
            brand="Maruti",
            model="Swift",
            year=2023,
            category="Hatchback",
            hourly_price=Decimal("250.00"),
            daily_price=Decimal("1800.00"),
            weekly_price=Decimal("10500.00"),
            seats=5,
            fuel="Petrol",
            transmission="Manual",
            mileage=Decimal("23.00"),
            image="https://example.com/swift.jpg",
            available=True,
            rating=Decimal("4.50"),
            review_count=50,
            color="Red",
            engine_cc=1197,
            top_speed=170,
            security_deposit=Decimal("5000.00"),
            popular=True,
        )
        car3 = Car(
            id="test-bmw-1",
            name="BMW 5 Series",
            brand="BMW",
            model="530i",
            year=2024,
            category="Luxury",
            hourly_price=Decimal("1500.00"),
            daily_price=Decimal("9500.00"),
            weekly_price=Decimal("55000.00"),
            seats=5,
            fuel="Petrol",
            transmission="Automatic",
            mileage=Decimal("13.00"),
            image="https://example.com/bmw.jpg",
            available=False,
            rating=Decimal("4.90"),
            review_count=30,
            color="White",
            engine_cc=1998,
            top_speed=250,
            security_deposit=Decimal("30000.00"),
            popular=False,
        )
        db.add_all([car1, car2, car3])
        db.flush()

        # Add features
        db.add(CarFeature(car_id=car1.id, feature="Panoramic Sunroof"))
        db.add(CarFeature(car_id=car1.id, feature="ADAS"))

        # Seed test offers
        offer1 = Offer(
            id="test-off-1",
            code="FIRSTRIDE",
            title="First Ride Special",
            description="25% off",
            discount=Decimal("25.00"),
            type="percent",
            min_amount=Decimal("1000.00"),
            valid_till=date(2028, 12, 31),
            color="#e8291e",
            is_active=True,
        )
        offer2 = Offer(
            id="test-off-2",
            code="WEEKEND50",
            title="Weekend Flat 500",
            description="Flat 500 off",
            discount=Decimal("500.00"),
            type="flat",
            min_amount=Decimal("2000.00"),
            valid_till=date(2028, 12, 31),
            color="#f59e0b",
            is_active=True,
        )
        offer3 = Offer(
            id="test-off-3",
            code="LUXURY15",
            title="Luxury 15% off",
            description="15% off Luxury cars",
            discount=Decimal("15.00"),
            type="percent",
            min_amount=Decimal("5000.00"),
            valid_till=date(2028, 12, 31),
            category="Luxury",
            color="#8b5cf6",
            is_active=True,
        )
        db.add_all([offer1, offer2, offer3])

        db.commit()
    finally:
        db.close()

    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers():
    token = create_access_token("test-admin-1", role="admin")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def customer_headers():
    token = create_access_token("test-customer-1", role="customer")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def unverified_headers():
    token = create_access_token("test-customer-unverified", role="customer")
    return {"Authorization": f"Bearer {token}"}

