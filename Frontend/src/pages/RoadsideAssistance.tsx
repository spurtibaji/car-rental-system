import { useState, useEffect } from 'react';
import { roadsideApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface RoadsideRequest {
  id: string;
  reference_id: string;
  issue_type: string;
  location: string;
  notes?: string;
  eta: string;
  status: string;
  created_at: string;
}

const issueTypes = [
  { value: 'breakdown', label: 'Engine Breakdown / Mechanical Failure' },
  { value: 'flat-tyre', label: 'Flat Tyre / Puncture Replacement' },
  { value: 'battery', label: 'Battery Jumpstart / Dead Battery' },
  { value: 'fuel', label: 'Fuel Emergency / Out of Petrol or Diesel' },
  { value: 'locked', label: 'Key Locked Inside Vehicle' },
  { value: 'towing', label: 'Flatbed Towing Required' },
  { value: 'accident', label: 'Accident / Collision Support' },
  { value: 'other', label: 'Other On-road Emergency' },
];

export default function RoadsideAssistance() {
  const { bookings, isLoggedIn } = useApp();

  const [issueType, setIssueType] = useState('breakdown');
  const [location, setLocation] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [requests, setRequests] = useState<RoadsideRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Load user's active/past roadside requests if logged in
  useEffect(() => {
    if (isLoggedIn) {
      setLoadingRequests(true);
      roadsideApi.list()
        .then(data => {
          if (Array.isArray(data)) setRequests(data);
        })
        .catch(err => console.warn('Could not load past roadside requests:', err))
        .finally(() => setLoadingRequests(false));
    }
  }, [isLoggedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!location.trim()) {
      setErrorMsg('Please specify your current location or nearest landmark.');
      return;
    }

    setLoading(true);
    try {
      const created = await roadsideApi.create({
        issue_type: issueType,
        location,
        booking_id: selectedBookingId || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMsg(
        `Emergency request dispatched successfully! Ticket Ref: #${created.reference_id || 'RSA-REQ'}. A patrol technician is being assigned.`
      );
      setLocation('');
      setNotes('');

      // Refresh requests list
      if (isLoggedIn) {
        const refreshed = await roadsideApi.list();
        if (Array.isArray(refreshed)) setRequests(refreshed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch roadside assistance. Please call our emergency hotline immediately.');
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Resolved ✓</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">Mechanic En Route 🚗</span>;
      case 'assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">Assigned</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Dispatched ⏳</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Emergency Banner */}
      <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-3xl font-black shrink-0 animate-pulse">
            🚨
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
              24/7 Nationwide Rapid Response
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground mt-1">
              Emergency Roadside Assistance
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Stuck on the highway or in city traffic? DriveNow fleet technicians are available 24/7 across all rental hubs.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-red-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Toll-Free SOS Hotline</p>
          <a
            href="tel:18001234567"
            className="text-2xl sm:text-3xl font-display font-black text-red-400 hover:underline block tracking-tight"
          >
            1800-123-4567
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Assistance Form */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-display font-bold text-xl text-foreground mb-1">Request On-Road Support</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Submit your breakdown ticket directly to our fleet control room. Average technician arrival is 25-35 minutes.
          </p>

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-400/10 border border-emerald-400/30 rounded-xl text-emerald-400 text-xs font-medium">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Nature of Emergency *
                </label>
                <select
                  value={issueType}
                  onChange={e => setIssueType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                >
                  {issueTypes.map(it => (
                    <option key={it.value} value={it.value}>{it.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Linked Active Booking (Optional)
                </label>
                <select
                  value={selectedBookingId}
                  onChange={e => setSelectedBookingId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- None / Direct Request --</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      #{b.id.slice(0, 6)} - {b.car?.name} ({b.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Exact Location / Highway / Landmark *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Mumbai-Pune Expressway, KM 42 near Khalapur Toll, northbound"
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Additional Details / Vehicle Symptoms
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe what happened: e.g. Smoke from radiator, flat right rear tyre, hazard lights on safely parked on shoulder..."
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-display font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-red-500/20"
            >
              {loading ? 'Transmitting Distress Request...' : 'Dispatch Roadside Technician Immediately ➔'}
            </button>
          </form>
        </div>

        {/* Coverage Highlights & Safety Tips */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-base text-foreground mb-4">What's Covered Free</h3>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>On-spot mechanical triage & engine diagnosis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Stepney tyre replacement and air replenishment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Battery jumper cable boost service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Free flatbed towing to the nearest DriveNow certified workshop</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Replacement vehicle dispatch if trip cannot continue</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-base text-foreground mb-2">Emergency Safety Rules</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              1. Turn on vehicle hazard warning lights immediately.<br/>
              2. Place the reflective emergency triangle 30 meters behind the vehicle.<br/>
              3. Stand on the safe passenger side or beyond highway guardrails while awaiting patrol arrival.
            </p>
          </div>
        </div>
      </div>

      {/* Dispatched Requests History */}
      {isLoggedIn && requests.length > 0 && (
        <div className="mt-10 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">My Roadside Request History</h3>
          <div className="space-y-3">
            {requests.map(req => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/40 rounded-xl border border-border gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-foreground capitalize">
                      {req.issue_type.replace('-', ' ')}
                    </span>
                    {statusBadge(req.status)}
                    <span className="text-[11px] font-mono text-muted-foreground">#{req.reference_id}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">📍 {req.location}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-muted-foreground block">Estimated Response</span>
                  <span className="text-xs font-semibold text-foreground">{req.eta || '25-35 mins'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
