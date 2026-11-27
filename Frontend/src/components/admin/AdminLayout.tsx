import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/adminApi';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: '📊' },
  { label: 'Fleet Management', path: '/admin/cars', icon: '🚗' },
  { label: 'Bookings', path: '/admin/bookings', icon: '📑' },
  { label: 'Customers', path: '/admin/customers', icon: '👥' },
  { label: 'KYC Reviews', path: '/admin/kyc', icon: '🪪' },
  { label: 'Revenue & Reports', path: '/admin/revenue', icon: '📈' },
];

export default function AdminLayout() {
  const { adminUser, isAuthenticated, isLoading, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);

  // Protected route guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true, state: { from: location } });
    }
  }, [isLoading, isAuthenticated, navigate, location]);

  // Ping backend API status
  useEffect(() => {
    if (isAuthenticated) {
      adminApi.getDashboard()
        .then(() => setIsApiHealthy(true))
        .catch(() => setIsApiHealthy(false));
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Verifying Administrator Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Admin Tag */}
            <div className="flex items-center gap-3">
              <Link to="/admin" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
                  <span className="text-white font-display font-black text-xs tracking-wider">ADM</span>
                </div>
                <span className="font-display font-bold text-lg text-foreground">
                  Drive<span className="text-primary">Now</span>
                </span>
              </Link>
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[11px] font-bold tracking-wide">
                Admin Console
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Side: Status Badge, User Chip & Logout */}
            <div className="flex items-center gap-3">
              {/* API Status */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full border border-border text-[11px]">
                <span className={`w-2 h-2 rounded-full ${isApiHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-muted-foreground font-bold">
                  {isApiHealthy ? 'Backend Live' : 'Connecting...'}
                </span>
              </div>

              {/* Admin Chip */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
                  A
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground leading-none">{adminUser?.name || 'Admin'}</p>
                  <p className="text-[10px] text-muted-foreground">{adminUser?.email || 'admin@drivenow.com'}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Sign Out of Admin Console"
              >
                Sign Out
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-border flex flex-col gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 mt-2 border-t border-border pt-2 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-border py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <p>© 2026 DriveNow Admin Portal · Dedicated Management System</p>
          <p>College Project Demonstration · Predefined Superadmin Access</p>
        </div>
      </footer>
    </div>
  );
}
