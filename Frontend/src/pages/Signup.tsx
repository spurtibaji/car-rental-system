import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';

export default function Signup() {
  const { signup } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !email || !phone || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup({ name, email, phone, password });
      navigate('/profile', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill() {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setName(`Test Customer ${randomNum}`);
    setEmail(`customer${randomNum}@example.com`);
    setPhone('+91 98765 43210');
    setPassword('Customer@123');
    setConfirmPassword('Customer@123');
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
          <h1 className="font-display font-black text-3xl text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join DriveNow for self-drive and chauffeur rentals</p>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3.5 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="priya@example.com"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-display font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Customer Account'}
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-5 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full py-2 px-3 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs font-medium text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ Generate Random Test Data</span>
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
