import { useState } from 'react';
import { useNavigate } from 'react-router';
import { tripPlannerApi } from '../services/api';
import { useApp } from '../context/AppContext';
import type { Car } from '../data/cars';

interface RecommendationItem {
  car: Car;
  rental_cost: number;
  driver_cost: number;
  fuel_cost: number;
  total_estimated_cost: number;
  is_best_match: boolean;
  match_reasons: string[];
}

interface TripPlannerResult {
  destination: string;
  distance_round_trip_km: number;
  terrain: string;
  days: number;
  passengers: number;
  purpose: string;
  budget: number;
  recommendations: RecommendationItem[];
}

const quickDestinations = [
  { name: 'Goa Coastline', days: 4, passengers: 4, budget: 18000, purpose: 'Weekend Getaway' },
  { name: 'Lonavala Hills', days: 2, passengers: 4, budget: 8000, purpose: 'Weekend Getaway' },
  { name: 'Mahabaleshwar', days: 3, passengers: 5, budget: 12000, purpose: 'Family Holiday' },
  { name: 'Leh Ladakh', days: 7, passengers: 4, budget: 35000, purpose: 'Off-Road Expedition' },
];

export default function TripPlanner() {
  const navigate = useNavigate();
  const { addToCart } = useApp();

  const [destination, setDestination] = useState('Goa Coastline');
  const [passengers, setPassengers] = useState(4);
  const [days, setDays] = useState(3);
  const [purpose, setPurpose] = useState('Weekend Getaway');
  const [budget, setBudget] = useState(15000);
  const [needDriver, setNeedDriver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<TripPlannerResult | null>(null);

  async function handlePlanTrip(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await tripPlannerApi.recommend({
        destination,
        passengers: Number(passengers),
        days: Number(days),
        purpose,
        budget: Number(budget),
        need_driver: needDriver,
      });

      if (data) {
        setResults(data);
      }
    } catch (err: any) {
      setError(err.message || 'Could not fetch trip recommendations. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCar(item: RecommendationItem) {
    const today = new Date().toISOString().split('T')[0];
    const returnDate = new Date(Date.now() + Math.max(1, days) * 86400000).toISOString().split('T')[0];
    addToCart(item.car, {
      pickupLocation: 'Mumbai Airport, T2',
      dropLocation: 'Mumbai Airport, T2',
      pickupDate: today,
      returnDate: returnDate,
      durationValue: days,
      withDriver: needDriver,
      totalAmount: item.total_estimated_cost,
    });
    navigate('/cart');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
          ✨ Intelligent Journey Assistant
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground">
          Trip Planner & Vehicle Matcher
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Tell us your destination and travel party. We'll calculate route distances, terrain requirements, fuel costs, and match the best vehicle.
        </p>
      </div>

      {/* Form & Quick Pickers */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
        {/* Quick Suggestions */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Popular Getaways
          </label>
          <div className="flex flex-wrap gap-2">
            {quickDestinations.map(q => (
              <button
                key={q.name}
                type="button"
                onClick={() => {
                  setDestination(q.name);
                  setDays(q.days);
                  setPassengers(q.passengers);
                  setBudget(q.budget);
                  setPurpose(q.purpose);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  destination === q.name
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted text-foreground border-border hover:bg-muted/80'
                }`}
              >
                📍 {q.name} ({q.days} days, ₹{q.budget.toLocaleString()})
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handlePlanTrip} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Destination *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="e.g. Goa, Manali, Pondicherry"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Trip Purpose
              </label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="Weekend Getaway">Weekend Getaway</option>
                <option value="Family Holiday">Family Holiday</option>
                <option value="Business Trip">Business Trip</option>
                <option value="Off-Road Expedition">Off-Road Expedition</option>
                <option value="Wedding / Celebration">Wedding / Celebration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Target Budget (₹)
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Passengers
              </label>
              <select
                value={passengers}
                onChange={e => setPassengers(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              >
                {[1, 2, 4, 5, 7, 8].map(p => (
                  <option key={p} value={p}>{p} {p === 1 ? 'Person' : 'People'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={needDriver}
                  onChange={e => setNeedDriver(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border bg-muted"
                />
                <span>Include Professional Chauffeur (+₹800/day)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-display font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/20"
          >
            {loading ? 'Analyzing Route & Calculating Fleet...' : 'Generate Recommendations ➔'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          {/* Trip Summary Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Itinerary Analysis</span>
              <h2 className="font-display font-black text-2xl text-foreground mt-0.5">
                Trip to {results.destination}
              </h2>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div>
                <span className="block font-semibold text-foreground">Estimated Round Trip</span>
                <span>{results.distance_round_trip_km} km</span>
              </div>
              <div>
                <span className="block font-semibold text-foreground">Terrain Profile</span>
                <span className="capitalize">{results.terrain}</span>
              </div>
              <div>
                <span className="block font-semibold text-foreground">Travelers</span>
                <span>{results.passengers} Guests · {results.days} Days</span>
              </div>
            </div>
          </div>

          {/* Recommendations Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.recommendations.map((item, idx) => (
              <div
                key={idx}
                className={`bg-card border rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                  item.is_best_match
                    ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/30'
                    : 'border-border shadow-sm'
                }`}
              >
                {item.is_best_match && (
                  <div className="absolute -top-3 left-6 bg-primary text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    ★ Best Matched Choice
                  </div>
                )}

                <div>
                  <img
                    src={item.car.image}
                    alt={item.car.name}
                    className="w-full h-40 object-cover rounded-xl border border-border mb-4 bg-muted"
                  />

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-lg text-foreground">{item.car.name}</h3>
                    <span className="text-xs text-muted-foreground capitalize font-medium">{item.car.type}</span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    {item.car.seats} Seats · {item.car.transmission} · {item.car.fuel}
                  </p>

                  {/* Match reasons */}
                  <div className="space-y-1 mb-4">
                    {item.match_reasons.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="text-emerald-400">✓</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cost breakdown */}
                  <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-xs mb-6 border border-border/50">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Vehicle Rental ({results.days}d):</span>
                      <span className="font-medium text-foreground">₹{item.rental_cost.toLocaleString()}</span>
                    </div>
                    {item.driver_cost > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Chauffeur Allowance:</span>
                        <span className="font-medium text-foreground">₹{item.driver_cost.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated Fuel (~{results.distance_round_trip_km}km):</span>
                      <span className="font-medium text-foreground">₹{item.fuel_cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-bold text-foreground">
                      <span>Total Estimated Journey:</span>
                      <span className="text-primary font-display font-black text-sm">
                        ₹{item.total_estimated_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectCar(item)}
                  className={`w-full py-2.5 rounded-xl font-display font-semibold text-xs transition-colors cursor-pointer ${
                    item.is_best_match
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  }`}
                >
                  Book This Vehicle ➔
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
