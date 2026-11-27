import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide administrative credentials.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill() {
    setEmail('admin@drivenow.com');
    setPassword('Admin@123');
    setError('');
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-xl shadow-primary/25 text-white font-display font-black text-xl mb-4">
            ADM
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="font-display font-black text-2xl text-foreground">Drive<span className="text-primary">Now</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider">
              Staff Only
            </span>
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Management Console Login</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Restricted access for fleet supervisors & system operators
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@drivenow.com"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Access Key / Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-display font-bold text-sm rounded-xl transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {loading ? 'Verifying Admin Token...' : 'Authorize Console Session ➔'}
            </button>
          </form>

          {/* Quick Predefined Admin Credential Fill */}
          <div className="mt-6 pt-5 border-t border-border">
            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full py-2.5 px-4 bg-muted hover:bg-secondary border border-border rounded-xl text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔑 Predefined Admin Demo Fill</span>
              <span className="text-muted-foreground font-mono text-[11px]">(admin@drivenow.com)</span>
            </button>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground text-center">
            🔒 Protected by RBAC session guard. Unauthorized access attempts are monitored and logged.
          </div>
        </div>
      </div>
    </div>
  );
}
