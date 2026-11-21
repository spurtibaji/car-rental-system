import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { profileApi, walletApi, bookingsApi, reviewsApi } from '../services/api';
import type { Booking } from '../data/mockData';
import ConfirmModal from '../components/ConfirmModal';

export default function Profile() {
  const {
    user,
    isLoggedIn,
    isLoadingUser,
    logout,
    saveProfile,
    handleAddMoney,
    bookings,
    cancelBooking,
    removeBooking,
    refreshUser,
    refreshBookings,
  } = useApp();

  const navigate = useNavigate();

  // Active section tab: 'profile' | 'wallet' | 'kyc' | 'bookings'
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'kyc' | 'bookings'>('profile');

  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Wallet States
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [addingMoney, setAddingMoney] = useState(false);
  const [walletMsg, setWalletMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // KYC States
  const [drivingLicenceFile, setDrivingLicenceFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycMsg, setKycMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const licenceInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  // Booking Tracking Modal
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Rating & Review Modal States
  const [ratingModalBooking, setRatingModalBooking] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // View Existing Review Modal
  const [viewReviewBooking, setViewReviewBooking] = useState<Booking | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!isLoadingUser && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoadingUser, isLoggedIn, navigate]);

  // Sync profile form when user object loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDob(user.dob || '');
      setAddress(user.address || '');
      setLicenceNumber(user.licenceNumber || '');
    }
  }, [user]);

  // Fetch transactions when wallet tab selected
  useEffect(() => {
    if (activeTab === 'wallet') {
      setLoadingTx(true);
      walletApi.getTransactions()
        .then(txs => {
          if (Array.isArray(txs)) setTransactions(txs);
        })
        .catch(err => console.warn('Could not load transactions', err))
        .finally(() => setLoadingTx(false));
    }
  }, [activeTab]);

  // Fetch KYC documents when kyc tab selected
  useEffect(() => {
    if (activeTab === 'kyc') {
      profileApi.getKYCDocuments()
        .then(docs => {
          if (Array.isArray(docs)) setKycDocuments(docs);
        })
        .catch(err => console.warn('Could not load KYC docs', err));
    }
  }, [activeTab]);

  if (isLoadingUser && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-card border border-border rounded-2xl max-w-sm w-full shadow-lg">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl mx-auto mb-3">
            👤
          </div>
          <h2 className="font-display font-bold text-base text-foreground mb-1">Session Required</h2>
          <p className="text-xs text-muted-foreground mb-5">Please sign in to access your profile and documents.</p>
          <Link
            to="/login"
            className="block w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors text-center"
          >
            Sign In to Your Account
          </Link>
        </div>
      </div>
    );
  }

  // Handle Profile Update
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await saveProfile({
        name,
        phone,
        dob,
        address,
        licenceNumber,
      });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  }

  // Handle Wallet Top-Up
  async function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWalletMsg(null);
    const amount = customAmount ? parseFloat(customAmount) : topUpAmount;
    if (!amount || amount <= 0) {
      setWalletMsg({ type: 'error', text: 'Please enter a valid amount greater than ₹0.' });
      return;
    }

    setAddingMoney(true);
    try {
      await handleAddMoney(amount);
      setWalletMsg({ type: 'success', text: `Successfully added ₹${amount.toLocaleString()} to your wallet!` });
      setCustomAmount('');
      // Refresh transactions
      const txs = await walletApi.getTransactions();
      if (Array.isArray(txs)) setTransactions(txs);
    } catch (err: any) {
      setWalletMsg({ type: 'error', text: err.message || 'Failed to add money to wallet.' });
    } finally {
      setAddingMoney(false);
    }
  }

  // Handle KYC Document Upload & Submit
  async function handleKycSubmit(e: React.FormEvent) {
    e.preventDefault();
    setKycMsg(null);

    const dl = licenceNumber?.trim() || user?.licenceNumber?.trim();
    if (!dl) {
      setKycMsg({ type: 'error', text: 'Please provide a valid Driving Licence Number.' });
      return;
    }

    if (!drivingLicenceFile) {
      setKycMsg({ type: 'error', text: 'Driving Licence document is mandatory. Please choose a file.' });
      return;
    }

    if (!aadhaarFile) {
      setKycMsg({ type: 'error', text: 'Aadhaar Card document is mandatory. Please choose a file.' });
      return;
    }

    setSubmittingKyc(true);
    try {
      // 1. Upload Driving Licence
      await profileApi.uploadKYCDocument('driving_license', drivingLicenceFile);
      // 2. Upload Aadhaar Card
      await profileApi.uploadKYCDocument('aadhaar', aadhaarFile);
      // 3. Submit KYC verification
      await profileApi.submitKYC(dl);

      // 4. Update KYC documents list smoothly
      try {
        const docs = await profileApi.getKYCDocuments();
        if (Array.isArray(docs)) setKycDocuments(docs);
      } catch (docErr) {
        console.warn('Could not refresh documents:', docErr);
      }

      // 5. Silent background refresh of user profile data
      try {
        await refreshUser();
      } catch (userErr) {
        console.warn('Could not refresh user in background:', userErr);
      }
      
      // 6. Reset files & form inputs safely
      setDrivingLicenceFile(null);
      setAadhaarFile(null);
      if (licenceInputRef.current) licenceInputRef.current.value = '';
      if (aadhaarInputRef.current) aadhaarInputRef.current.value = '';

      setActiveTab('kyc');
      setKycMsg({
        type: 'success',
        text: 'Both Driving Licence and Aadhaar Card submitted successfully! Your KYC status is now Pending Review.',
      });
    } catch (err: any) {
      setKycMsg({ type: 'error', text: err.message || 'Failed to upload and submit KYC.' });
    } finally {
      setSubmittingKyc(false);
    }
  }

  // Handle Track Booking
  async function handleOpenTrack(booking: Booking) {
    setTrackingBooking(booking);
    setLoadingTrack(true);
    try {
      const data = await bookingsApi.track(booking.id);
      setTrackingInfo(data);
    } catch {
      setTrackingInfo({
        booking_id: booking.id,
        status: booking.status,
        pickup_location: booking.pickup_location || 'Mumbai Airport, T2',
        drop_location: booking.drop_location || 'Mumbai Airport, T2',
        car_name: booking.car?.name || 'Selected Car',
        license_plate: booking.car?.license_plate || 'MH-02-DN-1001',
        eta_minutes: booking.status === 'confirmed' ? 25 : 0,
        pickup_code: 'DN-' + booking.id.slice(0, 4).toUpperCase(),
        driver_assigned: booking.with_driver,
        driver_name: booking.with_driver ? 'Ramesh Kumar (DriveNow Captain)' : undefined,
        driver_phone: booking.with_driver ? '+91 98200 12345' : undefined,
      });
    } finally {
      setLoadingTrack(false);
    }
  }

  // Modal Confirmation State
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    type: 'cancel' | 'delete';
    bookingId: string;
    carName: string;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionModalError, setActionModalError] = useState<string | null>(null);
  const [bookingNotice, setBookingNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function promptCancelBooking(booking: Booking) {
    setActionModalError(null);
    setConfirmModalState({
      isOpen: true,
      type: 'cancel',
      bookingId: booking.id,
      carName: booking.carName || 'Vehicle Reservation',
    });
  }

  function promptDeleteBooking(booking: Booking) {
    setActionModalError(null);
    setConfirmModalState({
      isOpen: true,
      type: 'delete',
      bookingId: booking.id,
      carName: booking.carName || 'Cancelled Record',
    });
  }

  async function handleConfirmModalAction() {
    if (!confirmModalState) return;
    setIsProcessingAction(true);
    setActionModalError(null);
    try {
      if (confirmModalState.type === 'cancel') {
        await cancelBooking(confirmModalState.bookingId);
        await Promise.allSettled([refreshBookings(), refreshUser()]);
        setBookingNotice({
          type: 'success',
          text: `Reservation for ${confirmModalState.carName} has been cancelled. Any eligible wallet refund has been credited.`,
        });
      } else {
        await removeBooking(confirmModalState.bookingId);
        await refreshBookings();
        setBookingNotice({
          type: 'success',
          text: `Booking record for ${confirmModalState.carName} was removed from your history.`,
        });
      }
      setConfirmModalState(null);
      setTimeout(() => setBookingNotice(null), 4000);
    } catch (err: any) {
      setActionModalError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  }

  function handleOpenRateModal(booking: Booking) {
    setRatingModalBooking(booking);
    setRatingValue(5);
    setHoverRating(0);
    setReviewComment('');
    setReviewError(null);
  }

  function handleCloseRateModal() {
    setRatingModalBooking(null);
    setRatingValue(5);
    setHoverRating(0);
    setReviewComment('');
    setReviewError(null);
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingModalBooking) return;
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      setReviewError('Please select a star rating between 1 and 5 stars.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please write your review / feedback before submitting.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    try {
      await reviewsApi.create({
        booking_id: ratingModalBooking.id,
        rating: ratingValue,
        comment: reviewComment.trim(),
      });
      setReviewSuccessMsg('Your review and rating have been submitted successfully! Thank you for your feedback.');
      setTimeout(() => setReviewSuccessMsg(null), 5000);
      handleCloseRateModal();
      await refreshBookings();
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleOpenViewReview(booking: Booking) {
    setViewReviewBooking(booking);
  }

  function handleCloseViewReview() {
    setViewReviewBooking(null);
  }

  const kycStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Verified ✓</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Pending Review ⏳</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">Rejected ✕</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">Not Submitted</span>;
    }
  };

  const bookingStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">Active Trip</span>;
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Confirmed</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Profile Summary */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-display font-black text-2xl shadow-inner">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-black text-2xl text-foreground">{user.name || 'Valued Customer'}</h1>
              {kycStatusBadge(user.kycStatus)}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email} · {user.phone || 'No phone set'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border">
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Wallet Balance</p>
            <p className="text-2xl font-display font-black text-primary">₹{Number(user.walletBalance || 0).toLocaleString()}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          👤 Personal Details
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          📑 My Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'wallet'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          💳 Digital Wallet (₹{Number(user.walletBalance || 0).toLocaleString()})
        </button>
        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'kyc'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          🪪 KYC & Licence Verification
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === 'profile' && (
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-2xl shadow-sm">
          <h2 className="font-display font-bold text-xl text-foreground mb-1">Customer Profile Information</h2>
          <p className="text-xs text-muted-foreground mb-6">Manage your contact information and driving credentials</p>

          {profileMsg && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs font-medium ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                  : 'bg-red-400/10 text-red-400 border border-red-400/30'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Driving Licence Number
              </label>
              <input
                type="text"
                value={licenceNumber}
                onChange={e => setLicenceNumber(e.target.value)}
                placeholder="e.g. MH-01-2020-0012345"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Required to rent vehicles. Must match your physical driving licence.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Billing / Residential Address
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="102, Ocean Heights, Bandra West, Mumbai, Maharashtra 400050"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-display font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: My Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">My Rental Bookings</h2>
              <p className="text-xs text-muted-foreground">View your active trips, pickup passes, and past rental history</p>
            </div>
            <Link
              to="/cars"
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              + Book Another Car
            </Link>
          </div>

          {/* Booking Action Notice Banner */}
          {bookingNotice && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
                bookingNotice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/25 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{bookingNotice.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{bookingNotice.text}</span>
              </div>
              <button
                onClick={() => setBookingNotice(null)}
                className="text-muted-foreground hover:text-foreground text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Review Submission Success Banner */}
          {reviewSuccessMsg && (
            <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 text-xs font-medium flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span>⭐</span>
                <span>{reviewSuccessMsg}</span>
              </div>
              <button
                onClick={() => setReviewSuccessMsg(null)}
                className="text-muted-foreground hover:text-foreground text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <span className="text-4xl mb-3 block">🚗</span>
              <h3 className="font-display font-bold text-base text-foreground mb-1">No Bookings Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                You haven't reserved any vehicles yet. Explore our fleet and experience seamless self-drive rentals!
              </p>
              <Link
                to="/cars"
                className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Browse All Cars
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start sm:items-center gap-4 w-full md:w-auto">
                    {(booking.car?.image || (booking as any).carImage) ? (
                      <img
                        src={booking.car?.image || (booking as any).carImage}
                        alt={booking.car?.name || (booking as any).carName || 'Vehicle'}
                        className="w-20 h-14 object-cover rounded-xl border border-border shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        Car
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-base text-foreground">
                          {booking.car?.name || (booking as any).carName || 'DriveNow Vehicle'}
                        </h4>
                        {bookingStatusBadge(booking.status)}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {booking.pickup_location || (booking as any).pickupLocation || 'Hub pickup'} ➔ {booking.drop_location || (booking as any).dropLocation || 'Same'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        📅 {booking.pickup_date || (booking as any).pickupDate} ({booking.pickup_time || (booking as any).pickupTime || '10:00'}) to {booking.return_date || (booking as any).returnDate || booking.pickup_date || (booking as any).pickupDate} ({booking.return_time || (booking as any).returnTime || '10:00'}) · {booking.duration_value || (booking as any).durationValue || 1} Day{(booking.duration_value || (booking as any).durationValue || 1) > 1 ? 's' : ''}
                        {(booking.with_driver || (booking as any).withDriver) && ' · With Chauffeur'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <div className="text-left md:text-right mr-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total</span>
                      <span className="font-display font-black text-foreground text-sm">
                        ₹{Number(booking.total_price || booking.total_amount || (booking as any).amount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleOpenTrack(booking)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Track
                        </button>
                      )}

                      {booking.status === 'completed' && (
                        (booking.review || (booking as any).review) ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
                              <span className="text-amber-400 font-bold">
                                ★ {(booking.review || (booking as any).review).rating}/5
                              </span>
                            </div>
                            <button
                              onClick={() => handleOpenViewReview(booking)}
                              className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="View your submitted feedback"
                            >
                              My Review
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenRateModal(booking)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                          >
                            <span>⭐</span>
                            <span>Rate Experience</span>
                          </button>
                        )
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => promptCancelBooking(booking)}
                          className="px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {booking.status === 'cancelled' && (
                        <button
                          onClick={() => promptDeleteBooking(booking)}
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Digital Wallet */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Money Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-lg text-foreground mb-1">Add Wallet Balance</h2>
            <p className="text-xs text-muted-foreground mb-5">Quickly recharge your balance for 1-click booking checkout</p>

            {walletMsg && (
              <div
                className={`mb-5 p-3.5 rounded-xl text-xs font-medium ${
                  walletMsg.type === 'success'
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                    : 'bg-red-400/10 text-red-400 border border-red-400/30'
                }`}
              >
                {walletMsg.text}
              </div>
            )}

            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Select Quick Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000, 3000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTopUpAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !customAmount && topUpAmount === amt
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Or Custom Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={addingMoney}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-display font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
              >
                {addingMoney ? 'Processing Payment...' : `Top-up ₹${customAmount || topUpAmount.toLocaleString()}`}
              </button>
            </form>
          </div>

          {/* Transactions Ledger */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-lg text-foreground mb-1">Transaction History</h2>
            <p className="text-xs text-muted-foreground mb-5">Recent credits, debits, and security deposit refunds</p>

            {loadingTx ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No past transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Booking Payment')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()} · {tx.payment_method || 'UPI'}
                      </p>
                    </div>
                    <span
                      className={`font-display font-bold text-xs ${
                        tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: KYC & Licence Verification */}
      {activeTab === 'kyc' && (
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">KYC & Identity Verification</h2>
              <p className="text-xs text-muted-foreground">
                Both a valid Driving Licence and Aadhaar Card are mandatory to rent self-drive vehicles.
              </p>
            </div>
            {kycStatusBadge(user.kycStatus)}
          </div>

          {kycMsg && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs font-medium ${
                kycMsg.type === 'success'
                  ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                  : 'bg-red-400/10 text-red-400 border border-red-400/30'
              }`}
            >
              {kycMsg.text}
            </div>
          )}

          <form onSubmit={handleKycSubmit} className="space-y-5">
            {/* Driving Licence Number */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Driving Licence Number *
              </label>
              <input
                type="text"
                required
                value={licenceNumber}
                onChange={e => setLicenceNumber(e.target.value)}
                placeholder="e.g. MH-01-2020-0012345"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Document 1: Driving Licence File */}
            <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span>🪪</span>
                  <span>1. Driving Licence Document *</span>
                </label>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                  Mandatory
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Upload front and back photo or combined PDF (max 5MB).
              </p>
              <input
                ref={licenceInputRef}
                type="file"
                required
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={e => setDrivingLicenceFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
              />
              {drivingLicenceFile && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <span>✓</span>
                  <span>{drivingLicenceFile.name} ({(drivingLicenceFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              )}
            </div>

            {/* Document 2: Aadhaar Card File */}
            <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span>🆔</span>
                  <span>2. Aadhaar Card Document *</span>
                </label>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                  Mandatory
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Upload clear front/back photo or official e-Aadhaar PDF (max 5MB).
              </p>
              <input
                ref={aadhaarInputRef}
                type="file"
                required
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={e => setAadhaarFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
              />
              {aadhaarFile && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <span>✓</span>
                  <span>{aadhaarFile.name} ({(aadhaarFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingKyc}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-display font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              {submittingKyc ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading Documents & Submitting...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Submit KYC for Verification</span>
                </>
              )}
            </button>
          </form>

          {/* Uploaded Documents List */}
          {kycDocuments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="font-display font-bold text-sm text-foreground mb-3">Submitted Documents</h3>
              <div className="space-y-2.5">
                {kycDocuments.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">
                        {doc.document_type === 'driving_license' || doc.document_type?.includes('licence')
                          ? '🪪'
                          : doc.document_type === 'aadhaar' || doc.document_type?.includes('aadhaar')
                          ? '🆔'
                          : '📄'}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground capitalize">
                          {doc.document_type === 'driving_license'
                            ? 'Driving Licence'
                            : doc.document_type === 'aadhaar'
                            ? 'Aadhaar Card'
                            : doc.document_type?.replace('_', ' ')}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-sm">
                          {doc.file_name || 'Document File'}
                          {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          doc.status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : doc.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {doc.status || 'Pending'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const url = profileApi.getDocumentViewUrl(doc.id);
                          window.open(url, '_blank');
                        }}
                        className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="View or download document"
                      >
                        <span>👁️</span>
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Tracking Modal */}
      {trackingBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-foreground">Trip Dispatch & Tracking</h3>
                <p className="text-xs text-muted-foreground">Booking #{trackingBooking.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setTrackingBooking(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingTrack ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Connecting to vehicle telematics...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Status Bar */}
                <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Status</p>
                    <p className="text-sm text-primary font-display font-bold capitalize">
                      {trackingInfo?.status || trackingBooking.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">Pickup Pass / OTP</p>
                    <p className="text-base font-mono font-black text-foreground">
                      {trackingInfo?.pickup_code || 'DN-7890'}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-semibold text-foreground">{trackingInfo?.car_name || trackingBooking.car?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">License Plate:</span>
                    <span className="font-mono font-semibold text-foreground">{trackingInfo?.license_plate || 'MH-02-DN-2024'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Pickup Location:</span>
                    <span className="font-semibold text-foreground">{trackingInfo?.pickup_location}</span>
                  </div>
                  {trackingInfo?.driver_assigned && (
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Chauffeur:</span>
                      <span className="font-semibold text-foreground">
                        {trackingInfo?.driver_name} ({trackingInfo?.driver_phone})
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary">
                  💡 Present your Pickup Pass OTP to the DriveNow hub executive along with your original Driving Licence.
                </div>

                <button
                  onClick={() => setTrackingBooking(null)}
                  className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Close Tracking Details
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern In-App Cancellation & Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmModalState?.isOpen)}
        onClose={() => {
          if (!isProcessingAction) {
            setConfirmModalState(null);
            setActionModalError(null);
          }
        }}
        onConfirm={handleConfirmModalAction}
        title={
          confirmModalState?.type === 'cancel'
            ? `Cancel Reservation for ${confirmModalState.carName}?`
            : `Remove Record for ${confirmModalState?.carName}?`
        }
        message={
          confirmModalState?.type === 'cancel'
            ? 'Are you sure you want to cancel this booking? If this trip was paid with wallet funds or eligible for a refund, the amount will be immediately credited back to your wallet balance.'
            : 'Are you sure you want to remove this cancelled reservation record from your rental history? This will clean up your bookings dashboard.'
        }
        confirmText={
          confirmModalState?.type === 'cancel'
            ? 'Yes, Cancel Reservation'
            : 'Yes, Remove Record'
        }
        cancelText="Keep Booking"
        variant={confirmModalState?.type === 'cancel' ? 'warning' : 'danger'}
        isLoading={isProcessingAction}
        error={actionModalError}
      />

      {/* Rate Your Rental Experience Modal */}
      {ratingModalBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={handleCloseRateModal}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                  <span>⭐ Rate Your Rental Experience</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Booking #{ratingModalBooking.id.slice(0, 10)}
                </p>
              </div>
              <button
                onClick={handleCloseRateModal}
                className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Vehicle Card Summary */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center gap-3 mb-5">
              {(ratingModalBooking.car?.image || (ratingModalBooking as any).carImage) ? (
                <img
                  src={ratingModalBooking.car?.image || (ratingModalBooking as any).carImage}
                  alt={ratingModalBooking.car?.name || (ratingModalBooking as any).carName || 'Vehicle'}
                  className="w-16 h-12 object-cover rounded-lg border border-border bg-muted shrink-0"
                />
              ) : (
                <div className="w-16 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-base shrink-0">
                  🚗
                </div>
              )}
              <div>
                <h4 className="font-display font-bold text-sm text-foreground">
                  {ratingModalBooking.car?.name || (ratingModalBooking as any).carName || 'DriveNow Vehicle'}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {ratingModalBooking.pickup_date || (ratingModalBooking as any).pickupDate} to {ratingModalBooking.return_date || (ratingModalBooking as any).returnDate} · Completed Trip
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="text-center py-3 bg-muted/20 border border-border/50 rounded-xl">
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  How would you rate your overall ride?
                </label>

                {/* 1-5 Star Buttons */}
                <div className="flex items-center justify-center gap-2 my-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeRating = hoverRating || ratingValue;
                    const isFilled = star <= activeRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRatingValue(star)}
                        className="text-3xl transition-transform hover:scale-125 focus:outline-none cursor-pointer p-1"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        <span className={isFilled ? 'text-amber-400 drop-shadow-md' : 'text-muted-foreground/30'}>
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label Indicator */}
                <p className="text-xs font-bold text-amber-400 min-h-[1.25rem]">
                  {(hoverRating || ratingValue) === 1 && '⭐ Poor — Unhappy with the experience'}
                  {(hoverRating || ratingValue) === 2 && '⭐⭐ Fair — Several things could improve'}
                  {(hoverRating || ratingValue) === 3 && '⭐⭐⭐ Good — Met standard expectations'}
                  {(hoverRating || ratingValue) === 4 && '⭐⭐⭐⭐ Very Good — Smooth ride & clean car'}
                  {(hoverRating || ratingValue) === 5 && '⭐⭐⭐⭐⭐ Outstanding! — Loved the entire trip!'}
                </p>
              </div>

              {/* Quick Tags */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Quick Highlights (Click to add):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '✨ Spotless & Clean',
                    '🚀 Smooth Driving',
                    '❄️ Powerful AC',
                    '⏱️ Punctual Handover',
                    '⛽ Excellent Mileage',
                    '📱 Easy Bluetooth Audio',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setReviewComment((prev) => {
                          const trimmed = prev.trim();
                          if (!trimmed) return tag;
                          if (trimmed.includes(tag)) return trimmed;
                          return `${trimmed}, ${tag}`;
                        });
                      }}
                      className="px-2 py-1 bg-muted hover:bg-muted/80 text-[11px] text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Your Review & Feedback <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {reviewComment.length} / 2000
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={2000}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about vehicle condition, interior cleanliness, driving performance, pickup/drop efficiency, or tips for future renters..."
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Error Alert */}
              {reviewError && (
                <div className="p-3 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs">
                  {reviewError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRateModal}
                  disabled={submittingReview}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-display font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingReview ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review ⭐</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submitted Review Modal */}
      {viewReviewBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={handleCloseViewReview}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-foreground">
                  Your Rental Review
                </h3>
                <p className="text-xs text-muted-foreground">
                  Booking #{viewReviewBooking.id.slice(0, 10)}
                </p>
              </div>
              <button
                onClick={handleCloseViewReview}
                className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                {(viewReviewBooking.car?.image || (viewReviewBooking as any).carImage) && (
                  <img
                    src={viewReviewBooking.car?.image || (viewReviewBooking as any).carImage}
                    alt={viewReviewBooking.car?.name || (viewReviewBooking as any).carName || 'Car'}
                    className="w-14 h-10 object-cover rounded-lg border border-border bg-muted shrink-0"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-xs text-foreground">
                    {viewReviewBooking.car?.name || (viewReviewBooking as any).carName || 'Vehicle'}
                  </h4>
                  <div className="flex items-center text-amber-400 text-xs mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const r = (viewReviewBooking.review || (viewReviewBooking as any).review)?.rating || 5;
                      return <span key={s}>{s <= r ? '★' : '☆'}</span>;
                    })}
                    <span className="ml-1 text-[11px] font-bold text-foreground">
                      {(viewReviewBooking.review || (viewReviewBooking as any).review)?.rating || 5}/5
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 border border-border rounded-xl">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold block mb-1">
                  Your Feedback:
                </span>
                <p className="text-xs text-foreground italic leading-relaxed">
                  "{(viewReviewBooking.review || (viewReviewBooking as any).review)?.comment || 'Thank you for your rating!'}"
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 flex items-center gap-2">
                <span>✓</span>
                <span>Review recorded in database. Thank you for helping the DriveNow community!</span>
              </div>

              <button
                onClick={handleCloseViewReview}
                className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
