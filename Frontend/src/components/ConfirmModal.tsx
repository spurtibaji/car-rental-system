import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  error?: string | null;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  error = null,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[#121212] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div 
          className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-2xl pointer-events-none ${
            isDanger ? 'bg-red-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-primary/20'
          }`} 
        />

        {/* Header with Icon */}
        <div className="flex items-start gap-3.5 mb-3">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border text-lg ${
              isDanger 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : isWarning 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-primary/10 border-primary/20 text-primary'
            }`}
          >
            {isDanger ? '🗑️' : isWarning ? '⚠️' : 'ℹ️'}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-display font-bold text-base text-foreground leading-tight">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Error Feedback if action failed */}
        {error && (
          <div className="mt-3 mb-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800/80">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-neutral-800 border border-border rounded-xl text-xs font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md ${
              isDanger 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : isWarning 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                : 'bg-primary hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isLoading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
