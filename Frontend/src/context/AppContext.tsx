import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Car } from '../data/cars';
import type { Booking, Offer } from '../data/mockData';
import { locations as defaultLocations } from '../data/mockData';
import { authApi, profileApi, walletApi, bookingsApi, carsApi, locationsApi, offersApi, getToken, removeToken } from '../services/api';

export interface CartItem {
  car: Car;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  durationType?: 'hourly' | 'daily' | 'weekly';
  durationValue: number;
  withDriver: boolean;
  couponCode: string;
  discount: number;
  totalAmount: number;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  kycStatus: 'not_uploaded' | 'pending' | 'verified' | 'rejected';
  licenceNumber: string;
  address: string;
  dob: string;
  profileComplete: boolean;
  role?: string;
}

interface AppContextType {
  cart: CartItem | null;
  setCart: (item: CartItem | null) => void;
  addToCart: (car: Car, options?: Partial<CartItem>) => void;
  cars: Car[];
  locations: string[];
  offers: Offer[];
  bookings: Booking[];
  addBooking: (b: any) => Promise<any>;
  cancelBooking: (id: string) => Promise<void>;
  removeBooking: (id: string) => Promise<void>;
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (userData: { name: string; email: string; phone: string; password: string }) => Promise<any>;
  logout: () => void;
  saveProfile: (data: Partial<User>) => Promise<void>;
  handleAddMoney: (amount: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshCars: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshAll: () => Promise<void>;
  isLoadingCars: boolean;
  isLoadingBookings: boolean;
  isLoadingUser: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
  isBackendConnected: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const CART_STORAGE_KEY = 'drivenow_customer_cart';

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize cart from localStorage if available
  const [cart, setCartState] = useState<CartItem | null>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setCart = useCallback((item: CartItem | null) => {
    setCartState(item);
    try {
      if (item) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(item));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not persist cart to localStorage', e);
    }
  }, []);

