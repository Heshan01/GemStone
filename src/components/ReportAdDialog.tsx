import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReportAdDialogProps {
  adId: string;
  adTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const REASONS = [
  'Fraudulent / Scam Seller',
  'Incorrect Weight / Description',
  'Misleading Certification Details',
  'Stolen / Suspicious Origin',
  'Spam or Harassment',
  'Other Policy Violation'
];

export default function ReportAdDialog({ adId, adTitle, isOpen, onClose }: ReportAdDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to submit a report.');
      return;
    }
    if (!details.trim()) {
      setError('Please provide some brief description details.');
      return;
    }

    setLoading(true);
    setError(null);

    const reportId = `${adId}_${user.uid}_${Date.now()}`;
    const newReport = {
      id: reportId,
      adId: adId,
      reporterId: user.uid,
      reason: reason,
      details: details.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'reports', reportId), newReport);
      setSuccess(true);
    } catch (err) {
      console.error('Error reporting ad:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-blue-500/5">
          <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Report Advertisement</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-zinc-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Report Submitted Successfully</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Thank you for helping keep the RatnaGem marketplace safe. Our moderation team will investigate <strong>{adTitle}</strong> immediately and take action if needed.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-medium rounded-xl text-sm transition-colors"
              >
                Close Dialog
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You are reporting <strong>{adTitle}</strong>. Your report will be sent to the administration team for manual inspection. Abuse of the reporting system may lead to profile bans.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Reason list */}
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                  Reason for Report
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {REASONS.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Details explanation */}
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                  Additional Context
                </label>
                <textarea
                  placeholder="Explain exactly what is wrong or fraudulent about this ad..."
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={1000}
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                ></textarea>
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {details.length}/1000 characters
                </p>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors flex justify-center items-center"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
