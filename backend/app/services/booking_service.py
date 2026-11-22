import json
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingPriceBreakdown, BookingStatus, PaymentStatus
from app.models.payment import Payment
from app.models.user import User, KYCStatus
from app.models.car import Car
from app.models.location import Location
from app.repositories.booking_repo import BookingRepository
from app.repositories.car_repo import CarRepository
from app.repositories.wallet_repo import WalletRepository
from app.repositories.offer_repo import OfferRepository
from app.services.offer_service import OfferService
from app.schemas.booking import (
    BookingQuoteRequest,
    BookingQuoteResponse,
    BookingCreateRequest,
    BookingResponse,
    PriceBreakdownSchema,
    BookingTrackingResponse,
    TrackingStage,
)
from app.schemas.review import ReviewResponse
from app.schemas.admin import (
    AdminBookingResponse,
    AdminBookingUser,
    AdminBookingCar,
)
from app.core.exceptions import (
    EntityNotFoundException,
    BookingConflictException,
    KYCRequiredException,
    InsufficientWalletBalanceException,
    AppException,
)


def get_car_license_plate(car_id: str) -> str:
    known = {
        "swift-1": "MH-02-DN-1011",
        "i20-1": "MH-02-DN-1022",
        "city-1": "MH-02-DN-2033",
        "dzire-1": "MH-02-DN-2044",
        "creta-1": "MH-02-DN-3055",
        "scorpio-1": "MH-02-DN-3066",
        "bmw5-1": "MH-02-DN-5077",
        "merc-1": "MH-02-DN-5088",
        "nexon-ev-1": "MH-02-DN-7099",
        "mg-ev-1": "MH-02-DN-7100",
        "innova-1": "MH-02-DN-8111",
        "ertiga-1": "MH-02-DN-8122",
    }
    if car_id in known:
        return known[car_id]
    num = abs(hash(car_id)) % 9000 + 1000
    return f"MH-02-DN-{num}"


def booking_to_schema(b: Booking) -> BookingResponse:
    breakdown_schema = None
    if b.price_breakdown:
        breakdown_schema = PriceBreakdownSchema(
            unit_price=float(b.price_breakdown.unit_price),
            duration_units=b.price_breakdown.duration_units,
            subtotal=float(b.price_breakdown.subtotal),
            driver_charge=float(b.price_breakdown.driver_charge),
            coupon_discount=float(b.price_breakdown.coupon_discount),
            wallet_deduction=float(b.price_breakdown.wallet_deduction),
            deposit_charge=float(b.price_breakdown.deposit_charge),
            total_payable=float(b.price_breakdown.total_payable),
        )

    user_info = None
    if b.user:
        user_info = {
            "id": b.user.id,
            "name": b.user.name,
            "email": b.user.email,
            "phone": b.user.phone,
        }

    car_info = None
    if b.car:
        car_info = {
            "id": b.car.id,
            "name": b.car.name,
            "image": b.car.image,
            "license_plate": get_car_license_plate(b.car.id),
            "brand": b.car.brand,
            "model": b.car.model,
            "category": b.car.category,
        }

    final_amt = float(b.final_amount or 0.0)

    review_schema = None
    if getattr(b, "review", None):
        r = b.review
        review_schema = ReviewResponse(
            id=r.id,
            car_id=r.car_id,
            car_name=b.car.name if b.car else None,
            car_image=b.car.image if b.car else None,
            user_id=r.user_id,
            user_name=b.user.name if b.user else None,
            booking_id=r.booking_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
        )

    return BookingResponse(
        id=b.id,
        carId=b.car_id,
        carName=b.car.name if b.car else "Car",
        carImage=b.car.image if b.car else "",
        pickupLocation=b.pickup_location_name,
        dropLocation=b.drop_location_name,
        pickupDate=b.pickup_date,
        returnDate=b.return_date,
        pickupTime=b.pickup_time,
        durationType=b.duration_type,
        durationValue=b.duration_value,
        amount=final_amt,
        status=b.status,
        withDriver=b.with_driver,
        couponApplied=b.coupon_code,
        discount=float(b.discount_amount or 0.0),
        createdAt=b.created_at.date() if isinstance(b.created_at, datetime) else b.created_at,
        breakdown=breakdown_schema,
        user=user_info,
        car=car_info,
        total_price=final_amt,
        total_amount=final_amt,
        pickup_date=b.pickup_date,
        return_date=b.return_date,
        pickup_time=b.pickup_time,
        return_time=b.return_time,
        pickup_location=b.pickup_location_name,
        drop_location=b.drop_location_name,
        duration_value=b.duration_value,
        with_driver=b.with_driver,
        payment_method=b.payment_method,
        review=review_schema,
    )