  const [cars, setCars] = useState<Car[]>([]);
  const [locations, setLocations] = useState<string[]>(defaultLocations);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('details');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoadingUser(false);
      return;
    }

    try {
      const me = await authApi.getMe();
      if (me) {
        setUser({
          id: me.id,
          name: me.name || '',
          email: me.email || '',
          phone: me.phone || '',
          walletBalance: Number(me.wallet_balance ?? 0),
          kycStatus: me.kyc_status || 'not_uploaded',
          licenceNumber: me.licence_number || '',
          address: me.address || '',
          dob: me.date_of_birth ? String(me.date_of_birth) : '',
          profileComplete: me.profile_complete ?? true,
          role: me.role,
        });
        setIsBackendConnected(true);
      }
    } catch (err: any) {
      console.warn('Could not refresh customer user from backend:', err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('token required')) {
        removeToken();
        setUser(null);
      }
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setBookings([]);
      return;
    }
    setIsLoadingBookings(true);
    try {
      const serverBookings = await bookingsApi.list();
      if (Array.isArray(serverBookings)) {
        setBookings(serverBookings as Booking[]);
        setIsBackendConnected(true);
      }
    } catch (err) {
      console.warn('Could not refresh bookings from backend:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  const refreshCars = useCallback(async () => {
    setIsLoadingCars(true);
    try {
      const res = await carsApi.list();
      const carList = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(carList) && carList.length > 0) {
        setCars(carList as Car[]);
        setIsBackendConnected(true);
      }
    } catch (err) {
      console.warn('Could not refresh cars from backend, using fallback:', err);
    } finally {
      setIsLoadingCars(false);
    }
  }, []);

  const refreshLocations = useCallback(async () => {
    try {
      const res = await locationsApi.list();
      const locList = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(locList) && locList.length > 0) {
        setLocations(locList);
        setIsBackendConnected(true);
      } else if (defaultLocations && defaultLocations.length > 0) {
        setLocations(defaultLocations);
      }
    } catch (err) {
      console.warn('Could not refresh locations from backend:', err);
      if (defaultLocations && defaultLocations.length > 0) {
        setLocations(defaultLocations);
      }
    }
  }, []);

  const refreshOffers = useCallback(async () => {
    try {
      const res = await offersApi.list();
      const offerList = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(offerList) && offerList.length > 0) {
        setOffers(offerList as Offer[]);
        setIsBackendConnected(true);
      }
    } catch (err) {
      console.warn('Could not refresh offers from backend:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      refreshCars(),
      refreshLocations(),
      refreshOffers(),
      refreshUser(),
      refreshBookings(),
    ]);
  }, [refreshCars, refreshLocations, refreshOffers, refreshUser, refreshBookings]);

  // Initial load: Fetch public data (cars, locations, offers) and check for existing customer session
  useEffect(() => {
    async function init() {
      await Promise.allSettled([
        refreshCars(),
        refreshLocations(),
        refreshOffers(),
      ]);

      // Only check user if token exists in localStorage (no automatic demo login)
      const token = getToken();
      if (token) {
        await Promise.allSettled([
          refreshUser(),
          refreshBookings(),
        ]);
      } else {
        setIsLoadingUser(false);
      }
    }
    init();
  }, [refreshCars, refreshLocations, refreshOffers, refreshUser, refreshBookings]);

  // Login handler
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    await Promise.allSettled([refreshUser(), refreshBookings()]);
    return res;
  }, [refreshUser, refreshBookings]);

  // Signup handler
  const signup = useCallback(async (userData: { name: string; email: string; phone: string; password: string }) => {
    const res = await authApi.register(userData);
    await Promise.allSettled([refreshUser(), refreshBookings()]);
    return res;
  }, [refreshUser, refreshBookings]);

  // Logout handler
  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setBookings([]);
    setCart(null);
  }, [setCart]);

  // Quick helper to add any car to cart with start and end dates
  const addToCart = useCallback((car: Car, options?: Partial<CartItem>) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const pickupDate = options?.pickupDate || today;
    const returnDate = options?.returnDate || tomorrow;
    const defaultDrop = options?.dropLocation || options?.pickupLocation || 'Mumbai Airport, T2';
    
    // Calculate days between start date and end date
    const diffMs = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
    const daysFromDates = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const durationValue = options?.durationValue ?? daysFromDates;
    const dailyPrice = car.price?.daily || 2000;
    const basePrice = dailyPrice * durationValue;
    const withDriver = options?.withDriver ?? false;
    const calculatedTotal = basePrice + (withDriver ? 800 * durationValue : 0);

    const newItem: CartItem = {
      car,
      pickupLocation: options?.pickupLocation || 'Mumbai Airport, T2',
      dropLocation: defaultDrop,
      pickupDate,
      returnDate,
      pickupTime: options?.pickupTime || '10:00',
      returnTime: options?.returnTime || '10:00',
      durationValue,
      withDriver,
      couponCode: options?.couponCode || '',
      discount: options?.discount || 0,
      totalAmount: options?.totalAmount || calculatedTotal,
    };

    setCart(newItem);
  }, [setCart]);

  // Persist profile updates to backend & DB
  async function saveProfile(updated: Partial<User>) {
    if (user) {
      setUser(prev => prev ? ({ ...prev, ...updated }) : null);
    }

    try {
      const res = await profileApi.update({
        name: updated.name,
        phone: updated.phone,
        dob: updated.dob,
        address: updated.address,
        licenceNumber: updated.licenceNumber,
      });

      if (res) {
        setUser(prev => prev ? ({
          ...prev,
          ...updated,
          walletBalance: res.wallet_balance !== undefined ? Number(res.wallet_balance) : prev.walletBalance,
          kycStatus: res.kyc_status || prev.kycStatus,
        }) : null);
      }
      setIsBackendConnected(true);
    } catch (err) {
      console.error('Failed to persist profile to backend:', err);
      throw err;
    }
  }

  // Persist wallet top-up to backend & DB
  async function handleAddMoney(amount: number) {
    try {
      const wallet = await walletApi.topUp(amount);
      if (wallet && wallet.balance !== undefined) {
        setUser(prev => prev ? ({ ...prev, walletBalance: Number(wallet.balance) }) : null);
      } else {
        setUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance + amount }) : null);
      }
      setIsBackendConnected(true);
    } catch (err) {
      console.error('Failed to top up wallet on backend:', err);
      setUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance + amount }) : null);
    }
  }

  // Create booking on backend & DB
  async function addBooking(b: any) {
    try {
      const pickup_date = b.pickupDate || b.pickup_date;
      const return_date = b.returnDate || b.return_date || pickup_date;
      const diffMs = new Date(return_date).getTime() - new Date(pickup_date).getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      const payload = {
        car_id: b.carId || b.car_id,
        pickup_location: b.pickupLocation || b.pickup_location || 'Mumbai Airport, T2',
        drop_location: b.dropLocation || b.drop_location || b.pickupLocation || 'Mumbai Airport, T2',
        pickup_date,
        return_date,
        pickup_time: b.pickupTime || b.pickup_time || '10:00',
        return_time: b.returnTime || b.return_time || '10:00',
        duration_value: b.durationValue || b.duration_value || diffDays,
        with_driver: Boolean(b.withDriver ?? b.with_driver),
        coupon_code: b.couponApplied || b.coupon_code || undefined,
        use_wallet: Boolean(b.useWallet ?? b.use_wallet),
        payment_method: b.paymentMethod || b.payment_method || 'upi',
      };

      const created = await bookingsApi.create(payload as any);
      await Promise.all([refreshBookings(), refreshUser(), refreshCars()]);
      setIsBackendConnected(true);
      return created;
    } catch (err) {
      console.error('Backend booking creation failed:', err);
      throw err;
    }
  }

  // Cancel booking on backend & DB
  async function cancelBooking(id: string) {
    try {
      await bookingsApi.cancel(id);
      await Promise.all([refreshBookings(), refreshUser(), refreshCars()]);
      setIsBackendConnected(true);
    } catch (err) {
      console.error('Backend booking cancellation failed; applying locally:', err);
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'cancelled' as const } : b))
      );
    }
  }

  // Remove cancelled booking from backend & DB
  async function removeBooking(id: string) {
    try {
      await bookingsApi.delete(id);
      await Promise.all([refreshBookings(), refreshCars()]);
      setIsBackendConnected(true);
    } catch (err) {
      console.error('Backend booking deletion failed; applying locally:', err);
      setBookings(prev => prev.filter(b => b.id !== id));
    }
  }

  return (
    <AppContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        cars,
        locations,
        offers,
        bookings,
        addBooking,
        cancelBooking,
        removeBooking,
        user,
        isLoggedIn: Boolean(user && getToken()),
        login,
        signup,
        logout,
        saveProfile,
        handleAddMoney,
        refreshUser,
        refreshBookings,
        refreshCars,
        refreshLocations,
        refreshOffers,
        refreshAll,
        isLoadingCars,
        isLoadingBookings,
        isLoadingUser,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        activeTab,
        setActiveTab,
        isBackendConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
