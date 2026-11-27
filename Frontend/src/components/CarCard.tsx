import { Link, useNavigate } from 'react-router';
import type { Car } from '../data/cars';
import { useApp } from '../context/AppContext';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  const { addToCart } = useApp();
  const navigate = useNavigate();

  function handleQuickBook(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(car);
    navigate('/cart');
  }

  return (
    <div className="group bg-card border border-border hover:border-primary/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col">
      {/* Image Container */}
      <Link to={`/cars/${car.id}`} className="relative block overflow-hidden aspect-[16/10] bg-muted">
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Availability Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
            car.available
              ? 'bg-white/95 text-emerald-700 border border-emerald-500/30'
              : 'bg-white/95 text-amber-700 border border-amber-500/30'
          }`}>
            {car.available ? '● Available' : '○ Booked'}
          </span>
        </div>
        {/* Category Tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-foreground backdrop-blur-md border border-border shadow-sm">
            {car.category}
          </span>
        </div>
      </Link>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">{car.brand}</span>
            <Link to={`/cars/${car.id}`} className="block font-display font-bold text-lg text-foreground hover:text-primary transition-colors">
              {car.name}
            </Link>
          </div>
          <div className="flex items-center gap-1 text-accent text-xs font-bold bg-accent/10 px-2 py-0.5 rounded-md">
            <span>★</span>
            <span>{car.rating}</span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/60 my-3 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>👥</span>
            <span>{car.seats} Seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>⛽</span>
            <span className="truncate">{car.fuel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>⚙️</span>
            <span className="truncate">{car.transmission}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Daily Rental</p>
            <p className="font-display font-black text-xl text-foreground">
              ₹{(car.price?.daily || 0).toLocaleString()}
              <span className="text-xs font-bold text-muted-foreground">/day</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/cars/${car.id}`}
              className="px-3 py-2 bg-muted hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-colors"
            >
              Details
            </Link>
            <button
              onClick={handleQuickBook}
              disabled={!car.available}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
