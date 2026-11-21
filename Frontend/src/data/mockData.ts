export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: number;
  type: 'percent' | 'flat';
  minAmount: number;
  validTill: string;
  category?: string;
  color: string;
}

export interface Booking {
  id: string;
  carId: string;
  carName: string;
  carImage: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  durationType?: 'hourly' | 'daily' | 'weekly';
  durationValue: number;
  amount: number;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  withDriver: boolean;
  couponApplied?: string;
  discount?: number;
  createdAt: string;
  review?: {
    id: string;
    rating: number;
    comment: string;
    created_at?: string;
  } | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  kycStatus: 'verified' | 'pending' | 'rejected';
  status: 'active' | 'suspended';
}

export interface MaintenanceRecord {
  id: string;
  carId: string;
  carName: string;
  type: 'scheduled' | 'repair' | 'damage';
  description: string;
  cost: number;
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export const offers: Offer[] = [
  {
    id: 'off-1',
    code: 'FIRSTRIDE',
    title: 'First Ride Special',
    description: 'Get 25% off on your very first rental with DriveNow',
    discount: 25,
    type: 'percent',
    minAmount: 1000,
    validTill: '2026-12-31',
    color: '#e8291e',
  },
  {
    id: 'off-2',
    code: 'WEEKEND50',
    title: 'Weekend Getaway',
    description: 'Flat ₹500 off on weekend bookings above ₹2,000',
    discount: 500,
    type: 'flat',
    minAmount: 2000,
    validTill: '2026-10-31',
    color: '#f59e0b',
  },
  {
    id: 'off-3',
    code: 'LUXURY15',
    title: 'Luxury Segment Off',
    description: '15% instant discount on BMW & Mercedes-Benz rentals',
    discount: 15,
    type: 'percent',
    minAmount: 5000,
    validTill: '2026-11-30',
    category: 'Luxury',
    color: '#8b5cf6',
  },
  {
    id: 'off-4',
    code: 'ELECTRIC20',
    title: 'Go Green Discount',
    description: 'Flat 20% off on all Electric vehicle rentals',
    discount: 20,
    type: 'percent',
    minAmount: 1500,
    validTill: '2026-12-31',
    category: 'Electric',
    color: '#10b981',
  },
];

export const locations = [
  'Mumbai Airport, T1',
  'Mumbai Airport, T2',
  'Bandra, Mumbai',
  'Andheri West, Mumbai',
  'Juhu, Mumbai',
  'Thane, Mumbai',
  'Pune Airport',
  'Koregaon Park, Pune',
  'Hinjewadi, Pune',
  'Nashik Road',
  'Nagpur Airport',
  'Aurangabad',
  'Bandra Kurla Complex (BKC), Mumbai',
  'Andheri East, Mumbai',
  'Powai, Mumbai',
  'Lower Parel, Mumbai',
  'Dadar / Prabhadevi, Mumbai',
  'Colaba / Marine Drive, Mumbai',
  'Borivali West, Mumbai',
  'Malad West, Mumbai',
  'Chembur, Mumbai',
  'Navi Mumbai - Vashi',
  'Navi Mumbai - Belapur',
  'Navi Mumbai - Kharghar',
  'Panvel Hub',
  'Baner / Balewadi, Pune',
  'Wakad, Pune',
  'Viman Nagar, Pune',
  'Shivaji Nagar, Pune',
  'Kothrud, Pune',
  'Magarpatta City, Pune',
  'Aundh, Pune',
  'Pune Railway Station',
  'Nashik City Center',
  'Nagpur Sitabuldi',
  'Chhatrapati Sambhajinagar (CIDCO)',
  'Kolhapur Central',
  'Shirdi Temple & Airport Hub',
  'Lonavala Center',
  'Mahabaleshwar Hub',
  'Alibaug Mandwa Jetty',
  'Goa Dabolim Airport',
  'Goa MOPA Airport',
  'Panaji City Center, Goa',
];

export const adminStats = {
  totalRevenue: 2847500,
  monthlyRevenue: 312800,
  activeBookings: 23,
  totalCars: 12,
  availableCars: 9,
  totalCustomers: 6,
  pendingKYC: 2,
  revenueGrowth: 18.5,
};