def admin_booking_to_schema(b: Booking) -> AdminBookingResponse:
    user_schema = None
    if b.user:
        user_schema = AdminBookingUser(
            id=b.user.id,
            name=b.user.name,
            email=b.user.email,
            phone=b.user.phone,
        )

    car_schema = None
    if b.car:
        car_schema = AdminBookingCar(
            id=b.car.id,
            name=b.car.name,
            image=b.car.image,
            license_plate=get_car_license_plate(b.car.id),
            brand=b.car.brand,
            model=b.car.model,
            category=b.car.category,
        )

    final_amt = float(b.final_amount or 0.0)

    return AdminBookingResponse(
        id=b.id,
        booking_id=b.id,
        user_id=b.user_id,
        car_id=b.car_id,
        status=b.status,
        pickup_date=b.pickup_date,
        return_date=b.return_date,
        pickup_time=b.pickup_time,
        return_time=b.return_time,
        pickup_location=b.pickup_location_name,
        drop_location=b.drop_location_name,
        duration_value=b.duration_value,
        total_price=final_amt,
        total_amount=final_amt,
        amount=final_amt,
        with_driver=b.with_driver,
        payment_method=b.payment_method,
        payment_status=b.payment_status,
        coupon_code=b.coupon_code,
        discount_amount=float(b.discount_amount or 0.0),
        created_at=b.created_at.date() if isinstance(b.created_at, datetime) else b.created_at,
        user=user_schema,
        car=car_schema,
        carId=b.car_id,
        carName=b.car.name if b.car else "DriveNow Vehicle",
        carImage=b.car.image if b.car else "",
        pickupLocation=b.pickup_location_name,
        dropLocation=b.drop_location_name,
        pickupDate=b.pickup_date,
        returnDate=b.return_date,
        pickupTime=b.pickup_time,
        returnTime=b.return_time,
        durationValue=b.duration_value,
        withDriver=b.with_driver,
        createdAt=b.created_at.date() if isinstance(b.created_at, datetime) else b.created_at,
    )


