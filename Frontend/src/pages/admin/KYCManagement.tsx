import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';

interface KYCDocument {
  id: string;
  type?: string;
  document_type?: string;
  file_name?: string;
  file_path?: string;
  mime_type?: string;
  file_size?: number;
  file_url?: string;
  status?: string;
  uploaded_at?: string;
}

interface KYCUserItem {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  kyc_status: 'pending' | 'verified' | 'rejected' | 'not_uploaded';
  licence_number?: string;
  documents?: KYCDocument[];
}

export default function KYCManagement() {
  const [kycList, setKycList] = useState<KYCUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Document Inspection Preview Modal
  const [previewDoc, setPreviewDoc] = useState<KYCDocument | null>(null);
  const [previewUser, setPreviewUser] = useState<KYCUserItem | null>(null);

  // Rejection Modal
  const [rejectUser, setRejectUser] = useState<KYCUserItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Documents are blurry or expired.');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadKYC() {
    setLoading(true);
    try {
      const data = await adminApi.listKYC();
      if (Array.isArray(data)) {
        setKycList(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch KYC review queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKYC();
  }, []);

  async function handleApprove(userId: string) {
    setReviewingId(userId);
    try {
      await adminApi.reviewKYC(userId, 'verified');
      setKycList(prev =>
        prev.map(u => (u.user_id === userId ? { ...u, kyc_status: 'verified' } : u))
      );
      setActionNotice({
        type: 'success',
        message: 'Customer KYC approved and marked as Verified.',
      });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to approve KYC',
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setReviewingId(null);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectUser) return;

    setReviewingId(rejectUser.user_id);
    try {
      await adminApi.reviewKYC(rejectUser.user_id, 'rejected', rejectReason);
      setKycList(prev =>
        prev.map(u => (u.user_id === rejectUser.user_id ? { ...u, kyc_status: 'rejected' } : u))
      );
      setRejectUser(null);
      setActionNotice({
        type: 'success',
        message: 'Customer KYC marked as Rejected with provided reason.',
      });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to reject KYC',
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setReviewingId(null);
    }
  }

  const filteredList = kycList.filter(u => {
    if (filter === 'all') return true;
    return u.kyc_status === filter;
  });

  const pendingCount = kycList.filter(u => u.kyc_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Customer KYC Verification Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit driving licences and identity documents required before granting vehicle access
          </p>
        </div>

        <button
          onClick={loadKYC}
          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>↻</span>
          <span>Refresh Queue</span>
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
        {(['all', 'pending', 'verified', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === tab
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab}</span>
            {tab === 'pending' && pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-black rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* KYC Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading KYC verification applications...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-400/10 border border-red-400/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-xs text-muted-foreground">
          No KYC applications found matching this status filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map(u => (
            <div
              key={u.user_id}
              className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm"
            >
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground">{u.name}</h3>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.phone || 'No phone'}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      u.kyc_status === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : u.kyc_status === 'rejected'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {u.kyc_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="bg-muted px-3 py-1.5 rounded-xl border border-border">
                    <span className="text-muted-foreground">Licence No: </span>
                    <span className="font-mono font-bold text-foreground">
                      {u.licence_number || 'Not Submitted'}
                    </span>
                  </div>

                  <div className="bg-muted px-3 py-1.5 rounded-xl border border-border">
                    <span className="text-muted-foreground">Files Attached: </span>
                    <span className="font-semibold text-foreground">
                      {u.documents?.length || 0} document(s)
                    </span>
                  </div>
                </div>

                {/* Uploaded Documents preview cards */}
                {u.documents && u.documents.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                      Submitted Documents ({u.documents.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {u.documents.map((doc, idx) => {
                        const docType = doc.document_type || doc.type || '';
                        const isDL = docType === 'driving_license' || docType.includes('licence');
                        const isAadhaar = docType === 'aadhaar' || docType.includes('aadhaar');
                        const docName = isDL ? 'Driving Licence' : isAadhaar ? 'Aadhaar Card' : docType.replace('_', ' ');
                        const isPdf = doc.mime_type?.includes('pdf') || doc.file_name?.toLowerCase().endsWith('.pdf');

                        return (
                          <div
                            key={doc.id || idx}
                            className="flex items-center justify-between p-2.5 bg-muted/60 hover:bg-muted/90 border border-border rounded-xl text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="text-base shrink-0">{isDL ? '🪪' : isAadhaar ? '🆔' : '📄'}</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground capitalize truncate">{docName}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {doc.file_name || (isPdf ? 'document.pdf' : 'document.jpg')}
                                  {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewDoc(doc);
                                  setPreviewUser(u);
                                }}
                                className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                title="Inspect document"
                              >
                                <span>👁️</span>
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const url = adminApi.getDocumentViewUrl(doc.id);
                                  window.open(url, '_blank');
                                }}
                                className="p-1 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg text-[11px] border border-border transition-colors cursor-pointer"
                                title="Open in new window"
                              >
                                ↗
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic pt-1">No documents uploaded yet.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border">
                {u.kyc_status !== 'verified' && (
                  <button
                    disabled={reviewingId === u.user_id}
                    onClick={() => handleApprove(u.user_id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    {reviewingId === u.user_id ? 'Approving...' : '✓ Approve Licence'}
                  </button>
                )}

                {u.kyc_status !== 'rejected' && (
                  <button
                    disabled={reviewingId === u.user_id}
                    onClick={() => {
                      setRejectUser(u);
                      setRejectReason('Uploaded photo is illegible or licence number mismatch.');
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Inspection Modal */}
      {previewDoc && previewUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {previewDoc.document_type === 'driving_license' || previewDoc.type === 'driving_license'
                    ? '🪪'
                    : previewDoc.document_type === 'aadhaar' || previewDoc.type === 'aadhaar'
                    ? '🆔'
                    : '📄'}
                </span>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                    {previewDoc.document_type === 'driving_license' || previewDoc.type === 'driving_license'
                      ? 'Driving Licence'
                      : previewDoc.document_type === 'aadhaar' || previewDoc.type === 'aadhaar'
                      ? 'Aadhaar Card'
                      : (previewDoc.document_type || previewDoc.type || 'Document').replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customer: <strong className="text-foreground">{previewUser.name}</strong> ({previewUser.email})
                    {previewUser.licence_number ? ` · DL: ${previewUser.licence_number}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewUser(null);
                }}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Document Details Strip */}
            <div className="px-5 py-2.5 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
              <div className="flex items-center gap-4">
                <span>File: <strong className="text-foreground">{previewDoc.file_name || 'document'}</strong></span>
                {previewDoc.file_size && (
                  <span>Size: <strong className="text-foreground">{(previewDoc.file_size / 1024).toFixed(0)} KB</strong></span>
                )}
                {previewDoc.uploaded_at && (
                  <span>Uploaded: <strong className="text-foreground">{new Date(previewDoc.uploaded_at).toLocaleDateString()}</strong></span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = adminApi.getDocumentViewUrl(previewDoc.id);
                  window.open(url, '_blank');
                }}
                className="text-primary hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>↗ Open in New Window</span>
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-4 sm:p-6 overflow-auto flex-1 flex items-center justify-center bg-black/40 min-h-[350px] max-h-[62vh]">
              {previewDoc.mime_type?.includes('pdf') || previewDoc.file_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={adminApi.getDocumentViewUrl(previewDoc.id)}
                  title={previewDoc.file_name || 'Document PDF Preview'}
                  className="w-full h-[58vh] rounded-xl border border-border bg-background"
                />
              ) : (
                <div className="w-full flex items-center justify-center">
                  <img
                    src={adminApi.getDocumentViewUrl(previewDoc.id)}
                    alt={previewDoc.file_name || 'KYC Document'}
                    className="max-h-[58vh] max-w-full object-contain rounded-xl shadow-2xl border border-border"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">KYC Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    previewUser.kyc_status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : previewUser.kyc_status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {previewUser.kyc_status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {previewUser.kyc_status !== 'verified' && (
                  <button
                    disabled={reviewingId === previewUser.user_id}
                    onClick={() => {
                      handleApprove(previewUser.user_id);
                      setPreviewDoc(null);
                      setPreviewUser(null);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    {reviewingId === previewUser.user_id ? 'Approving...' : '✓ Approve KYC'}
                  </button>
                )}

                {previewUser.kyc_status !== 'rejected' && (
                  <button
                    disabled={reviewingId === previewUser.user_id}
                    onClick={() => {
                      setRejectUser(previewUser);
                      setRejectReason('Uploaded photo is illegible or document details mismatch.');
                      setPreviewDoc(null);
                      setPreviewUser(null);
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPreviewDoc(null);
                    setPreviewUser(null);
                  }}
                  className="px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-display font-black text-lg text-foreground mb-1">
              Reject KYC Application
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Rejecting verification for <strong className="text-foreground">{rejectUser.name}</strong> ({rejectUser.email})
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Rejection Reason (Sent to Customer)
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground outline-none focus:border-red-400"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectUser(null)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewingId === rejectUser.user_id}
                  className="px-4 py-2 bg-red-500 text-white font-semibold text-xs rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
