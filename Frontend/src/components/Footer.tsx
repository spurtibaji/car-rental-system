import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-black text-sm">DR</span>
              </div>
              <span className="font-display font-bold text-xl">Drive<span className="text-primary">Now</span></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium self-drive car rental service across Maharashtra. Drive your way, anytime.
            </p>
            <div className="flex gap-3 mt-4">
              {['📘', '📸', '🐦'].map((icon, i) => (
                <button key={i} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm hover:bg-primary/20 transition-colors">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Browse Cars', path: '/cars' },
                { label: 'Trip Planner', path: '/trip-planner' },
                { label: 'Cart & Checkout', path: '/cart' },
                { label: 'My Bookings', path: '/profile' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Customer Support</h4>
            <ul className="space-y-2">
              {[
                { label: 'Roadside Assistance', path: '/roadside' },
                { label: 'KYC Verification', path: '/profile' },
                { label: 'Wallet & Payments', path: '/profile' },
                { label: 'Login / Register', path: '/login' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📞 1800-123-4567</li>
              <li>📧 help@drivenow.in</li>
              <li>📍 Pune & Mumbai, Maharashtra</li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                  24/7 Roadside Assistance Active
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-muted-foreground text-xs">
          <p>© 2026 DriveNow Customer Portal. All rights reserved.</p>
          <p>College Project Demonstration</p>
        </div>
      </div>
    </footer>
  );
}
