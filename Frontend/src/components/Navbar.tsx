import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { searchQuery, setSearchQuery, cart, user, bookings, isLoggedIn, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate('/cars');
    setSearchOpen(false);
  }

  function handleLogout() {
    logout();
    navigate('/login');
    setMenuOpen(false);
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
              <span className="text-white font-display font-black text-sm">DR</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Drive<span className="text-primary">Now</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home', path: '/' },
              { label: 'Cars', path: '/cars' },
              { label: 'Trip Planner', path: '/trip-planner' },
              { label: 'Roadside Help', path: '/roadside' },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isActive(path)
                    ? 'text-primary bg-primary/10'
                    : 'text-secondary-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Search Cars"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Cart & Bookings */}
            <Link to="/cart" className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Cart & Bookings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {(cart || bookings.length > 0) && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {cart ? 1 : bookings.length}
                </span>
              )}
            </Link>

            {/* Customer Authentication */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                    <span className="text-primary font-display font-bold text-xs">
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                    </span>
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-foreground max-w-[120px] truncate">
                    {user.name || 'Profile'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-border transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-muted border border-border transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div className="pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by car name, brand, model..."
                  className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-lg text-sm text-foreground placeholder-muted-foreground outline-none border border-border focus:border-primary transition-colors"
                  autoFocus
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-xs rounded-md font-bold cursor-pointer">
                  Search
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-1 border-t border-border pt-2">
            {[
              { label: 'Home', path: '/' },
              { label: 'Cars', path: '/cars' },
              { label: 'Trip Planner', path: '/trip-planner' },
              { label: 'Roadside Help', path: '/roadside' },
              { label: 'Cart & Bookings', path: '/cart' },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isActive(path) ? 'text-primary bg-primary/10' : 'text-secondary-foreground hover:bg-muted'
                }`}
              >
                {label}
              </Link>
            ))}

            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-bold text-foreground hover:bg-muted"
                >
                  My Profile & Wallet
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg text-sm font-bold border border-border text-foreground hover:bg-muted"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
