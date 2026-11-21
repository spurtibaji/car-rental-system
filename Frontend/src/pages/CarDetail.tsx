import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import LocationCombobox from '../components/LocationCombobox';

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const { cars, addToCart, locations } = useApp();
  const navigate = useNavigate();

  const car = cars.find(c => c.id === id);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [selectedImage, setSelectedImage] = useState(0);
  const [pickupDate, setPickupDate] = useState(todayStr);
  const [returnDate, setReturnDate] = useState(tomorrowStr);
  const [withDriver, setWithDriver] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(locations[0] || 'Mumbai Airport, T2');

  if (!car) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="font-display font-bold text-xl text-foreground mb-2">Vehicle Not Found</h2>
        <p className="text-muted-foreground text-xs mb-6">The requested car does not exist in our fleet.</p>
        <Link to="/cars" className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl">
          Back to Cars
        </Link>
      </div>
    );
  }

  // Calculate rental duration in days from start date to end date
  const diffMs = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
  const durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const dailyRate = car.price?.daily || 2000;
  const basePrice = dailyRate * durationDays;
  const driverFee = withDriver ? 800 * durationDays : 0;
  const totalAmount = basePrice + driverFee;

  function handleStartDateChange(newDate: string) {
    setPickupDate(newDate);
    if (returnDate < newDate) {
      setReturnDate(newDate);
    }
  }

  function handleBookNow() {
    if (!car) return;
    addToCart(car, {
      pickupLocation,
      pickupDate,
      returnDate,
      durationValue: durationDays,
      withDriver,
      totalAmount,
    });
    navigate('/cart');
  }

  const images = car.images && car.images.length > 0 ? car.images : [car.image];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/cars" className="hover:text-foreground">Cars</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{car.name}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Images & Specs (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden aspect-[16/10] relative">
            <img
              src={images[selectedImage] || car.image}
              alt={car.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                car.available
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {car.available ? '● Available for Rental' : '○ Currently Booked'}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === idx ? 'border-primary' : 'border-border opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Specs Details */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground block text-[11px]">Engine Capacity</span>
                <span className="font-semibold text-foreground text-sm">{car.engineCC || 1493} CC</span>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground block text-[11px]">Mileage</span>
                <span className="font-semibold text-foreground text-sm">{car.mileage ? `${car.mileage} km/l` : 'Electric'}</span>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground block text-[11px]">Transmission</span>
                <span className="font-semibold text-foreground text-sm">{car.transmission}</span>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground block text-[11px]">Seating</span>
                <span className="font-semibold text-foreground text-sm">{car.seats} Passengers</span>
              </div>
            </div>
          </div>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Key Equipment & Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {car.features.map(feat => (
                  <div key={feat} className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl border border-border/50">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-foreground font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Card (1 col) */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl sticky top-20">
            <div className="mb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{car.brand}</span>
              <h1 className="font-display font-black text-2xl text-foreground">{car.name}</h1>
              <p className="text-muted-foreground text-xs">{car.category} · Model {car.year || 2024}</p>
            </div>

            {/* Rental Selection */}
            <div className="space-y-4 pt-4 border-t border-border">
              <LocationCombobox
                id="cardetail-pickup-hub"
                label="Pickup Hub"
                value={pickupLocation}
                onChange={val => setPickupLocation(val)}
                suggestions={locations}
                placeholder="Select hub or type custom address..."
                helperText="Select a hub from suggestions or type doorstep address"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Start Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={pickupDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">End Date</label>
                  <input
                    type="date"
                    min={pickupDate}
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Rental Duration Summary */}
              <div className="flex items-center justify-between p-3 bg-muted/60 rounded-xl border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Rental Duration</span>
                  <span className="font-bold text-foreground">{durationDays} Day{durationDays > 1 ? 's' : ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[11px]">Daily Rate</span>
                  <span className="font-bold text-primary">₹{dailyRate.toLocaleString()}/day</span>
                </div>
              </div>

              {/* Driver Option */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-foreground">Add Chauffeur / Driver</p>
                  <p className="text-[10px] text-muted-foreground">+₹800 per day</p>
                </div>
                <input
                  type="checkbox"
                  checked={withDriver}
                  onChange={e => setWithDriver(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>

              {/* Price Calculation */}
              <div className="p-4 bg-muted/40 rounded-xl space-y-2 text-xs border border-border/60">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Rental ({durationDays} day{durationDays > 1 ? 's' : ''})</span>
                  <span>₹{basePrice.toLocaleString()}</span>
                </div>
                {withDriver && (
                  <div className="flex justify-between text-accent">
                    <span>Driver Allowance</span>
                    <span>+₹{driverFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-foreground pt-2 border-t border-border">
                  <span>Total Estimated</span>
                  <span className="text-primary font-display font-black text-lg">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleBookNow}
                disabled={!car.available}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-display font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
