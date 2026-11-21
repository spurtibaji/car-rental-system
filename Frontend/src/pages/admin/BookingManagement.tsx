import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import ConfirmModal from '../../components/ConfirmModal';

interface BookingItem {
  id: string;
  booking_id?: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  pickup_date?: string;
  return_date?: string;
  pickupDate?: string;
  returnDate?: string;
  pickup_time?: string;
  return_time?: string;
  pickupTime?: string;
  returnTime?: string;
  pickup_location?: string;
  drop_location?: string;
  pickupLocation?: string;
  dropLocation?: string;
  duration_type?: string;
  duration_value?: number;
  durationValue?: number;
  total_price?: number;
  total_amount?: number;
  amount?: number;
  with_driver?: boolean;
  withDriver?: boolean;
  payment_method?: string;
  paymentMethod?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  car?: {
    id: string;
    name: string;
    image?: string;
    license_plate?: string;
    brand?: string;
    model?: string;
  };
  carName?: string;
  carImage?: string;
  userName?: string;
  userEmail?: string;
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal & Notification State
  const [bookingToDelete, setBookingToDelete] = useState<BookingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadBookings() {
    setLoading(true);
    try {
      const res = await adminApi.listBookings(selectedStatus !== 'all' ? { status: selectedStatus } : {});
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setBookings(list);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings list');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [selectedStatus]);

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      await adminApi.updateBookingStatus(id, newStatus);
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: newStatus as any } : b))
      );
      setActionNotice({
        type: 'success',
        message: `Booking #${id} status updated to ${newStatus.toUpperCase()}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to update booking status',
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!bookingToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteBooking(bookingToDelete.id);
      setBookings(prev => prev.filter(b => b.id !== bookingToDelete.id));
      const deletedId = bookingToDelete.id;
      setBookingToDelete(null);
      setActionNotice({
        type: 'success',
        message: `Booking reservation #${deletedId} was permanently deleted.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete booking');
    } finally {
      setIsDeleting(false);
    }
  }

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    active: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Booking & Reservation Dispatch
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time rental schedules, change lifecycle states, and review customer trips
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>↻</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
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

      {/* Filter Tabs */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-2 overflow-x-auto shadow-sm">
        {['all', 'confirmed', 'active', 'completed', 'cancelled'].map(st => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === st
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading reservation schedule...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-xs text-muted-foreground">
          No bookings found in this category.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Schedule & Location</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Lifecycle State</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-foreground">#{b.id.slice(0, 8)}</span>
                      {(b.with_driver || b.withDriver) && (
                        <span className="block text-[10px] text-primary font-semibold">With Driver</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{b.user?.name || b.userName || 'Customer'}</p>
                      <p className="text-[10px] text-muted-foreground">{b.user?.email || b.user?.phone || b.userEmail || 'Direct User'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-display font-bold text-foreground">{b.car?.name || b.carName || 'DriveNow Vehicle'}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{b.car?.license_plate || (b as any).license_plate || (b as any).licensePlate || 'MH-02-DN-XXXX'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-foreground">
                        {b.pickup_date || b.pickupDate} ➔ {b.return_date || b.returnDate || b.pickup_date || b.pickupDate} <span className="text-muted-foreground text-[11px]">({b.duration_value || b.durationValue || 1}d)</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-xs">
                        📍 {b.pickup_location || b.pickupLocation || 'Hub pickup'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-display font-bold text-foreground">
                        ₹{Number(b.total_amount ?? b.total_price ?? b.amount ?? 0).toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-muted-foreground uppercase">
                        {b.payment_method || b.paymentMethod || 'UPI'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        disabled={updatingId === b.id}
                        value={b.status}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border outline-none bg-card cursor-pointer ${
                          statusColors[b.status] || 'border-border text-foreground'
                        }`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="active">Active Trip</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'cancelled' && (
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setBookingToDelete(b);
                          }}
                          className="px-2.5 py-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                          title="Purge record"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern In-App Reservation Purge Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(bookingToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setBookingToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={`Permanently Purge Reservation #${bookingToDelete?.id}?`}
        message={`Are you sure you want to permanently delete cancelled booking record #${bookingToDelete?.id} for ${bookingToDelete?.user?.name || bookingToDelete?.userName || 'customer'}? This action cannot be reversed.`}
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