class BookingService:
    def __init__(self, db: Session):
        self.db = db
        self.booking_repo = BookingRepository(db)
        self.car_repo = CarRepository(db)
        self.wallet_repo = WalletRepository(db)
        self.offer_repo = OfferRepository(db)
        self.offer_service = OfferService(db)

    def _resolve_dates(
        self,
        pickup_date: date,
        return_date: Optional[date] = None,
        duration_type: Optional[str] = None,
        duration_value: Optional[int] = 1,
    ) -> date:
        if return_date:
            if return_date < pickup_date:
                raise AppException("Return date cannot be earlier than pickup date", status_code=400)
            return return_date

        val = max(1, duration_value or 1)
        if duration_type == "weekly":
            return pickup_date + timedelta(weeks=val)
        return pickup_date + timedelta(days=val)

    def calculate_quote(
        self, data: BookingQuoteRequest, user_id: Optional[str] = None
    ) -> BookingQuoteResponse:
        car = self.car_repo.get_by_id(data.car_id)
        if not car:
            raise EntityNotFoundException("Car", data.car_id)

        resolved_return_date = self._resolve_dates(
            pickup_date=data.pickup_date,
            return_date=data.return_date,
            duration_type=data.duration_type,
            duration_value=data.duration_value,
        )

        is_avail, _ = self.car_repo.check_availability(
            car_id=car.id,
            pickup_date=data.pickup_date,
            return_date=resolved_return_date,
        )

        # Server-side pricing calculation based on daily rate and days
        diff_days = (resolved_return_date - data.pickup_date).days
        days = max(1, diff_days if data.return_date else (data.duration_value or 1))
        unit_price = car.daily_price

        base_amount = round(unit_price * Decimal(str(days)), 2)
        driver_fee = (
            Decimal("800.00") * Decimal(str(days)) if data.with_driver else Decimal("0.00")
        )
        subtotal = base_amount + driver_fee

        # Coupon calculation
        coupon_discount = Decimal("0.00")
        coupon_code = None
        if data.coupon_code:
            valid, discount, _, offer = self.offer_service.validate_coupon(
                code=data.coupon_code, amount=subtotal, car=car
            )
            if valid and offer:
                coupon_discount = discount
                coupon_code = offer.code

        # Wallet calculation
        wallet_balance = Decimal("0.00")
        wallet_discount = Decimal("0.00")
        if user_id:
            wallet = self.wallet_repo.get_or_create(user_id)
            wallet_balance = wallet.balance
            if data.use_wallet and wallet_balance > 0:
                amount_after_coupon = max(Decimal("0.00"), subtotal - coupon_discount)
                wallet_discount = min(wallet_balance, amount_after_coupon)

        deposit = car.security_deposit
        final_rental = max(Decimal("0.00"), subtotal - coupon_discount - wallet_discount)
        total_payable = final_rental + deposit

        return BookingQuoteResponse(
            car_id=car.id,
            car_name=car.name,
            unit_price=float(unit_price),
            duration_type=data.duration_type or "daily",
            duration_value=days,
            base_amount=float(base_amount),
            driver_fee=float(driver_fee),
            subtotal=float(subtotal),
            coupon_discount=float(coupon_discount),
            coupon_code=coupon_code,
            wallet_discount=float(wallet_discount),
            security_deposit=float(deposit),
            final_amount=float(final_rental),
            total_payable=float(total_payable),
            is_available=is_avail,
            wallet_balance=float(wallet_balance),
        )

    def create_booking(self, user: User, data: BookingCreateRequest) -> BookingResponse:
        # Rule: A booking requiring KYC must be rejected unless the user is verified.
        if user.kyc_status != KYCStatus.VERIFIED:
            raise KYCRequiredException(
                "KYC verification is required before booking a car. Please submit your documents in Profile."
            )

        resolved_return_date = self._resolve_dates(
            pickup_date=data.pickup_date,
            return_date=data.return_date,
            duration_type=data.duration_type,
            duration_value=data.duration_value,
        )

        booking_id = f"bk-{int(datetime.now(timezone.utc).timestamp() * 1000) % 10000000}"

        # Use atomic database transaction with row locking
        try:
            # 1. Lock the car row to prevent race condition / double-booking
            car = self.car_repo.get_for_update(data.car_id)
            if not car:
                raise EntityNotFoundException("Car", data.car_id)

            if not car.available:
                raise AppException("Car is currently unavailable for booking", status_code=400)

            # 2. Check overlapping bookings with lock
            conflicts = self.booking_repo.find_conflicts(
                car_id=car.id,
                pickup_date=data.pickup_date,
                return_date=resolved_return_date,
                for_update=True,
            )
            if conflicts:
                raise BookingConflictException(
                    f"Car '{car.name}' is already booked between {data.pickup_date} and {resolved_return_date}"
                )

            # 3. Recalculate price strictly on server using daily rate and number of days
            diff_days = (resolved_return_date - data.pickup_date).days
            days = max(1, diff_days if data.return_date else (data.duration_value or 1))

            unit_price = car.daily_price
            base_amount = round(unit_price * Decimal(str(days)), 2)
            driver_fee = (
                Decimal("800.00") * Decimal(str(days))
                if data.with_driver
                else Decimal("0.00")
            )
            subtotal = base_amount + driver_fee

            # 4. Validate and apply coupon
            coupon_discount = Decimal("0.00")
            applied_coupon = None
            if data.coupon_code:
                valid, discount, msg, offer = self.offer_service.validate_coupon(
                    code=data.coupon_code, amount=subtotal, car=car
                )
                if not valid:
                    raise AppException(f"Coupon validation failed: {msg}", status_code=400)
                coupon_discount = discount
                applied_coupon = offer
                self.offer_repo.increment_uses(offer.id)

            # 5. Handle wallet deduction atomically
            wallet_deduction = Decimal("0.00")
            wallet_payment = data.payment_method == "wallet"
            if data.use_wallet or wallet_payment:
                wallet = self.wallet_repo.get_for_update(user.id)
                amount_after_coupon = max(Decimal("0.00"), subtotal - coupon_discount)
                amount_to_wallet = amount_after_coupon + car.security_deposit if wallet_payment else amount_after_coupon
                if wallet_payment and wallet.balance < amount_to_wallet:
                    raise InsufficientWalletBalanceException(
                        available=float(wallet.balance), required=float(amount_to_wallet)
                    )
                wallet_deduction = amount_to_wallet if wallet_payment else min(wallet.balance, amount_after_coupon)
                if wallet_deduction > 0:
                    wallet.balance -= wallet_deduction
                    txn = self.wallet_repo.create(
                        None  # Handled below
                    ) if False else None
                    # Create ledger transaction
                    from app.models.wallet import WalletTransaction, WalletTransactionType

                    txn = WalletTransaction(
                        wallet_id=wallet.id,
                        type=WalletTransactionType.DEBIT,
                        amount=wallet_deduction,
                        balance_after=wallet.balance,
                        label=f"Booking {booking_id}",
                        booking_id=booking_id,
                    )
                    self.db.add(txn)

            deposit = car.security_deposit
            final_amount = max(Decimal("0.00"), subtotal - coupon_discount - wallet_deduction) + deposit

            # 6. Create booking record
            pickup_loc = data.pickup_location.strip()
            drop_loc = (data.drop_location or data.pickup_location).strip()

            booking = Booking(
                id=booking_id,
                user_id=user.id,
                car_id=car.id,
                pickup_location_name=pickup_loc,
                drop_location_name=drop_loc,
                pickup_date=data.pickup_date,
                return_date=resolved_return_date,
                pickup_time=data.pickup_time or "10:00",
                return_time=data.return_time or "10:00",
                duration_type=data.duration_type or "daily",
                duration_value=days,
                with_driver=data.with_driver,
                driver_fee=driver_fee,
                base_amount=base_amount,
                discount_amount=coupon_discount,
                wallet_amount=wallet_deduction,
                security_deposit=deposit,
                final_amount=final_amount,
                payment_method=data.payment_method,
                payment_status=PaymentStatus.COMPLETED,
                status=BookingStatus.CONFIRMED,
                coupon_code=applied_coupon.code if applied_coupon else None,
            )
            self.db.add(booking)
            self.db.flush()

            # 7. Create price breakdown record
            breakdown = BookingPriceBreakdown(
                booking_id=booking.id,
                unit_price=unit_price,
                duration_units=days,
                subtotal=subtotal,
                driver_charge=driver_fee,
                coupon_discount=coupon_discount,
                wallet_deduction=wallet_deduction,
                deposit_charge=deposit,
                total_payable=final_amount,
                details_json=json.dumps({
                    "car_name": car.name,
                    "pickup_date": str(data.pickup_date),
                    "return_date": str(resolved_return_date),
                    "coupon": applied_coupon.code if applied_coupon else None,
                }),
            )
            self.db.add(breakdown)

            # 8. Create payment record
            payment = Payment(
                booking_id=booking.id,
                user_id=user.id,
                amount=wallet_deduction if wallet_payment else final_amount,
                payment_method=data.payment_method,
                transaction_reference=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                status="successful",
            )
            self.db.add(payment)

            self.db.commit()
            return self.get_booking_by_id(booking.id)

        except Exception as e:
            self.db.rollback()
            raise e

    def get_booking_by_id(self, booking_id: str) -> BookingResponse:
        booking = self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise EntityNotFoundException("Booking", booking_id)
        return booking_to_schema(booking)

    def list_user_bookings(self, user_id: str) -> List[BookingResponse]:
        bookings = self.booking_repo.list_by_user(user_id)
        return [booking_to_schema(b) for b in bookings]

    def list_all_bookings(
        self,
        status: Optional[str] = None,
        car_id: Optional[str] = None,
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[BookingResponse], int]:
        bookings, total = self.booking_repo.list_all(
            status=status, car_id=car_id, user_id=user_id, skip=skip, limit=limit
        )
        return [booking_to_schema(b) for b in bookings], total

    def list_admin_bookings(
        self,
        status: Optional[str] = None,
        car_id: Optional[str] = None,
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AdminBookingResponse], int]:
        bookings, total = self.booking_repo.list_all(
            status=status, car_id=car_id, user_id=user_id, skip=skip, limit=limit
        )
        return [admin_booking_to_schema(b) for b in bookings], total

    def get_admin_booking_by_id(self, booking_id: str) -> AdminBookingResponse:
        booking = self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise EntityNotFoundException("Booking", booking_id)
        return admin_booking_to_schema(booking)


    def cancel_booking(self, booking_id: str, user_id: Optional[str] = None) -> BookingResponse:
        booking = self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise EntityNotFoundException("Booking", booking_id)

        if user_id and booking.user_id != user_id:
            raise AppException("You can only cancel your own bookings", status_code=403)

        if booking.status == BookingStatus.CANCELLED:
            raise AppException("This booking has already been cancelled", status_code=400)

        if booking.status == BookingStatus.COMPLETED:
            raise AppException("Completed bookings cannot be cancelled", status_code=400)

        try:
            # Cancellation Policy:
            # 1. Refund wallet deduction back to user wallet ledger
            if booking.wallet_amount > 0:
                self.wallet_repo.credit(
                    user_id=booking.user_id,
                    amount=booking.wallet_amount,
                    label=f"Refund - {booking.id} (Wallet balance)",
                    booking_id=booking.id,
                )

            # 2. Refund security deposit to wallet as credit
            if booking.security_deposit > 0:
                self.wallet_repo.credit(
                    user_id=booking.user_id,
                    amount=booking.security_deposit,
                    label=f"Security Deposit Refund - {booking.id}",
                    booking_id=booking.id,
                )

            # 3. Update booking status
            booking.status = BookingStatus.CANCELLED
            booking.payment_status = PaymentStatus.REFUNDED
            self.db.commit()

            return self.get_booking_by_id(booking.id)

        except Exception as e:
            self.db.rollback()
            raise e

    def get_tracking(self, booking_id: str) -> BookingTrackingResponse:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise EntityNotFoundException("Booking", booking_id)

        stage_names = ["Confirmed", "Pickup Ready", "Active", "Returned"]
        status_map = {
            BookingStatus.CONFIRMED: 0,
            BookingStatus.ACTIVE: 2,
            BookingStatus.COMPLETED: 3,
            BookingStatus.CANCELLED: -1,
        }

        current_idx = status_map.get(booking.status, 0)
        stages = []
        for i, name in enumerate(stage_names):
            stages.append(
                TrackingStage(
                    name=name,
                    completed=i <= current_idx if current_idx >= 0 else False,
                    current=i == current_idx if current_idx >= 0 else False,
                )
            )

        return BookingTrackingResponse(
            booking_id=booking.id,
            status=booking.status,
            current_stage_index=current_idx,
            stages=stages,
        )

    def delete_booking(self, booking_id: str, user_id: Optional[str] = None) -> None:
        """Remove a booking from database."""
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise EntityNotFoundException("Booking", booking_id)

        if user_id and booking.user_id != user_id:
            raise AppException("You can only delete your own bookings", status_code=403)

        self.booking_repo.delete(booking)
