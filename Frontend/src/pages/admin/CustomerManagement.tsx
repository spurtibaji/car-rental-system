import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
  totalBookings: number;
  totalSpent: number;
  kyc_status: 'not_uploaded' | 'pending' | 'verified' | 'rejected';
  status: 'active' | 'suspended';
  average_rating?: number | null;
  averageRating?: number | null;
  total_reviews?: number;
  totalReviews?: number;
}

interface DetailedReviewItem {
  id: string;
  car_id: string;
  car_name?: string;
  car_image?: string;
  user_id: string;
  user_name?: string;
  booking_id?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface CustomerReviewsData {
  user_id: string;
  user_name: string;
  email: string;
  phone?: string;
  average_rating: number | null;
  total_reviews: number;
  rating_breakdown?: Record<string, number>;
  reviews: DetailedReviewItem[];
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Customer Reviews Modal States
  const [selectedCustomerForReviews, setSelectedCustomerForReviews] = useState<CustomerItem | null>(null);
  const [reviewsData, setReviewsData] = useState<CustomerReviewsData | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await adminApi.listCustomers();
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setCustomers(list);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer accounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleToggleStatus(customer: CustomerItem) {
    const newStatus = customer.status === 'active' ? 'suspended' : 'active';
    setUpdatingId(customer.id);
    try {
      await adminApi.toggleCustomerStatus(customer.id, newStatus);
      setCustomers(prev =>
        prev.map(c => (c.id === customer.id ? { ...c, status: newStatus } : c))
      );
      setActionNotice({
        type: 'success',
        message: `Customer ${customer.name} status updated to ${newStatus.toUpperCase()}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to update customer status',
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleOpenReviews(customer: CustomerItem) {
    setSelectedCustomerForReviews(customer);
    setLoadingReviews(true);
    setReviewsError('');
    try {
      const res = await adminApi.getCustomerReviews(customer.id);
      const data = (res as any)?.data || res;
      setReviewsData(data);
    } catch (err: any) {
      setReviewsError(err.message || 'Failed to load customer reviews');
    } finally {
      setLoadingReviews(false);
    }
  }

  function handleCloseReviews() {
    setSelectedCustomerForReviews(null);
    setReviewsData(null);
    setReviewsError('');
  }

  const kycBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Verified ✓</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending ⏳</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">Rejected ✕</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">None</span>;
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Customer Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer accounts, verify lifetime rental spends, and toggle account access
          </p>
        </div>

        <button
          onClick={loadCustomers}
          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>↻</span>
          <span>Refresh List</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{actionNotice.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-muted-foreground hover:text-foreground text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-muted border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'active', 'suspended'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading customer directory...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-xs text-muted-foreground">
          No registered customer accounts found.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-bold">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4">Bookings</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">Customer Rating</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{c.name || 'Unnamed'}</p>
                          <p className="text-[10px] text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {c.phone || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {kycBadge(c.kyc_status)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {c.totalBookings || 0}
                    </td>

                    <td className="py-3.5 px-4 font-display font-bold text-foreground">
                      ₹{(c.totalSpent || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      {(() => {
                        const totalRevs = c.total_reviews ?? (c as any).totalReviews ?? 0;
                        const avgRating = c.average_rating ?? (c as any).averageRating;
                        if (totalRevs > 0 && avgRating !== null && avgRating !== undefined) {
                          return (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200">
                                <span className="text-amber-600 font-bold text-xs">★ {Number(avgRating).toFixed(1)}</span>
                                <span className="text-[10px] text-muted-foreground">({totalRevs})</span>
                              </div>
                              <button
                                onClick={() => handleOpenReviews(c)}
                                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                title="View customer detailed reviews and feedback"
                              >
                                <span>💬</span>
                                <span>Reviews</span>
                              </button>
                            </div>
                          );
                        }
                        return (
                          <span className="text-muted-foreground text-[11px] italic">
                            No reviews yet
                          </span>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        disabled={updatingId === c.id}
                        onClick={() => handleToggleStatus(c)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                          c.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {updatingId === c.id
                          ? 'Updating...'
                          : c.status === 'active'
                          ? 'Suspend'
                          : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Reviews Modal */}
      {selectedCustomerForReviews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={handleCloseReviews}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedCustomerForReviews.name ? selectedCustomerForReviews.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-base text-foreground">
                      {selectedCustomerForReviews.name}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                      Customer Reviews
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedCustomerForReviews.email} {selectedCustomerForReviews.phone ? `· ${selectedCustomerForReviews.phone}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseReviews}
                className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingReviews ? (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading verified customer reviews & ratings...
                </div>
              ) : reviewsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  {reviewsError}
                </div>
              ) : !reviewsData || reviewsData.reviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                  <span className="text-3xl block mb-2">⭐</span>
                  <p className="font-bold text-foreground mb-1">No Reviews Submitted Yet</p>
                  <p className="max-w-xs mx-auto">This customer has not submitted any ratings or reviews for completed rentals.</p>
                </div>
              ) : (
                <>
                  {/* Rating Summary Card */}
                  <div className="bg-muted/40 border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Overall Customer Rating</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-display font-black text-4xl text-foreground">
                          {reviewsData.average_rating ? reviewsData.average_rating.toFixed(1) : '—'}
                        </span>
                        <span className="text-sm text-muted-foreground font-bold">/ 5.0</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-amber-500 text-base">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star}>
                            {star <= Math.round(reviewsData.average_rating || 0) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        Based on {reviewsData.total_reviews} verified rental review{reviewsData.total_reviews > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Breakdown bars */}
                    {reviewsData.rating_breakdown && (
                      <div className="w-full sm:w-64 space-y-1.5 text-xs">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const count = reviewsData.rating_breakdown?.[String(stars)] || 0;
                          const pct = reviewsData.total_reviews > 0 ? (count / reviewsData.total_reviews) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-2 text-[11px]">
                              <span className="w-10 text-muted-foreground font-mono">{stars} ★</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-6 text-right font-mono text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Individual Reviews List */}
                  <div>
                    <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center justify-between">
                      <span>Rental Feedback & Comments</span>
                      <span className="text-xs text-muted-foreground font-bold">
                        {reviewsData.reviews.length} submission{reviewsData.reviews.length > 1 ? 's' : ''}
                      </span>
                    </h3>

                    <div className="space-y-3">
                      {reviewsData.reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-3">
                              {rev.car_image ? (
                                <img
                                  src={rev.car_image}
                                  alt={rev.car_name || 'Vehicle'}
                                  className="w-12 h-9 object-cover rounded-lg border border-border bg-muted shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">
                                  🚗
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-xs text-foreground">
                                  {rev.car_name || 'Vehicle'}
                                </h4>
                                {rev.booking_id && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    Booking #{rev.booking_id.slice(0, 10)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-0.5">
                              <div className="flex items-center text-amber-500 text-xs">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <span key={s}>{s <= rev.rating ? '★' : '☆'}</span>
                                ))}
                                <span className="ml-1 text-[11px] font-bold text-foreground">{rev.rating}/5</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }) : ''}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-xs text-foreground/90 leading-relaxed italic">
                            "{rev.comment}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                onClick={handleCloseReviews}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
