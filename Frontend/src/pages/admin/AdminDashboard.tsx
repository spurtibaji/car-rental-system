import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { adminApi } from '../../services/adminApi';

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeBookings: number;
  totalCars: number;
  availableCars: number;
  totalCustomers: number;
  pendingKYC: number;
  revenueGrowth: number;
}

interface MonthlyRevenueItem {
  month: string;
  month_name: string;
  amount: number;
  percentage: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyRev, setMonthlyRev] = useState<MonthlyRevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const data = await adminApi.getDashboard();
        if (data?.stats) {
          setStats(data.stats);
          setMonthlyRev(data.monthly_revenue || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load administrator telemetry');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">Aggregating real-time fleet analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
        <p className="font-bold">Error loading dashboard telemetry</p>
        <p className="text-xs mt-1">{error || 'Could not connect to admin metrics service.'}</p>
      </div>
    );
  }

  const utilizationRate = stats.totalCars > 0
    ? Math.round(((stats.totalCars - stats.availableCars) / stats.totalCars) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Fleet Operations Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry, reservation lifecycle, and revenue analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stats.pendingKYC > 0 && (
            <Link
              to="/admin/kyc"
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <span>⏳</span>
              <span>{stats.pendingKYC} Pending KYC</span>
            </Link>
          )}
          <Link
            to="/admin/cars"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shadow-primary/20"
          >
            + Add New Vehicle
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Total Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold">
              ₹
            </span>
          </div>
          <p className="font-display font-black text-2xl text-foreground mt-3">
            ₹{stats.totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
            <span className="text-emerald-400 font-semibold">+{stats.revenueGrowth}%</span>
            <span>growth this month</span>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Active Bookings</span>
            <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
              📑
            </span>
          </div>
          <p className="font-display font-black text-2xl text-foreground mt-3">
            {stats.activeBookings}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
            <span className="text-blue-400 font-semibold">{utilizationRate}%</span>
            <span>fleet utilization</span>
          </div>
        </div>

        {/* Fleet Availability */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Vehicles in Fleet</span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm">
              🚗
            </span>
          </div>
          <p className="font-display font-black text-2xl text-foreground mt-3">
            {stats.totalCars}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
            <span className="text-emerald-400 font-semibold">{stats.availableCars} Available</span>
            <span>· {stats.totalCars - stats.availableCars} on road</span>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Customers</span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm">
              👥
            </span>
          </div>
          <p className="font-display font-black text-2xl text-foreground mt-3">
            {stats.totalCustomers}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
            <span className={stats.pendingKYC > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {stats.pendingKYC} awaiting KYC
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend Chart */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">Annual Revenue Trajectory</h2>
            <p className="text-xs text-muted-foreground">Monthly gross receipts from self-drive & chauffeur rentals</p>
          </div>
          <Link
            to="/admin/revenue"
            className="text-xs text-primary hover:underline font-semibold"
          >
            View Full Financial Reports ➔
          </Link>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-3 items-end h-56 pt-6">
          {monthlyRev.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center h-full justify-end group">
              <div className="text-[10px] text-muted-foreground font-mono mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{item.amount > 0 ? `${(item.amount / 1000).toFixed(0)}k` : '0'}
              </div>
              <div className="w-full bg-muted rounded-t-lg relative overflow-hidden flex flex-col justify-end h-full max-h-[140px]">
                <div
                  style={{ height: `${Math.max(item.percentage, 4)}%` }}
                  className="w-full bg-primary/80 group-hover:bg-primary transition-all rounded-t-lg"
                />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold mt-2">
                {item.month_name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/cars"
          className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <span className="text-2xl block mb-2">🚗</span>
          <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
            Fleet Catalog
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle availability, update pricing tiers, and add new cars.
          </p>
        </Link>

        <Link
          to="/admin/bookings"
          className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <span className="text-2xl block mb-2">📑</span>
          <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
            Live Bookings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Manage dispatch, inspect OTPs, and update reservation status.
          </p>
        </Link>

        <Link
          to="/admin/customers"
          className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <span className="text-2xl block mb-2">👥</span>
          <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
            Customer Directory
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            View lifetime spend, booking counts, and suspend or activate users.
          </p>
        </Link>

        <Link
          to="/admin/kyc"
          className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <span className="text-2xl block mb-2">🪪</span>
          <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
            Licence Verification
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Approve or reject customer driving licences with audit logs.
          </p>
        </Link>
      </div>
    </div>
  );
}
