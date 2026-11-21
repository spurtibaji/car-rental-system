import { useState } from 'react';
import { useNavigate } from 'react-router';
import { categories, categoryIcons } from '../data/cars';
import { useApp } from '../context/AppContext';
import CarCard from '../components/CarCard';
import LocationCombobox from '../components/LocationCombobox';

export default function Home() {
  const { cars, locations, offers, setSelectedCategory } = useApp();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState('');
  const [budget, setBudget] = useState(5000);
  const [showBudgetResults, setShowBudgetResults] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const popularCars = cars.filter(c => c.popular);
  const availableCars = cars.filter(c => c.available).slice(0, 6);
  const budgetCars = cars.filter(c => (c.price?.daily || 0) <= budget && c.available);

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate('/cars');
  }

  function handleCategoryClick(cat: string) {
    setSelectedCategory(cat);
    navigate('/cars');
  }

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[560px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1600&h=700&fit=crop&auto=format"
            alt="Premium car on road"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              {cars.filter(c => c.available).length} Cars Available Now
            </div>
            <h1 className="font-display font-black text-5xl sm:text-6xl text-foreground leading-tight mb-4">
              Drive Your<br />
              <span className="text-primary">Dream Car</span><br />
              Today
            </h1>
            <p className="text-secondary-foreground text-lg mb-8 max-w-md">
              Hatchbacks to Luxury — hourly, daily or weekly rentals across Maharashtra. Instant booking, no hassle.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/cars')}
                className="px-6 py-3 bg-primary text-white font-display font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 cursor-pointer"
              >
                Explore Fleet
              </button>
              <button
                onClick={() => navigate('/trip-planner')}
                className="px-6 py-3 bg-muted border border-border text-foreground font-display font-semibold rounded-xl hover:bg-secondary transition-colors cursor-pointer"
              >
                AI Trip Planner
              </button>
            </div>
          </div>

          {/* Quick Search Card */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
            <h3 className="font-display font-bold text-xl text-foreground mb-1">Find Your Ride</h3>
            <p className="text-muted-foreground text-sm mb-6">Pick location, date & drive away</p>

            <form onSubmit={handleHeroSearch} className="space-y-4">
              <LocationCombobox
                id="home-pickup-location"
                label="Pick-up Location"
                value={pickup}
                onChange={setPickup}
                suggestions={locations}
                placeholder="Select pick-up hub or enter address..."
              />

              <LocationCombobox
                id="home-drop-location"
                label="Drop-off Location"
                value={drop}
                onChange={setDrop}
                suggestions={locations}
                isDropoff={true}
                pickupReference={pickup}
                placeholder="Same as pick-up or enter address..."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Pick-up Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                  <input
                    type="time"
                    defaultValue="10:00"
                    className="w-full bg-muted border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-display font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-md shadow-primary/20 cursor-pointer"
              >
                Search Available Cars
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">Explore by Segment</h2>
            <p className="text-muted-foreground text-sm">Find the perfect car type for your trip</p>
          </div>
          <button
            onClick={() => navigate('/cars')}
            className="text-primary text-sm font-semibold hover:underline"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => {
            const count = cars.filter(c => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="bg-card border border-border hover:border-primary/50 rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group cursor-pointer"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {categoryIcons[cat]}
                </div>
                <p className="font-display font-semibold text-sm text-foreground">{cat}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{count} models</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured / Available Fleet */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">Featured Fleet</h2>
            <p className="text-muted-foreground text-sm">Top-rated vehicles ready for booking</p>
          </div>
          <button
            onClick={() => navigate('/cars')}
            className="text-primary text-sm font-semibold hover:underline"
          >
            Browse all cars →
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(popularCars.length > 0 ? popularCars.slice(0, 6) : availableCars).map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* Active Special Offers */}
      {offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground">Special Coupons & Offers</h2>
            <p className="text-muted-foreground text-sm">Use these codes at checkout to save on your ride</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers.map(offer => (
              <div key={offer.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-primary/20 text-primary border border-primary/30 inline-block mb-3">
                    {offer.code}
                  </span>
                  <h3 className="font-display font-bold text-base text-foreground mb-1">{offer.title}</h3>
                  <p className="text-muted-foreground text-xs">{offer.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Min ₹{offer.minAmount}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(offer.code);
                      setCopiedCode(offer.code);
                      setTimeout(() => setCopiedCode(null), 2500);
                    }}
                    className={`font-semibold cursor-pointer transition-colors ${
                      copiedCode === offer.code ? 'text-emerald-400 font-bold' : 'text-primary hover:underline'
                    }`}
                  >
                    {copiedCode === offer.code ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Budget Finder Tool */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="max-w-xl mx-auto text-center mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">Find Cars by Your Daily Budget</h2>
            <p className="text-muted-foreground text-sm">Slide to filter cars that fit your budget</p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <input
                type="range"
                min="1500"
                max="10000"
                step="500"
                value={budget}
                onChange={e => {
                  setBudget(Number(e.target.value));
                  setShowBudgetResults(true);
                }}
                className="w-64 accent-primary"
              />
              <span className="font-display font-bold text-xl text-primary">₹{budget.toLocaleString()}/day</span>
            </div>
          </div>

          {showBudgetResults && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {budgetCars.slice(0, 3).map(car => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
