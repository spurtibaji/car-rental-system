import { useState } from 'react';
import { categories } from '../data/cars';
import { useApp } from '../context/AppContext';
import CarCard from '../components/CarCard';

export default function Cars() {
  const { cars, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, isLoadingCars } = useApp();
  const [fuelFilter, setFuelFilter] = useState('All');
  const [transmissionFilter, setTransmissionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const filteredCars = cars.filter(car => {
    const matchesCategory = selectedCategory === 'All' || car.category === selectedCategory;
    const matchesFuel = fuelFilter === 'All' || car.fuel === fuelFilter;
    const matchesTrans = transmissionFilter === 'All' || car.transmission === transmissionFilter;
    const matchesSearch = !searchQuery ||
      car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesFuel && matchesTrans && matchesSearch;
  });

  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.price?.daily || 0) - (b.price?.daily || 0);
    if (sortBy === 'price-desc') return (b.price?.daily || 0) - (a.price?.daily || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground">Explore Fleet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {filteredCars.length} vehicles available across Maharashtra hubs
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 mb-8 space-y-4">
        {/* Search & Category Pills */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search make or model..."
              className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Fuel Type</label>
            <select
              value={fuelFilter}
              onChange={e => setFuelFilter(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="All">All Fuels</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Transmission</label>
            <select
              value={transmissionFilter}
              onChange={e => setTransmissionFilter(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="All">All Transmissions</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setFuelFilter('All');
                setTransmissionFilter('All');
                setSearchQuery('');
                setSortBy('popular');
              }}
              className="w-full py-2 bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Car Cards Grid */}
      {isLoadingCars ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Loading vehicle fleet...</p>
        </div>
      ) : sortedCars.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <div className="text-4xl mb-3">🚗</div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1">No Cars Match Your Filter</h3>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or resetting filters to view all vehicles.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setFuelFilter('All');
              setTransmissionFilter('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90"
          >
            Show All Cars
          </button>
        </div>
      )}
    </div>
  );
}
