import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import ConfirmModal from '../components/ConfirmModal';
import LocationCombobox from '../components/LocationCombobox';

export default function Cart() {
  const {
    cart,
    setCart,
    addBooking,
    cancelBooking,
    bookings,
    refreshBookings,
    user,
    locations,
    offers,
    isLoadingBookings,
  } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'checkout' | 'booked'>(cart ? 'checkout' : 'booked');

  useEffect(() => {
    if (cart && activeTab !== 'checkout') {
      setActiveTab('checkout');
    }
  }, [cart]);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [step, setStep] = useState(1);
  const [hasUserEditedPickup, setHasUserEditedPickup] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(cart?.pickupLocation || locations[0] || 'Mumbai Airport, T2');
  const [dropLocation, setDropLocation] = useState(cart?.dropLocation || '');
  const [pickupDate, setPickupDate] = useState(cart?.pickupDate || todayStr);
  const [returnDate, setReturnDate] = useState(cart?.returnDate || tomorrowStr);
  const [pickupTime, setPickupTime] = useState(cart?.pickupTime || '10:00');
  const [returnTime, setReturnTime] = useState(cart?.returnTime || '10:00');
  const [coupon, setCoupon] = useState(cart?.couponCode || '');
  const [couponApplied, setCouponApplied] = useState<typeof offers[0] | null>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cash' | 'wallet'>('upi');
  const [useWallet, setUseWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [trackingId, setTrackingId] = useState<string | null>(null);

  // Synchronize state when cart changes
  useEffect(() => {
    if (cart) {
      if (cart.pickupLocation) setPickupLocation(cart.pickupLocation);
      if (cart.dropLocation) setDropLocation(cart.dropLocation);
      if (cart.pickupDate) setPickupDate(cart.pickupDate);
      if (cart.returnDate) setReturnDate(cart.returnDate);
    }
  }, [cart]);

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = useState<{ id: string; name: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleConfirmCancel() {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelBooking(bookingToCancel.id);
      await Promise.allSettled([refreshBookings()]);
      setBookingToCancel(null);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  }

  useEffect(() => {
    if (!pickupLocation && !hasUserEditedPickup && !cart?.pickupLocation && locations.length > 0) {
      setPickupLocation(locations[0]);
    }
  }, [locations, pickupLocation, hasUserEditedPickup, cart]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  // Calculate rental duration in days from start date to end date
  const diffMs = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
  const durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const dailyRate = cart?.car.price?.daily || 2000;
  const baseAmount = cart ? dailyRate * durationDays : 0;
  const driverFee = cart?.withDriver ? 800 * durationDays : 0;
  const couponDiscount = couponApplied
    ? couponApplied.type === 'percent'
      ? Math.round((baseAmount * couponApplied.discount) / 100)
      : couponApplied.discount
    : 0;
  const walletDiscount = useWallet ? Math.min(user?.walletBalance ?? 0, baseAmount + driverFee - couponDiscount) : 0;
  const finalAmount = Math.max(0, baseAmount + driverFee - couponDiscount - walletDiscount);

  function applyCoupon() {
    const found = offers.find(o => o.code.toUpperCase() === coupon.toUpperCase());
    if (!found) {
      setCouponError('Invalid coupon code');
      return;
    }
    if (baseAmount < found.minAmount) {
      setCouponError(`Minimum order ₹${found.minAmount.toLocaleString()} required`);
      return;
    }
    setCouponApplied(found);
    setCouponError('');
  }

  async function handleConfirm() {
    if (step < 3) {
      if (step === 1 && !pickupLocation.trim()) {
        setSubmitError('Please enter or select a pick-up location or address');
        return;
      }
      setSubmitError('');
      setStep(step + 1);
      return;
    }

    if (!cart) return;

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const c = cart;
    try {
      const finalPickup = pickupLocation.trim() || 'Mumbai Airport, T2';
      const finalDrop = dropLocation.trim() || finalPickup;
      const payload = {
        car_id: c.car.id,
        pickup_location: finalPickup,
        drop_location: finalDrop,
        pickup_date: pickupDate,
        return_date: returnDate,
        pickup_time: pickupTime,
        return_time: returnTime,
        duration_value: durationDays,
        with_driver: c.withDriver,
        coupon_code: couponApplied?.code || undefined,
        use_wallet: useWallet,
        payment_method: useWallet ? 'wallet' : paymentMethod,
      };

      const result = await addBooking(payload);
      const bookingId = result?.id || result?.data?.id || `bk-${Date.now().toString().slice(-6)}`;
      setConfirmedBookingId(bookingId);
      setCart(null);
      await refreshBookings();
      setActiveTab('booked');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to complete booking. Please check car availability.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusColors: Record<string, string> = {
    confirmed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    completed: 'text-muted-foreground bg-muted border-border',
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner / Heading */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-foreground">Cart & Bookings</h1>
          <p className="text-muted-foreground text-sm">
            Complete your rental checkout and manage reservations
          </p>
        </div>
        <div className="flex gap-2">
          {cart && (
            <button
              onClick={() => setActiveTab('checkout')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'checkout'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              🛒 Pending Checkout (1)
            </button>
          )}
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'booked'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            📋 My Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {confirmedBookingId && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-display font-bold text-sm text-emerald-400">Booking Confirmed!</p>
              <p className="text-xs text-muted-foreground">Booking ID: <span className="font-mono font-bold text-foreground">{confirmedBookingId}</span></p>
            </div>
          </div>
          <button onClick={() => setConfirmedBookingId('')} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      {/* Checkout Tab */}
      {activeTab === 'checkout' && cart && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Checkout Steps (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {submitError && (
              <div className="p-3 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs font-medium">
                {submitError}
              </div>
            )}

            {/* Steps Indicator */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4 text-xs font-semibold">
              <span className={step >= 1 ? 'text-primary' : 'text-muted-foreground'}>1. Hub & Timing</span>
              <span>→</span>
              <span className={step >= 2 ? 'text-primary' : 'text-muted-foreground'}>2. Review Details</span>
              <span>→</span>
              <span className={step >= 3 ? 'text-primary' : 'text-muted-foreground'}>3. Payment</span>
            </div>

            {/* Step 1: Locations */}
            {step === 1 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">Pick-up & Return Location</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a DriveNow hub from suggestions or type your custom pickup/drop-off location or full address
                  </p>
                </div>

                <LocationCombobox
                  id="cart-pickup-hub"
                  label="Pick-up Hub"
                  value={pickupLocation}
                  onChange={val => {
                    setPickupLocation(val);
                    setHasUserEditedPickup(true);
                  }}
                  suggestions={locations}
                  placeholder="Select a hub or type custom pickup address / landmark..."
                  helperText="Select an official hub from dropdown suggestions or type your home, hotel, or airport address."
                  required
                />

                <LocationCombobox
                  id="cart-dropoff-hub"
                  label="Drop-off Hub"
                  value={dropLocation}
                  onChange={val => setDropLocation(val)}
                  suggestions={locations}
                  isDropoff={true}
                  pickupReference={pickupLocation}
                  placeholder={`Same as pick-up (${pickupLocation || 'hub'}) or type custom address...`}
                  helperText="Return to the same hub as pick-up, choose a different hub, or enter custom return address."
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Start Date</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={pickupDate}
                      onChange={e => {
                        setPickupDate(e.target.value);
                        if (returnDate < e.target.value) setReturnDate(e.target.value);
                      }}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">End Date</label>
                    <input
                      type="date"
                      min={pickupDate}
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Pick-up Time</label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Return Time</label>
                    <input
                      type="time"
                      value={returnTime}
                      onChange={e => setReturnTime(e.target.value)}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-xl border border-border/50 text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Rental Duration:</span>
                  <span className="font-bold text-foreground">{durationDays} Day{durationDays > 1 ? 's' : ''} (₹{dailyRate.toLocaleString()}/day)</span>
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-display font-semibold rounded-xl text-sm transition-colors mt-4 cursor-pointer"
                >
                  Continue to Summary
                </button>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-display font-bold text-lg text-foreground">Review Rental Details</h2>
                <div className="flex gap-4 p-4 bg-muted/40 rounded-xl border border-border">
                  <img src={cart.car.image} alt={cart.car.name} className="w-24 h-16 object-cover rounded-lg bg-muted" />
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground">{cart.car.name}</h3>
                    <p className="text-xs text-muted-foreground">{cart.car.brand} · {cart.car.category}</p>
                    <p className="text-xs text-foreground mt-1">
                      📅 {pickupDate} ({pickupTime}) ➔ {returnDate} ({returnTime}) · {durationDays} Day{durationDays > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-y border-border py-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Route</span>
                    <span className="text-foreground">{pickupLocation.trim()} → {dropLocation.trim() || pickupLocation.trim()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Driver Option</span>
                    <span className="text-foreground">{cart.withDriver ? 'Chauffeur Included (+₹800/day)' : 'Self-Drive'}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Deposit (Refundable)</span>
                    <span className="text-foreground font-semibold">₹{(cart.car.deposit || 5000).toLocaleString()}</span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-foreground block mb-1">Have a Coupon?</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WEEKEND50"
                      value={coupon}
                      onChange={e => setCoupon(e.target.value)}
                      className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-muted border border-border rounded-xl text-xs font-semibold hover:bg-secondary text-foreground cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400 mt-1">{couponError}</p>}
                  {couponApplied && <p className="text-xs text-emerald-400 mt-1">✓ Applied: {couponApplied.title} (-₹{couponDiscount})</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="py-3 px-5 bg-muted border border-border rounded-xl text-xs font-semibold hover:bg-secondary text-foreground cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-display font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-display font-bold text-lg text-foreground">Select Payment Method</h2>

                {/* Wallet Toggle */}
                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">Pay with DriveNow Wallet</p>
                      <p className="text-[11px] text-muted-foreground">Available Balance: ₹{(user?.walletBalance ?? 0).toLocaleString()}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={e => {
                        const selected = e.target.checked;
                        setUseWallet(selected);
                        setPaymentMethod(selected ? 'wallet' : 'upi');
                      }}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </div>
                  {useWallet && (
                    <p className="text-xs text-emerald-400">
                      Wallet will cover the full booking total, including any security deposit. Other payment methods are unavailable.
                    </p>
                  )}
                </div>

                {/* Method Options */}
                {!useWallet && <div className="space-y-2 pt-2">
                  {[
                    { id: 'upi', label: 'UPI / Google Pay / PhonePe', icon: '📱' },
                    { id: 'card', label: 'Credit or Debit Card', icon: '💳' },
                    { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
                    { id: 'cash', label: 'Pay at Hub on Pickup', icon: '💵' },
                  ].map(m => (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === m.id
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{m.icon}</span>
                        <span className="text-xs font-semibold text-foreground">{m.label}</span>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id as 'upi' | 'card' | 'netbanking' | 'cash')}
                        className="accent-primary cursor-pointer"
                      />
                    </label>
                  ))}
                </div>}

                {!user && (
                  <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400 text-xs">
                    Please <Link to="/login" className="font-bold underline">Sign In</Link> to complete booking.
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="py-3 px-5 bg-muted border border-border rounded-xl text-xs font-semibold hover:bg-secondary text-foreground cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-white font-display font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg shadow-primary/25 cursor-pointer"
                  >
                    {isSubmitting ? 'Confirming Booking...' : `Pay ₹${finalAmount.toLocaleString()} & Confirm`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Summary Sidebar (1 col) */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-20 shadow-lg space-y-4">
              <h3 className="font-display font-bold text-base text-foreground">Order Summary</h3>
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <img src={cart.car.image} alt={cart.car.name} className="w-14 h-10 object-cover rounded-lg bg-muted" />
                <div>
                  <p className="font-semibold text-xs text-foreground">{cart.car.name}</p>
                  <p className="text-[11px] text-muted-foreground">{durationDays} Day{durationDays > 1 ? 's' : ''} rental</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>₹{baseAmount.toLocaleString()}</span>
                </div>
                {cart.withDriver && (
                  <div className="flex justify-between text-accent">
                    <span>Driver Fee</span>
                    <span>+₹{driverFee.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                {walletDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Wallet Applied</span>
                    <span>-₹{walletDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-foreground pt-3 border-t border-border">
                  <span>Payable Now</span>
                  <span className="text-primary font-display font-black text-xl">₹{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setCart(null)}
                className="w-full py-2 text-xs text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 rounded-xl transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booked Tab / History */}
      {activeTab === 'booked' && (
        <div className="space-y-4">
          {isLoadingBookings ? (
            <div className="text-center py-20 text-muted-foreground text-xs">
              Loading your bookings from database...
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1">No Active Bookings</h3>
              <p className="text-muted-foreground text-xs mb-4">You have not booked any cars yet.</p>
              <Link to="/cars" className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90">
                Explore Fleet
              </Link>
            </div>
          ) : (
            bookings.map(b => (
              <div key={b.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={b.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80'}
                      alt={b.carName}
                      className="w-20 h-14 object-cover rounded-xl bg-muted shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-base text-foreground">{b.carName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${statusColors[b.status]}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        📍 {b.pickupLocation} → {b.dropLocation || b.pickupLocation}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        📅 {b.pickupDate} ➔ {b.returnDate || b.pickupDate} ({b.durationValue || 1} Day{(b.durationValue || 1) > 1 ? 's' : ''})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-stretch sm:self-center justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    <div className="text-right">
                      <span className="font-display font-black text-lg text-primary">₹{Number(b.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackingId(trackingId === b.id ? null : b.id)}
                        className="px-3 py-1.5 bg-muted border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                      >
                        {trackingId === b.id ? 'Hide' : 'Track'}
                      </button>
                      {(b.status === 'confirmed' || b.status === 'active') && (
                        <button
                          onClick={() => {
                            setCancelError(null);
                            setBookingToCancel({ id: b.id, name: b.carName });
                          }}
                          className="px-3 py-1.5 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-400/20 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {trackingId === b.id && (
                  <div className="p-4 bg-muted/40 border-t border-border text-xs">
                    <p className="text-muted-foreground font-mono mb-3">Booking Reference: {b.id}</p>
                    <div className="flex items-center justify-between">
                      {['Confirmed', 'Prepared', 'Active Ride', 'Returned'].map((s, idx) => (
                        <div key={s} className="flex flex-col items-center flex-1 text-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx <= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-[11px] mt-1 text-foreground font-medium">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modern In-App Cancellation Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(bookingToCancel)}
        onClose={() => {
          if (!isCancelling) {
            setBookingToCancel(null);
            setCancelError(null);
          }
        }}
        onConfirm={handleConfirmCancel}
        title={`Cancel Reservation for ${bookingToCancel?.name || 'Vehicle'}?`}
        message={`Are you sure you want to cancel your booking for ${bookingToCancel?.name}? Any eligible refund will be credited back to your wallet balance.`}
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        variant="warning"
        isLoading={isCancelling}
        error={cancelError}
      />
    </div>
  );
}
