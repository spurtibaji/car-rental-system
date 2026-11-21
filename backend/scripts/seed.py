import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole, KYCStatus, UserStatus
from app.models.car import Car, CarFeature
from app.models.location import Location
from app.models.offer import Offer
from app.models.booking import Booking, BookingPriceBreakdown, BookingStatus, PaymentStatus
from app.models.payment import Payment
from app.models.wallet import WalletAccount, WalletTransaction, WalletTransactionType
from app.models.maintenance import MaintenanceRecord, MaintenanceType, MaintenanceStatus
from app.models.review import Review
from app.core.logging import logger


def seed_database():
    logger.info("Dropping existing tables and creating fresh schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.role == UserRole.ADMIN).first():
            logger.info("Database already contains seed data. Skipping...")
            return

        logger.info("Seeding Locations...")
        locations_data = [
            ("Mumbai Airport, T1", "Mumbai"),
            ("Mumbai Airport, T2", "Mumbai"),
            ("Bandra, Mumbai", "Mumbai"),
            ("Andheri West, Mumbai", "Mumbai"),
            ("Juhu, Mumbai", "Mumbai"),
            ("Thane, Mumbai", "Mumbai"),
            ("Pune Airport", "Pune"),
            ("Koregaon Park, Pune", "Pune"),
            ("Hinjewadi, Pune", "Pune"),
            ("Nashik Road", "Nashik"),
            ("Nagpur Airport", "Nagpur"),
            ("Aurangabad", "Aurangabad"),
            ("Bandra Kurla Complex (BKC), Mumbai", "Mumbai"),
            ("Andheri East, Mumbai", "Mumbai"),
            ("Powai, Mumbai", "Mumbai"),
            ("Lower Parel, Mumbai", "Mumbai"),
            ("Dadar / Prabhadevi, Mumbai", "Mumbai"),
            ("Colaba / Marine Drive, Mumbai", "Mumbai"),
            ("Borivali West, Mumbai", "Mumbai"),
            ("Malad West, Mumbai", "Mumbai"),
            ("Chembur, Mumbai", "Mumbai"),
            ("Navi Mumbai - Vashi", "Navi Mumbai"),
            ("Navi Mumbai - Belapur", "Navi Mumbai"),
            ("Navi Mumbai - Kharghar", "Navi Mumbai"),
            ("Panvel Hub", "Navi Mumbai"),
            ("Baner / Balewadi, Pune", "Pune"),
            ("Wakad, Pune", "Pune"),
            ("Viman Nagar, Pune", "Pune"),
            ("Shivaji Nagar, Pune", "Pune"),
            ("Kothrud, Pune", "Pune"),
            ("Magarpatta City, Pune", "Pune"),
            ("Aundh, Pune", "Pune"),
            ("Pune Railway Station", "Pune"),
            ("Nashik City Center", "Nashik"),
            ("Nagpur Sitabuldi", "Nagpur"),
            ("Chhatrapati Sambhajinagar (CIDCO)", "Aurangabad"),
            ("Kolhapur Central", "Kolhapur"),
            ("Shirdi Temple & Airport Hub", "Shirdi"),
            ("Lonavala Center", "Lonavala"),
            ("Mahabaleshwar Hub", "Mahabaleshwar"),
            ("Alibaug Mandwa Jetty", "Alibaug"),
            ("Goa Dabolim Airport", "Goa"),
            ("Goa MOPA Airport", "Goa"),
            ("Panaji City Center, Goa", "Goa"),
        ]
        for name, city in locations_data:
            loc = Location(name=name, city=city, is_active=True)
            db.add(loc)
        db.commit()

        logger.info("Seeding Admin and Customers...")
        # 1 Admin User
        admin_user = User(
            id="admin-001",
            name="DriveNow Admin",
            email="admin@drivenow.com",
            phone="+91 99999 88888",
            password_hash=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            kyc_status=KYCStatus.VERIFIED,
            status=UserStatus.ACTIVE,
            profile_complete=True,
        )
        db.add(admin_user)

        # 6 Customers matching mockData.ts
        customers_data = [
            ("c-001", "Rahul Sharma", "rahul@email.com", "+91 98765 43210", "verified", "active", "1995-06-15", "42, Shivaji Nagar, Pune - 411005", "MH01 2019 1234567", 2500.0),
            ("c-002", "Priya Patel", "priya@email.com", "+91 87654 32109", "verified", "active", "1997-03-22", "Flat 302, Green Glen, Mumbai", "MH02 2020 9876543", 1500.0),
            ("c-003", "Amit Kumar", "amit@email.com", "+91 76543 21098", "pending", "active", "1992-11-10", "12, MG Road, Pune", "MH12 2018 5544332", 500.0),
            ("c-004", "Sneha Joshi", "sneha@email.com", "+91 65432 10987", "pending", "active", "1998-08-01", "7, Model Colony, Pune", "MH14 2021 7788990", 0.0),
            ("c-005", "Vikram Singh", "vikram@email.com", "+91 54321 09876", "verified", "active", "1988-02-28", "Plot 88, Viman Nagar, Pune", "MH01 2015 1122334", 4200.0),
            ("c-006", "Ananya Reddy", "ananya@email.com", "+91 43210 98765", "rejected", "suspended", "2000-09-12", "55, Baner Road, Pune", "MH12 2023 9988776", 0.0),
        ]

        for cid, name, email, phone, kyc, status, dob, addr, lic, wallet_bal in customers_data:
            dob_val = datetime.strptime(dob, "%Y-%m-%d").date()
            user = User(
                id=cid,
                name=name,
                email=email,
                phone=phone,
                password_hash=hash_password("Password@123"),
                role=UserRole.CUSTOMER,
                kyc_status=kyc,
                status=status,
                date_of_birth=dob_val,
                address=addr,
                licence_number=lic,
                profile_complete=True,
            )
            db.add(user)
            db.flush()

            # Create wallet and initial balance
            wallet = WalletAccount(user_id=user.id, balance=Decimal(str(wallet_bal)))
            db.add(wallet)
            db.flush()

            if wallet_bal > 0:
                txn = WalletTransaction(
                    wallet_id=wallet.id,
                    type=WalletTransactionType.CREDIT,
                    amount=Decimal(str(wallet_bal)),
                    balance_after=Decimal(str(wallet_bal)),
                    label="Welcome Bonus & Top-up via UPI",
                )
                db.add(txn)

        db.commit()

        logger.info("Seeding Offers...")
        offers_data = [
            ("off-1", "FIRSTRIDE", "First Ride Special", "25% off on your first booking", 25, "percent", 1000, "2026-12-31", None, "#e8291e"),
            ("off-2", "WEEKEND50", "Weekend Getaway", "Flat ₹500 off on weekend bookings", 500, "flat", 2000, "2026-10-31", None, "#f59e0b"),
            ("off-3", "ELECTRIC20", "Go Green Deal", "20% off on all Electric cars", 20, "percent", 1500, "2026-11-30", "Electric", "#10b981"),
            ("off-4", "LUXURY15", "Luxury Experience", "15% off on Luxury segment cars", 15, "percent", 5000, "2026-10-15", "Luxury", "#8b5cf6"),
            ("off-5", "DIWALI30", "Diwali Offer", "30% off — Festive Season Special", 30, "percent", 2500, "2026-10-25", None, "#f59e0b"),
        ]
        for oid, code, title, desc, disc, typ, min_amt, val_till, cat, color in offers_data:
            off = Offer(
                id=oid,
                code=code,
                title=title,
                description=desc,
                discount=Decimal(str(disc)),
                type=typ,
                min_amount=Decimal(str(min_amt)),
                valid_till=datetime.strptime(val_till, "%Y-%m-%d").date(),
                category=cat,
                color=color,
                max_uses=1000,
                current_uses=0,
                is_active=True,
            )
            db.add(off)
        db.commit()

        logger.info("Seeding Cars with Features and Images...")
        cars_data = [
            {
                "id": "swift-1",
                "name": "Maruti Swift",
                "brand": "Maruti",
                "model": "Swift",
                "year": 2023,
                "category": "Hatchback",
                "price": (250, 1800, 10500),
                "seats": 5,
                "fuel": "Petrol",
                "transmission": "Manual",
                "mileage": 23,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg/1280px-Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg/1280px-Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg",
                ],
                "available": True,
                "rating": 4.5,
                "reviews": 128,
                "features": ["AC", "Music System", "Power Windows", "Central Locking", "Airbags"],
                "color": "Solid Red",
                "engineCC": 1197,
                "topSpeed": 170,
                "deposit": 5000,
                "popular": True,
            },
            {
                "id": "i20-1",
                "name": "Hyundai i20",
                "brand": "Hyundai",
                "model": "i20",
                "year": 2023,
                "category": "Hatchback",
                "price": (280, 2000, 12000),
                "seats": 5,
                "fuel": "Petrol",
                "transmission": "Automatic",
                "mileage": 20,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Hyundai_i20_%28III%2C_Facelift%29_%E2%80%93_f_11102025.jpg/1280px-Hyundai_i20_%28III%2C_Facelift%29_%E2%80%93_f_11102025.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Hyundai_i20_%28III%2C_Facelift%29_%E2%80%93_f_11102025.jpg/1280px-Hyundai_i20_%28III%2C_Facelift%29_%E2%80%93_f_11102025.jpg",
                ],
                "available": True,
                "rating": 4.6,
                "reviews": 95,
                "features": ["AC", "Sunroof", "Reverse Camera", "Apple CarPlay", "Android Auto"],
                "color": "Polar White",
                "engineCC": 1197,
                "topSpeed": 172,
                "deposit": 5000,
                "popular": False,
            },
            {
                "id": "city-1",
                "name": "Honda City",
                "brand": "Honda",
                "model": "City",
                "year": 2023,
                "category": "Sedan",
                "price": (350, 2500, 15000),
                "seats": 5,
                "fuel": "Petrol",
                "transmission": "Automatic",
                "mileage": 18,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg/1280px-Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg/1280px-Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg",
                ],
                "available": True,
                "rating": 4.7,
                "reviews": 203,
                "features": ["AC", "Lane Watch", "Sunroof", "Wireless Charging", "Honda Sensing"],
                "color": "Lunar Silver",
                "engineCC": 1498,
                "topSpeed": 195,
                "deposit": 7000,
                "popular": True,
            },
            {
                "id": "dzire-1",
                "name": "Maruti Dzire",
                "brand": "Maruti",
                "model": "Dzire",
                "year": 2023,
                "category": "Sedan",
                "price": (300, 2200, 13000),
                "seats": 5,
                "fuel": "Petrol",
                "transmission": "Manual",
                "mileage": 24,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Suzuki_Dzire_II_1.2_GLX_Hybrid_Arctic_White_Pearl.jpg/1280px-Suzuki_Dzire_II_1.2_GLX_Hybrid_Arctic_White_Pearl.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Suzuki_Dzire_II_1.2_GLX_Hybrid_Arctic_White_Pearl.jpg/1280px-Suzuki_Dzire_II_1.2_GLX_Hybrid_Arctic_White_Pearl.jpg",
                ],
                "available": True,
                "rating": 4.4,
                "reviews": 167,
                "features": ["AC", "Music System", "Power Steering", "ABS", "EBD"],
                "color": "Magma Grey",
                "engineCC": 1197,
                "topSpeed": 180,
                "deposit": 6000,
                "popular": False,
            },
            {
                "id": "creta-1",
                "name": "Hyundai Creta",
                "brand": "Hyundai",
                "model": "Creta",
                "year": 2024,
                "category": "SUV",
                "price": (500, 3500, 21000),
                "seats": 5,
                "fuel": "Diesel",
                "transmission": "Automatic",
                "mileage": 17,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png/1280px-2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png/1280px-2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png",
                ],
                "available": True,
                "rating": 4.8,
                "reviews": 312,
                "features": ["Panoramic Sunroof", "360 Camera", "ADAS", "Ventilated Seats", "Bose Sound"],
                "color": "Abyss Black",
                "engineCC": 1493,
                "topSpeed": 185,
                "deposit": 10000,
                "popular": True,
            },
            {
                "id": "scorpio-1",
                "name": "Mahindra Scorpio-N",
                "brand": "Mahindra",
                "model": "Scorpio-N",
                "year": 2023,
                "category": "SUV",
                "price": (550, 3800, 23000),
                "seats": 6,
                "fuel": "Diesel",
                "transmission": "Automatic",
                "mileage": 15,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Mahindra_Scorpio_GLX_2.6_m-Hawk_2011_%2836756517492%29.jpg/1280px-Mahindra_Scorpio_GLX_2.6_m-Hawk_2011_%2836756517492%29.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Mahindra_Scorpio_GLX_2.6_m-Hawk_2011_%2836756517492%29.jpg/1280px-Mahindra_Scorpio_GLX_2.6_m-Hawk_2011_%2836756517492%29.jpg",
                ],
                "available": False,
                "rating": 4.6,
                "reviews": 189,
                "features": ["4WD", "Terrain Modes", "Sony Sound", "Wireless Charging", "Sunroof"],
                "color": "Deep Forest",
                "engineCC": 2184,
                "topSpeed": 195,
                "deposit": 12000,
                "popular": True,
            },
            {
                "id": "bmw5-1",
                "name": "BMW 5 Series",
                "brand": "BMW",
                "model": "530i",
                "year": 2024,
                "category": "Luxury",
                "price": (1500, 9500, 55000),
                "seats": 5,
                "fuel": "Petrol",
                "transmission": "Automatic",
                "mileage": 13,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/BMW_G60_520i_1X7A2443.jpg/1280px-BMW_G60_520i_1X7A2443.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/BMW_G60_520i_1X7A2443.jpg/1280px-BMW_G60_520i_1X7A2443.jpg",
                ],
                "available": True,
                "rating": 4.9,
                "reviews": 74,
                "features": ["iDrive 8", "Massage Seats", "Harman Kardon", "Gesture Control", "Heads-Up Display"],
                "color": "Mineral White",
                "engineCC": 1998,
                "topSpeed": 250,
                "deposit": 30000,
                "popular": True,
            },
            {
                "id": "merc-1",
                "name": "Mercedes E-Class",
                "brand": "Mercedes",
                "model": "E350",
                "year": 2024,
                "category": "Luxury",
                "price": (1800, 11000, 65000),
                "seats": 5,
                "fuel": "Petrol",
                "transmission": "Automatic",
                "mileage": 12,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Mercedes-Benz_W214_1X7A1841.jpg/1280px-Mercedes-Benz_W214_1X7A1841.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Mercedes-Benz_W214_1X7A1841.jpg/1280px-Mercedes-Benz_W214_1X7A1841.jpg",
                ],
                "available": True,
                "rating": 4.9,
                "reviews": 61,
                "features": ["MBUX Infotainment", "Burmester Sound", "Air Suspension", "Driver Assist", "Ambient Lighting"],
                "color": "Obsidian Black",
                "engineCC": 1991,
                "topSpeed": 250,
                "deposit": 35000,
                "popular": False,
            },
            {
                "id": "nexon-ev-1",
                "name": "Tata Nexon EV",
                "brand": "Tata",
                "model": "Nexon EV Max",
                "year": 2024,
                "category": "Electric",
                "price": (400, 2800, 16000),
                "seats": 5,
                "fuel": "Electric",
                "transmission": "Automatic",
                "mileage": 0,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Tata_Nexon_Blue_Dual_Tone.jpg/1280px-Tata_Nexon_Blue_Dual_Tone.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Tata_Nexon_Blue_Dual_Tone.jpg/1280px-Tata_Nexon_Blue_Dual_Tone.jpg",
                ],
                "available": True,
                "rating": 4.7,
                "reviews": 143,
                "features": ["440km Range", "Fast Charging", "ADAS", "Connected Tech", "JBL Sound"],
                "color": "Pristine White",
                "engineCC": 0,
                "topSpeed": 150,
                "deposit": 8000,
                "popular": True,
            },
            {
                "id": "mg-ev-1",
                "name": "MG ZS EV",
                "brand": "MG",
                "model": "ZS EV Exclusive",
                "year": 2024,
                "category": "Electric",
                "price": (450, 3200, 19000),
                "seats": 5,
                "fuel": "Electric",
                "transmission": "Automatic",
                "mileage": 0,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/MG_ZS_%28crossover%2C_second_generation%29_DSC_8542.jpg/1280px-MG_ZS_%28crossover%2C_second_generation%29_DSC_8542.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/MG_ZS_%28crossover%2C_second_generation%29_DSC_8542.jpg/1280px-MG_ZS_%28crossover%2C_second_generation%29_DSC_8542.jpg",
                ],
                "available": True,
                "rating": 4.6,
                "reviews": 89,
                "features": ["461km Range", "Level 2 ADAS", "Panoramic Roof", "MG i-SMART", "PM 2.5 Filter"],
                "color": "Camden Grey",
                "engineCC": 0,
                "topSpeed": 175,
                "deposit": 9000,
                "popular": False,
            },
            {
                "id": "innova-1",
                "name": "Toyota Innova",
                "brand": "Toyota",
                "model": "Innova Crysta",
                "year": 2023,
                "category": "7-Seater",
                "price": (600, 4200, 25000),
                "seats": 7,
                "fuel": "Diesel",
                "transmission": "Manual",
                "mileage": 15,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Toyota_Innova_Zenix_2.0_V_%28III%29_%E2%80%93_f_22032025.jpg/1280px-Toyota_Innova_Zenix_2.0_V_%28III%29_%E2%80%93_f_22032025.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Toyota_Innova_Zenix_2.0_V_%28III%29_%E2%80%93_f_22032025.jpg/1280px-Toyota_Innova_Zenix_2.0_V_%28III%29_%E2%80%93_f_22032025.jpg",
                ],
                "available": True,
                "rating": 4.8,
                "reviews": 241,
                "features": ["Captain Seats", "Rear AC", "Toyota Safety Sense", "USB Ports All Rows", "Trunk Space"],
                "color": "Platinum White Pearl",
                "engineCC": 2393,
                "topSpeed": 185,
                "deposit": 12000,
                "popular": True,
            },
            {
                "id": "ertiga-1",
                "name": "Maruti Ertiga",
                "brand": "Maruti",
                "model": "Ertiga ZXI+",
                "year": 2023,
                "category": "7-Seater",
                "price": (420, 3000, 18000),
                "seats": 7,
                "fuel": "Petrol",
                "transmission": "Automatic",
                "mileage": 19,
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg/1280px-Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg",
                "images": [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg/1280px-Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg",
                ],
                "available": True,
                "rating": 4.5,
                "reviews": 178,
                "features": ["Smart Play Pro+", "Rear Seat Entertainment", "Auto Gear Shift", "Cruise Control", "ABS+EBD"],
                "color": "Brave Khaki",
                "engineCC": 1462,
                "topSpeed": 175,
                "deposit": 8000,
                "popular": False,
            },
        ]

        for c_data in cars_data:
            car = Car(
                id=c_data["id"],
                name=c_data["name"],
                brand=c_data["brand"],
                model=c_data["model"],
                year=c_data["year"],
                category=c_data["category"],
                hourly_price=Decimal(str(c_data["price"][0])),
                daily_price=Decimal(str(c_data["price"][1])),
                weekly_price=Decimal(str(c_data["price"][2])),
                seats=c_data["seats"],
                fuel=c_data["fuel"],
                transmission=c_data["transmission"],
                mileage=Decimal(str(c_data["mileage"])),
                image=c_data["image"],
                available=c_data["available"],
                rating=Decimal(str(c_data["rating"])),
                review_count=c_data["reviews"],
                color=c_data["color"],
                engine_cc=c_data["engineCC"],
                top_speed=c_data["topSpeed"],
                security_deposit=Decimal(str(c_data["deposit"])),
                popular=c_data["popular"],
            )
            db.add(car)
            db.flush()

            for feat in c_data["features"]:
                db.add(CarFeature(car_id=car.id, feature=feat))

        db.commit()

        logger.info("Seeding Maintenance Records...")
        maint_data = [
            ("m-001", "creta-1", "Hyundai Creta", "scheduled", "Oil change + filter replacement", 3500, "2026-08-15", "completed"),
            ("m-002", "scorpio-1", "Mahindra Scorpio-N", "damage", "Minor dent on rear bumper", 8000, "2026-09-01", "in-progress"),
            ("m-003", "bmw5-1", "BMW 5 Series", "scheduled", "Annual servicing", 25000, "2026-09-10", "pending"),
            ("m-004", "swift-1", "Maruti Swift", "repair", "AC compressor replacement", 12000, "2026-08-28", "completed"),
        ]
        for mid, cid, cname, typ, desc, cost, dt, stat in maint_data:
            rec = MaintenanceRecord(
                id=mid,
                car_id=cid,
                car_name=cname,
                type=typ,
                description=desc,
                cost=Decimal(str(cost)),
                date=datetime.strptime(dt, "%Y-%m-%d").date(),
                status=stat,
            )
            db.add(rec)
        db.commit()

        logger.info("Seeding Bookings...")
        bookings_data = [
            {
                "id": "bk-001",
                "user_id": "c-001",
                "car_id": "creta-1",
                "pickup_loc": "Mumbai Airport, T2",
                "drop_loc": "Pune, Hinjewadi",
                "pickup_date": "2026-09-10",
                "return_date": "2026-09-12",
                "pickup_time": "10:00",
                "duration_value": 2,
                "amount": 7000,
                "status": "active",
                "with_driver": True,
                "coupon": "WEEKEND50",
                "discount": 500,
            },
            {
                "id": "bk-002",
                "user_id": "c-001",
                "car_id": "city-1",
                "pickup_loc": "Bandra, Mumbai",
                "drop_loc": "Bandra, Mumbai",
                "pickup_date": "2026-08-20",
                "return_date": "2026-08-22",
                "pickup_time": "09:00",
                "duration_value": 2,
                "amount": 5000,
                "status": "completed",
                "with_driver": False,
                "coupon": None,
                "discount": 0,
            },
            {
                "id": "bk-003",
                "user_id": "c-001",
                "car_id": "bmw5-1",
                "pickup_loc": "Juhu, Mumbai",
                "drop_loc": "Juhu, Mumbai",
                "pickup_date": "2026-07-15",
                "return_date": "2026-07-16",
                "pickup_time": "18:00",
                "duration_value": 1,
                "amount": 9500,
                "status": "completed",
                "with_driver": True,
                "coupon": "LUXURY15",
                "discount": 1425,
            },
            {
                "id": "bk-004",
                "user_id": "c-001",
                "car_id": "nexon-ev-1",
                "pickup_loc": "Andheri West, Mumbai",
                "drop_loc": "Andheri West, Mumbai",
                "pickup_date": "2026-09-20",
                "return_date": "2026-09-27",
                "pickup_time": "08:00",
                "duration_value": 7,
                "amount": 16000,
                "status": "confirmed",
                "with_driver": False,
                "coupon": "ELECTRIC20",
                "discount": 3200,
            },
        ]

        for b in bookings_data:
            booking = Booking(
                id=b["id"],
                user_id=b["user_id"],
                car_id=b["car_id"],
                pickup_location_name=b["pickup_loc"],
                drop_location_name=b["drop_loc"],
                pickup_date=datetime.strptime(b["pickup_date"], "%Y-%m-%d").date(),
                return_date=datetime.strptime(b["return_date"], "%Y-%m-%d").date(),
                pickup_time=b["pickup_time"],
                return_time="10:00",
                duration_value=b["duration_value"],
                with_driver=b["with_driver"],
                driver_fee=Decimal("800.00") if b["with_driver"] else Decimal("0.00"),
                base_amount=Decimal(str(b["amount"])),
                discount_amount=Decimal(str(b["discount"])),
                wallet_amount=Decimal("0.00"),
                security_deposit=Decimal("5000.00"),
                final_amount=Decimal(str(b["amount"])),
                payment_method="upi",
                payment_status=PaymentStatus.COMPLETED,
                status=b["status"],
                coupon_code=b["coupon"],
            )
            db.add(booking)
            db.flush()

            # Breakdown
            breakdown = BookingPriceBreakdown(
                booking_id=booking.id,
                unit_price=Decimal(str(b["amount"])) / Decimal(str(b["duration_value"])),
                duration_units=b["duration_value"],
                subtotal=Decimal(str(b["amount"])),
                driver_charge=Decimal("800.00") if b["with_driver"] else Decimal("0.00"),
                coupon_discount=Decimal(str(b["discount"])),
                wallet_deduction=Decimal("0.00"),
                deposit_charge=Decimal("5000.00"),
                total_payable=Decimal(str(b["amount"])) + Decimal("5000.00"),
            )
            db.add(breakdown)

            # Payment
            pmt = Payment(
                booking_id=booking.id,
                user_id=b["user_id"],
                amount=Decimal(str(b["amount"])),
                payment_method="upi",
                transaction_reference=f"TXN-SEED-{b['id']}",
                status="successful",
            )
            db.add(pmt)

        logger.info("Seeding Reviews...")
        review_1 = Review(
            id="rev-001",
            car_id="city-1",
            user_id="c-001",
            booking_id="bk-002",
            rating=5,
            comment="The Honda City was super smooth, spotless, and fuel efficient. Pickup at Bandra was prompt!",
            created_at=datetime(2026, 8, 23, 11, 30, 0, tzinfo=timezone.utc),
        )
        db.add(review_1)

        db.commit()
        logger.info("Successfully seeded all database tables with production-grade mock data!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
