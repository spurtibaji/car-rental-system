import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/profile';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill() {
    setEmail('rahul@email.com');
    setPassword('Password@123');
    setError('');
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 text-primary font-display font-black text-xl mb-4 shadow-md shadow-primary/20">
            DR
          </div>
          <h1 className="font-display font-black text-3xl text-foreground">Customer Sign In</h1>
          <p className="text-muted-foreground text-sm mt-1">Access your bookings, profile, and digital wallet</p>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-display font-bold text-sm rounded-xl transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-6 pt-5 border-t border-border">
            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full py-2.5 px-4 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ Quick-fill Demo Customer</span>
              <span className="text-muted-foreground">(rahul@email.com)</span>
            </button>
          </div>

          {/* Signup Link */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have a customer account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-bold">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
